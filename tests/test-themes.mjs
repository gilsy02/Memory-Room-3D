import assert from 'node:assert/strict';
import * as THREE from 'three';
import { THEMES, getSavedTheme, applyTheme } from '../src/environment/themes.js';
import { buildAtticRoom } from '../src/environment/roomGeometry.js';
import { setupLighting } from '../src/environment/lighting.js';
import { setupAmbientSound, createMockAudioContext, CHORD_PROGRESSION } from '../src/audio/ambientSound.js';
import { createDustParticles, updateDust } from '../src/environment/dustParticles.js';

assert.deepEqual(Object.keys(THEMES), ['attic', 'louvre', 'shrine']);
assert.equal(getSavedTheme().id, 'attic', 'falls back to attic without storage');
assert.equal(THEMES.louvre.particles, null, 'louvre has no dust');

for (const theme of Object.values(THEMES)) {
  const scene = new THREE.Scene();
  const { roomGroup, bounds } = buildAtticRoom(scene);
  const { lights } = setupLighting(scene);
  applyTheme(theme, { scene, roomGroup, lights });
  assert.deepEqual(bounds, { minX: -3.6, maxX: 3.6, minZ: -5.4, maxZ: 5.4 });
  if (theme.particles) {
    createDustParticles(scene, theme.particles);
    updateDust(0.016, 12.3);
  }
}

const scene = new THREE.Scene();
const { roomGroup } = buildAtticRoom(scene);
applyTheme(THEMES.shrine, { scene, roomGroup, lights: setupLighting(scene).lights });
assert.ok(roomGroup.getObjectByName('Torii'), 'shrine adds a torii');
// Theme sound settings drive the procedural music
for (const theme of Object.values(THEMES)) {
  assert.ok(theme.sound, `${theme.id} has sound settings`);
  const sound = setupAmbientSound({ audioContext: createMockAudioContext(), ...theme.sound });
  const expected = theme.sound.progression || CHORD_PROGRESSION;
  assert.equal(sound.getCurrentChord(), expected[0]);
  for (let i = 0; i < expected.length; i++) sound.nextChord();
  assert.equal(sound.getCurrentChord(), expected[0], 'progression loops');
  await sound.play();
  sound.playChime();
  sound.pause();
  sound.destroy();
}
assert.equal(THEMES.shrine.sound.voicing, 'pluck');

console.log('✓ All theme tests passed.');
