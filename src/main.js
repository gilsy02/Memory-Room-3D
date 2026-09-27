import './style.css';
import * as THREE from 'three';
import { getMemories } from './storage/photoStorage.js';

console.log('[기억의 다락방] Initializing project scaffolding...');
const initialMemories = getMemories();
console.log(`[기억의 다락방] Loaded ${initialMemories.length} memories from storage.`);

// Canvas & WebGL Test Scene
const canvas = document.getElementById('webgl-canvas');
if (canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a120c);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.5, 3);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Placeholder test object (warm golden memory cube)
  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff9d42,
    roughness: 0.4,
    metalness: 0.1
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1.5, 0);
  scene.add(cube);

  // Soft ambient & warm directional lights
  const ambientLight = new THREE.AmbientLight(0xffe8d6, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xff9d42, 1.2);
  dirLight.position.set(5, 8, 4);
  scene.add(dirLight);

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Basic UI event hooks for scaffolding test
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

console.log('[기억의 다락방] Base UI & Three.js ready.');
