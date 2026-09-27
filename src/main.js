import './style.css';
import * as THREE from 'three';
import { getMemories } from './storage/photoStorage.js';
import { initScene } from './scene/sceneManager.js';
import { setupLighting } from './environment/lighting.js';
import { buildAtticRoom } from './environment/roomGeometry.js';
import { createDustParticles, updateDust } from './environment/dustParticles.js';
import { setupControls } from './controls/firstPersonControls.js';
import { setupMobileControls } from './controls/mobileControls.js';

console.log('[기억의 다락방] Initializing project scaffolding...');
const initialMemories = getMemories();
console.log(`[기억의 다락방] Loaded ${initialMemories.length} memories from storage.`);

// UI DOM references
const startOverlay = document.getElementById('start-overlay');
const btnStart = document.getElementById('btn-start');
const manageModal = document.getElementById('manage-modal');
const btnManage = document.getElementById('btn-manage');
const manageClose = document.getElementById('manage-close');
const polaroidModal = document.getElementById('polaroid-modal');
const polaroidClose = document.getElementById('polaroid-close');

let controls = null;
let mobileControls = null;

function isAnyModalOpen() {
  return (
    (manageModal && !manageModal.classList.contains('hidden')) ||
    (polaroidModal && !polaroidModal.classList.contains('hidden'))
  );
}

// 3D Scene Initialization
const canvas = document.getElementById('webgl-canvas');
if (canvas) {
  const { scene, camera, renderer } = initScene(canvas);
  const { lights, updateLights } = setupLighting(scene);

  // Build procedural attic room environment & movement bounds
  const { roomGroup, bounds } = buildAtticRoom(scene);

  // Golden dust particles floating in sunlight
  const { points: dustPoints } = createDustParticles(scene);

  camera.position.set(0, 1.65, 2.0);
  camera.lookAt(0, 1.65, -3.0);

  // Setup First-Person & Mobile Controls
  controls = setupControls(camera, canvas, bounds);
  mobileControls = setupMobileControls(controls, canvas);

  controls.onLock(() => {
    if (startOverlay) {
      startOverlay.classList.add('hidden');
    }
  });

  controls.onUnlock(() => {
    // Show start overlay when unlocked (ESC pressed) unless a modal dialog is open
    if (!isAnyModalOpen() && startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  });

  // Re-lock controls on canvas click if overlay is already closed and modals are closed
  canvas.addEventListener('click', () => {
    if (
      !isAnyModalOpen() &&
      startOverlay &&
      startOverlay.classList.contains('hidden') &&
      !controls.isLocked()
    ) {
      controls.lock();
    }
  });

  const clock = new THREE.Clock();

  // Render & Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Update first-person camera movement & collision clamping
    controls.update(delta);
    if (mobileControls && typeof mobileControls.update === 'function') {
      mobileControls.update(delta);
    }

    // Update dynamic lighting (gentle breathing / flicker)
    updateLights(elapsedTime);

    // Update floating sunlight dust motes
    updateDust(delta, elapsedTime);

    renderer.render(scene, camera);
  }

  animate();
}

// Start overlay enter room hook
function enterRoom() {
  if (startOverlay) {
    startOverlay.classList.add('hidden');
  }
  if (controls) {
    controls.enable();
    controls.lock();
  }
  if (mobileControls && typeof mobileControls.showJoystick === 'function') {
    mobileControls.showJoystick();
  }
}

if (btnStart) {
  btnStart.addEventListener('click', (e) => {
    e.stopPropagation();
    enterRoom();
  });
}

if (startOverlay) {
  startOverlay.addEventListener('click', () => {
    enterRoom();
  });
}

// Modal management hooks
if (btnManage && manageModal) {
  btnManage.addEventListener('click', () => {
    if (controls) {
      controls.disable();
      controls.unlock();
    }
    if (mobileControls && typeof mobileControls.hideJoystick === 'function') {
      mobileControls.hideJoystick();
    }
    manageModal.classList.remove('hidden');
  });
}

if (manageClose && manageModal) {
  manageClose.addEventListener('click', () => {
    manageModal.classList.add('hidden');
    if (controls) {
      controls.enable();
    }
    if (startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  });
}

if (polaroidClose && polaroidModal) {
  polaroidClose.addEventListener('click', () => {
    polaroidModal.classList.add('hidden');
    if (controls) {
      controls.enable();
    }
    if (startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  });
}

console.log('[기억의 다락방] Navigation and collision controls active.');
