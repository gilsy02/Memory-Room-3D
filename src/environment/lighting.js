import * as THREE from 'three';

/**
 * Sets up warm sunset attic lighting and ambient living glow.
 * @param {THREE.Scene} scene
 * @returns {{ lights: Object, updateLights: (time: number) => void }}
 */
export function setupLighting(scene) {
  // 1. Directional Light: Golden hour sunset stream cutting through window
  const dirLight = new THREE.DirectionalLight(0xff9d42, 2.2);
  dirLight.position.set(7, 5.5, -4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 25;
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  // 2. Desk/Floor Lamp Point Light: Warm reading lamp accent
  const lampLight = new THREE.PointLight(0xffc67d, 2.0, 12, 2);
  lampLight.position.set(-2.8, 1.8, 2.5);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.width = 1024;
  lampLight.shadow.mapSize.height = 1024;
  lampLight.shadow.bias = -0.001;
  scene.add(lampLight);

  // 3. Fairy Lights Ambient Point Light: Cozy ambient fill
  const fairyLight = new THREE.PointLight(0xffbe6f, 0.8, 15);
  fairyLight.position.set(0, 3.2, 0);
  scene.add(fairyLight);

  // 4. Hemisphere Light: Soft warm sky vs rich attic floor bounce
  const hemiLight = new THREE.HemisphereLight(0xffe8d6, 0x3a2215, 0.6);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const baseLampIntensity = 2.0;

  /**
   * Updates dynamic lights (e.g. gentle incandescent lamp flicker/breathing)
   * @param {number} time - In seconds or clock elapsed time
   */
  function updateLights(time) {
    // Subtle, gentle flicker/breathing oscillation (+/- 3%)
    const flicker = Math.sin(time * 2.5) * 0.02 + Math.sin(time * 5.7) * 0.01;
    lampLight.intensity = baseLampIntensity * (1 + flicker);
  }

  return {
    lights: {
      dirLight,
      lampLight,
      fairyLight,
      hemiLight
    },
    updateLights
  };
}
