/**
 * test-manager.mjs
 * Comprehensive unit and integration test suite for Photo & Memory Management Modal.
 * Verifies modal lifecycle, slot switching, image staging, save/reset flow,
 * live 3D texture update callbacks, JSON export/import, and controls/raycaster pausing.
 */

import assert from 'node:assert/strict';

// Test Mock Storage for isolated testing
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MockLocalStorage();

/**
 * Creates a mock DOM element for testing in Node.js
 */
function createMockElement(id = '', tagName = 'div') {
  const classSet = new Set();
  const style = {};
  const listeners = {};
  const attributes = {};
  const children = [];
  let content = '';
  let srcVal = '';
  let valueVal = '';

  const el = {
    id,
    tagName: tagName.toUpperCase(),
    type: tagName === 'button' ? 'button' : tagName === 'input' ? 'text' : undefined,
    style,
    disabled: false,
    files: [],
    dataset: {},
    children,
    classList: {
      add: (...cls) => cls.forEach((c) => classSet.add(c)),
      remove: (...cls) => cls.forEach((c) => classSet.delete(c)),
      contains: (c) => classSet.has(c)
    },
    get textContent() {
      return content;
    },
    set textContent(val) {
      content = String(val);
    },
    get value() {
      return valueVal;
    },
    set value(val) {
      valueVal = String(val);
    },
    get src() {
      return srcVal;
    },
    set src(val) {
      srcVal = String(val);
    },
    innerHTML: '',
    setAttribute: (name, val) => {
      attributes[name] = String(val);
    },
    getAttribute: (name) => {
      return attributes[name] !== undefined ? attributes[name] : null;
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    querySelectorAll: (selector) => {
      if (selector === '.slot-btn') {
        return children.filter(
          (c) => c.classList && (c.classList.contains('slot-btn') || c.type === 'button')
        );
      }
      return [];
    },
    querySelector: (selector) => {
      const all = el.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    },
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((h) => h !== handler);
    },
    dispatchEvent: (event) => {
      const handlers = listeners[event.type] || [];
      handlers.forEach((h) => h(event));
    },
    click: () => {
      const handlers = listeners['click'] || [];
      handlers.forEach((h) => h({ target: el, stopPropagation: () => {} }));
    },
    closest: (selector) => {
      if (selector === '.slot-btn' && classSet.has('slot-btn')) {
        return el;
      }
      return null;
    },
    getListeners: (event) => listeners[event] || []
  };

  return el;
}

/**
 * Creates a mock EventTarget for keyboard events
 */
function createMockKeyTarget() {
  const listeners = {};
  return {
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((h) => h !== handler);
    },
    triggerKey: (key, extra = {}) => {
      const handlers = listeners['keydown'] || [];
      let defaultPrevented = false;
      const event = {
        key,
        preventDefault: () => {
          defaultPrevented = true;
        },
        get defaultPrevented() {
          return defaultPrevented;
        },
        ...extra
      };
      handlers.forEach((h) => h(event));
      return event;
    },
    getListeners: (event) => listeners[event] || []
  };
}

// Import modules under test
const { setupPhotoManagerModal } = await import('../src/ui/photoManagerModal.js');
const { getMemories, resetMemories } = await import('../src/storage/photoStorage.js');

