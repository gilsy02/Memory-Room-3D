import './style.css';
import * as THREE from 'three';
import { getMemories } from './storage/photoStorage.js';
import { initScene } from './scene/sceneManager.js';
import { setupLighting } from './environment/lighting.js';

console.log('[기억의 다락방] Initializing project scaffolding...');
const initialMemories = getMemories();
console.log(`[기억의 다락방] Loaded ${initialMemories.length} memories from storage.`);

// 3D Scene Initialization
const canvas = document.getElementById('webgl-canvas');
if (canvas) {
  const { scene, camera, renderer } = initScene(canvas);
  const { lights, updateLights } = setupLighting(scene);

  // Verification test meshes (Floor receiver & floating memory cube caster)
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x4a3324,
    roughness: 0.8,
    metalness: 0.1
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, -3);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const cubeGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0xff9d42,
    roughness: 0.35,
    metalness: 0.15
  });
  const testCube = new THREE.Mesh(cubeGeo, cubeMat);
  testCube.position.set(0, 1.0, -3.5);
  testCube.castShadow = true;
  testCube.receiveShadow = true;
  scene.add(testCube);

  camera.lookAt(0, 1.0, -3.5);

  const clock = new THREE.Clock();

  // Render & Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Update dynamic lighting (gentle breathing / flicker)
    updateLights(elapsedTime);

    // Subtle cube hover & rotation
    testCube.rotation.x += 0.005;
    testCube.rotation.y += 0.01;
    testCube.position.y = 1.0 + Math.sin(elapsedTime * 1.5) * 0.08;

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
