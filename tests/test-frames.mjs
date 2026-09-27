import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getMemories } from '../src/storage/photoStorage.js';
import { createPhotoFrames, FRAME_CONFIGS } from '../src/objects/photoFrame.js';
import { createStringLights } from '../src/objects/stringLights.js';

async function runTests() {
  console.log('--- Testing 3D Photo Frames Creation & Placement ---');

  const scene = new THREE.Scene();
  const memories = getMemories();
  assert.equal(memories.length, 8, 'Must load 8 memories from storage');

  const {
    frameGroup,
    interactiveMeshes,
    updateFrameTexture,
    getFrameBySlot
  } = createPhotoFrames(scene, memories);

  // Test 1: frameGroup added to scene
  assert.ok(frameGroup instanceof THREE.Group, 'frameGroup must be a THREE.Group');
  assert.ok(scene.children.includes(frameGroup), 'scene must contain frameGroup');
  assert.equal(frameGroup.children.length, 8, 'frameGroup must contain exactly 8 frame sub-groups');

  // Test 2: Verify placement coordinates and rotation for each slot
  FRAME_CONFIGS.forEach((config) => {
    const slot = config.slot;
    const singleFrame = frameGroup.getObjectByName(`PhotoFrame_Slot_${slot}`);
    assert.ok(singleFrame, `PhotoFrame_Slot_${slot} must exist in frameGroup`);

    // Verify position
    assert.ok(
      Math.abs(singleFrame.position.x - config.position.x) < 0.001,
      `Slot ${slot} X position mismatch: expected ${config.position.x}, got ${singleFrame.position.x}`
    );
    assert.ok(
      Math.abs(singleFrame.position.y - config.position.y) < 0.001,
      `Slot ${slot} Y position mismatch: expected ${config.position.y}, got ${singleFrame.position.y}`
    );
    assert.ok(
      Math.abs(singleFrame.position.z - config.position.z) < 0.001,
      `Slot ${slot} Z position mismatch: expected ${config.position.z}, got ${singleFrame.position.z}`
    );

    // Verify rotation
    assert.ok(
      Math.abs(singleFrame.rotation.y - config.rotationY) < 0.001,
      `Slot ${slot} rotationY mismatch: expected ${config.rotationY}, got ${singleFrame.rotation.y}`
    );
  });

  // Verify specific wall positioning requirements
  // 3 on Left wall (X: -3.85, Y: 2.0, Z: -3.0, 0.0, 3.0, rotY: Math.PI / 2)
  const leftSlots = [1, 2, 3];
  const expectedLeftZ = [-3.0, 0.0, 3.0];
  leftSlots.forEach((slot, idx) => {
    const frame = frameGroup.getObjectByName(`PhotoFrame_Slot_${slot}`);
    assert.equal(frame.position.x, -3.85, `Slot ${slot} on left wall must have X = -3.85`);
    assert.equal(frame.position.y, 2.0, `Slot ${slot} on left wall must have Y = 2.0`);
    assert.equal(frame.position.z, expectedLeftZ[idx], `Slot ${slot} on left wall Z mismatch`);
    assert.equal(frame.rotation.y, Math.PI / 2, `Slot ${slot} on left wall must have rotY = Math.PI / 2`);
  });

  // 3 on Right wall (X: +3.85, Y: 2.0, Z: -3.0, 0.0, 3.0, rotY: -Math.PI / 2)
  const rightSlots = [4, 5, 6];
  const expectedRightZ = [-3.0, 0.0, 3.0];
  rightSlots.forEach((slot, idx) => {
    const frame = frameGroup.getObjectByName(`PhotoFrame_Slot_${slot}`);
    assert.equal(frame.position.x, 3.85, `Slot ${slot} on right wall must have X = 3.85`);
    assert.equal(frame.position.y, 2.0, `Slot ${slot} on right wall must have Y = 2.0`);
    assert.equal(frame.position.z, expectedRightZ[idx], `Slot ${slot} on right wall Z mismatch`);
    assert.equal(frame.rotation.y, -Math.PI / 2, `Slot ${slot} on right wall must have rotY = -Math.PI / 2`);
  });

  // 2 on Back wall (X: -1.8, 1.8, Y: 2.1, Z: 5.85, rotY: Math.PI)
  const backSlots = [7, 8];
  const expectedBackX = [-1.8, 1.8];
  backSlots.forEach((slot, idx) => {
    const frame = frameGroup.getObjectByName(`PhotoFrame_Slot_${slot}`);
    assert.equal(frame.position.x, expectedBackX[idx], `Slot ${slot} on back wall X mismatch`);
    assert.equal(frame.position.y, 2.1, `Slot ${slot} on back wall must have Y = 2.1`);
    assert.equal(frame.position.z, 5.85, `Slot ${slot} on back wall must have Z = 5.85`);
    assert.equal(frame.rotation.y, Math.PI, `Slot ${slot} on back wall must have rotY = Math.PI`);
  });

  console.log('✓ All 8 photo frame wall placements verified.');

  console.log('--- Testing Frame Component Geometry & userData Contract ---');

  for (let slot = 1; slot <= 8; slot++) {
    const frameObj = getFrameBySlot(slot);
    assert.ok(frameObj, `getFrameBySlot(${slot}) should return frame object`);

    const { frameMesh, matMesh, photoMesh, highlightMesh, userData } = frameObj;

    // Outer frame mesh
    assert.ok(frameMesh instanceof THREE.Mesh, `Slot ${slot} outer frame mesh exists`);
    assert.equal(frameMesh.castShadow, true, `Slot ${slot} outer frame must castShadow`);
    assert.equal(frameMesh.receiveShadow, true, `Slot ${slot} outer frame must receiveShadow`);

    // Inner mat board
    assert.ok(matMesh instanceof THREE.Mesh, `Slot ${slot} mat board mesh exists`);
    assert.equal(matMesh.receiveShadow, true, `Slot ${slot} mat board must receiveShadow`);

    // Photo plane mesh
    assert.ok(photoMesh instanceof THREE.Mesh, `Slot ${slot} photo plane mesh exists`);
    assert.ok(photoMesh.material.map, `Slot ${slot} photo plane must have texture map`);

    // Highlight glow border mesh (initially invisible or opacity 0)
    assert.ok(highlightMesh instanceof THREE.Mesh, `Slot ${slot} highlight glow border mesh exists`);
    assert.equal(highlightMesh.visible, false, `Slot ${slot} highlight mesh must be initially hidden`);

    // userData contract verification
    assert.equal(userData.isPhotoFrame, true, `Slot ${slot} userData.isPhotoFrame must be true`);
    assert.equal(userData.slot, slot, `Slot ${slot} userData.slot must match`);
    assert.equal(typeof userData.memoryId, 'string', `Slot ${slot} userData.memoryId must be string`);
    assert.ok(userData.memory, `Slot ${slot} userData.memory must be object`);
    assert.equal(userData.highlightMesh, highlightMesh, `Slot ${slot} userData.highlightMesh must match`);

    // Also check that photoMesh and frameMesh carry this userData for raycasting
    assert.equal(photoMesh.userData.isPhotoFrame, true, `Slot ${slot} photoMesh.userData.isPhotoFrame must be true`);
    assert.equal(frameMesh.userData.isPhotoFrame, true, `Slot ${slot} frameMesh.userData.isPhotoFrame must be true`);
  }

  // Test interactiveMeshes array for raycasting
  assert.ok(Array.isArray(interactiveMeshes), 'interactiveMeshes must be an array');
  assert.equal(interactiveMeshes.length, 16, 'interactiveMeshes must contain 16 meshes (photo + frame per slot)');
  interactiveMeshes.forEach((mesh) => {
    assert.ok(mesh instanceof THREE.Mesh, 'Every interactive item must be THREE.Mesh');
    assert.equal(mesh.userData.isPhotoFrame, true, 'Interactive mesh must have isPhotoFrame: true');
  });

  console.log('✓ Frame geometry and userData contract tests passed.');

  console.log('--- Testing Dynamic Texture Update Function ---');

  const testSlot = 2;
  const newImageUrl = 'data:image/jpeg;base64,mockUpdatedImageData';
  const updated = updateFrameTexture(testSlot, newImageUrl);
  assert.equal(updated, true, 'updateFrameTexture must return true on success');

  const frame2 = getFrameBySlot(testSlot);
  assert.equal(frame2.userData.memory.imageUrl, newImageUrl, 'Memory imageUrl must update');
  assert.ok(frame2.photoMesh.material.map, 'Photo mesh material map must be updated');

  // Test invalid slot
  const invalidUpdate = updateFrameTexture(99, 'invalid');
  assert.equal(invalidUpdate, false, 'updateFrameTexture on invalid slot must return false');

  console.log('✓ Dynamic texture update tests passed.');

  console.log('--- Testing Glowing Fairy String Lights ---');

  const { lightsGroup, updateFairyLights, bulbs, pointLights } = createStringLights(scene);

  // Test 1: lightsGroup mounted in scene
  assert.ok(lightsGroup instanceof THREE.Group, 'lightsGroup must be a THREE.Group');
  assert.ok(scene.children.includes(lightsGroup), 'scene must contain lightsGroup');

  // Test 2: Sagging catenary wires
  const wireMeshes = lightsGroup.children.filter((c) => c.name && c.name.startsWith('FairyWire_'));
  assert.equal(wireMeshes.length, 4, 'Must have 4 catenary sagging wire meshes');

  // Test 3: Bulb count (32 to 40)
  assert.ok(bulbs.length >= 32 && bulbs.length <= 40, `Bulb count ${bulbs.length} must be between 32 and 40`);
  bulbs.forEach((bulb) => {
    assert.ok(bulb instanceof THREE.Mesh, 'Bulb must be a THREE.Mesh');
    assert.ok(bulb.geometry instanceof THREE.SphereGeometry, 'Bulb geometry must be SphereGeometry');
    assert.equal(bulb.geometry.parameters.radius, 0.045, 'Bulb radius must be 0.045m');
    assert.equal(bulb.material.emissive.getHex(), 0xffe599, 'Bulb emissive color must be 0xffe599');
    assert.ok(bulb.material.emissiveIntensity >= 1.0, 'Bulb emissive intensity must be warm glowing');
  });

  // Test 4: Point lights (4 to 6)
  assert.ok(pointLights.length >= 4 && pointLights.length <= 6, `Point lights count ${pointLights.length} must be between 4 and 6`);
  pointLights.forEach((pl) => {
    assert.ok(pl instanceof THREE.PointLight, 'Must be THREE.PointLight');
    assert.equal(pl.color.getHex(), 0xffcf78, 'Point light color must be 0xffcf78');
    assert.equal(pl.distance, 3.5, 'Point light distance must be 3.5m');
  });

  // Test 5: updateFairyLights subtle twinkling animation
  const initialIntensity0 = bulbs[0].material.emissiveIntensity;
  const initialLight0 = pointLights[0].intensity;

  updateFairyLights(1.5);

  const updatedIntensity0 = bulbs[0].material.emissiveIntensity;
  const updatedLight0 = pointLights[0].intensity;

  assert.ok(
    initialIntensity0 !== updatedIntensity0 || initialLight0 !== updatedLight0,
    'updateFairyLights must modulate emissive intensity / light intensity over time'
  );

  console.log('✓ All Glowing Fairy String Lights tests passed.');
  console.log('\n[PASS] Task 6 Verification successful.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
