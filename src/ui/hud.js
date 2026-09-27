import { isTouchDevice } from '../controls/mobileControls.js';

/**
 * Resolves a DOM element from a selector string or element reference.
 * Returns null if running in headless/test environments without DOM.
 *
 * @param {string|HTMLElement|null} target
 * @returns {HTMLElement|null}
 */
function resolveElement(target) {
  if (!target) return null;
  if (typeof target === 'string') {
    if (typeof document !== 'undefined') {
      return document.querySelector(target);
    }
    return null;
  }
  return target;
}

/**
 * Initializes and manages Heads-Up Display (HUD) interface:
 * - Center reticle crosshair dot
 * - Interactive memory tooltip badge: [E] 추억 열기: {title}
 * - Floating mobile touch interaction button: '기억 열기'
 *
 * @param {object} [options]
 * @param {string|HTMLElement} [options.container='#hud']
 * @param {string|HTMLElement} [options.promptEl='#interaction-prompt']
 * @param {string|HTMLElement} [options.promptTextEl='#interaction-text']
 * @param {string|HTMLElement} [options.crosshairEl='#crosshair']
 * @param {string|HTMLElement} [options.mobileBtnEl='#mobile-interact-btn']
 * @param {boolean|(() => boolean)} [options.isTouch]
 * @param {(memory: object) => void} [options.onSelect]
 * @returns {object} HUD controller interface
 */
export function setupHUD(options = {}) {
  const container = resolveElement(options.container || '#hud');
  const promptEl = resolveElement(options.promptEl || '#interaction-prompt');
  const promptTextEl = resolveElement(options.promptTextEl || '#interaction-text');
  const crosshairEl = resolveElement(options.crosshairEl || '#crosshair');

  const checkIsTouch = () => {
    if (typeof options.isTouch === 'function') {
      return options.isTouch();
    }
    if (options.isTouch !== undefined) {
      return Boolean(options.isTouch);
    }
    return isTouchDevice();
  };

  // Mobile Floating Interaction Button
  let mobileBtn = resolveElement(options.mobileBtnEl || '#mobile-interact-btn');
  let createdMobileBtn = false;

  if (!mobileBtn && typeof document !== 'undefined' && checkIsTouch()) {
    mobileBtn = document.createElement('button');
    mobileBtn.id = 'mobile-interact-btn';
    mobileBtn.type = 'button';
    mobileBtn.setAttribute('aria-label', '기억 열기');
    mobileBtn.className =
      'fixed bottom-8 right-6 z-30 px-5 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-amber-50 font-batang text-sm font-semibold tracking-wide shadow-2xl border border-amber-400/50 backdrop-blur-md flex items-center gap-2 transition-all duration-300 pointer-events-auto cursor-pointer';
    mobileBtn.style.display = 'none';
    mobileBtn.innerHTML = `
      <svg class="w-4 h-4 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>기억 열기</span>
    `;

    if (container) {
      container.appendChild(mobileBtn);
    } else if (document.body) {
      document.body.appendChild(mobileBtn);
    }
    createdMobileBtn = true;
  }

  let currentMemory = null;
  let isPromptVisible = false;
  let currentPromptText = '';

  const selectCallbacks = new Set();
  if (typeof options.onSelect === 'function') {
    selectCallbacks.add(options.onSelect);
  }

  // Wire mobile button click/tap
  const onMobileBtnClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (currentMemory) {
      selectCallbacks.forEach((cb) => cb(currentMemory));
    }
  };

  if (mobileBtn && typeof mobileBtn.addEventListener === 'function') {
    mobileBtn.addEventListener('click', onMobileBtnClick);
  }

  /**
   * Displays the interaction prompt badge with the given memory's title.
   *
   * @param {object} memory
   */
  function showPrompt(memory) {
    currentMemory = memory || null;
    isPromptVisible = true;
    const title = memory?.title ? memory.title : '';
    currentPromptText = `[E] 추억 열기: ${title}`;

    if (promptTextEl) {
      promptTextEl.textContent = `추억 열기: ${title}`;
    }

    if (promptEl) {
      promptEl.classList?.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      promptEl.classList?.add('opacity-100', 'translate-y-0');
      if (promptEl.style) {
        promptEl.style.opacity = '1';
        promptEl.style.transform = 'translateY(0)';
        promptEl.style.pointerEvents = 'auto';
      }
      if (!promptTextEl) {
        promptEl.textContent = currentPromptText;
      }
    }

    // Enhance crosshair visual feedback on focus
    if (crosshairEl) {
      crosshairEl.classList?.add('scale-150', 'bg-amber-100');
    }

    // Show mobile button if in touch environment
    if (mobileBtn && checkIsTouch()) {
      mobileBtn.style.display = 'flex';
      mobileBtn.classList?.remove('hidden');
      if (mobileBtn.style) {
        mobileBtn.style.opacity = '1';
      }
    }
  }

  /**
   * Hides the interaction prompt badge.
   */
  function hidePrompt() {
    currentMemory = null;
    isPromptVisible = false;
    currentPromptText = '';

    if (promptEl) {
      promptEl.classList?.add('opacity-0', 'translate-y-2', 'pointer-events-none');
      promptEl.classList?.remove('opacity-100', 'translate-y-0');
      if (promptEl.style) {
        promptEl.style.opacity = '0';
        promptEl.style.transform = 'translateY(8px)';
        promptEl.style.pointerEvents = 'none';
      }
    }

    if (crosshairEl) {
      crosshairEl.classList?.remove('scale-150', 'bg-amber-100');
    }

    if (mobileBtn) {
      mobileBtn.style.display = 'none';
      mobileBtn.classList?.add('hidden');
      if (mobileBtn.style) {
        mobileBtn.style.opacity = '0';
      }
    }
  }

  /**
   * Sets crosshair visibility.
   *
   * @param {boolean} visible
   */
  function setCrosshairVisible(visible) {
    if (crosshairEl) {
      if (visible) {
        crosshairEl.classList?.remove('opacity-0', 'hidden');
        if (crosshairEl.style) {
          crosshairEl.style.display = 'block';
          crosshairEl.style.opacity = '1';
        }
      } else {
        crosshairEl.classList?.add('opacity-0', 'hidden');
        if (crosshairEl.style) {
          crosshairEl.style.display = 'none';
          crosshairEl.style.opacity = '0';
        }
      }
    }
  }

  /**
   * Registers a selection callback (e.g. from mobile button).
   *
   * @param {(memory: object) => void} callback
   * @returns {() => void} unsubscribe function
   */
  function onSelect(callback) {
    if (typeof callback === 'function') {
      selectCallbacks.add(callback);
      return () => selectCallbacks.delete(callback);
    }
    return () => {};
  }

  /**
   * Clean up added DOM elements and event listeners.
   */
  function destroy() {
    hidePrompt();
    if (mobileBtn && typeof mobileBtn.removeEventListener === 'function') {
      mobileBtn.removeEventListener('click', onMobileBtnClick);
    }
    if (createdMobileBtn && mobileBtn && typeof mobileBtn.remove === 'function') {
      mobileBtn.remove();
    }
    selectCallbacks.clear();
  }

  return {
    showPrompt,
    hidePrompt,
    setCrosshairVisible,
    onSelect,
    destroy,
    getPromptText: () => currentPromptText,
    isPromptVisible: () => isPromptVisible,
    getCurrentMemory: () => currentMemory,
    getMobileButton: () => mobileBtn,
    getElements: () => ({ container, promptEl, promptTextEl, crosshairEl, mobileBtn })
  };
}
