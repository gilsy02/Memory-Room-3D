import * as THREE from 'three';
import { createProceduralCanvas } from './textures.js';

let activeDustInstance = null;

/**
 * Generates a 32x32 soft circular radial alpha sprite texture for dust particles.
 * @returns {THREE.CanvasTexture}
 */
export function generateDustSprite() {
  const size = 32;
  const canvas = createProceduralCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 245, 200, 0.85)');
  grad.addColorStop(0.55, 'rgba(255, 215, 120, 0.35)');
  grad.addColorStop(1.0, 'rgba(255, 180, 60, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates 400 floating golden particle motes centered around the sunlight beam from the window.
 *
 * @param {THREE.Scene} scene
 * @returns {{ points: THREE.Points, updateDust: (delta: number, time?: number) => void }}
 */
export function createDustParticles(scene) {
  const PARTICLE_COUNT = 400;

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const movementParams = new Float32Array(PARTICLE_COUNT * 6);
  // [speedX, speedY, speedZ, phaseX, phaseY, phaseZ]

  // Sunlight beam starts at the dormer window and streams diagonally down into the attic
  const beamOrigin = new THREE.Vector3(0.0, 2.2, -5.8);
  const beamTarget = new THREE.Vector3(0.5, 0.5, 0.5);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const i6 = i * 6;

    let x, y, z;

    // ~70% of particles concentrated in the warm golden sunlight beam
    if (i < 280) {
      const t = Math.random(); // Position along beam length
      const beamCenter = new THREE.Vector3().lerpVectors(beamOrigin, beamTarget, t);
      const radius = (Math.random() ** 0.5) * (0.5 + t * 1.0);
      const angle = Math.random() * Math.PI * 2;

      x = beamCenter.x + Math.cos(angle) * radius;
      y = beamCenter.y + Math.sin(angle) * (radius * 0.7);
      z = beamCenter.z + (Math.random() - 0.5) * 0.8;
    } else {
      // ~30% gently floating ambient motes around the room
      x = (Math.random() - 0.5) * 6.5;
      y = 0.4 + Math.random() * 3.4;
      z = (Math.random() - 0.5) * 9.5;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // Individual harmonic oscillation frequencies and phases
    movementParams[i6] = 0.3 + Math.random() * 0.5;      // speedX
    movementParams[i6 + 1] = 0.25 + Math.random() * 0.4;  // speedY
    movementParams[i6 + 2] = 0.3 + Math.random() * 0.5;  // speedZ
    movementParams[i6 + 3] = Math.random() * Math.PI * 2; // phaseX
    movementParams[i6 + 4] = Math.random() * Math.PI * 2; // phaseY
    movementParams[i6 + 5] = Math.random() * Math.PI * 2; // phaseZ
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const sprite = generateDustSprite();

  const material = new THREE.PointsMaterial({
    size: 0.08,
    map: sprite,
    color: 0xffdf88,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'DustParticles';
  scene.add(points);

  /**
   * Gently oscillates and drifts particles in air with slow swirling motion.
   * @param {number} delta - Frame delta time in seconds
   * @param {number} [time] - Total elapsed time in seconds
   */
  function instanceUpdateDust(delta, time) {
    const t = typeof time === 'number' ? time : (typeof delta === 'number' ? delta : 0);
    const posAttr = geometry.attributes.position;
    const posArray = posAttr.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const i6 = i * 6;

      const baseX = basePositions[i3];
      const baseY = basePositions[i3 + 1];
      const baseZ = basePositions[i3 + 2];

      const sx = movementParams[i6];
      const sy = movementParams[i6 + 1];
      const sz = movementParams[i6 + 2];
      const px = movementParams[i6 + 3];
      const py = movementParams[i6 + 4];
      const pz = movementParams[i6 + 5];

      // Subtle atmospheric air current oscillation
      const offsetX = Math.sin(t * sx + px) * 0.16 + Math.cos(t * 0.2 + pz) * 0.05;
      const offsetY = Math.sin(t * sy + py) * 0.12 + Math.sin(t * 0.15 + i) * 0.04;
      const offsetZ = Math.cos(t * sz + pz) * 0.16 + Math.sin(t * 0.25 + px) * 0.05;

      posArray[i3] = baseX + offsetX;
      posArray[i3 + 1] = baseY + offsetY;
      posArray[i3 + 2] = baseZ + offsetZ;
    }

    posAttr.needsUpdate = true;
  }

  activeDustInstance = { points, updateDust: instanceUpdateDust };

  return activeDustInstance;
}

/**
 * Module-level export to update currently active dust system in render loop.
 * @param {number} delta
 * @param {number} [time]
 */
export function updateDust(delta, time) {
  if (activeDustInstance) {
    activeDustInstance.updateDust(delta, time);
  }
}
