import assert from 'node:assert/strict';
import { setupPolaroidModal } from '../src/ui/polaroidModal.js';
import { getMemories } from '../src/storage/photoStorage.js';

/**
 * Creates a mock DOM element for testing in Node.js
 */
function createMockElement(id = '', tagName = 'div') {
  const classSet = new Set();
  const style = {};
  const listeners = {};
  let content = '';
  let srcVal = '';
  let altVal = '';

  const el = {
    id,
    tagName: tagName.toUpperCase(),
    type: tagName === 'button' ? 'button' : undefined,
    style,
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
    get src() {
      return srcVal;
    },
    set src(val) {
      srcVal = String(val);
    },
    get alt() {
      return altVal;
    },
    set alt(val) {
      altVal = String(val);
    },
    innerHTML: '',
    setAttribute: () => {},
    getAttribute: () => null,
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
    getListeners: (event) => listeners[event] || []
  };

  return el;
}

/**
 * Creates a mock EventTarget for window/keyboard events
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

async function runTests() {
  console.log('--- Testing Polaroid Modal Interface Contract & Initial State ---');

  const container = createMockElement('polaroid-modal');
  container.classList.add('hidden');
  const card = createMockElement('polaroid-card');
  const img = createMockElement('polaroid-img', 'img');
  const title = createMockElement('polaroid-title', 'h3');
  const date = createMockElement('polaroid-date', 'span');
  const story = createMockElement('polaroid-story', 'p');
  const slot = createMockElement('polaroid-slot', 'span');
  const prevBtn = createMockElement('polaroid-prev', 'button');
  const nextBtn = createMockElement('polaroid-next', 'button');
  const editBtn = createMockElement('polaroid-edit', 'button');
  const closeBtn = createMockElement('polaroid-close', 'button');
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

  let editCallbackMemory = null;
  let closeCallbackCalled = false;
  let navigateCallbackData = null;
  let openCallbackData = null;

  const testMemories = [
    { id: 'mem-1', slot: 1, title: '첫 번째 추억: 제주 바다', date: '2023. 07. 12', story: '푸르던 파도 소리', imageUrl: 'data:image/jpeg;base64,aaa' },
    { id: 'mem-2', slot: 2, title: '두 번째 추억: 밤하늘 별', date: '2023. 09. 20', story: '쏟아지던 은하수', imageUrl: 'data:image/jpeg;base64,bbb' },
    { id: 'mem-3', slot: 3, title: '세 번째 추억: 가을 단풍', date: '2023. 11. 05', story: '붉게 물든 숲길', imageUrl: 'data:image/jpeg;base64,ccc' }
  ];

  const modal = setupPolaroidModal({
    container,
    card,
    img,
    title,
    date,
    story,
    slot,
    prevBtn,
    nextBtn,
    editBtn,
    closeBtn,
    controls: mockControls,
    raycaster: mockRaycaster,
    keyTarget,
    memories: testMemories,
    onEdit: (mem) => {
      editCallbackMemory = mem;
    },
    onClose: () => {
      closeCallbackCalled = true;
    },
    onNavigate: (mem, idx, total) => {
      navigateCallbackData = { mem, idx, total };
    },
    onOpen: (mem, idx, total) => {
      openCallbackData = { mem, idx, total };
    }
  });

  // Test 1: Verify methods existence
  assert.equal(typeof modal.open, 'function', 'modal.open must be a function');
  assert.equal(typeof modal.close, 'function', 'modal.close must be a function');
  assert.equal(typeof modal.isOpen, 'function', 'modal.isOpen must be a function');
  assert.equal(typeof modal.next, 'function', 'modal.next must be a function');
  assert.equal(typeof modal.prev, 'function', 'modal.prev must be a function');
  assert.equal(typeof modal.goToIndex, 'function', 'modal.goToIndex must be a function');
  assert.equal(typeof modal.getCurrentMemory, 'function', 'modal.getCurrentMemory must be a function');
  assert.equal(typeof modal.getCurrentIndex, 'function', 'modal.getCurrentIndex must be a function');
  assert.equal(typeof modal.getAllMemories, 'function', 'modal.getAllMemories must be a function');
  assert.equal(typeof modal.setMemories, 'function', 'modal.setMemories must be a function');
  assert.equal(typeof modal.destroy, 'function', 'modal.destroy must be a function');

  // Test 2: Initial state
  assert.equal(modal.isOpen(), false, 'Modal must initially be closed');
  assert.equal(modal.getCurrentMemory(), null, 'Current memory must be null initially');
  assert.equal(modal.getAllMemories().length, 3, 'Must have 3 test memories');
  console.log('✓ Interface contract and initial state verified.');

  console.log('--- Testing Modal Open & DOM Rendering ---');

  // Open with second memory
  modal.open(testMemories[1]);

  assert.equal(modal.isOpen(), true, 'modal.isOpen() must return true after open()');
  assert.equal(modal.getCurrentIndex(), 1, 'Current index must be 1');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-2', 'Current memory must be mem-2');

  // Verify DOM element updates
  assert.equal(container.classList.contains('hidden'), false, 'Container must remove "hidden"');
  assert.equal(container.style.display, 'flex', 'Container display style must be "flex"');
  assert.equal(card.classList.contains('scale-100'), true, 'Card must add "scale-100"');
  assert.equal(title.textContent, '두 번째 추억: 밤하늘 별', 'Title text must match memory');
  assert.equal(date.textContent, '2023. 09. 20', 'Date text must match memory');
  assert.equal(story.textContent, '쏟아지던 은하수', 'Story text must match memory');
  assert.equal(img.src, 'data:image/jpeg;base64,bbb', 'Image src must match memory');
  assert.equal(slot.textContent, '추억 2 / 3', 'Slot indicator must format as "추억 {slot} / {total}"');

  // Verify controls and raycaster disabling
  assert.equal(controlsDisabled, true, 'Controls must be disabled on modal open');
  assert.equal(controlsUnlocked, true, 'Controls must be unlocked on modal open');
  assert.equal(raycasterActive, false, 'Raycaster must be disabled on modal open');

  // Verify onOpen callback
  assert.deepEqual(
    openCallbackData,
    { mem: testMemories[1], idx: 1, total: 3 },
    'onOpen callback must be triggered with active memory data'
  );
  console.log('✓ Modal open and DOM rendering verified.');

  console.log('--- Testing Navigation & Wraparound Cycling ---');

  // Next: from index 1 to index 2
  modal.next();
  assert.equal(modal.getCurrentIndex(), 2, 'Next must advance to index 2');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-3', 'Current memory must be mem-3');
  assert.equal(slot.textContent, '추억 3 / 3', 'Slot text must be "추억 3 / 3"');
  assert.equal(navigateCallbackData?.idx, 2, 'onNavigate must receive index 2');

  // Next again: wraparound from index 2 to index 0
  modal.next();
  assert.equal(modal.getCurrentIndex(), 0, 'Next must wrap around to index 0');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-1', 'Current memory must be mem-1');
  assert.equal(slot.textContent, '추억 1 / 3', 'Slot text must be "추억 1 / 3"');
  assert.equal(navigateCallbackData?.idx, 0, 'onNavigate must receive index 0');

  // Prev: wraparound backward from index 0 to index 2
  modal.prev();
  assert.equal(modal.getCurrentIndex(), 2, 'Prev must wrap around backward from 0 to 2');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-3', 'Current memory must be mem-3');
  assert.equal(slot.textContent, '추억 3 / 3', 'Slot text must be "추억 3 / 3"');
  assert.equal(navigateCallbackData?.idx, 2, 'onNavigate must receive index 2');

  // Prev again: from index 2 to index 1
  modal.prev();
  assert.equal(modal.getCurrentIndex(), 1, 'Prev must step backward from 2 to 1');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-2', 'Current memory must be mem-2');

  // goToIndex
  modal.goToIndex(0);
  assert.equal(modal.getCurrentIndex(), 0, 'goToIndex(0) must set index to 0');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-1');

  modal.goToIndex(5); // 5 % 3 = 2
  assert.equal(modal.getCurrentIndex(), 2, 'goToIndex(5) must wrap to index 2');
  console.log('✓ Navigation and wraparound cycling verified.');

  console.log('--- Testing Interactive Buttons & Callbacks ---');

  // Prev button click
  prevBtn.click();
  assert.equal(modal.getCurrentIndex(), 1, 'Clicking prevBtn must call prev()');

  // Next button click
  nextBtn.click();
  assert.equal(modal.getCurrentIndex(), 2, 'Clicking nextBtn must call next()');

  // Edit button click
  editBtn.click();
  assert.equal(editCallbackMemory?.id, 'mem-3', 'Clicking editBtn must call onEdit with current memory');
  console.log('✓ Button click handlers and onEdit callback verified.');

  console.log('--- Testing Keyboard Navigation Shortcuts ---');

  // ArrowLeft
  const leftEvt = keyTarget.triggerKey('ArrowLeft');
  assert.equal(modal.getCurrentIndex(), 1, 'ArrowLeft must cycle backward');
  assert.equal(leftEvt.defaultPrevented, true, 'ArrowLeft must preventDefault()');

  // ArrowRight
  const rightEvt = keyTarget.triggerKey('ArrowRight');
  assert.equal(modal.getCurrentIndex(), 2, 'ArrowRight must cycle forward');
  assert.equal(rightEvt.defaultPrevented, true, 'ArrowRight must preventDefault()');

  // Escape
  assert.equal(modal.isOpen(), true, 'Modal should be open before Escape');
  const escEvt = keyTarget.triggerKey('Escape');
  assert.equal(modal.isOpen(), false, 'Escape key must close modal');
  assert.equal(escEvt.defaultPrevented, true, 'Escape must preventDefault()');
  assert.equal(closeCallbackCalled, true, 'onClose callback must be called on Escape');
  assert.equal(container.classList.contains('hidden'), true, 'Container must have "hidden" after close');
  assert.equal(controlsEnabled, true, 'Controls must be re-enabled on close');
  assert.equal(raycasterActive, true, 'Raycaster must be re-enabled on close');

  // Keyboard events when modal is closed must be ignored
  navigateCallbackData = null;
  keyTarget.triggerKey('ArrowRight');
  assert.equal(navigateCallbackData, null, 'Key events must be ignored when modal is closed');
  console.log('✓ Keyboard shortcuts and suppression verified.');

  console.log('--- Testing Backdrop & Close Button Dismissal ---');

  // Re-open
  modal.open(testMemories[0]);
  assert.equal(modal.isOpen(), true);

  // Close button click
  closeCallbackCalled = false;
  closeBtn.click();
  assert.equal(modal.isOpen(), false, 'Clicking closeBtn must close modal');
  assert.equal(closeCallbackCalled, true, 'onClose callback must be called');

  // Backdrop click on container
  modal.open(testMemories[0]);
  assert.equal(modal.isOpen(), true);
  // Dispatch click where event.target === container
  container.dispatchEvent({
    type: 'click',
    target: container
  });
  assert.equal(modal.isOpen(), false, 'Clicking container backdrop must close modal');

  // Click inside card (event.target !== container) must NOT close modal
  modal.open(testMemories[0]);
  assert.equal(modal.isOpen(), true);
  container.dispatchEvent({
    type: 'click',
    target: card // clicked on child element
  });
  assert.equal(modal.isOpen(), true, 'Clicking inside card must NOT close modal');
  modal.close();
  console.log('✓ Close button and backdrop click verified.');

  console.log('--- Testing Edge Cases & Memory Matching ---');

  // Test match by slot number
  modal.open({ slot: 2 });
  assert.equal(modal.getCurrentIndex(), 1, 'open({ slot: 2 }) must match memory by slot');
  assert.equal(modal.getCurrentMemory()?.id, 'mem-2');

  // Test setMemories updates current view when open
  const newMemories = [
    { id: 'new-1', slot: 1, title: '새로운 기억 1', date: '2024. 01. 01', story: '새로운 이야기' }
  ];
  modal.setMemories(newMemories);
  assert.equal(modal.getAllMemories().length, 1, 'setMemories must update internal memory list');
  assert.equal(title.textContent, '새로운 기억 1', 'DOM title must update to new memories');
  assert.equal(slot.textContent, '추억 1 / 1', 'Slot text must update for single memory');

  // Single memory next/prev wraparound
  modal.next();
  assert.equal(modal.getCurrentIndex(), 0, 'Single memory next() must remain at index 0');
  modal.prev();
  assert.equal(modal.getCurrentIndex(), 0, 'Single memory prev() must remain at index 0');

  // Destroy cleanup
  modal.destroy();
  assert.equal(modal.isOpen(), false, 'destroy() must close modal');
  assert.equal(keyTarget.getListeners('keydown').length, 0, 'destroy() must remove keydown listeners');
  assert.equal(prevBtn.getListeners('click').length, 0, 'destroy() must remove prevBtn listeners');
  assert.equal(nextBtn.getListeners('click').length, 0, 'destroy() must remove nextBtn listeners');
  assert.equal(editBtn.getListeners('click').length, 0, 'destroy() must remove editBtn listeners');
  assert.equal(closeBtn.getListeners('click').length, 0, 'destroy() must remove closeBtn listeners');
  assert.equal(container.getListeners('click').length, 0, 'destroy() must remove container listeners');

  console.log('✓ Edge cases, slot matching, and cleanup verified.');

  console.log('--- Testing Default Presets Fallback Integration ---');
  // Verify open without memories array loads from getMemories()
  const defaultModal = setupPolaroidModal({
    container: createMockElement('m-modal'),
    card: createMockElement('m-card'),
    img: createMockElement('m-img', 'img'),
    title: createMockElement('m-title', 'h3'),
    date: createMockElement('m-date', 'span'),
    story: createMockElement('m-story', 'p'),
    slot: createMockElement('m-slot', 'span')
  });

  const storedMemories = getMemories();
  defaultModal.open(storedMemories[0]);
  assert.equal(defaultModal.getAllMemories().length, storedMemories.length, 'Must load default memories from photoStorage');
  assert.equal(defaultModal.getCurrentMemory()?.title, storedMemories[0].title);
  defaultModal.destroy();
  console.log('✓ Default photoStorage presets integration verified.');

  console.log('🎉 All Polaroid modal tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Polaroid test failed:', err);
  process.exit(1);
});
