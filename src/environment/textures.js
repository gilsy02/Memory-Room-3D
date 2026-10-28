import * as THREE from 'three';

/**
 * Creates an HTML5 canvas or a headless mock for Node.js test environments.
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement|Object}
 */
export function createProceduralCanvas(width, height) {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  // Headless mock canvas for Node.js unit testing
  return {
    width,
    height,
    getContext: () => ({
      canvas: { width, height },
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: () => {},
      set fillStyle(val) {},
      set strokeStyle(val) {},
      set lineWidth(val) {},
      set globalAlpha(val) {},
      set shadowColor(val) {},
      set shadowBlur(val) {}
    })
  };
}

/**
 * Generates procedural wood plank texture (warm oak for floor, dark timber for beams).
 * @param {'floor'|'beam'|'timber'} [type='floor']
 * @returns {THREE.CanvasTexture}
 */
export function generateWoodTexture(type = 'floor') {
  const isBeam = type === 'beam' || type === 'timber';
  const width = 512;
  const height = 512;
  const canvas = createProceduralCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (isBeam) {
    // Dark timber rafters / structural beams
    ctx.fillStyle = '#3a2215';
    ctx.fillRect(0, 0, width, height);

    // Weathered timber grain lines
    const grainCount = 120;
    for (let i = 0; i < grainCount; i++) {
      const x = Math.random() * width;
      const alpha = 0.04 + Math.random() * 0.08;
      const isDark = Math.random() > 0.35;
      ctx.strokeStyle = isDark ? `rgba(20, 10, 5, ${alpha})` : `rgba(100, 65, 40, ${alpha * 0.7})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      const wobble = (Math.random() - 0.5) * 15;
      ctx.bezierCurveTo(x + wobble, height * 0.33, x - wobble, height * 0.66, x + (Math.random() - 0.5) * 10, height);
      ctx.stroke();
    }

    // Weathered dark distress streaks
    ctx.fillStyle = 'rgba(15, 8, 4, 0.08)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const w = 4 + Math.random() * 20;
      ctx.fillRect(x, 0, w, height);
    }
  } else {
    // Warm oak wooden plank floor
    // 8 distinct floorboard planks
    const plankCount = 8;
    const plankWidth = width / plankCount;
    const oakBaseTones = [
      '#a6774a', '#9c6e43', '#b38253', '#8e633c',
      '#aa794c', '#986a41', '#b07f50', '#a07044'
    ];

    for (let i = 0; i < plankCount; i++) {
      const px = i * plankWidth;
      const baseColor = oakBaseTones[i % oakBaseTones.length];

      // Plank background
      ctx.fillStyle = baseColor;
      ctx.fillRect(px, 0, plankWidth, height);

      // Fine longitudinal wood grain
      const grainLines = 24;
      for (let g = 0; g < grainLines; g++) {
        const gx = px + (g / grainLines) * plankWidth + (Math.random() - 0.5) * 3;
        const darkGrain = Math.random() > 0.4;
        const alpha = 0.05 + Math.random() * 0.09;
        ctx.strokeStyle = darkGrain ? `rgba(60, 32, 14, ${alpha})` : `rgba(240, 195, 145, ${alpha * 0.8})`;
        ctx.lineWidth = 0.75 + Math.random() * 1.5;

        const waveFreq = 0.015 + Math.random() * 0.02;
        const waveAmp = 1.5 + Math.random() * 2.5;

        ctx.beginPath();
        for (let y = 0; y <= height; y += 16) {
          const ox = gx + Math.sin(y * waveFreq + i * 2) * waveAmp;
          if (y === 0) ctx.moveTo(ox, y);
          else ctx.lineTo(ox, y);
        }
        ctx.stroke();
      }

      // Subtle occasional wood knot
      if (i % 2 === 1) {
        const knotY = 120 + ((i * 137) % (height - 240));
        const knotX = px + plankWidth * (0.3 + (i % 3) * 0.2);
        for (let r = 2; r < 14; r += 2.5) {
          ctx.beginPath();
          ctx.ellipse(knotX, knotY, r * 0.6, r * 1.4, 0.1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(50, 25, 10, ${0.18 - r * 0.01})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Plank joint dark seam (shadow groove)
      ctx.fillStyle = 'rgba(25, 12, 6, 0.75)';
      ctx.fillRect(px + plankWidth - 1.5, 0, 1.5, height);

      // Plank joint bevel highlight (illuminated edge)
      ctx.fillStyle = 'rgba(255, 220, 175, 0.25)';
      ctx.fillRect(px, 0, 1, height);
    }
  }

  // Micro-texture noise overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  for (let n = 0; n < 3000; n++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    ctx.fillRect(nx, ny, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates procedural warm cream stucco plaster texture for attic walls and ceiling panels.
 * @returns {THREE.CanvasTexture}
 */
export function generatePlasterTexture() {
  const width = 512;
  const height = 512;
  const canvas = createProceduralCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Warm cream plaster base tone
  ctx.fillStyle = '#f4ede2';
  ctx.fillRect(0, 0, width, height);

  // Subtle trowel stroke patches
  for (let i = 0; i < 60; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const rx = 30 + Math.random() * 80;
    const ry = 15 + Math.random() * 40;
    const angle = (Math.random() - 0.5) * 0.8;
    const isLight = Math.random() > 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.12)' : 'rgba(210, 192, 170, 0.1)';
    ctx.fill();
    ctx.restore();
  }

  // Stucco grain & speckle noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const isDark = Math.random() > 0.45;
    ctx.fillStyle = isDark ? 'rgba(165, 145, 125, 0.08)' : 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates procedural panoramic golden hour sunset sky gradient with glowing sun disc.
 * @returns {THREE.CanvasTexture}
 */
export function generateSunsetSkyTexture() {
  const width = 512;
  const height = 512;
  const canvas = createProceduralCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Panoramic golden hour sky gradient from zenith to horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0.0, '#1c1635'); // Deep evening indigo
  skyGrad.addColorStop(0.22, '#482046'); // Twilight violet
  skyGrad.addColorStop(0.45, '#9f3930'); // Rich crimson
  skyGrad.addColorStop(0.68, '#de6628'); // Sunset golden-orange
  skyGrad.addColorStop(0.85, '#f79f3c'); // Warm amber
  skyGrad.addColorStop(1.0, '#ffd87c'); // Brilliant horizon gold
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft glowing sun disc near horizon
  const sunX = width * 0.5;
  const sunY = height * 0.72;
  const sunRadius = width * 0.35;

  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
  sunGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)'); // Core incandescent white
  sunGrad.addColorStop(0.12, 'rgba(255, 246, 205, 0.95)'); // Golden corona
  sunGrad.addColorStop(0.32, 'rgba(255, 185, 75, 0.55)'); // Radiance
  sunGrad.addColorStop(0.62, 'rgba(235, 120, 45, 0.22)'); // Sunset haze bloom
  sunGrad.addColorStop(1.0, 'rgba(200, 80, 30, 0.0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle atmospheric cloud wisps
  const wispYLevels = [height * 0.58, height * 0.65, height * 0.78];
  for (const wy of wispYLevels) {
    const cloudGrad = ctx.createLinearGradient(0, wy - 12, 0, wy + 12);
    cloudGrad.addColorStop(0, 'rgba(255, 160, 110, 0)');
    cloudGrad.addColorStop(0.5, 'rgba(255, 190, 140, 0.16)');
    cloudGrad.addColorStop(1, 'rgba(180, 80, 60, 0)');
    ctx.fillStyle = cloudGrad;
    ctx.fillRect(0, wy - 12, width, 24);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a simple vertical gradient sky (no sun, no clouds).
 * @param {string[]} colors - Colors from zenith to horizon
 * @returns {THREE.CanvasTexture}
 */
export function generateGradientSkyTexture(colors) {
  const width = 512;
  const height = 512;
  const canvas = createProceduralCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  colors.forEach((c, i) => grad.addColorStop(i / Math.max(colors.length - 1, 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
