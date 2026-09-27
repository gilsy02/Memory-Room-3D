/**
 * polaroidModal.js
 * Emotional Polaroid Memory Detail Modal & Navigation View for 3D Memory Room.
 *
 * Provides:
 * - Authentic polaroid card layout with ivory paper, washi tape graphic, photo sheen, and slot indicator
 * - Heartfelt handwritten / Batang typography & warm journal story container
 * - Interactive navigation (Next/Prev buttons with wraparound cycling)
 * - Keyboard navigation (ArrowLeft, ArrowRight, Escape)
 * - Direct memory edit callback trigger
 * - Controls and raycaster pausing while modal is active; restoring upon dismissal
 */

import { getMemories } from '../storage/photoStorage.js';

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
 * Initializes and manages the emotional Polaroid Memory Modal.
 *
 * @param {object} [options]
 * @param {string|HTMLElement} [options.container='#polaroid-modal']
 * @param {string|HTMLElement} [options.card='#polaroid-card']
 * @param {string|HTMLElement} [options.img='#polaroid-img']
 * @param {string|HTMLElement} [options.title='#polaroid-title']
 * @param {string|HTMLElement} [options.date='#polaroid-date']
 * @param {string|HTMLElement} [options.story='#polaroid-story']
 * @param {string|HTMLElement} [options.slot='#polaroid-slot']
 * @param {string|HTMLElement} [options.prevBtn='#polaroid-prev']
 * @param {string|HTMLElement} [options.nextBtn='#polaroid-next']
 * @param {string|HTMLElement} [options.editBtn='#polaroid-edit']
 * @param {string|HTMLElement} [options.closeBtn='#polaroid-close']
 * @param {Array<object>} [options.memories]
 * @param {object} [options.controls]
 * @param {object} [options.raycaster]
 * @param {EventTarget} [options.keyTarget] Custom target for keydown events (window/document/mock)
 * @param {(memory: object) => void} [options.onEdit]
 * @param {() => void} [options.onClose]
 * @param {(memory: object, index: number, total: number) => void} [options.onNavigate]
 * @param {(memory: object, index: number, total: number) => void} [options.onOpen]
 * @returns {object} Polaroid modal controller interface
 */