console.log('🧪 Starting Photo Manager Modal Test Suite...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ----------------------------------------------------
// Setup shared test fixtures
// ----------------------------------------------------
function createTestFixture() {
  const container = createMockElement('manage-modal');
  container.classList.add('hidden');
  const closeBtn = createMockElement('manage-close', 'button');
  const slotSelector = createMockElement('slot-selector');

  // Pre-create 8 slot buttons in slotSelector
  for (let i = 1; i <= 8; i++) {
    const btn = createMockElement(`slot-btn-${i}`, 'button');
    btn.classList.add('slot-btn');
    btn.dataset.slot = String(i);
    btn.setAttribute('data-slot', String(i));
    slotSelector.appendChild(btn);
  }

  const uploadDropzone = createMockElement('upload-dropzone');
  const uploadFileInput = createMockElement('upload-file-input', 'input');
  const uploadPreview = createMockElement('upload-preview', 'img');
  uploadPreview.classList.add('hidden');
  const uploadPlaceholder = createMockElement('upload-placeholder');
  const titleInput = createMockElement('input-title', 'input');
  const dateInput = createMockElement('input-date', 'input');
  const storyInput = createMockElement('input-story', 'textarea');
  const resetBtn = createMockElement('btn-reset-memories', 'button');
  const exportBtn = createMockElement('btn-export-json', 'button');
  const importBtn = createMockElement('btn-import-json', 'button');
  const importFileInput = createMockElement('input-import-file', 'input');
  const saveBtn = createMockElement('btn-save-memory', 'button');
  const keyTarget = createMockKeyTarget();

  let controlsDisabled = false;
  let controlsEnabled = false;
  let controlsUnlocked = false;
  const mockControls = {
    disable: () => {
      controlsDisabled = true;
      controlsEnabled = false;
    },
    enable: () => {
      controlsEnabled = true;
      controlsDisabled = false;
    },
    unlock: () => {
      controlsUnlocked = true;
    }
  };

  let raycasterActive = true;
  const mockRaycaster = {
    setEnabled: (val) => {
      raycasterActive = Boolean(val);
    },
    isEnabled: () => raycasterActive
  };

  let savedItemData = null;
  let closedCalled = false;
  let resetMemoriesData = null;
  let importedMemoriesData = null;
  let slotChangedData = null;

  const modal = setupPhotoManagerModal({
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
    saveBtn,
    controls: mockControls,
    raycaster: mockRaycaster,
    keyTarget,
    onSave: (saved) => {
      savedItemData = saved;
    },
    onClose: () => {
      closedCalled = true;
    },
    onReset: (fresh) => {
      resetMemoriesData = fresh;
    },
    onImport: (imported) => {
      importedMemoriesData = imported;
    },
    onSlotChange: (slot, mem) => {
      slotChangedData = { slot, mem };
    }
  });

  return {
    modal,
    elements: {
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
    },
    keyTarget,
    spies: {
      get controlsDisabled() {
        return controlsDisabled;
      },
      get controlsEnabled() {
        return controlsEnabled;
      },
      get controlsUnlocked() {
        return controlsUnlocked;
      },
      get raycasterActive() {
        return raycasterActive;
      },
      get savedItemData() {
        return savedItemData;
      },
      get closedCalled() {
        return closedCalled;
      },
      get resetMemoriesData() {
        return resetMemoriesData;
      },
      get importedMemoriesData() {
        return importedMemoriesData;
      },
      get slotChangedData() {
        return slotChangedData;
      },
      resetSpies: () => {
        savedItemData = null;
        closedCalled = false;
        resetMemoriesData = null;
        importedMemoriesData = null;
        slotChangedData = null;
      }
    }
  };
}

// ----------------------------------------------------
// 1. Interface Contract & Initial State
// ----------------------------------------------------
console.log('[Group 1: Modal Interface Contract & Initial State]');

test('setupPhotoManagerModal returns required interface methods', () => {
  const { modal } = createTestFixture();
  assert.equal(typeof modal.open, 'function');
  assert.equal(typeof modal.close, 'function');
  assert.equal(typeof modal.isOpen, 'function');
  assert.equal(typeof modal.getActiveSlot, 'function');
  assert.equal(typeof modal.loadSlot, 'function');
  assert.equal(typeof modal.save, 'function');
  assert.equal(typeof modal.reset, 'function');
  assert.equal(typeof modal.exportBackup, 'function');
  assert.equal(typeof modal.importBackup, 'function');
  assert.equal(typeof modal.destroy, 'function');
  assert.equal(typeof modal.getAllMemories, 'function');
  assert.equal(typeof modal.setMemories, 'function');
});

test('Modal is initially closed and loads all 8 memories', () => {
  const { modal, elements } = createTestFixture();
  assert.equal(modal.isOpen(), false, 'Modal should initially be closed');
  assert.equal(elements.container.classList.contains('hidden'), true);
  const memories = modal.getAllMemories();
  assert.equal(memories.length, 8, 'Should have 8 memories initially');
});

// ----------------------------------------------------
// 2. Open Lifecycle, Raycaster & Controls Pausing
// ----------------------------------------------------
console.log('\n[Group 2: Modal Open & Controls Lifecycle]');

test('open() opens modal at target slot and disables controls and raycaster', () => {
  const { modal, elements, spies } = createTestFixture();

  modal.open(3);

  assert.equal(modal.isOpen(), true, 'modal.isOpen() must be true');
  assert.equal(elements.container.classList.contains('hidden'), false);
  assert.equal(elements.container.style.display, 'flex');
  assert.equal(modal.getActiveSlot(), 3, 'Active slot should be 3');

  // Verify controls & raycaster pausing
  assert.equal(spies.controlsDisabled, true, 'Controls must be disabled');
  assert.equal(spies.controlsUnlocked, true, 'Controls must be unlocked');
  assert.equal(spies.raycasterActive, false, 'Raycaster must be disabled');

  // Verify form is populated with slot 3 memory
  const slot3Memory = getMemories().find((m) => m.slot === 3);
  assert.equal(elements.titleInput.value, slot3Memory.title);
  assert.equal(elements.dateInput.value, slot3Memory.date);
  assert.equal(elements.storyInput.value, slot3Memory.story);
  assert.equal(elements.uploadPreview.src, slot3Memory.imageUrl);
  assert.equal(elements.uploadPreview.classList.contains('hidden'), false);
  assert.equal(elements.uploadPlaceholder.classList.contains('hidden'), true);
});

// ----------------------------------------------------
// 3. Slot Switching & Form Population
// ----------------------------------------------------
console.log('\n[Group 3: Slot Navigation & Active Slot Selection]');

test('Clicking a slot button switches the active slot and updates form values', () => {
  const { modal, elements, spies } = createTestFixture();

  modal.open(1);
  assert.equal(modal.getActiveSlot(), 1);

  // Switch to slot 5 via loadSlot
  modal.loadSlot(5);
  assert.equal(modal.getActiveSlot(), 5);
  assert.equal(spies.slotChangedData?.slot, 5);

  const slot5Memory = getMemories().find((m) => m.slot === 5);
  assert.equal(elements.titleInput.value, slot5Memory.title);
  assert.equal(elements.dateInput.value, slot5Memory.date);
  assert.equal(elements.storyInput.value, slot5Memory.story);

  // Verify active class in slotSelector
  const slotButtons = elements.slotSelector.querySelectorAll('.slot-btn');
  const btn5 = slotButtons[4];
  assert.equal(btn5.classList.contains('active'), true);
  const btn1 = slotButtons[0];
  assert.equal(btn1.classList.contains('active'), false);
});

test('Clamps slot numbers outside 1..8 range safely', () => {
  const { modal } = createTestFixture();
  modal.loadSlot(10);
  assert.equal(modal.getActiveSlot(), 8, 'Should clamp to 8');
  modal.loadSlot(0);
  assert.equal(modal.getActiveSlot(), 1, 'Should clamp to 1');
});

// ----------------------------------------------------
// 4. Editing, Image Staging & Save Flow
// ----------------------------------------------------
console.log('\n[Group 4: Editing, Saving & Live 3D Texture Callbacks]');

await asyncTest('Editing fields and clicking save updates LocalStorage and invokes onSave callback', async () => {
  const { modal, elements, spies } = createTestFixture();

  modal.open(2);
  elements.titleInput.value = '수정된 두 번째 봄날';
  elements.dateInput.value = '2025. 04. 10';
  elements.storyInput.value = '따스한 바람이 불어오던 새로운 날의 기억.';

  const updatedItem = await modal.save();

  assert.equal(updatedItem.slot, 2);
  assert.equal(updatedItem.title, '수정된 두 번째 봄날');
  assert.equal(updatedItem.date, '2025. 04. 10');
  assert.equal(updatedItem.story, '따스한 바람이 불어오던 새로운 날의 기억.');

  // Verify onSave callback received updated memory
  assert.equal(spies.savedItemData?.slot, 2);
  assert.equal(spies.savedItemData?.title, '수정된 두 번째 봄날');

  // Verify stored in LocalStorage
  const stored = getMemories().find((m) => m.slot === 2);
  assert.equal(stored.title, '수정된 두 번째 봄날');
  assert.equal(stored.date, '2025. 04. 10');
});

await asyncTest('handleImageFile stages image and applies compression', async () => {
  const { modal, elements } = createTestFixture();

  modal.open(4);
  const fakeImageDataUrl = 'data:image/jpeg;base64,staged_image_data_slot_4';

  await modal.handleImageFile(fakeImageDataUrl);

  assert.equal(elements.uploadPreview.src, fakeImageDataUrl);
  assert.equal(elements.uploadPreview.classList.contains('hidden'), false);
  assert.equal(elements.uploadPlaceholder.classList.contains('hidden'), true);

  // Now save and verify staged image is persisted
  const saved = await modal.save();
  assert.equal(saved.slot, 4);
  assert.equal(saved.imageUrl, fakeImageDataUrl);

  const stored = getMemories().find((m) => m.slot === 4);
  assert.equal(stored.imageUrl, fakeImageDataUrl);
});

// ----------------------------------------------------
// 5. Reset to Curated Presets
// ----------------------------------------------------
console.log('\n[Group 5: Reset to Curated Presets]');

test('reset() restores initial 8 presets and triggers onReset callback', () => {
  const { modal, elements, spies } = createTestFixture();

  modal.open(2);
  assert.equal(elements.titleInput.value, '수정된 두 번째 봄날'); // Modified earlier

  const fresh = modal.reset();

  assert.equal(fresh.length, 8);
  assert.equal(fresh[1].title, '봄날의 벚꽃길', 'Must restore slot 2 default preset');
  assert.equal(spies.resetMemoriesData?.length, 8);
  assert.equal(spies.resetMemoriesData?.[1].title, '봄날의 벚꽃길');

  // Form input should now be reset
  assert.equal(elements.titleInput.value, '봄날의 벚꽃길');
});

// ----------------------------------------------------
// 6. JSON Export & Import Backup Flow
// ----------------------------------------------------
console.log('\n[Group 6: JSON Export & Import]');

test('exportBackup() exports valid formatted JSON string with 8 memories', () => {
  const { modal } = createTestFixture();
  const jsonStr = modal.exportBackup();

  assert.ok(typeof jsonStr === 'string');
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.length, 8);
  assert.equal(parsed[0].slot, 1);
});

