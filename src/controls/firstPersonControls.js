/**
 * First-Person Navigation & Collision Controls
 *
 * Provides smooth, cozy first-person walking with:
 * - PointerLock API integration for mouse yaw & pitch
 * - Pitch clamped between -85° and +85°
 * - WASD & Arrow keys with diagonal normalization
 * - Smooth velocity interpolation with damping ~10 for cozy, gentle movement
 * - Constant eye height (1.65m) and boundary clamping to attic room perimeter
 */

export const DEFAULT_BOUNDS = {
  minX: -3.6,
  maxX: 3.6,
  minZ: -5.4,
  maxZ: 5.4
};

export const DEFAULT_CONTROL_CONFIG = {
  walkSpeed: 2.8, // meters per second
  damping: 10.0, // velocity decay coefficient
  eyeHeight: 1.65, // camera eye level in meters
  mouseSensitivity: 0.002, // radians per mouse pixel
  minPitch: -85 * (Math.PI / 180), // -1.4835 rad (~ -85 deg)
  maxPitch: 85 * (Math.PI / 180) // +1.4835 rad (~ +85 deg)
};

function isInputElement(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

/**
 * Initializes first-person controls on the camera.
 *
 * @param {import('three').PerspectiveCamera} camera
 * @param {HTMLElement|null} domElement
 * @param {object} [bounds]
 * @param {object} [options]
 * @returns {object} controls instance
 */
export function setupControls(camera, domElement = null, bounds = {}, options = {}) {
  const config = { ...DEFAULT_CONTROL_CONFIG, ...options };
  const currentBounds = { ...DEFAULT_BOUNDS, ...bounds };

  // Set camera rotation order for natural FPS yaw/pitch handling
  camera.rotation.order = 'YXZ';
  camera.position.y = config.eyeHeight;

  let enabled = true;
  let isLocked = false;

  const velocity = { x: 0, y: 0, z: 0 };
  const moveInput = { x: 0, z: 0 }; // External / mobile joystick analog input

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  const lockCallbacks = [];
  const unlockCallbacks = [];

  function setLocked(val) {
    const prev = isLocked;
    isLocked = Boolean(val);
    if (isLocked !== prev) {
      if (isLocked) {
        for (const cb of lockCallbacks) cb();
      } else {
        resetKeys();
        for (const cb of unlockCallbacks) cb();
      }
    }
  }

  function resetKeys() {
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    moveInput.x = 0;
    moveInput.z = 0;
  }

  function addRotation(deltaYaw, deltaPitch) {
    camera.rotation.y -= deltaYaw;
    camera.rotation.x -= deltaPitch;
    camera.rotation.x = Math.max(config.minPitch, Math.min(config.maxPitch, camera.rotation.x));
    camera.rotation.z = 0;
  }

  function lock() {
    if (domElement && typeof domElement.requestPointerLock === 'function') {
      try {
        const promise = domElement.requestPointerLock();
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err) => {
            // User gesture required or locked by another window
            console.warn('[FirstPersonControls] Pointer lock request rejected:', err);
          });
        }
      } catch (err) {
        console.warn('[FirstPersonControls] Pointer lock error:', err);
      }
    } else {
      setLocked(true);
    }
  }

  function unlock() {
    if (typeof document !== 'undefined' && typeof document.exitPointerLock === 'function') {
      try {
        document.exitPointerLock();
      } catch (err) {
        console.warn('[FirstPersonControls] Exit pointer lock error:', err);
      }
    } else {
      setLocked(false);
    }
  }

  function enable() {
    enabled = true;
  }

  function disable() {
    enabled = false;
    resetKeys();
  }

  function isEnabled() {
    return enabled;
  }

  function onKeyDown(e) {
    if (!enabled) return;
    if (isInputElement(e.target)) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
    }
  }

  function onKeyUp(e) {
    if (isInputElement(e.target)) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
    }
  }

  function onMouseMove(e) {
    if (!enabled || !isLocked) return;
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    addRotation(movementX * config.mouseSensitivity, movementY * config.mouseSensitivity);
  }

  function onPointerlockChange() {
    if (typeof document !== 'undefined') {
      const locked = document.pointerLockElement === domElement;
      setLocked(locked);
    }
  }

  function onPointerlockError(err) {
    console.warn('[FirstPersonControls] Pointerlock error:', err);
  }

  // Attach event listeners when running in browser DOM
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerlockChange);
    document.addEventListener('pointerlockerror', onPointerlockError);
  }

  function update(delta) {
    if (!delta || delta <= 0 || !Number.isFinite(delta)) return;
    const dt = Math.min(delta, 0.1);

    let targetVx = 0;
    let targetVz = 0;

    if (enabled) {
      let inputX = 0;
      let inputZ = 0;

      // Desktop keyboard movement responds when locked or in headless testing
      const allowKeys = isLocked || typeof document === 'undefined';
      if (allowKeys) {
        if (keys.forward) inputZ -= 1;
        if (keys.backward) inputZ += 1;
        if (keys.left) inputX -= 1;
        if (keys.right) inputX += 1;
      }

      // Add analog / virtual joystick / direct move input
      inputX += moveInput.x;
      inputZ += moveInput.z;

      const inputMag = Math.hypot(inputX, inputZ);
      if (inputMag > 1.0) {
        inputX /= inputMag;
        inputZ /= inputMag;
      }

      if (inputMag > 0.001) {
        const yaw = camera.rotation.y;
        const sinY = Math.sin(yaw);
        const cosY = Math.cos(yaw);

        // Three.js forward: (-sinY, 0, -cosY)
        // Three.js right: (cosY, 0, -sinY)
        const forwardAmount = -inputZ; // forward key -> inputZ is -1 -> forwardAmount is +1
        const rightAmount = inputX;

        targetVx = (-sinY * forwardAmount + cosY * rightAmount) * config.walkSpeed;
        targetVz = (-cosY * forwardAmount - sinY * rightAmount) * config.walkSpeed;
      }
    }

    // Velocity damping
    const blend = Math.min(1.0, config.damping * dt);
    velocity.x += (targetVx - velocity.x) * blend;
    velocity.z += (targetVz - velocity.z) * blend;
    velocity.y = 0;

    if (Math.abs(velocity.x) < 0.002 && Math.abs(targetVx) < 0.002) velocity.x = 0;
    if (Math.abs(velocity.z) < 0.002 && Math.abs(targetVz) < 0.002) velocity.z = 0;

    // Camera position update
    camera.position.x += velocity.x * dt;
    camera.position.z += velocity.z * dt;
    camera.position.y = config.eyeHeight;

    // Room collision boundary clamping
    if (camera.position.x < currentBounds.minX) {
      camera.position.x = currentBounds.minX;
      velocity.x = 0;
    } else if (camera.position.x > currentBounds.maxX) {
      camera.position.x = currentBounds.maxX;
      velocity.x = 0;
    }

    if (camera.position.z < currentBounds.minZ) {
      camera.position.z = currentBounds.minZ;
      velocity.z = 0;
    } else if (camera.position.z > currentBounds.maxZ) {
      camera.position.z = currentBounds.maxZ;
      velocity.z = 0;
    }
  }

  function dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerlockChange);
      document.removeEventListener('pointerlockerror', onPointerlockError);
    }
    lockCallbacks.length = 0;
    unlockCallbacks.length = 0;
  }

  return {
    update,
    isLocked: () => isLocked,
    setLocked,
    lock,
    unlock,
    enable,
    disable,
    isEnabled,
    onLock: (cb) => {
      lockCallbacks.push(cb);
      return () => {
        const idx = lockCallbacks.indexOf(cb);
        if (idx !== -1) lockCallbacks.splice(idx, 1);
      };
    },
    onUnlock: (cb) => {
      unlockCallbacks.push(cb);
      return () => {
        const idx = unlockCallbacks.indexOf(cb);
        if (idx !== -1) unlockCallbacks.splice(idx, 1);
      };
    },
    addRotation,
    setMoveInput: ({ x = 0, z = 0 }) => {
      moveInput.x = x;
      moveInput.z = z;
    },
    getMoveInput: () => ({ ...moveInput }),
    getVelocity: () => ({ ...velocity }),
    setVelocity: (vx, vz) => {
      velocity.x = vx;
      velocity.z = vz;
    },
    getBounds: () => ({ ...currentBounds }),
    setBounds: (newBounds) => {
      Object.assign(currentBounds, newBounds);
    },
    getKeys: () => ({ ...keys }),
    setKeys: (newKeys) => {
      Object.assign(keys, newKeys);
    },
    getConfig: () => ({ ...config }),
    dispose
  };
}
