import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  setupControls,
  DEFAULT_BOUNDS,
  DEFAULT_CONTROL_CONFIG
} from '../src/controls/firstPersonControls.js';
import {
  setupMobileControls,
  isTouchDevice
} from '../src/controls/mobileControls.js';

async function runTests() {
  console.log('--- Testing First-Person Controls Initialization ---');

  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  camera.position.set(0, 1.65, 2.0);
  camera.lookAt(0, 1.65, -3.0);

  const bounds = { minX: -3.6, maxX: 3.6, minZ: -5.4, maxZ: 5.4 };
  const controls = setupControls(camera, null, bounds);

  // Test 1: Interface contract verification
  assert.equal(typeof controls.update, 'function', 'controls.update must be a function');
  assert.equal(typeof controls.isLocked, 'function', 'controls.isLocked must be a function');
  assert.equal(typeof controls.lock, 'function', 'controls.lock must be a function');
  assert.equal(typeof controls.unlock, 'function', 'controls.unlock must be a function');
  assert.equal(typeof controls.enable, 'function', 'controls.enable must be a function');
  assert.equal(typeof controls.disable, 'function', 'controls.disable must be a function');
  assert.equal(typeof controls.onLock, 'function', 'controls.onLock must be a function');
  assert.equal(typeof controls.onUnlock, 'function', 'controls.onUnlock must be a function');

  // Test 2: Camera setup properties
  assert.equal(camera.rotation.order, 'YXZ', 'Camera rotation order must be YXZ');
  assert.equal(camera.position.y, 1.65, 'Camera eye height must be initialized to 1.65m');
  assert.deepEqual(controls.getBounds(), bounds, 'Bounds must match room specification');

  console.log('✓ Controls initialization interface tests passed.');

  console.log('--- Testing PointerLock and Lock Callbacks ---');

  let lockCount = 0;
  let unlockCount = 0;

  const removeLock = controls.onLock(() => {
    lockCount++;
  });
  const removeUnlock = controls.onUnlock(() => {
    unlockCount++;
  });

  assert.equal(controls.isLocked(), false, 'Initially isLocked should be false');

  controls.setLocked(true);
  assert.equal(controls.isLocked(), true, 'isLocked should be true after setLocked(true)');
  assert.equal(lockCount, 1, 'onLock callback should have fired once');

  controls.setLocked(false);
  assert.equal(controls.isLocked(), false, 'isLocked should be false after setLocked(false)');
  assert.equal(unlockCount, 1, 'onUnlock callback should have fired once');

  removeLock();
  removeUnlock();

  controls.setLocked(true);
  assert.equal(lockCount, 1, 'Removed onLock callback must not fire again');
  controls.setLocked(false);

  console.log('✓ PointerLock and callback tests passed.');

  console.log('--- Testing Pitch & Yaw Rotation with Clamping ---');

  camera.rotation.set(0, 0, 0);

  // Test 3: Normal pitch change
  controls.addRotation(0, 0.5); // mouse look up
  assert.ok(Math.abs(camera.rotation.x - -0.5) < 0.001, 'Rotation X should reflect delta pitch');

  // Test 4: Pitch clamped between -85° and +85° (~ -1.4835 to +1.4835 rad)
  const maxPitch = (85 * Math.PI) / 180;
  const minPitch = (-85 * Math.PI) / 180;

  // Excessive look down
  controls.addRotation(0, 10.0);
  assert.ok(
    Math.abs(camera.rotation.x - minPitch) < 0.0001,
    `Pitch should be clamped at minPitch (${minPitch}), got ${camera.rotation.x}`
  );

  // Excessive look up
  controls.addRotation(0, -20.0);
  assert.ok(
    Math.abs(camera.rotation.x - maxPitch) < 0.0001,
    `Pitch should be clamped at maxPitch (${maxPitch}), got ${camera.rotation.x}`
  );

  // Test 5: Yaw freedom and roll lock
  camera.rotation.set(0, 0, 0);
  controls.addRotation(Math.PI * 4, 0); // 720 degree turn
  assert.ok(Math.abs(camera.rotation.y - -Math.PI * 4) < 0.001, 'Yaw should rotate freely without clamp');
  assert.equal(camera.rotation.z, 0, 'Roll (Z rotation) must remain strictly 0');

  console.log('✓ Pitch clamp and Yaw rotation tests passed.');

  console.log('--- Testing Movement Math & Walking Direction ---');

  // Reset camera to origin facing -Z (yaw = 0)
  camera.position.set(0, 1.65, 0);
  camera.rotation.set(0, 0, 0);
  controls.setVelocity(0, 0);
  controls.setLocked(true);

  // Test 6: Forward movement (W key) when yaw = 0
  controls.setKeys({ forward: true, backward: false, left: false, right: false });

  // Simulate 30 frames at 60fps (0.5 sec) to accelerate
  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }

  let vel = controls.getVelocity();
  assert.ok(vel.z < -2.5, `Forward key should accelerate along -Z, vel.z: ${vel.z}`);
  assert.ok(Math.abs(vel.x) < 0.001, `No sideways velocity expected, vel.x: ${vel.x}`);
  assert.ok(camera.position.z < 0, `Camera position Z should have moved forward, pos.z: ${camera.position.z}`);
  assert.equal(camera.position.y, 1.65, 'Camera eye height must remain 1.65m');

  // Test 7: Backward movement (S key) when yaw = 0
  controls.setVelocity(0, 0);
  camera.position.set(0, 1.65, 0);
  controls.setKeys({ forward: false, backward: true, left: false, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }
  vel = controls.getVelocity();
  assert.ok(vel.z > 2.5, `Backward key should accelerate along +Z, vel.z: ${vel.z}`);
  assert.ok(camera.position.z > 0, `Camera should move backward along +Z, pos.z: ${camera.position.z}`);

  // Test 8: Strafe Right (D key) and Strafe Left (A key)
  controls.setVelocity(0, 0);
  camera.position.set(0, 1.65, 0);
  controls.setKeys({ forward: false, backward: false, left: false, right: true });

  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }
  vel = controls.getVelocity();
  assert.ok(vel.x > 2.5, `Right key (D) should accelerate along +X, vel.x: ${vel.x}`);
  assert.ok(camera.position.x > 0, `Camera should move right along +X, pos.x: ${camera.position.x}`);

  controls.setVelocity(0, 0);
  camera.position.set(0, 1.65, 0);
  controls.setKeys({ forward: false, backward: false, left: true, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }
  vel = controls.getVelocity();
  assert.ok(vel.x < -2.5, `Left key (A) should accelerate along -X, vel.x: ${vel.x}`);
  assert.ok(camera.position.x < 0, `Camera should move left along -X, pos.x: ${camera.position.x}`);

  // Test 9: Movement rotated by 90 degrees yaw (yaw = PI / 2, looking at -X)
  camera.position.set(0, 1.65, 0);
  camera.rotation.set(0, Math.PI / 2, 0);
  controls.setVelocity(0, 0);
  controls.setKeys({ forward: true, backward: false, left: false, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }
  vel = controls.getVelocity();
  assert.ok(vel.x < -2.5, `Forward at yaw=90deg should move along -X, vel.x: ${vel.x}`);
  assert.ok(Math.abs(vel.z) < 0.05, `Forward at yaw=90deg should have minimal Z velocity, vel.z: ${vel.z}`);

  // Test 10: Walking speed limit and diagonal normalization
  camera.position.set(0, 1.65, 0);
  camera.rotation.set(0, 0, 0);
  controls.setVelocity(0, 0);
  // Press both W and D
  controls.setKeys({ forward: true, backward: false, left: false, right: true });

  for (let i = 0; i < 60; i++) {
    controls.update(0.016);
  }
  vel = controls.getVelocity();
  const diagonalSpeed = Math.hypot(vel.x, vel.z);
  assert.ok(
    diagonalSpeed <= DEFAULT_CONTROL_CONFIG.walkSpeed + 0.01,
    `Diagonal speed (${diagonalSpeed}) must not exceed walkSpeed (${DEFAULT_CONTROL_CONFIG.walkSpeed})`
  );

  console.log('✓ Movement math and walking direction tests passed.');

  console.log('--- Testing Velocity Damping ---');

  // Test 11: Deceleration when keys released
  controls.setKeys({ forward: false, backward: false, left: false, right: false });
  const initialDampSpeed = Math.hypot(vel.x, vel.z);

  // Advance 0.1s
  for (let i = 0; i < 6; i++) {
    controls.update(0.016);
  }
  const midDampSpeed = Math.hypot(controls.getVelocity().x, controls.getVelocity().z);
  assert.ok(
    midDampSpeed < initialDampSpeed * 0.6,
    `Speed should drop significantly during damping: ${midDampSpeed} < ${initialDampSpeed * 0.6}`
  );

  // Advance 0.5s further (total > 0.6s with damping 10)
  for (let i = 0; i < 40; i++) {
    controls.update(0.016);
  }
  const stoppedVel = controls.getVelocity();
  assert.equal(stoppedVel.x, 0, 'Damped X velocity should reach exactly 0');
  assert.equal(stoppedVel.z, 0, 'Damped Z velocity should reach exactly 0');

  console.log('✓ Velocity damping tests passed.');

  console.log('--- Testing Room Boundary Clamping & Collision ---');

  // Test 12: Positive X boundary clamping (maxX = 3.6)
  camera.position.set(3.5, 1.65, 0);
  camera.rotation.set(0, 0, 0);
  controls.setVelocity(0, 0);
  controls.setKeys({ forward: false, backward: false, left: false, right: true });

  for (let i = 0; i < 30; i++) {
    controls.update(0.05); // move fast towards +X
  }

  assert.equal(camera.position.x, bounds.maxX, `Camera X must be clamped at maxX (${bounds.maxX}), got ${camera.position.x}`);
  assert.equal(controls.getVelocity().x, 0, 'Velocity on clamped boundary must be reset to 0');

  // Test 13: Negative X boundary clamping (minX = -3.6)
  camera.position.set(-3.5, 1.65, 0);
  controls.setVelocity(0, 0);
  controls.setKeys({ forward: false, backward: false, left: true, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.05);
  }
  assert.equal(camera.position.x, bounds.minX, `Camera X must be clamped at minX (${bounds.minX}), got ${camera.position.x}`);
  assert.equal(controls.getVelocity().x, 0, 'Velocity on clamped boundary must be reset to 0');

  // Test 14: Negative Z boundary clamping (minZ = -5.4, window wall)
  camera.position.set(0, 1.65, -5.3);
  controls.setVelocity(0, 0);
  controls.setKeys({ forward: true, backward: false, left: false, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.05);
  }
  assert.equal(camera.position.z, bounds.minZ, `Camera Z must be clamped at minZ (${bounds.minZ}), got ${camera.position.z}`);
  assert.equal(controls.getVelocity().z, 0, 'Velocity on clamped boundary must be reset to 0');

  // Test 15: Positive Z boundary clamping (maxZ = 5.4, back wall)
  camera.position.set(0, 1.65, 5.3);
  controls.setVelocity(0, 0);
  controls.setKeys({ forward: false, backward: true, left: false, right: false });

  for (let i = 0; i < 30; i++) {
    controls.update(0.05);
  }
  assert.equal(camera.position.z, bounds.maxZ, `Camera Z must be clamped at maxZ (${bounds.maxZ}), got ${camera.position.z}`);
  assert.equal(controls.getVelocity().z, 0, 'Velocity on clamped boundary must be reset to 0');

  console.log('✓ Room boundary clamping tests passed.');

  console.log('--- Testing Enable/Disable Controls Hooks ---');

  // Test 16: Disabling controls stops input processing
  controls.setKeys({ forward: true, backward: false, left: false, right: false });
  controls.disable();
  assert.equal(controls.isEnabled(), false, 'isEnabled() should be false');

  controls.update(0.016);
  assert.equal(controls.getVelocity().z, 0, 'Disabled controls must not accelerate');

  controls.enable();
  assert.equal(controls.isEnabled(), true, 'isEnabled() should be true');

  console.log('✓ Enable/disable hook tests passed.');

  console.log('--- Testing Mobile Controls Integration ---');

  // Test 17: Mobile touch detection helper
  assert.equal(typeof isTouchDevice(), 'boolean', 'isTouchDevice() must return boolean');

  // Test 18: Mobile analog input integration
  controls.setKeys({ forward: false, backward: false, left: false, right: false });
  camera.position.set(0, 1.65, 0);
  camera.rotation.set(0, 0, 0);
  controls.setVelocity(0, 0);

  // Set analog joystick input: diagonal forward-right (x = 0.707, z = -0.707)
  controls.setMoveInput({ x: 0.707, z: -0.707 });

  for (let i = 0; i < 30; i++) {
    controls.update(0.016);
  }

  vel = controls.getVelocity();
  assert.ok(vel.x > 1.5, `Mobile analog X should produce rightward velocity: ${vel.x}`);
  assert.ok(vel.z < -1.5, `Mobile analog Z should produce forward velocity: ${vel.z}`);

  // Reset analog input
  controls.setMoveInput({ x: 0, z: 0 });
  for (let i = 0; i < 50; i++) {
    controls.update(0.016);
  }
  assert.equal(controls.getVelocity().x, 0, 'Velocity should damp to 0 when joystick releases');
  assert.equal(controls.getVelocity().z, 0, 'Velocity should damp to 0 when joystick releases');

  // Clean up
  controls.dispose();

  console.log('✓ Mobile controls integration tests passed.');
  console.log('\n[PASS] Task 5 Verification successful.');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