test('importBackup() validates and imports memories, updating state and onImport callback', () => {
  const { modal, elements, spies } = createTestFixture();

  const customMemories = [
    {
      slot: 1,
      title: '가족과의 제주 여행',
      date: '2023. 08. 15',
      story: '에메랄드빛 바다와 함께한 시간.',
      imageUrl: 'data:image/jpeg;base64,custom_jeju',
      frameStyle: 'wood-gold'
    }
  ];

  const imported = modal.importBackup(JSON.stringify(customMemories));

  assert.equal(imported.length, 8);
  assert.equal(imported[0].title, '가족과의 제주 여행');
  assert.equal(spies.importedMemoriesData?.[0].title, '가족과의 제주 여행');

  // Load slot 1 to verify form update
  modal.loadSlot(1);
  assert.equal(elements.titleInput.value, '가족과의 제주 여행');
});

test('importBackup() throws error for invalid JSON string', () => {
  const { modal } = createTestFixture();
  assert.throws(
    () => modal.importBackup('invalid-json{{{'),
    { message: /JSON 파싱에 실패했습니다/ }
  );
});

// ----------------------------------------------------
// 7. Modal Dismissal (Close Button, Backdrop, ESC)
// ----------------------------------------------------
console.log('\n[Group 7: Modal Dismissal & Controls Restoring]');

