import './style.css';
import * as THREE from 'three';
import { getMemories } from './storage/photoStorage.js';
import { initScene } from './scene/sceneManager.js';
import { setupLighting } from './environment/lighting.js';
import { buildAtticRoom } from './environment/roomGeometry.js';
import { createDustParticles, updateDust } from './environment/dustParticles.js';
import { setupControls } from './controls/firstPersonControls.js';
import { setupMobileControls } from './controls/mobileControls.js';
import { createPhotoFrames } from './objects/photoFrame.js';
import { createStringLights } from './objects/stringLights.js';
import { setupHUD } from './ui/hud.js';
import { setupRaycaster } from './interaction/raycaster.js';
import { setupPolaroidModal } from './ui/polaroidModal.js';

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
let hud = null;
let raycaster = null;
let polaroid = null;

function isAnyModalOpen() {
  return (
    (manageModal && !manageModal.classList.contains('hidden')) ||
    (polaroidModal && !polaroidModal.classList.contains('hidden')) ||
    Boolean(polaroid && polaroid.isOpen())
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

  // 3D Photo frames mounted on attic walls
  const {
    frameGroup,
    interactiveMeshes,
    updateFrameTexture,
    getFrameBySlot
  } = createPhotoFrames(scene, initialMemories);

  // Glowing fairy string lights draped across crossbeams
  const { lightsGroup, updateFairyLights } = createStringLights(scene);

  camera.position.set(0, 1.65, 2.0);
  camera.lookAt(0, 1.65, -3.0);

  // Setup First-Person & Mobile Controls
  controls = setupControls(camera, canvas, bounds);
  mobileControls = setupMobileControls(controls, canvas);

  // Setup Heads-Up Display (HUD)
  hud = setupHUD();

  // Setup Center Raycasting & Interaction Prompt
  raycaster = setupRaycaster(camera, interactiveMeshes, {
    domElement: canvas,
    controls,
    maxDistance: 4.0,
    onHover: (memory, slot) => {
      hud.showPrompt(memory);
    },
    onHoverExit: () => {
      hud.hidePrompt();
    },
    onSelect: (memory, slot) => {
      console.log(`[기억의 다락방] Selected memory #${slot}: ${memory?.title}`);
      const latestMemories = getMemories();
      if (polaroid) {
        polaroid.open(memory, latestMemories);
      }
      // Dispatch custom event for external integrations
      const event = new CustomEvent('memory-select', {
        detail: { memory, slot }
      });
      window.dispatchEvent(event);
    }
  });

  // Setup Emotional Polaroid Detail Modal
  polaroid = setupPolaroidModal({
    controls,
    raycaster,
    onEdit: (memory) => {
      console.log(`[기억의 다락방] Edit memory requested for slot ${memory?.slot}: ${memory?.title}`);
      if (polaroid) {
        polaroid.close();
      }
      if (manageModal) {
        if (controls) {
          controls.disable();
          controls.unlock();
        }
        if (raycaster) {
          raycaster.setEnabled(false);
        }
        if (hud) {
          hud.hidePrompt();
        }
        if (mobileControls && typeof mobileControls.hideJoystick === 'function') {
          mobileControls.hideJoystick();
        }
        if (memory?.slot) {
          const slotBtn = manageModal.querySelector(`.slot-btn[data-slot="${memory.slot}"]`);
          if (slotBtn) {
            const allSlotBtns = manageModal.querySelectorAll('.slot-btn');
            allSlotBtns.forEach((btn) => {
              btn.classList.remove('active', 'border-amber-500/60', 'bg-amber-500/20', 'text-amber-200');
              btn.classList.add('border-stone-800', 'bg-stone-900/60', 'text-stone-400');
            });
            slotBtn.classList.remove('border-stone-800', 'bg-stone-900/60', 'text-stone-400');
            slotBtn.classList.add('active', 'border-amber-500/60', 'bg-amber-500/20', 'text-amber-200');
          }
        }
        manageModal.classList.remove('hidden');
      }
    },
    onClose: () => {
      if (hud) {
        hud.hidePrompt();
      }
    }
  });

  // Wire mobile touch button in HUD to trigger selection
  hud.onSelect((memory) => {
    raycaster.triggerSelect(memory);
  });

  // Initially disable raycast until user enters the attic room
  raycaster.setEnabled(false);

  controls.onLock(() => {
    if (startOverlay) {
      startOverlay.classList.add('hidden');
    }
    if (raycaster) {
      raycaster.setEnabled(true);
    }
  });

  controls.onUnlock(() => {
    // Show start overlay when unlocked (ESC pressed) unless a modal dialog is open
    if (!isAnyModalOpen() && startOverlay) {
      startOverlay.classList.remove('hidden');
      if (raycaster) {
        raycaster.setEnabled(false);
      }
    }
    if (hud) {
      hud.hidePrompt();
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

    // Update center raycasting & frame hover glow
    if (raycaster) {
      raycaster.update(delta);
    }

    // Update dynamic lighting (gentle breathing / flicker)
    updateLights(elapsedTime);

    // Update floating sunlight dust motes
    updateDust(delta, elapsedTime);

    // Update twinkling fairy string lights
    updateFairyLights(elapsedTime);

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
  if (raycaster) {
    raycaster.setEnabled(true);
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
    if (raycaster) {
      raycaster.setEnabled(false);
    }
    if (hud) {
      hud.hidePrompt();
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
    if (raycaster) {
      raycaster.setEnabled(true);
    }
    if (startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  });
}

// Window-level memory-select event hook for external or debug triggers
if (typeof window !== 'undefined') {
  window.addEventListener('memory-select', (event) => {
    const { memory, slot } = event.detail || {};
    console.log(`[기억의 다락방] memory-select received for slot ${slot}:`, memory?.title);
    if (polaroid && !polaroid.isOpen() && memory) {
      polaroid.open(memory, getMemories());
    }
  });
}

console.log('[기억의 다락방] Navigation, collision, raycasting, and HUD prompt active.');
