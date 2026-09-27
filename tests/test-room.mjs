import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  generateWoodTexture,
  generatePlasterTexture,
  generateSunsetSkyTexture
} from '../src/environment/textures.js';
import { buildAtticRoom } from '../src/environment/roomGeometry.js';
import {
  createDustParticles,
  updateDust,
  generateDustSprite
} from '../src/environment/dustParticles.js';

async function runTests() {
  console.log('--- Testing Procedural Textures ---');

  // Test 1: Wood textures (floor and beam)
  const floorWoodTex = generateWoodTexture('floor');
  assert.ok(floorWoodTex instanceof THREE.CanvasTexture, 'floorWoodTex should be THREE.CanvasTexture');
  assert.equal(floorWoodTex.wrapS, THREE.RepeatWrapping, 'floorWoodTex wrapS should be RepeatWrapping');
  assert.equal(floorWoodTex.wrapT, THREE.RepeatWrapping, 'floorWoodTex wrapT should be RepeatWrapping');

  const beamWoodTex = generateWoodTexture('beam');
  assert.ok(beamWoodTex instanceof THREE.CanvasTexture, 'beamWoodTex should be THREE.CanvasTexture');
  assert.equal(beamWoodTex.wrapS, THREE.RepeatWrapping, 'beamWoodTex wrapS should be RepeatWrapping');
  assert.equal(beamWoodTex.wrapT, THREE.RepeatWrapping, 'beamWoodTex wrapT should be RepeatWrapping');

  // Test 2: Plaster texture
  const plasterTex = generatePlasterTexture();
  assert.ok(plasterTex instanceof THREE.CanvasTexture, 'plasterTex should be THREE.CanvasTexture');
  assert.equal(plasterTex.wrapS, THREE.RepeatWrapping, 'plasterTex wrapS should be RepeatWrapping');
  assert.equal(plasterTex.wrapT, THREE.RepeatWrapping, 'plasterTex wrapT should be RepeatWrapping');

  // Test 3: Sunset sky texture
  const sunsetTex = generateSunsetSkyTexture();
  assert.ok(sunsetTex instanceof THREE.CanvasTexture, 'sunsetTex should be THREE.CanvasTexture');

  // Test 4: Dust particle sprite texture
  const dustSprite = generateDustSprite();
  assert.ok(dustSprite instanceof THREE.CanvasTexture, 'dustSprite should be THREE.CanvasTexture');

  console.log('✓ All Procedural Texture tests passed.');

  console.log('--- Testing Attic Room Geometry ---');

  const scene = new THREE.Scene();
  const { roomGroup, bounds } = buildAtticRoom(scene);

  // Test 5: Room group mounted in scene
  assert.ok(roomGroup instanceof THREE.Group, 'roomGroup should be THREE.Group');
  assert.ok(scene.children.includes(roomGroup), 'scene should contain roomGroup');

  // Test 6: Movement bounds verification
  assert.deepEqual(bounds, {
    minX: -3.6,
    maxX: 3.6,
    minZ: -5.4,
    maxZ: 5.4
  }, 'Room movement bounds must match specification');

  // Test 7: Floor mesh verification
  const floorMesh = roomGroup.getObjectByName('RoomFloor');
  assert.ok(floorMesh, 'RoomFloor mesh should exist in roomGroup');
  assert.equal(floorMesh.receiveShadow, true, 'RoomFloor must receive shadows');
  assert.equal(floorMesh.geometry.parameters.width, 8.0, 'Floor width should be 8m');
  assert.equal(floorMesh.geometry.parameters.height, 12.0, 'Floor depth should be 12m');

  // Test 8: Ceiling panels verification
  const leftCeil = roomGroup.getObjectByName('LeftCeilingPanel');
  const rightCeil = roomGroup.getObjectByName('RightCeilingPanel');
  assert.ok(leftCeil, 'LeftCeilingPanel should exist');
  assert.ok(rightCeil, 'RightCeilingPanel should exist');
  assert.equal(leftCeil.receiveShadow, true, 'Left ceiling panel receives shadows');
  assert.equal(rightCeil.receiveShadow, true, 'Right ceiling panel receives shadows');

  // Test 9: Structural timber rafters and ridge beam
  const ridgeBeam = roomGroup.getObjectByName('RidgeBeam');
  assert.ok(ridgeBeam, 'RidgeBeam should exist');
  assert.equal(ridgeBeam.castShadow, true, 'Ridge beam casts shadows');
  assert.equal(ridgeBeam.receiveShadow, true, 'Ridge beam receives shadows');

  const rafter0 = roomGroup.getObjectByName('LeftRafter_0');
  const collarTie0 = roomGroup.getObjectByName('CollarTie_0');
  assert.ok(rafter0, 'LeftRafter_0 should exist');
  assert.ok(collarTie0, 'CollarTie_0 should exist');
  assert.equal(rafter0.castShadow, true, 'Rafter casts shadows');
  assert.equal(collarTie0.castShadow, true, 'Collar tie casts shadows');

  // Test 10: Walls & Baseboards verification
  const backWall = roomGroup.getObjectByName('BackWall');
  const frontWall = roomGroup.getObjectByName('FrontWall');
  assert.ok(backWall, 'BackWall should exist');
  assert.ok(frontWall, 'FrontWall should exist');
  assert.equal(backWall.receiveShadow, true, 'Back wall receives shadows');
  assert.equal(frontWall.receiveShadow, true, 'Front wall receives shadows');

  // Front wall has window cutout hole
  assert.equal(frontWall.geometry.parameters.shapes.holes.length, 1, 'Front wall shape should contain 1 window cutout hole');

  // Test 11: Dormer window frame and sunset backdrop
  const windowSill = roomGroup.getObjectByName('WindowSill');
  const windowArch = roomGroup.getObjectByName('WindowArchTrim');
  const windowGlass = roomGroup.getObjectByName('WindowGlass');
  const skyBackdrop = roomGroup.getObjectByName('SunsetSkyBackdrop');

  assert.ok(windowSill, 'WindowSill should exist');
  assert.ok(windowArch, 'WindowArchTrim should exist');
  assert.ok(windowGlass, 'WindowGlass should exist');
  assert.ok(skyBackdrop, 'SunsetSkyBackdrop should exist');
  assert.equal(windowGlass.material.transparent, true, 'Window glass should be transparent');
  assert.ok(skyBackdrop.position.z < -6.0, 'Sunset sky backdrop should be outside the window');

  console.log('✓ All Attic Room Geometry tests passed.');

  console.log('--- Testing Golden Dust Particles ---');

  const { points, updateDust: instanceUpdate } = createDustParticles(scene);

  // Test 12: Dust system creation
  assert.ok(points instanceof THREE.Points, 'Dust system should be THREE.Points');
  assert.ok(scene.children.includes(points), 'Dust points added to scene');
  assert.equal(points.geometry.attributes.position.count, 400, 'Dust system must have exactly 400 particles');
  assert.equal(points.material.transparent, true, 'Dust material must be transparent');
  assert.equal(points.material.blending, THREE.AdditiveBlending, 'Dust material must use AdditiveBlending');
  assert.equal(points.material.depthWrite, false, 'Dust material depthWrite must be false');

  // Test 13: Particle animation updates
  const x0 = points.geometry.attributes.position.getX(0);
  const y0 = points.geometry.attributes.position.getY(0);
  const z0 = points.geometry.attributes.position.getZ(0);

  instanceUpdate(0.016, 1.5);

  const x1 = points.geometry.attributes.position.getX(0);
  const y1 = points.geometry.attributes.position.getY(0);
  const z1 = points.geometry.attributes.position.getZ(0);

  assert.ok(x0 !== x1 || y0 !== y1 || z0 !== z1, 'Instance updateDust should oscillate particle positions');

  // Test 14: Module-level updateDust function
  updateDust(0.016, 3.0);
  const x2 = points.geometry.attributes.position.getX(0);
  assert.ok(x1 !== x2, 'Module-level updateDust should oscillate particle positions');

  console.log('✓ All Dust Particles tests passed.');
  console.log('\n[PASS] Task 4 Verification successful.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
