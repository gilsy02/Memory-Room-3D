/**
 * photoManagerModal.js
 * In-browser Photo & Memory Management Modal for 3D Memory Room.
 *
 * Provides:
 * - 8 slot selector cards with slot number, thumbnail, and memory title
 * - Active slot editing: image drop zone / file picker with real-time preview
 * - Automatic image compression (<1200px, 0.8 JPEG) via compressImage()
 * - Real-time title, date, and story editing
 * - Live 3D texture update via onSave callback without page reload
 * - Reset to curated default presets with onReset callback
 * - JSON export & import backup functionality
 * - Modal lifecycle: pauses controls & raycaster while open, restores on close
 * - Warm, cozy toast notification feedback
 */

import {
  getMemories,
  saveMemory,
  resetMemories,
  exportMemoriesJSON,
  importMemoriesJSON,
  compressImage
} from '../storage/photoStorage.js';

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
 * Escapes unsafe HTML characters to prevent XSS in template interpolation.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Displays a warm, subtle toast message in the bottom center of the screen.
 *
 * @param {string} message
 * @param {'success'|'error'} [type='success']
 */
export function showToast(message, type = 'success') {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('manage-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'manage-toast';
  const borderCol =
    type === 'error'
      ? 'border-red-500/50 text-red-200 bg-[#2b1414]/95'
      : 'border-amber-400/50 text-amber-100 bg-[#241911]/95';

  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl ${borderCol} border shadow-2xl backdrop-blur-md text-xs font-batang flex items-center gap-2 pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100`;

  const iconSvg =
    type === 'error'
      ? `<svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : `<svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  if (document.body && typeof document.body.appendChild === 'function') {
    document.body.appendChild(toast);
  }

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (typeof toast.remove === 'function') {
        toast.remove();
      }
    }, 350);
  }, 2500);
}

/**
 * Initializes and manages the Photo & Memory Management Modal.
 *
 * @param {object} [options]
 * @param {string|HTMLElement} [options.container='#manage-modal']
 * @param {string|HTMLElement} [options.closeBtn='#manage-close']
 * @param {string|HTMLElement} [options.slotSelector='#slot-selector']
 * @param {string|HTMLElement} [options.uploadDropzone='#upload-dropzone']
 * @param {string|HTMLElement} [options.uploadFileInput='#upload-file-input']
 * @param {string|HTMLElement} [options.uploadPreview='#upload-preview']
 * @param {string|HTMLElement} [options.uploadPlaceholder='#upload-placeholder']
 * @param {string|HTMLElement} [options.titleInput='#input-title']
 * @param {string|HTMLElement} [options.dateInput='#input-date']
 * @param {string|HTMLElement} [options.storyInput='#input-story']
 * @param {string|HTMLElement} [options.resetBtn='#btn-reset-memories']
 * @param {string|HTMLElement} [options.exportBtn='#btn-export-json']
 * @param {string|HTMLElement} [options.importBtn='#btn-import-json']
 * @param {string|HTMLElement} [options.importFileInput='#input-import-file']
 * @param {string|HTMLElement} [options.saveBtn='#btn-save-memory']
 * @param {Array<object>} [options.memories]
 * @param {object} [options.controls]
 * @param {object} [options.raycaster]
 * @param {EventTarget} [options.keyTarget]
 * @param {(savedItem: object) => void} [options.onSave]
 * @param {() => void} [options.onClose]
 * @param {(freshMemories: Array<object>) => void} [options.onReset]
 * @param {(importedMemories: Array<object>) => void} [options.onImport]
 * @param {(slot: number, memory: object) => void} [options.onSlotChange]
 * @returns {object} Manager modal controller interface
 */
export function setupPhotoManagerModal(options = {}) {
  const container = resolveElement(options.container || '#manage-modal');
  const closeBtn = resolveElement(options.closeBtn || '#manage-close');
  const slotSelector = resolveElement(options.slotSelector || '#slot-selector');
  const uploadDropzone = resolveElement(options.uploadDropzone || '#upload-dropzone');
  const uploadFileInput = resolveElement(options.uploadFileInput || '#upload-file-input');
  const uploadPreview = resolveElement(options.uploadPreview || '#upload-preview');
  const uploadPlaceholder = resolveElement(options.uploadPlaceholder || '#upload-placeholder');
  const titleInput = resolveElement(options.titleInput || '#input-title');
  const dateInput = resolveElement(options.dateInput || '#input-date');
  const storyInput = resolveElement(options.storyInput || '#input-story');
  const resetBtn = resolveElement(options.resetBtn || '#btn-reset-memories');
  const exportBtn = resolveElement(options.exportBtn || '#btn-export-json');
  const importBtn = resolveElement(options.importBtn || '#btn-import-json');
  const importFileInput = resolveElement(options.importFileInput || '#input-import-file');
  const saveBtn = resolveElement(options.saveBtn || '#btn-save-memory');

  const controls = options.controls || null;
  const raycaster = options.raycaster || null;

  const keyTarget =
    options.keyTarget ||
    (typeof window !== 'undefined'
      ? window
      : typeof document !== 'undefined'
        ? document
        : null);

  let allMemories = Array.isArray(options.memories) ? [...options.memories] : [];
  let activeSlot = 1;
  let isOpenState = false;
  let isSaving = false;

  // Staged images mapped by slot number (e.g. newly picked or dropped)
  const stagedImages = new Map();

  /**
   * Refreshes memory data from storage if empty
   */
  function syncMemoriesFromStorage() {
    try {
      allMemories = getMemories() || [];
    } catch {
      allMemories = [];
    }
  }

  if (allMemories.length === 0) {
    syncMemoriesFromStorage();
  }

  /**
   * Returns memory object for given slot
   *
   * @param {number} slot
   * @returns {object}
   */
  function getMemoryBySlot(slot) {
    const found = allMemories.find((m) => Number(m.slot) === Number(slot));
    return (
      found || {
        id: `mem_0${slot}`,
        slot: Number(slot),
        title: `기억 #${slot}`,
        date: '',
        story: '',
        imageUrl: '',
        frameStyle: 'wood-gold'
      }
    );
  }

  /**
   * Renders the 8 slot navigation cards/tabs
   */
  function renderSlotSelector() {
    if (!slotSelector) return;

    // Check if slotSelector already contains buttons
    const existingButtons = slotSelector.querySelectorAll
      ? slotSelector.querySelectorAll('.slot-btn')
      : [];

    if (existingButtons.length === 8) {
      // Update existing 8 buttons
      existingButtons.forEach((btn, idx) => {
        const slotNum = idx + 1;
        const memory = getMemoryBySlot(slotNum);
        const displayImage = stagedImages.get(slotNum) || memory.imageUrl;
        const isActive = slotNum === activeSlot;

        btn.dataset.slot = String(slotNum);
        btn.setAttribute?.('data-slot', String(slotNum));

        // Update styling
        if (btn.classList) {
          if (isActive) {
            btn.classList.add(
              'active',
              'border-amber-500/80',
              'bg-amber-500/20',
              'text-amber-200',
              'ring-1',
              'ring-amber-400/40'
            );
            btn.classList.remove('border-stone-800', 'bg-stone-900/60', 'text-stone-400');
          } else {
            btn.classList.remove(
              'active',
              'border-amber-500/80',
              'bg-amber-500/20',
              'text-amber-200',
              'ring-1',
              'ring-amber-400/40'
            );
            btn.classList.add('border-stone-800', 'bg-stone-900/60', 'text-stone-400');
          }
        }

        // Render card content: mini-thumbnail + slot label & title
        btn.innerHTML = `
          <div class="flex items-center gap-1.5 w-full pointer-events-none text-left">
            <div class="w-6 h-6 rounded bg-stone-800/80 overflow-hidden flex-shrink-0 border border-stone-700/60 flex items-center justify-center">
              ${
                displayImage
                  ? `<img src="${displayImage}" class="w-full h-full object-cover" alt="" />`
                  : `<span class="text-[9px] text-stone-500 font-mono">${slotNum}</span>`
              }
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-bold leading-tight truncate">액자 ${slotNum}</div>
              <div class="text-[9px] text-stone-400 truncate opacity-85">${escapeHtml(memory.title) || '제목 없음'}</div>
            </div>
          </div>
        `;
      });
    } else if (typeof document !== 'undefined') {
      // Dynamically construct 8 cards if empty
      slotSelector.innerHTML = '';
      for (let slotNum = 1; slotNum <= 8; slotNum++) {
        const memory = getMemoryBySlot(slotNum);
        const displayImage = stagedImages.get(slotNum) || memory.imageUrl;
        const isActive = slotNum === activeSlot;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.slot = String(slotNum);
        btn.setAttribute?.('data-slot', String(slotNum));
        btn.className = `slot-btn ${
          isActive
            ? 'active border-amber-500/80 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40'
            : 'border-stone-800 bg-stone-900/60 text-stone-400'
        } p-2 text-xs rounded-lg border text-center font-medium cursor-pointer transition-all hover:bg-stone-800`;

        btn.innerHTML = `
          <div class="flex items-center gap-1.5 w-full pointer-events-none text-left">
            <div class="w-6 h-6 rounded bg-stone-800/80 overflow-hidden flex-shrink-0 border border-stone-700/60 flex items-center justify-center">
              ${
                displayImage
                  ? `<img src="${displayImage}" class="w-full h-full object-cover" alt="" />`
                  : `<span class="text-[9px] text-stone-500 font-mono">${slotNum}</span>`
              }
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-bold leading-tight truncate">액자 ${slotNum}</div>
              <div class="text-[9px] text-stone-400 truncate opacity-85">${escapeHtml(memory.title) || '제목 없음'}</div>
            </div>
          </div>
        `;

        slotSelector.appendChild(btn);
      }
    }
  }

  /**
   * Populates the active slot editor form with current memory values
   *
   * @param {number} slot
   */
  function loadSlot(slot) {
    const targetSlot = Math.min(Math.max(Number(slot) || 1, 1), 8);
    activeSlot = targetSlot;

    const memory = getMemoryBySlot(activeSlot);
    const displayImage = stagedImages.get(activeSlot) || memory.imageUrl;

    if (titleInput) {
      titleInput.value = memory.title || '';
    }

    if (dateInput) {
      dateInput.value = memory.date || '';
    }

    if (storyInput) {
      storyInput.value = memory.story || '';
    }

    // Update Image Preview & Placeholder
    if (displayImage) {
      if (uploadPreview) {
        uploadPreview.src = displayImage;
        uploadPreview.classList?.remove('hidden');
        if (uploadPreview.style) {
          uploadPreview.style.display = 'block';
        }
      }
      if (uploadPlaceholder) {
        uploadPlaceholder.classList?.add('hidden');
        if (uploadPlaceholder.style) {
          uploadPlaceholder.style.display = 'none';
        }
      }
    } else {
      if (uploadPreview) {
        uploadPreview.src = '';
        uploadPreview.classList?.add('hidden');
        if (uploadPreview.style) {
          uploadPreview.style.display = 'none';
        }
      }
      if (uploadPlaceholder) {
        uploadPlaceholder.classList?.remove('hidden');
        if (uploadPlaceholder.style) {
          uploadPlaceholder.style.display = 'flex';
        }
      }
    }

    renderSlotSelector();

    if (typeof options.onSlotChange === 'function') {
      options.onSlotChange(activeSlot, memory);
    }
  }

  /**
   * Processes a selected image file or data URL, applies compression, and updates preview
   *
   * @param {File|Blob|string} fileOrDataUrl
   */
  async function handleImageFile(fileOrDataUrl) {
    if (!fileOrDataUrl) return;

    try {
      const compressed = await compressImage(fileOrDataUrl);
      stagedImages.set(activeSlot, compressed);

      if (uploadPreview) {
        uploadPreview.src = compressed;
        uploadPreview.classList?.remove('hidden');
        if (uploadPreview.style) {
          uploadPreview.style.display = 'block';
        }
      }
      if (uploadPlaceholder) {
        uploadPlaceholder.classList?.add('hidden');
        if (uploadPlaceholder.style) {
          uploadPlaceholder.style.display = 'none';
        }
      }

      renderSlotSelector();
      showToast('사진이 최적화되었습니다. [저장하기]를 누르면 적용됩니다.');
    } catch (err) {
      console.warn('[photoManagerModal] Image compression error:', err);
      showToast('이미지 처리 중 오류가 발생했습니다.', 'error');
    }
  }

  /**
   * Saves the active slot memory to storage, updates live 3D texture, and displays toast
   */
  async function save() {
    if (isSaving) return;
    isSaving = true;

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '저장 중...';
    }

    try {
      const currentMemory = getMemoryBySlot(activeSlot);
      const title = titleInput ? titleInput.value.trim() : currentMemory.title;
      const date = dateInput ? dateInput.value.trim() : currentMemory.date;
      const story = storyInput ? storyInput.value.trim() : currentMemory.story;
      const imageUrl = stagedImages.get(activeSlot) || currentMemory.imageUrl;

      const updated = await saveMemory({
        slot: activeSlot,
        title,
        date,
        story,
        imageUrl,
        frameStyle: currentMemory.frameStyle || 'wood-gold'
      });

      // Clear staged image for this slot
      stagedImages.delete(activeSlot);

      // Update in-memory cache
      const idx = allMemories.findIndex((m) => Number(m.slot) === activeSlot);
      if (idx !== -1) {
        allMemories[idx] = updated;
      } else {
        allMemories.push(updated);
      }

      renderSlotSelector();
      loadSlot(activeSlot);

      if (typeof options.onSave === 'function') {
        options.onSave(updated);
      }

      showToast(`'액자 ${activeSlot}' 추억이 저장되었습니다.`);
      return updated;
    } catch (err) {
      console.error('[photoManagerModal] Save failed:', err);
      showToast(err.message || '저장 중 오류가 발생했습니다.', 'error');
      throw err;
    } finally {
      isSaving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장하기';
      }
    }
  }

  /**
   * Resets all memories to 8 curated presets and triggers onReset
   */
  function reset() {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(
        '모든 추억을 기본 설정으로 되돌리시겠습니까?\n작성하신 내용과 사진이 초기화됩니다.'
      );
      if (!ok) return null;
    }

    try {
      const freshPresets = resetMemories();
      stagedImages.clear();
      allMemories = [...freshPresets];

      renderSlotSelector();
      loadSlot(activeSlot);

      if (typeof options.onReset === 'function') {
        options.onReset(freshPresets);
      }

      showToast('모든 추억이 기본 테마로 초기화되었습니다.');
      return freshPresets;
    } catch (err) {
      console.error('[photoManagerModal] Reset failed:', err);
      showToast('초기화 중 오류가 발생했습니다.', 'error');
      throw err;
    }
  }

  /**
   * Exports all current memories as a downloaded JSON backup file
   */
  function exportBackup() {
    try {
      const jsonStr = exportMemoriesJSON();

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `memory-room-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      showToast('추억 데이터가 JSON 파일로 저장되었습니다.');
      return jsonStr;
    } catch (err) {
      console.error('[photoManagerModal] Export failed:', err);
      showToast('내보내기 중 오류가 발생했습니다.', 'error');
      throw err;
    }
  }

  /**
   * Imports memories from a JSON string or file reader
   *
   * @param {string} [jsonString]
   */
  function importBackup(jsonString) {
    if (jsonString) {
      try {
        const imported = importMemoriesJSON(jsonString);
        stagedImages.clear();
        allMemories = [...imported];

        renderSlotSelector();
        loadSlot(activeSlot);

        if (typeof options.onImport === 'function') {
          options.onImport(imported);
        }

        if (importFileInput) {
          importFileInput.value = '';
        }

        showToast('성공적으로 추억 데이터를 복원했습니다.');
        return imported;
      } catch (err) {
        if (importFileInput) {
          importFileInput.value = '';
        }
        showToast(err.message || '가져오기에 실패했습니다.', 'error');
        throw err;
      }
    }

    // Trigger file input picker if no string passed
    if (importFileInput && typeof importFileInput.click === 'function') {
      importFileInput.click();
    }
  }

  /**
   * Opens the photo manager modal with warm backdrop fade-in
   *
   * @param {number} [targetSlot=1]
   */
  function open(targetSlot = 1) {
    syncMemoriesFromStorage();
    isOpenState = true;

    if (container) {
      container.classList?.remove('hidden');
      if (container.style) {
        container.style.display = 'flex';
      }
    }

    // Disable controls and unlock mouse pointer
    if (controls) {
      if (typeof controls.disable === 'function') {
        controls.disable();
      }
      if (typeof controls.unlock === 'function') {
        controls.unlock();
      }
    }

    // Disable center raycaster while modal is open
    if (raycaster) {
      if (typeof raycaster.setEnabled === 'function') {
        raycaster.setEnabled(false);
      }
    }

    loadSlot(targetSlot);
  }

  /**
   * Closes the photo manager modal and restores controls & raycaster
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

  // Event Handlers
  const onCloseClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    close();
  };

  const onBackdropClick = (e) => {
    if (e && e.target === container) {
      close();
    }
  };

  const onSlotSelectorClick = (e) => {
    if (!e || !e.target) return;
    const target = e.target;
    const btn =
      typeof target.closest === 'function'
        ? target.closest('.slot-btn')
        : target.classList?.contains('slot-btn')
          ? target
          : null;

    if (btn) {
      const slotNum = Number(btn.dataset?.slot || btn.getAttribute?.('data-slot'));
      if (slotNum >= 1 && slotNum <= 8) {
        loadSlot(slotNum);
      }
    }
  };

  const onDropzoneClick = () => {
    if (uploadFileInput && typeof uploadFileInput.click === 'function') {
      uploadFileInput.click();
    }
  };

  const onFileInputChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    if (uploadFileInput) {
      uploadFileInput.value = '';
    }
  };

  const onDragOver = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (uploadDropzone && uploadDropzone.classList) {
      uploadDropzone.classList.add('border-amber-400', 'bg-amber-950/20');
    }
  };

  const onDragLeave = () => {
    if (uploadDropzone && uploadDropzone.classList) {
      uploadDropzone.classList.remove('border-amber-400', 'bg-amber-950/20');
    }
  };

  const onDrop = (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    onDragLeave();
    const file = e?.dataTransfer?.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const onSaveClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    save();
  };

  const onResetClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    reset();
  };

  const onExportClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    exportBackup();
  };

  const onImportBtnClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    importBackup();
  };

  const onImportFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) {
      if (importFileInput) {
        importFileInput.value = '';
      }
      return;
    }

    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const text = readEvent?.target?.result;
        try {
          if (text) {
            importBackup(text);
          }
        } finally {
          if (importFileInput) {
            importFileInput.value = '';
          }
        }
      };
      reader.onerror = () => {
        if (importFileInput) {
          importFileInput.value = '';
        }
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      };
      reader.readAsText(file);
    } else {
      if (importFileInput) {
        importFileInput.value = '';
      }
    }
  };

  const onKeyDown = (e) => {
    if (!isOpenState) return;

    if (e.key === 'Escape') {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      close();
    }
  };

  // Wire event listeners
  if (closeBtn && typeof closeBtn.addEventListener === 'function') {
    closeBtn.addEventListener('click', onCloseClick);
  }

  if (container && typeof container.addEventListener === 'function') {
    container.addEventListener('click', onBackdropClick);
  }

  if (slotSelector && typeof slotSelector.addEventListener === 'function') {
    slotSelector.addEventListener('click', onSlotSelectorClick);
  }

  if (uploadDropzone && typeof uploadDropzone.addEventListener === 'function') {
    uploadDropzone.addEventListener('click', onDropzoneClick);
    uploadDropzone.addEventListener('dragover', onDragOver);
    uploadDropzone.addEventListener('dragenter', onDragOver);
    uploadDropzone.addEventListener('dragleave', onDragLeave);
    uploadDropzone.addEventListener('drop', onDrop);
  }

  if (uploadFileInput && typeof uploadFileInput.addEventListener === 'function') {
    uploadFileInput.addEventListener('change', onFileInputChange);
  }

  if (saveBtn && typeof saveBtn.addEventListener === 'function') {
    saveBtn.addEventListener('click', onSaveClick);
  }

  if (resetBtn && typeof resetBtn.addEventListener === 'function') {
    resetBtn.addEventListener('click', onResetClick);
  }

  if (exportBtn && typeof exportBtn.addEventListener === 'function') {
    exportBtn.addEventListener('click', onExportClick);
  }

  if (importBtn && typeof importBtn.addEventListener === 'function') {
    importBtn.addEventListener('click', onImportBtnClick);
  }

  if (importFileInput && typeof importFileInput.addEventListener === 'function') {
    importFileInput.addEventListener('change', onImportFileChange);
  }

  if (keyTarget && typeof keyTarget.addEventListener === 'function') {
    keyTarget.addEventListener('keydown', onKeyDown);
  }

  // Initial slot card render
  renderSlotSelector();

  /**
   * Tears down listeners and references
   */
  function destroy() {
    close();

    if (closeBtn && typeof closeBtn.removeEventListener === 'function') {
      closeBtn.removeEventListener('click', onCloseClick);
    }
    if (container && typeof container.removeEventListener === 'function') {
      container.removeEventListener('click', onBackdropClick);
    }
    if (slotSelector && typeof slotSelector.removeEventListener === 'function') {
      slotSelector.removeEventListener('click', onSlotSelectorClick);
    }
    if (uploadDropzone && typeof uploadDropzone.removeEventListener === 'function') {
      uploadDropzone.removeEventListener('click', onDropzoneClick);
      uploadDropzone.removeEventListener('dragover', onDragOver);
      uploadDropzone.removeEventListener('dragenter', onDragOver);
      uploadDropzone.removeEventListener('dragleave', onDragLeave);
      uploadDropzone.removeEventListener('drop', onDrop);
    }
    if (uploadFileInput && typeof uploadFileInput.removeEventListener === 'function') {
      uploadFileInput.removeEventListener('change', onFileInputChange);
    }
    if (saveBtn && typeof saveBtn.removeEventListener === 'function') {
      saveBtn.removeEventListener('click', onSaveClick);
    }
    if (resetBtn && typeof resetBtn.removeEventListener === 'function') {
      resetBtn.removeEventListener('click', onResetClick);
    }
    if (exportBtn && typeof exportBtn.removeEventListener === 'function') {
      exportBtn.removeEventListener('click', onExportClick);
    }
    if (importBtn && typeof importBtn.removeEventListener === 'function') {
      importBtn.removeEventListener('click', onImportBtnClick);
    }
    if (importFileInput && typeof importFileInput.removeEventListener === 'function') {
      importFileInput.removeEventListener('change', onImportFileChange);
    }
    if (keyTarget && typeof keyTarget.removeEventListener === 'function') {
      keyTarget.removeEventListener('keydown', onKeyDown);
    }
  }

  return {
    open,
    close,
    isOpen: () => isOpenState,
    getActiveSlot: () => activeSlot,
    loadSlot,
    save,
    reset,
    exportBackup,
    importBackup,
    handleImageFile,
    getAllMemories: () => allMemories,
    setMemories: (memories) => {
      allMemories = Array.isArray(memories) ? [...memories] : [];
      renderSlotSelector();
      if (isOpenState) {
        loadSlot(activeSlot);
      }
    },
    destroy,
    getElements: () => ({
      container,
      closeBtn,
      slotSelector,
      uploadDropzone,
      uploadFileInput,
      uploadPreview,
      uploadPlaceholder,
      titleInput,
      dateInput,
      storyInput,
      resetBtn,
      exportBtn,
      importBtn,
      importFileInput,
      saveBtn
    })
  };
}