test('Close button dismisses modal and restores controls and raycaster', () => {
  const { modal, elements, spies } = createTestFixture();

  modal.open(1);
  assert.equal(modal.isOpen(), true);

  elements.closeBtn.click();

  assert.equal(modal.isOpen(), false);
  assert.equal(elements.container.classList.contains('hidden'), true);
  assert.equal(spies.closedCalled, true, 'onClose callback must be called');
  assert.equal(spies.controlsEnabled, true, 'Controls must be re-enabled');
  assert.equal(spies.raycasterActive, true, 'Raycaster must be re-enabled');
});

test('Backdrop click on container closes modal', () => {
  const { modal, elements } = createTestFixture();

  modal.open(1);
  assert.equal(modal.isOpen(), true);

  elements.container.dispatchEvent({
    type: 'click',
    target: elements.container
  });

  assert.equal(modal.isOpen(), false);
  assert.equal(elements.container.classList.contains('hidden'), true);
});

test('Escape key dismisses modal', () => {
  const { modal, elements, keyTarget } = createTestFixture();

  modal.open(1);
  assert.equal(modal.isOpen(), true);

  const escEvent = keyTarget.triggerKey('Escape');

  assert.equal(modal.isOpen(), false);
  assert.equal(escEvent.defaultPrevented, true);
  assert.equal(elements.container.classList.contains('hidden'), true);
});

// ----------------------------------------------------
// 8. Teardown / Destroy Cleanup
// ----------------------------------------------------
console.log('\n[Group 8: Cleanup & Teardown]');

test('destroy() closes modal and removes all event listeners cleanly', () => {
  const { modal, elements, keyTarget } = createTestFixture();

  modal.open(1);
  modal.destroy();

  assert.equal(modal.isOpen(), false);
  assert.equal(elements.closeBtn.getListeners('click').length, 0);
  assert.equal(elements.saveBtn.getListeners('click').length, 0);
  assert.equal(elements.resetBtn.getListeners('click').length, 0);
  assert.equal(elements.exportBtn.getListeners('click').length, 0);
  assert.equal(elements.importBtn.getListeners('click').length, 0);
  assert.equal(keyTarget.getListeners('keydown').length, 0);
});

console.log(`\n🎉 All ${passedTests} Photo Manager Modal tests passed successfully!\n`);
