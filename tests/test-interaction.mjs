import assert from 'node:assert/strict';
import * as THREE from 'three';
import { setupRaycaster, getFrameData, DEFAULT_INTERACTION_DISTANCE } from '../src/interaction/raycaster.js';
import { setupHUD } from '../src/ui/hud.js';
import { createPhotoFrames, FRAME_CONFIGS } from '../src/objects/photoFrame.js';
import { getMemories } from '../src/storage/photoStorage.js';

// Helper mock DOM element generator for Node test environment
function createMockElement(id = '', tagName = 'div') {
  const classSet = new Set();
  const style = {};
  const listeners = {};
  let content = '';

  return {
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
    appendChild: () => {},
    remove: () => {}
  };
}

async function runTests() {
  console.log('--- Testing Raycaster Setup & Interface Contract ---');

  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
  camera.position.set(0, 2.0, 0);
  camera.lookAt(0, 2.0, -5.0);
  camera.updateMatrixWorld(true);

  const raycaster = setupRaycaster(camera, []);

  assert.equal(typeof raycaster.update, 'function', 'raycaster.update must be a function');
  assert.equal(typeof raycaster.setInteractiveMeshes, 'function', 'setInteractiveMeshes must be a function');
  assert.equal(typeof raycaster.setEnabled, 'function', 'setEnabled must be a function');
  assert.equal(typeof raycaster.isEnabled, 'function', 'isEnabled must be a function');
  assert.equal(typeof raycaster.getCurrentHover, 'function', 'getCurrentHover must be a function');
  assert.equal(typeof raycaster.triggerSelect, 'function', 'triggerSelect must be a function');
  assert.equal(typeof raycaster.onSelect, 'function', 'onSelect must be a function');
  assert.equal(typeof raycaster.onHover, 'function', 'onHover must be a function');
  assert.equal(typeof raycaster.onHoverExit, 'function', 'onHoverExit must be a function');
  assert.equal(typeof raycaster.destroy, 'function', 'destroy must be a function');

  assert.equal(raycaster.isEnabled(), true, 'raycaster must be enabled by default');
  assert.equal(raycaster.getCurrentHover(), null, 'current hover must be null initially');
  assert.equal(DEFAULT_INTERACTION_DISTANCE, 4.0, 'DEFAULT_INTERACTION_DISTANCE must be 4.0m');

  raycaster.destroy();
  console.log('✓ Raycaster interface contract passed.');

  console.log('--- Testing Raycaster Math, Distance Cutoff & Frame Highlighting ---');

  // Create mock frame with outer mesh and highlight mesh
  const testCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  testCamera.position.set(0, 2.0, 0);
  testCamera.lookAt(0, 2.0, -5.0);
  testCamera.updateMatrixWorld(true);

  const frameGeo = new THREE.BoxGeometry(1.0, 1.0, 0.1);
  const frameMat = new THREE.MeshBasicMaterial();
  const testFrameMesh = new THREE.Mesh(frameGeo, frameMat);
  testFrameMesh.position.set(0, 2.0, -2.5); // 2.5m in front of camera
  testFrameMesh.updateMatrixWorld(true);

  const highlightGeo = new THREE.BoxGeometry(1.1, 1.1, 0.12);
  const highlightMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 });
  const testHighlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
  testHighlightMesh.visible = false;

  const mockMemory = { id: 'mem_test', slot: 1, title: '테스트 추억', date: '2024. 01. 01' };
  testFrameMesh.userData = {
    isPhotoFrame: true,
    slot: 1,
    memoryId: mockMemory.id,
    memory: mockMemory,
    highlightMesh: testHighlightMesh
  };

  let hoverCalls = 0;
  let hoveredMemory = null;
  let hoveredSlot = null;
  let hoverExitCalls = 0;
  let selectedMemory = null;
  let selectedSlot = null;

  const testRaycaster = setupRaycaster(testCamera, [testFrameMesh], {
    maxDistance: 4.0,
    onHover: (mem, slot) => {
      hoverCalls++;
      hoveredMemory = mem;
      hoveredSlot = slot;
    },
    onHoverExit: () => {
      hoverExitCalls++;
    },
    onSelect: (mem, slot) => {
      selectedMemory = mem;
      selectedSlot = slot;
    }
  });

  // Test 1: Frame at 2.5m directly in gaze -> hover triggered, highlight visible
  testRaycaster.update(0.016);
  assert.equal(hoverCalls, 1, 'Hover should be called once when looking at frame <= 4.0m');
  assert.equal(hoveredSlot, 1, 'Hovered slot should be 1');
  assert.equal(hoveredMemory.title, '테스트 추억', 'Hovered memory title should match');
  assert.equal(testHighlightMesh.visible, true, 'Highlight mesh must become visible on hover');
  assert.ok(testHighlightMesh.material.opacity > 0, 'Highlight mesh opacity must increase above 0');

  const currentHover = testRaycaster.getCurrentHover();
  assert.ok(currentHover, 'getCurrentHover() should return active hover object');
  assert.equal(currentHover.slot, 1);

  // Subsequent update on same frame keeps hover active without duplicate onHover callback
  testRaycaster.update(0.016);
  assert.equal(hoverCalls, 1, 'Subsequent frames should not re-trigger onHover');

  // Test 2: Distance cutoff (>4.0m ignored)
  testFrameMesh.position.set(0, 2.0, -4.5); // Move to 4.5m (> 4.0m)
  testFrameMesh.updateMatrixWorld(true);

  testRaycaster.update(0.016);
  assert.equal(hoverExitCalls, 1, 'HoverExit should fire when frame moves beyond 4.0m');
  assert.equal(testHighlightMesh.visible, false, 'Highlight mesh must become invisible when out of range');
  assert.equal(testHighlightMesh.material.opacity, 0.0, 'Highlight mesh opacity must reset to 0');
  assert.equal(testRaycaster.getCurrentHover(), null, 'getCurrentHover() must be null beyond 4.0m');

  // Test 3: Looking away -> hover exit
  testFrameMesh.position.set(0, 2.0, -2.5); // Move back into range
  testFrameMesh.updateMatrixWorld(true);
  testRaycaster.update(0.016);
  assert.equal(hoverCalls, 2, 'Hover should fire again when looking at frame in range');
  assert.equal(testHighlightMesh.visible, true, 'Highlight mesh visible again');

  // Turn camera 90 degrees away
  testCamera.lookAt(5.0, 2.0, 0);
  testCamera.updateMatrixWorld(true);
  testRaycaster.update(0.016);
  assert.equal(hoverExitCalls, 2, 'HoverExit should fire when camera turns away');
  assert.equal(testHighlightMesh.visible, false, 'Highlight mesh must become invisible when looking away');
  assert.equal(testRaycaster.getCurrentHover(), null, 'getCurrentHover() must be null when looking away');

  console.log('✓ Raycaster math, distance threshold, and highlight glow tests passed.');

  console.log('--- Testing Frame Switching (Slot 1 to Slot 2) ---');

  // Point camera back forward
  testCamera.lookAt(0, 2.0, -5.0);
  testCamera.updateMatrixWorld(true);

  // Frame 2
  const frame2Geo = new THREE.BoxGeometry(1.0, 1.0, 0.1);
  const frame2Mesh = new THREE.Mesh(frame2Geo, new THREE.MeshBasicMaterial());
  frame2Mesh.position.set(0, 2.0, -2.0); // Directly in front of Frame 1
  frame2Mesh.updateMatrixWorld(true);

  const highlight2Mesh = new THREE.Mesh(highlightGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
  highlight2Mesh.visible = false;
  const mockMemory2 = { id: 'mem_02', slot: 2, title: '두 번째 기억' };
  frame2Mesh.userData = {
    isPhotoFrame: true,
    slot: 2,
    memoryId: mockMemory2.id,
    memory: mockMemory2,
    highlightMesh: highlight2Mesh
  };

  testRaycaster.setInteractiveMeshes([testFrameMesh, frame2Mesh]);

  // Frame 2 is at distance 2.0m, closer than Frame 1 at 2.5m -> Frame 2 should be hit
  testRaycaster.update(0.016);
  assert.equal(testRaycaster.getCurrentHover().slot, 2, 'Closer Frame 2 should be hovered');
  assert.equal(highlight2Mesh.visible, true, 'Frame 2 highlight must be visible');
  assert.equal(testHighlightMesh.visible, false, 'Frame 1 highlight must be deactivated');

  console.log('✓ Frame switching and occlusion handling verified.');

  console.log('--- Testing Selection Trigger Callbacks ---');

  // Trigger selection while hovering Frame 2
  const selectSuccess = testRaycaster.triggerSelect();
  assert.equal(selectSuccess, true, 'triggerSelect() should return true when hover is active');
  assert.equal(selectedSlot, 2, 'Selected slot should match hovered slot');
  assert.equal(selectedMemory.title, '두 번째 기억', 'Selected memory title should match');

  // Manual trigger with parameters
  testRaycaster.triggerSelect(mockMemory, 1);
  assert.equal(selectedSlot, 1, 'Explicit triggerSelect should pass custom slot');
  assert.equal(selectedMemory.title, '테스트 추억');

  console.log('✓ Selection callback triggers verified.');

  console.log('--- Testing setEnabled(false) Modal Pausing ---');

  // Ensure Frame 2 is hovered
  testRaycaster.update(0.016);
  assert.ok(testRaycaster.getCurrentHover(), 'Frame 2 must be hovered before disabling');
  assert.equal(highlight2Mesh.visible, true, 'Frame 2 highlight visible before disabling');

  // Disable raycaster (simulating modal open)
  const exitCallsBeforeDisable = hoverExitCalls;
  testRaycaster.setEnabled(false);
  assert.equal(testRaycaster.isEnabled(), false, 'isEnabled() must be false');
  assert.equal(testRaycaster.getCurrentHover(), null, 'currentHover must be nullified when disabled');
  assert.equal(highlight2Mesh.visible, false, 'highlightMesh must be hidden when disabled');
  assert.equal(highlight2Mesh.material.opacity, 0.0, 'highlight opacity must be 0 when disabled');
  assert.equal(hoverExitCalls, exitCallsBeforeDisable + 1, 'onHoverExit must fire on disable');

  // While disabled, update does not hover
  testRaycaster.update(0.016);
  assert.equal(testRaycaster.getCurrentHover(), null, 'update() while disabled must not hover');
  assert.equal(testRaycaster.triggerSelect(), false, 'triggerSelect() while disabled must return false');

  // Re-enable
  testRaycaster.setEnabled(true);
  assert.equal(testRaycaster.isEnabled(), true, 'isEnabled() must be true after re-enabling');
  testRaycaster.update(0.016);
  assert.equal(testRaycaster.getCurrentHover().slot, 2, 'Raycast resumes on re-enable');

  testRaycaster.destroy();
  console.log('✓ Pause/resume with setEnabled passed.');

  console.log('--- Testing Real createPhotoFrames() Scene Raycasting ---');

  const realScene = new THREE.Scene();
  const memories = getMemories();
  const { frameGroup, interactiveMeshes, getFrameBySlot } = createPhotoFrames(realScene, memories);

  // Slot 1 is mounted on left wall at (-3.85, 2.0, -3.0)
  // Position camera at (-1.0, 2.0, -3.0) looking directly at (-3.85, 2.0, -3.0)
  // Distance is 2.85m, which is <= 4.0m threshold
  const sceneCamera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
  sceneCamera.position.set(-1.0, 2.0, -3.0);
  sceneCamera.lookAt(-3.85, 2.0, -3.0);
  sceneCamera.updateMatrixWorld(true);
  frameGroup.updateMatrixWorld(true);

  let realHoverMemory = null;
  let realHoverSlot = null;

  const realRaycaster = setupRaycaster(sceneCamera, interactiveMeshes, {
    maxDistance: 4.0,
    onHover: (mem, slot) => {
      realHoverMemory = mem;
      realHoverSlot = slot;
    }
  });

  realRaycaster.update(0.016);
  assert.ok(realRaycaster.getCurrentHover(), 'Should detect hit on Slot 1');
  assert.equal(realHoverSlot, 1, 'Detected slot must be 1');
  assert.ok(realHoverMemory, 'Hovered memory data must exist');

  const slot1Frame = getFrameBySlot(1);
  assert.equal(slot1Frame.highlightMesh.visible, true, 'Slot 1 highlightMesh must be visible');
  assert.ok(slot1Frame.highlightMesh.material.opacity > 0, 'Slot 1 highlight opacity > 0');

  // Verify other slots are NOT highlighted
  for (let s = 2; s <= 8; s++) {
    const otherFrame = getFrameBySlot(s);
    assert.equal(otherFrame.highlightMesh.visible, false, `Slot ${s} highlightMesh must NOT be visible`);
  }

  realRaycaster.destroy();
  console.log('✓ Real photo frames 3D environment raycasting verified.');

  console.log('--- Testing HUD Interface & Prompt Logic ---');

  const mockPromptEl = createMockElement('interaction-prompt');
  const mockPromptTextEl = createMockElement('interaction-text');
  const mockCrosshairEl = createMockElement('crosshair');
  const mockMobileBtnEl = createMockElement('mobile-interact-btn', 'button');

  let hudSelected = null;
  const hud = setupHUD({
    promptEl: mockPromptEl,
    promptTextEl: mockPromptTextEl,
    crosshairEl: mockCrosshairEl,
    mobileBtnEl: mockMobileBtnEl,
    isTouch: () => true,
    onSelect: (mem) => {
      hudSelected = mem;
    }
  });

  assert.equal(typeof hud.showPrompt, 'function', 'hud.showPrompt must be a function');
  assert.equal(typeof hud.hidePrompt, 'function', 'hud.hidePrompt must be a function');
  assert.equal(typeof hud.setCrosshairVisible, 'function', 'hud.setCrosshairVisible must be a function');

  // Test 1: showPrompt updates text and visibility
  const sampleMemory = { title: '노을 지던 바닷가', slot: 3 };
  hud.showPrompt(sampleMemory);

  assert.equal(hud.isPromptVisible(), true, 'isPromptVisible() should return true');
  assert.equal(hud.getPromptText(), '[E] 추억 열기: 노을 지던 바닷가', 'HUD prompt format must match specification');
  assert.equal(mockPromptTextEl.textContent, '추억 열기: 노을 지던 바닷가', 'Prompt text element must update');
  assert.equal(mockPromptEl.style.opacity, '1', 'Prompt opacity style must be 1');
  assert.equal(mockPromptEl.classList.contains('opacity-100'), true, 'Prompt element class must include opacity-100');
  assert.equal(mockPromptEl.classList.contains('opacity-0'), false, 'Prompt element class must remove opacity-0');

  // Crosshair focus effect
  assert.equal(mockCrosshairEl.classList.contains('scale-150'), true, 'Crosshair must scale on prompt show');

  // Mobile button visibility
  assert.equal(mockMobileBtnEl.style.display, 'flex', 'Mobile button must show on prompt show');

  // Mobile button click triggering onSelect
  mockMobileBtnEl.dispatchEvent({ type: 'click' });
  assert.equal(hudSelected?.title, '노을 지던 바닷가', 'Mobile button click must trigger onSelect with memory');

  // Test 2: hidePrompt resets state
  hud.hidePrompt();
  assert.equal(hud.isPromptVisible(), false, 'isPromptVisible() should be false after hidePrompt()');
  assert.equal(hud.getPromptText(), '', 'getPromptText() should be empty after hidePrompt()');
  assert.equal(mockPromptEl.style.opacity, '0', 'Prompt opacity style must be 0');
  assert.equal(mockPromptEl.classList.contains('opacity-0'), true, 'Prompt element class must add opacity-0');
  assert.equal(mockCrosshairEl.classList.contains('scale-150'), false, 'Crosshair scale removed on hide');
  assert.equal(mockMobileBtnEl.style.display, 'none', 'Mobile button hidden on hidePrompt');

  // Test 3: Crosshair visibility toggle
  hud.setCrosshairVisible(false);
  assert.equal(mockCrosshairEl.style.opacity, '0', 'Crosshair hidden when setCrosshairVisible(false)');
  hud.setCrosshairVisible(true);
  assert.equal(mockCrosshairEl.style.opacity, '1', 'Crosshair visible when setCrosshairVisible(true)');

  hud.destroy();
  console.log('✓ HUD interaction prompt and mobile button tests passed.');

  console.log('\n=============================================');
  console.log('ALL TASK 7 RAYCASTING & HUD TESTS PASSED! ✓');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