export function setupPolaroidModal(options = {}) {
  const container = resolveElement(options.container || '#polaroid-modal');
  const cardEl = resolveElement(options.card || '#polaroid-card');
  const imgEl = resolveElement(options.img || '#polaroid-img');
  const titleEl = resolveElement(options.title || '#polaroid-title');
  const dateEl = resolveElement(options.date || '#polaroid-date');
  const storyEl = resolveElement(options.story || '#polaroid-story');
  const slotEl = resolveElement(options.slot || '#polaroid-slot');
  const prevBtn = resolveElement(options.prevBtn || '#polaroid-prev');
  const nextBtn = resolveElement(options.nextBtn || '#polaroid-next');
  const editBtn = resolveElement(options.editBtn || '#polaroid-edit');
  const closeBtn = resolveElement(options.closeBtn || '#polaroid-close');

  const controls = options.controls || null;
  const raycaster = options.raycaster || null;

  let allMemories = Array.isArray(options.memories) ? [...options.memories] : [];
  let currentIndex = 0;
  let currentMemory = null;
  let isOpenState = false;

  const keyTarget =
    options.keyTarget ||
    (typeof window !== 'undefined'
      ? window
      : typeof document !== 'undefined'
        ? document
        : null);

  /**
   * Renders the current memory's details to the DOM elements.
   */
  function renderCurrent() {
    if (!allMemories || allMemories.length === 0) {
      currentMemory = null;
      return;
    }

    currentIndex = ((currentIndex % allMemories.length) + allMemories.length) % allMemories.length;
    currentMemory = allMemories[currentIndex];

    const total = allMemories.length;
    const slotNumber =
      currentMemory?.slot !== undefined ? currentMemory.slot : currentIndex + 1;

    if (imgEl) {
      imgEl.src = currentMemory?.imageUrl || '';
      imgEl.alt = currentMemory?.title || '추억 사진';
    }

    if (titleEl) {
      titleEl.textContent = currentMemory?.title || '이름 없는 추억';
    }

    if (dateEl) {
      dateEl.textContent = currentMemory?.date || '날짜 기록 없음';
    }

    if (storyEl) {
      storyEl.textContent = currentMemory?.story || '';
    }

    if (slotEl) {
      slotEl.textContent = `추억 ${slotNumber} / ${total}`;
    }
  }

  /**
   * Opens the polaroid modal with the given memory and list of all memories.
   *
   * @param {object} [memory] Target memory object or null
   * @param {Array<object>} [memories] Optional replacement array of memories
   */
  function open(memory = null, memories = null) {
    if (Array.isArray(memories) && memories.length > 0) {
      allMemories = [...memories];
    } else if (allMemories.length === 0) {
      try {
        allMemories = getMemories() || [];
      } catch {
        allMemories = [];
      }
    }

    if (allMemories.length === 0 && memory) {
      allMemories = [memory];
    }

    if (memory && allMemories.length > 0) {
      let idx = allMemories.findIndex((m) => m === memory);
      if (idx === -1 && memory.id !== undefined) {
        idx = allMemories.findIndex((m) => m.id === memory.id);
      }
      if (idx === -1 && memory.slot !== undefined) {
        idx = allMemories.findIndex((m) => m.slot === memory.slot);
      }
      if (idx === -1 && memory.title) {
        idx = allMemories.findIndex((m) => m.title === memory.title);
      }
      currentIndex = idx !== -1 ? idx : 0;
    } else {
      currentIndex = 0;
    }

    renderCurrent();
    isOpenState = true;

    if (container) {
      container.classList?.remove('hidden');
      if (container.style) {
        container.style.display = 'flex';
      }
    }

    if (cardEl) {
      cardEl.classList?.remove('scale-95');
      cardEl.classList?.add('scale-100');
    }

    // Disable controls and unlock pointer so cursor is freed
    if (controls) {
      if (typeof controls.disable === 'function') {
        controls.disable();
      }
      if (typeof controls.unlock === 'function') {
        controls.unlock();
      }
    }

    // Disable raycaster while modal is open
    if (raycaster) {
      if (typeof raycaster.setEnabled === 'function') {
        raycaster.setEnabled(false);
      }
    }

    if (typeof options.onOpen === 'function') {
      options.onOpen(currentMemory, currentIndex, allMemories.length);
    }
  }

  /**
   * Closes the polaroid modal and restores controls & raycaster.
   */
  function close() {
    if (!isOpenState) return;
    isOpenState = false;

    if (container) {
      container.classList?.add('hidden');
      if (container.style) {
        container.style.display = 'none';
      }
    }

    if (cardEl) {
      cardEl.classList?.remove('scale-100');
      cardEl.classList?.add('scale-95');
    }

    // Restore controls
    if (controls) {
      if (typeof controls.enable === 'function') {
        controls.enable();
      }
    }

    // Restore raycaster
    if (raycaster) {
      if (typeof raycaster.setEnabled === 'function') {
        raycaster.setEnabled(true);
      }
    }

    if (typeof options.onClose === 'function') {
      options.onClose();
    }
  }

  /**
   * Cycles forward to the next memory.
   */
  function next() {
    if (!allMemories || allMemories.length === 0) return;
    currentIndex = (currentIndex + 1) % allMemories.length;
    renderCurrent();
    if (typeof options.onNavigate === 'function') {
      options.onNavigate(currentMemory, currentIndex, allMemories.length);
    }
  }

  /**
   * Cycles backward to the previous memory.
   */
  function prev() {
    if (!allMemories || allMemories.length === 0) return;
    currentIndex = (currentIndex - 1 + allMemories.length) % allMemories.length;
    renderCurrent();
    if (typeof options.onNavigate === 'function') {
      options.onNavigate(currentMemory, currentIndex, allMemories.length);
    }
  }

  /**
   * Jumps to a specific index in the memories array.
   *
   * @param {number} index
   */
  function goToIndex(index) {
    if (!allMemories || allMemories.length === 0) return;
    currentIndex = ((index % allMemories.length) + allMemories.length) % allMemories.length;
    renderCurrent();
    if (typeof options.onNavigate === 'function') {
      options.onNavigate(currentMemory, currentIndex, allMemories.length);
    }
  }

  /**
   * Triggers the edit memory callback.
   */
  function handleEdit() {
    if (typeof options.onEdit === 'function') {
      options.onEdit(currentMemory);
    }
  }

  // Event Handlers
  const onPrevClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    prev();
  };

  const onNextClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    next();
  };

  const onEditClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    handleEdit();
  };

  const onCloseClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    close();
  };

  const onContainerClick = (e) => {
    // Backdrop click: close if clicking directly on modal background
    if (e && e.target === container) {
      close();
    }
  };

  const onKeyDown = (e) => {
    if (!isOpenState) return;

    // Ignore key events when user is typing into input or textarea
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (
      active &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable)
    ) {
      return;
    }

    const key = e.key;
    if (key === 'ArrowLeft') {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      prev();
    } else if (key === 'ArrowRight') {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      next();
    } else if (key === 'Escape') {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      close();
    }
  };

  // Wire event listeners
  if (prevBtn && typeof prevBtn.addEventListener === 'function') {
    prevBtn.addEventListener('click', onPrevClick);
  }

  if (nextBtn && typeof nextBtn.addEventListener === 'function') {
    nextBtn.addEventListener('click', onNextClick);
  }

  if (editBtn && typeof editBtn.addEventListener === 'function') {
    editBtn.addEventListener('click', onEditClick);
  }

  if (closeBtn && typeof closeBtn.addEventListener === 'function') {
    closeBtn.addEventListener('click', onCloseClick);
  }

  if (container && typeof container.addEventListener === 'function') {
    container.addEventListener('click', onContainerClick);
  }

  if (keyTarget && typeof keyTarget.addEventListener === 'function') {
    keyTarget.addEventListener('keydown', onKeyDown);
  }

  /**
   * Destroys event listeners and references.
   */
  function destroy() {
    close();

    if (prevBtn && typeof prevBtn.removeEventListener === 'function') {
      prevBtn.removeEventListener('click', onPrevClick);
    }
    if (nextBtn && typeof nextBtn.removeEventListener === 'function') {
      nextBtn.removeEventListener('click', onNextClick);
    }
    if (editBtn && typeof editBtn.removeEventListener === 'function') {
      editBtn.removeEventListener('click', onEditClick);
    }
    if (closeBtn && typeof closeBtn.removeEventListener === 'function') {
      closeBtn.removeEventListener('click', onCloseClick);
    }
    if (container && typeof container.removeEventListener === 'function') {
      container.removeEventListener('click', onContainerClick);
    }
    if (keyTarget && typeof keyTarget.removeEventListener === 'function') {
      keyTarget.removeEventListener('keydown', onKeyDown);
    }
  }

  return {
    open,
    close,
    isOpen: () => isOpenState,
    next,
    prev,
    goToIndex,
    getCurrentMemory: () => currentMemory,
    getCurrentIndex: () => currentIndex,
    getAllMemories: () => allMemories,
    setMemories: (memories) => {
      allMemories = Array.isArray(memories) ? [...memories] : [];
      if (isOpenState) {
        renderCurrent();
      }
    },
    destroy,
    getElements: () => ({
      container,
      cardEl,
      imgEl,
      titleEl,
      dateEl,
      storyEl,
      slotEl,
      prevBtn,
      nextBtn,
      editBtn,
      closeBtn
    })
  };
}
