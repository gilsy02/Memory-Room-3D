import './style.css';
import * as THREE from 'three';
import { getMemories } from './storage/photoStorage.js';
import { initScene } from './scene/sceneManager.js';
import { setupLighting } from './environment/lighting.js';
import { buildAtticRoom } from './environment/roomGeometry.js';
import { createDustParticles, updateDust } from './environment/dustParticles.js';

console.log('[기억의 다락방] Initializing project scaffolding...');
const initialMemories = getMemories();
console.log(`[기억의 다락방] Loaded ${initialMemories.length} memories from storage.`);

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

  const clock = new THREE.Clock();

  // Render & Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Update dynamic lighting (gentle breathing / flicker)
    updateLights(elapsedTime);

    // Update floating sunlight dust motes
    updateDust(delta, elapsedTime);

    renderer.render(scene, camera);
  }

  animate();
}

// Basic UI event hooks
const startOverlay = document.getElementById('start-overlay');
const btnStart = document.getElementById('btn-start');
const manageModal = document.getElementById('manage-modal');
const btnManage = document.getElementById('btn-manage');
const manageClose = document.getElementById('manage-close');
const polaroidModal = document.getElementById('polaroid-modal');
const polaroidClose = document.getElementById('polaroid-close');

if (btnStart && startOverlay) {
  btnStart.addEventListener('click', () => {
    startOverlay.classList.add('hidden');
  });
}

if (btnManage && manageModal) {
  btnManage.addEventListener('click', () => {
    manageModal.classList.remove('hidden');
  });
}

if (manageClose && manageModal) {
  manageClose.addEventListener('click', () => {
    manageModal.classList.add('hidden');
  });
}

if (polaroidClose && polaroidModal) {
  polaroidClose.addEventListener('click', () => {
    polaroidModal.classList.add('hidden');
  });
}

console.log('[기억의 다락방] Scene and Lighting foundation active.');
