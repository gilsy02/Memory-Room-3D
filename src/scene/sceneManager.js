import * as THREE from 'three';

/**
 * Initializes Three.js Scene, Camera, and Renderer with sunset atmospheric tuning.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, handleResize: Function }}
 */
export function initScene(canvas) {
  // 1. Scene & Warm Fog
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3a2318);
  scene.fog = new THREE.FogExp2(0x3a2318, 0.035);

  // 2. Camera (Eye-level POV in cozy attic)
  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.65, 0);

  // 3. Renderer with ACES ToneMapping and PCFSoft Shadows
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Shadow Configuration
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Cinematic Sunset Tone Mapping
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // 4. Responsive Resize Handler
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    handleResize
  };
}
