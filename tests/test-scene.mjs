import assert from 'node:assert/strict';
import * as THREE from 'three';
import { setupLighting } from '../src/environment/lighting.js';

// Setup minimal mock environment for initScene in Node.js
if (typeof window === 'undefined') {
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 2,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

class MockCanvas {
  getContext(type) {
    return {
      canvas: this,
      getParameter: (param) => {
        // Return string for VERSION and SHADING_LANGUAGE_VERSION
        return 'WebGL 2.0';
      },
      getContextAttributes: () => ({ xrCompatible: false, alpha: false, antialias: true }),
      getExtension: () => null,
      getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
      createTexture: () => ({}),
      bindTexture: () => {},
      texParameteri: () => {},
      texImage2D: () => {},
      clearColor: () => {},
      clearDepth: () => {},
      clearStencil: () => {},
      enable: () => {},
      disable: () => {},
      depthFunc: () => {},
      frontFace: () => {},
      cullFace: () => {},
      viewport: () => {},
      scissor: () => {},
      pixelStorei: () => {},
      createFramebuffer: () => ({}),
      bindFramebuffer: () => {},
      createRenderbuffer: () => ({}),
      bindRenderbuffer: () => {},
      renderbufferStorage: () => {},
      framebufferRenderbuffer: () => {},
      framebufferTexture2D: () => {},
      checkFramebufferStatus: () => 36053,
      deleteFramebuffer: () => {},
      deleteRenderbuffer: () => {},
      deleteTexture: () => {}
    };
  }
  style = {};
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getBoundingClientRect() {
    return { width: 1920, height: 1080, top: 0, left: 0 };
  }
}

async function runTests() {
  console.log('--- Testing Lighting Foundation ---');

  // Test 1: setupLighting exports and returns lights & updateLights
  const scene = new THREE.Scene();
  const { lights, updateLights } = setupLighting(scene);

  assert.ok(lights, 'lights object should be returned');
  assert.equal(typeof updateLights, 'function', 'updateLights should be a function');

  // Test 2: Directional light configuration
  const { dirLight, lampLight, fairyLight, hemiLight } = lights;
  assert.ok(dirLight instanceof THREE.DirectionalLight, 'dirLight should be THREE.DirectionalLight');
  assert.equal(dirLight.color.getHex(), 0xff9d42, 'dirLight color should be 0xff9d42');
  assert.equal(dirLight.intensity, 2.2, 'dirLight intensity should be 2.2');
  assert.equal(dirLight.position.x, 7, 'dirLight posX should be 7');
  assert.equal(dirLight.position.y, 5.5, 'dirLight posY should be 5.5');
  assert.equal(dirLight.position.z, -4, 'dirLight posZ should be -4');
  assert.equal(dirLight.castShadow, true, 'dirLight should castShadow');
  assert.equal(dirLight.shadow.mapSize.width, 2048, 'dirLight shadow map width 2048');
  assert.equal(dirLight.shadow.mapSize.height, 2048, 'dirLight shadow map height 2048');

  // Test 3: Lamp point light configuration
  assert.ok(lampLight instanceof THREE.PointLight, 'lampLight should be THREE.PointLight');
  assert.equal(lampLight.color.getHex(), 0xffc67d, 'lampLight color should be 0xffc67d');
  assert.equal(lampLight.intensity, 2.0, 'lampLight intensity should be 2.0');
  assert.equal(lampLight.distance, 12, 'lampLight distance should be 12');
  assert.equal(lampLight.decay, 2, 'lampLight decay should be 2');
  assert.equal(lampLight.position.x, -2.8, 'lampLight posX should be -2.8');
  assert.equal(lampLight.position.y, 1.8, 'lampLight posY should be 1.8');
  assert.equal(lampLight.position.z, 2.5, 'lampLight posZ should be 2.5');
  assert.equal(lampLight.castShadow, true, 'lampLight should castShadow');

  // Test 4: Fairy lights & Hemisphere light configuration
  assert.ok(fairyLight instanceof THREE.PointLight, 'fairyLight should be THREE.PointLight');
  assert.equal(fairyLight.color.getHex(), 0xffbe6f, 'fairyLight color should be 0xffbe6f');
  assert.equal(fairyLight.intensity, 0.8, 'fairyLight intensity should be 0.8');
  assert.equal(fairyLight.distance, 15, 'fairyLight distance should be 15');
  assert.equal(fairyLight.position.y, 3.2, 'fairyLight posY should be 3.2');

  assert.ok(hemiLight instanceof THREE.HemisphereLight, 'hemiLight should be THREE.HemisphereLight');
  assert.equal(hemiLight.color.getHex(), 0xffe8d6, 'hemiLight skyColor should be 0xffe8d6');
  assert.equal(hemiLight.groundColor.getHex(), 0x3a2215, 'hemiLight groundColor should be 0x3a2215');
  assert.equal(hemiLight.intensity, 0.6, 'hemiLight intensity should be 0.6');

  // Test 5: All 4 lights added to scene
  assert.ok(scene.children.includes(dirLight), 'dirLight added to scene');
  assert.ok(scene.children.includes(lampLight), 'lampLight added to scene');
  assert.ok(scene.children.includes(fairyLight), 'fairyLight added to scene');
  assert.ok(scene.children.includes(hemiLight), 'hemiLight added to scene');

  // Test 6: Dynamic light update (breathing oscillation)
  const initialIntensity = lampLight.intensity;
  updateLights(1.0);
  assert.notEqual(lampLight.intensity, initialIntensity, 'updateLights should modulate intensity');
  assert.ok(lampLight.intensity > 1.9 && lampLight.intensity < 2.1, 'lampLight intensity remains within +/- 3% breathing range');

  console.log('✓ All Lighting tests passed.');

  console.log('--- Testing Scene Manager Foundation ---');
  const { initScene } = await import('../src/scene/sceneManager.js');
  assert.equal(typeof initScene, 'function', 'initScene should be a function');

  // Test scene initialization with mock canvas
  const canvas = new MockCanvas();
  const sceneContext = initScene(canvas);

  assert.ok(sceneContext.scene instanceof THREE.Scene, 'scene is THREE.Scene');
  assert.ok(sceneContext.scene.fog instanceof THREE.FogExp2, 'scene.fog is THREE.FogExp2');
  assert.equal(sceneContext.scene.fog.color.getHex(), 0x3a2318, 'fog color is 0x3a2318');
  assert.equal(sceneContext.scene.fog.density, 0.035, 'fog density is 0.035');

  assert.ok(sceneContext.camera instanceof THREE.PerspectiveCamera, 'camera is THREE.PerspectiveCamera');
  assert.equal(sceneContext.camera.fov, 65, 'camera FOV is 65');
  assert.equal(sceneContext.camera.near, 0.1, 'camera near is 0.1');
  assert.equal(sceneContext.camera.far, 100, 'camera far is 100');
  assert.equal(sceneContext.camera.position.x, 0, 'camera posX is 0');
  assert.equal(sceneContext.camera.position.y, 1.65, 'camera posY is 1.65');
  assert.equal(sceneContext.camera.position.z, 0, 'camera posZ is 0');

  assert.equal(sceneContext.renderer.shadowMap.enabled, true, 'renderer shadowMap is enabled');
  assert.equal(sceneContext.renderer.shadowMap.type, THREE.PCFSoftShadowMap, 'renderer shadowMap is PCFSoftShadowMap');
  assert.equal(sceneContext.renderer.toneMapping, THREE.ACESFilmicToneMapping, 'renderer toneMapping is ACESFilmicToneMapping');
  assert.equal(sceneContext.renderer.toneMappingExposure, 1.05, 'renderer toneMappingExposure is 1.05');

  assert.equal(typeof sceneContext.handleResize, 'function', 'handleResize is a function');

  console.log('✓ All Scene Manager tests passed.');
  console.log('\n[PASS] Task 3 Verification successful.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
