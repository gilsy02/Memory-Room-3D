/**
 * Mobile Touch & Virtual Joystick Controls
 *
 * Provides touch-based first-person controls:
 * - Touch device detection
 * - Bottom-left virtual analog joystick for player movement
 * - Single-finger touch drag for smooth pitch & yaw camera rotation
 * - Seamless integration with firstPersonControls instance
 */

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0))
  );
}

function isInteractiveElement(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(
    target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('#mobile-joystick-zone') ||
      target.closest('#manage-modal') ||
      target.closest('#polaroid-modal') ||
      target.closest('#start-overlay:not(.hidden)')
  );
}

/**
 * Initializes mobile controls integrated with firstPersonControls.
 *
 * @param {object} controls Instance returned by setupControls
 * @param {HTMLElement|null} domElement Target canvas or viewport
 * @param {object} [options]
 * @returns {object} Mobile controls interface
 */
export function setupMobileControls(controls, domElement = null, options = {}) {
  const force = Boolean(options.force);
  const touchAvailable = isTouchDevice();

  if (!touchAvailable && !force) {
    return {
      active: false,
      isTouchDevice: () => false,
      update: () => {},
      destroy: () => {}
    };
  }

  const touchSensitivity = options.touchSensitivity || 0.0035;
  const maxRadius = options.maxRadius || 42;
  const zoneSize = options.zoneSize || 110;
  const thumbSize = options.thumbSize || 44;

  let joystickZone = null;
  let joystickThumb = null;

  if (typeof document !== 'undefined') {
    joystickZone = document.getElementById('mobile-joystick-zone');
    if (!joystickZone) {
      joystickZone = document.createElement('div');
      joystickZone.id = 'mobile-joystick-zone';
      joystickZone.setAttribute('aria-label', '가상 조이스틱 이동 컨트롤');
      joystickZone.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: ${zoneSize}px;
        height: ${zoneSize}px;
        border-radius: 50%;
        background: rgba(30, 20, 14, 0.45);
        border: 2px solid rgba(255, 198, 125, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(255, 157, 66, 0.15);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 35;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        transition: opacity 0.25s ease;
      `;

      joystickThumb = document.createElement('div');
      joystickThumb.id = 'mobile-joystick-thumb';
      joystickThumb.style.cssText = `
        width: ${thumbSize}px;
        height: ${thumbSize}px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, rgba(255, 220, 170, 0.9), rgba(214, 104, 22, 0.8));
        border: 1.5px solid rgba(255, 235, 204, 0.7);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 180, 100, 0.4);
        pointer-events: none;
        transform: translate(0px, 0px);
        will-change: transform;
      `;

      joystickZone.appendChild(joystickThumb);
      document.body.appendChild(joystickZone);
    } else {
      joystickThumb = joystickZone.querySelector('#mobile-joystick-thumb');
    }
  }

  let joystickTouchId = null;
  const joystickCenter = { x: 0, y: 0 };

  let lookTouchId = null;
  let lastLookX = 0;
  let lastLookY = 0;

  function handleJoystickMove(clientX, clientY) {
    if (!joystickThumb) return;
    const dx = clientX - joystickCenter.x;
    const dy = clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

    const normX = thumbX / maxRadius;
    const normZ = thumbY / maxRadius;
    controls.setMoveInput({ x: normX, z: normZ });
  }

  function resetJoystick() {
    joystickTouchId = null;
    if (joystickThumb) {
      joystickThumb.style.transform = 'translate(0px, 0px)';
    }
    controls.setMoveInput({ x: 0, z: 0 });
  }

  function onJoystickTouchStart(e) {
    if (!controls.isEnabled()) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (joystickTouchId === null) {
        joystickTouchId = touch.identifier;
        if (joystickZone) {
          const rect = joystickZone.getBoundingClientRect();
          joystickCenter.x = rect.left + rect.width / 2;
          joystickCenter.y = rect.top + rect.height / 2;
        }
        handleJoystickMove(touch.clientX, touch.clientY);
        if (e.cancelable) e.preventDefault();
        break;
      }
    }
  }

  function onLookTouchStart(e) {
    if (!controls.isEnabled()) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) continue;
      if (isInteractiveElement(e.target)) continue;

      if (lookTouchId === null) {
        lookTouchId = touch.identifier;
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;
        break;
      }
    }
  }

  function onTouchMove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        handleJoystickMove(touch.clientX, touch.clientY);
        if (e.cancelable) e.preventDefault();
      } else if (touch.identifier === lookTouchId) {
        const deltaX = touch.clientX - lastLookX;
        const deltaY = touch.clientY - lastLookY;
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;

        controls.addRotation(deltaX * touchSensitivity, deltaY * touchSensitivity);
        if (e.cancelable) e.preventDefault();
      }
    }
  }

  function onTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        resetJoystick();
      } else if (touch.identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  }

  if (joystickZone) {
    joystickZone.addEventListener('touchstart', onJoystickTouchStart, { passive: false });
  }

  const lookTarget = domElement || (typeof window !== 'undefined' ? window : null);
  if (lookTarget && typeof lookTarget.addEventListener === 'function') {
    lookTarget.addEventListener('touchstart', onLookTouchStart, { passive: true });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  }

  function showJoystick() {
    if (joystickZone) {
      joystickZone.style.display = 'flex';
      joystickZone.style.opacity = '1';
      joystickZone.style.pointerEvents = 'auto';
    }
  }

  function hideJoystick() {
    if (joystickZone) {
      joystickZone.style.opacity = '0';
      joystickZone.style.pointerEvents = 'none';
      resetJoystick();
    }
  }

  function destroy() {
    if (joystickZone) {
      joystickZone.removeEventListener('touchstart', onJoystickTouchStart);
      if (joystickZone.parentNode) {
        joystickZone.parentNode.removeChild(joystickZone);
      }
      joystickZone = null;
      joystickThumb = null;
    }
    if (lookTarget && typeof lookTarget.removeEventListener === 'function') {
      lookTarget.removeEventListener('touchstart', onLookTouchStart);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    }
    resetJoystick();
    lookTouchId = null;
  }

  return {
    active: true,
    isTouchDevice: () => true,
    showJoystick,
    hideJoystick,
    update: () => {},
    destroy
  };
}
