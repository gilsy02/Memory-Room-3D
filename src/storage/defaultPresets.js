/**
 * defaultPresets.js
 * Curated presets for 3D Memory Room (기억의 다락방).
 * Generates 8 procedural canvas-drawn scenic images embedded as base64 data URLs.
 */

// Preset metadata definitions
export const PRESET_METADATA = [
  {
    id: 'mem_01',
    slot: 1,
    title: '노을 지던 바닷가',
    date: '2024. 08. 15',
    story: '붉게 물든 하늘을 보며 나눈 이야기들. 영원히 잊지 못할 따스했던 여름날의 기억.',
    frameStyle: 'wood-gold'
  },
  {
    id: 'mem_02',
    slot: 2,
    title: '봄날의 벚꽃길',
    date: '2024. 04. 08',
    story: '바람에 흩날리던 연분홍 꽃잎들 사이로 걸었던 길. 봄이 주는 설렘이 가득했던 날.',
    frameStyle: 'natural-oak'
  },
  {
    id: 'mem_03',
    slot: 3,
    title: '별빛 쏟아지던 캠핑',
    date: '2023. 10. 03',
    story: '타닥타닥 타오르는 모닥불과 밤하늘을 수놓은 무수한 별들. 고요함이 준 깊은 위로.',
    frameStyle: 'dark-walnut'
  },
  {
    id: 'mem_04',
    slot: 4,
    title: '따스한 오후의 책방',
    date: '2023. 11. 19',
    story: '오래된 종이 냄새와 창가로 비쳐 들던 오후의 볕. 한 줄의 문장에 마음이 머물던 시간.',
    frameStyle: 'vintage-bronze'
  },
  {
    id: 'mem_05',
    slot: 5,
    title: '은행나무 단풍 산책',
    date: '2023. 11. 05',
    story: '노랗게 물든 은행잎이 황금빛 융단처럼 깔려 있던 길. 발걸음마다 바스락거리던 가을의 소리.',
    frameStyle: 'classic-gold'
  },
  {
    id: 'mem_06',
    slot: 6,
    title: '햇살 속 낮잠 자는 고양이',
    date: '2024. 05. 21',
    story: '따스한 창턱에 웅크려 단잠에 빠진 고양이의 숨소리. 세상의 모든 평화가 깃든 순간.',
    frameStyle: 'wood-warm'
  },
  {
    id: 'mem_07',
    slot: 7,
    title: '비 내리던 날의 카페',
    date: '2024. 07. 02',
    story: '유리창을 타고 흘러내리던 빗방울과 김이 모락모락 피어나던 커피. 빗소리가 만들어준 아늑함.',
    frameStyle: 'black-matte'
  },
  {
    id: 'mem_08',
    slot: 8,
    title: '첫눈 내리던 겨울밤',
    date: '2023. 12. 24',
    story: '주황빛 가로등 불빛 아래 소복소복 내리던 첫눈. 세상이 숨죽이고 하얗게 빛나던 밤.',
    frameStyle: 'silver-ornate'
  }
];

// Procedural 2D Canvas Art Generators
export function drawSunsetBeach(ctx, w, h) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#1c0b2b');
  skyGrad.addColorStop(0.3, '#6a1b51');
  skyGrad.addColorStop(0.6, '#cf4329');
  skyGrad.addColorStop(0.85, '#f39c12');
  skyGrad.addColorStop(1, '#fed330');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.65);

  // Glowing Sun
  const sunX = w * 0.5;
  const sunY = h * 0.62;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 80);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fff4b8');
  sunGrad.addColorStop(0.5, 'rgba(255, 140, 0, 0.6)');
  sunGrad.addColorStop(1, 'rgba(255, 69, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
  ctx.fill();

  // Sea gradient
  const seaGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  seaGrad.addColorStop(0, '#a83c1b');
  seaGrad.addColorStop(0.25, '#692823');
  seaGrad.addColorStop(0.6, '#262238');
  seaGrad.addColorStop(1, '#0e0e1a');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // Golden water reflection
  for (let i = 0; i < 45; i++) {
    const y = h * 0.63 + (i / 45) * (h * 0.3);
    const spread = (i + 1) * 3.5;
    const x = sunX - spread + Math.random() * spread * 2;
    const rw = 15 + Math.random() * (spread * 0.8);
    const alpha = Math.max(0.1, 0.8 - (i / 45) * 0.65);
    ctx.fillStyle = `rgba(255, 230, 130, ${alpha})`;
    ctx.fillRect(x - rw / 2, y, rw, 1.8);
  }

  // Shore wave foam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.94);
  ctx.bezierCurveTo(w * 0.3, h * 0.91, w * 0.7, h * 0.97, w, h * 0.93);
  ctx.lineTo(w, h * 0.95);
  ctx.bezierCurveTo(w * 0.7, h * 0.99, w * 0.3, h * 0.93, 0, h * 0.96);
  ctx.fill();

  // Wet sandy shore
  ctx.fillStyle = '#160d14';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.95);
  ctx.bezierCurveTo(w * 0.4, h * 0.93, w * 0.7, h * 0.97, w, h * 0.95);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Distant silhouettes of birds
  ctx.strokeStyle = '#3a111a';
  ctx.lineWidth = 1.6;
  const birds = [
    { x: w * 0.28, y: h * 0.35, s: 8 },
    { x: w * 0.33, y: h * 0.31, s: 11 },
    { x: w * 0.38, y: h * 0.37, s: 7 }
  ];
  birds.forEach((b) => {
    ctx.beginPath();
    ctx.moveTo(b.x - b.s, b.y + b.s * 0.3);
    ctx.quadraticCurveTo(b.x - b.s * 0.4, b.y - b.s * 0.4, b.x, b.y);
    ctx.quadraticCurveTo(b.x + b.s * 0.4, b.y - b.s * 0.4, b.x + b.s, b.y + b.s * 0.3);
    ctx.stroke();
  });
}

export function drawCherryBlossoms(ctx, w, h) {
  // Pastel sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#a5d8f7');
  skyGrad.addColorStop(0.5, '#fde2e8');
  skyGrad.addColorStop(1, '#fef9e7');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft distant rolling hills
  ctx.fillStyle = '#b7e4c7';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  ctx.quadraticCurveTo(w * 0.35, h * 0.58, w * 0.75, h * 0.68);
  ctx.quadraticCurveTo(w * 0.9, h * 0.72, w, h * 0.7);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Lush spring lawn
  ctx.fillStyle = '#74c69d';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.quadraticCurveTo(w * 0.5, h * 0.68, w, h * 0.76);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Winding stone path
  ctx.fillStyle = '#d8c3b0';
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.69);
  ctx.quadraticCurveTo(w * 0.48, h * 0.82, w * 0.3, h);
  ctx.lineTo(w * 0.65, h);
  ctx.quadraticCurveTo(w * 0.54, h * 0.84, w * 0.51, h * 0.69);
  ctx.fill();

  // Cherry tree branches
  ctx.strokeStyle = '#3e2723';
  ctx.lineCap = 'round';

  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.1);
  ctx.bezierCurveTo(w * 0.2, h * 0.18, w * 0.3, h * 0.05, w * 0.55, h * 0.22);
  ctx.stroke();

  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, h * 0.14);
  ctx.bezierCurveTo(w * 0.35, h * 0.3, w * 0.42, h * 0.32, w * 0.48, h * 0.4);
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(w, h * 0.08);
  ctx.bezierCurveTo(w * 0.8, h * 0.16, w * 0.7, h * 0.1, w * 0.5, h * 0.25);
  ctx.stroke();

  // Cherry blossom petals clusters
  const colors = ['#ffccd5', '#ffb3c1', '#ff8fa3', '#fff0f3', '#fbc3bc'];
  for (let i = 0; i < 280; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 120;
    const cx = Math.random() < 0.55 ? w * 0.32 + Math.cos(angle) * r * 1.5 : w * 0.72 + Math.cos(angle) * r * 1.3;
    const cy = h * 0.18 + Math.sin(angle) * (r * 0.7);

    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.ellipse(cx, cy, 5 + Math.random() * 6, 4 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drifting fallen petals
  for (let j = 0; j < 40; j++) {
    const px = Math.random() * w;
    const py = h * 0.4 + Math.random() * (h * 0.58);
    ctx.fillStyle = colors[j % colors.length];
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.random() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawCampfireStars(ctx, w, h) {
  // Midnight sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#030712');
  skyGrad.addColorStop(0.45, '#0b132b');
  skyGrad.addColorStop(0.75, '#1c2541');
  skyGrad.addColorStop(1, '#2c1930');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Milky Way band
  const mwGrad = ctx.createLinearGradient(0, 0, w, h * 0.7);
  mwGrad.addColorStop(0, 'rgba(167, 139, 250, 0.05)');
  mwGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.12)');
  mwGrad.addColorStop(1, 'rgba(147, 197, 253, 0.04)');
  ctx.fillStyle = mwGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.3, w * 0.55, h * 0.25, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Twinkling stars
  for (let i = 0; i < 180; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * (h * 0.65);
    const size = Math.random() * 1.8 + 0.5;
    const alpha = 0.3 + Math.random() * 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(sx, sy, size, size);
  }

  // Distant mountain ridge
  ctx.fillStyle = '#0b0f19';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.lineTo(w * 0.25, h * 0.58);
  ctx.lineTo(w * 0.55, h * 0.66);
  ctx.lineTo(w * 0.8, h * 0.55);
  ctx.lineTo(w, h * 0.68);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Dark meadow foreground
  ctx.fillStyle = '#05080f';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.quadraticCurveTo(w * 0.5, h * 0.78, w, h * 0.83);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Glowing Tent
  const tx = w * 0.26;
  const ty = h * 0.82;
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(tx, ty - 65);
  ctx.lineTo(tx - 55, ty);
  ctx.lineTo(tx + 55, ty);
  ctx.closePath();
  ctx.fill();

  // Warm tent doorway glow
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(tx, ty - 50);
  ctx.lineTo(tx - 20, ty);
  ctx.lineTo(tx + 20, ty);
  ctx.closePath();
  ctx.fill();

  // Campfire location
  const fx = w * 0.68;
  const fy = h * 0.84;

  // Fire radial ambient glow
  const fireGlow = ctx.createRadialGradient(fx, fy - 10, 5, fx, fy - 10, 110);
  fireGlow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
  fireGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.2)');
  fireGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
  ctx.fillStyle = fireGlow;
  ctx.beginPath();
  ctx.arc(fx, fy - 10, 110, 0, Math.PI * 2);
  ctx.fill();

  // Firewood logs
  ctx.strokeStyle = '#291811';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(fx - 24, fy + 4);
  ctx.lineTo(fx + 24, fy - 2);
  ctx.moveTo(fx + 22, fy + 4);
  ctx.lineTo(fx - 22, fy - 2);
  ctx.stroke();

  // Flame layers
  // Red flame
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(fx - 18, fy);
  ctx.quadraticCurveTo(fx - 20, fy - 35, fx, fy - 52);
  ctx.quadraticCurveTo(fx + 20, fy - 35, fx + 18, fy);
  ctx.fill();

  // Orange flame
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(fx - 12, fy);
  ctx.quadraticCurveTo(fx - 14, fy - 28, fx, fy - 44);
  ctx.quadraticCurveTo(fx + 14, fy - 28, fx + 12, fy);
  ctx.fill();

  // Yellow core
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(fx - 7, fy);
  ctx.quadraticCurveTo(fx - 8, fy - 18, fx, fy - 30);
  ctx.quadraticCurveTo(fx + 8, fy - 18, fx + 7, fy);
  ctx.fill();

  // Floating spark embers
  for (let e = 0; e < 25; e++) {
    const ex = fx - 25 + Math.random() * 50;
    const ey = fy - 40 - Math.random() * 70;
    ctx.fillStyle = Math.random() > 0.4 ? '#fef08a' : '#f97316';
    ctx.fillRect(ex, ey, 2.2, 2.2);
  }
}

export function drawCozyBookstore(ctx, w, h) {
  // Warm mahogany room interior
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, '#1c0f0a');
  wallGrad.addColorStop(1, '#2c1810');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // Bookshelves backdrop
  const shelfYList = [h * 0.15, h * 0.35, h * 0.55];
  shelfYList.forEach((sy) => {
    // Shelf wood plank
    ctx.fillStyle = '#4a2818';
    ctx.fillRect(w * 0.05, sy + 65, w * 0.9, 12);
    ctx.fillStyle = '#2d160c';
    ctx.fillRect(w * 0.05, sy + 77, w * 0.9, 4);

    // Row of books
    const bookColors = ['#7c2d12', '#1e3a8a', '#14532d', '#701a75', '#b45309', '#374151', '#991b1b', '#065f46'];
    let bx = w * 0.07;
    while (bx < w * 0.9) {
      const bw = 12 + Math.random() * 16;
      const bh = 48 + Math.random() * 16;
      ctx.fillStyle = bookColors[Math.floor(Math.random() * bookColors.length)];
      ctx.fillRect(bx, sy + 65 - bh, bw, bh);

      // Gold spine stripes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx + 2, sy + 65 - bh + 6, bw - 4, 1.5);
      ctx.fillRect(bx + 2, sy + 65 - bh + 12, bw - 4, 1.5);

      bx += bw + 2 + Math.random() * 3;
    }
  });

  // Reading Desk
  const deskGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
  deskGrad.addColorStop(0, '#3e2316');
  deskGrad.addColorStop(1, '#1b0e08');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#593420';
  ctx.fillRect(0, h * 0.72, w, 6);

  // Vintage Brass Lamp
  const lx = w * 0.75;
  const ly = h * 0.58;

  // Lamp warm glowing conical beam
  const lampBeam = ctx.createRadialGradient(lx, ly, 10, lx - 40, ly + 90, 160);
  lampBeam.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
  lampBeam.addColorStop(0.4, 'rgba(251, 191, 36, 0.35)');
  lampBeam.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = lampBeam;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(lx - 160, h * 0.95);
  ctx.lineTo(lx + 80, h * 0.95);
  ctx.closePath();
  ctx.fill();

  // Lamp shade & stand
  ctx.fillStyle = '#065f46'; // Emerald glass shade
  ctx.beginPath();
  ctx.ellipse(lx, ly, 32, 16, 0, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = '#d97706'; // Brass arm
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lx, ly + 4);
  ctx.quadraticCurveTo(lx + 20, ly + 40, lx + 10, h * 0.76);
  ctx.stroke();

  ctx.fillStyle = '#b45309'; // Brass base
  ctx.beginPath();
  ctx.ellipse(lx + 10, h * 0.76, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Open book on desk
  const ox = w * 0.42;
  const oy = h * 0.83;
  ctx.fillStyle = '#fef3c7'; // Cream pages
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.quadraticCurveTo(ox - 40, oy - 8, ox - 75, oy);
  ctx.lineTo(ox - 75, oy + 42);
  ctx.quadraticCurveTo(ox - 40, oy + 36, ox, oy + 44);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.quadraticCurveTo(ox + 40, oy - 8, ox + 75, oy);
  ctx.lineTo(ox + 75, oy + 42);
  ctx.quadraticCurveTo(ox + 40, oy + 36, ox, oy + 44);
  ctx.fill();

  // Spine and text lines
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, oy - 2);
  ctx.lineTo(ox, oy + 46);
  ctx.stroke();

  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  for (let line = 0; line < 5; line++) {
    ctx.beginPath();
    ctx.moveTo(ox - 65, oy + 12 + line * 6);
    ctx.lineTo(ox - 15, oy + 10 + line * 6);
    ctx.moveTo(ox + 15, oy + 10 + line * 6);
    ctx.lineTo(ox + 65, oy + 12 + line * 6);
    ctx.stroke();
  }
}

export function drawGinkgoWalk(ctx, w, h) {
  // Golden autumn atmosphere
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#fef08a');
  skyGrad.addColorStop(0.5, '#fde047');
  skyGrad.addColorStop(1, '#eab308');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Sunlight beam streaming down
  const sunRay = ctx.createLinearGradient(w * 0.2, 0, w * 0.6, h);
  sunRay.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  sunRay.addColorStop(0.6, 'rgba(254, 240, 138, 0.2)');
  sunRay.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = sunRay;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, 0);
  ctx.lineTo(w * 0.5, 0);
  ctx.lineTo(w * 0.8, h);
  ctx.lineTo(w * 0.3, h);
  ctx.fill();

  // Ginkgo tree avenue trunks
  const trunkGrad = ctx.createLinearGradient(0, 0, w, 0);
  trunkGrad.addColorStop(0, '#451a03');
  trunkGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = trunkGrad;

  // Left trunks
  ctx.fillRect(w * 0.12, h * 0.15, 22, h * 0.85);
  ctx.fillRect(w * 0.24, h * 0.3, 15, h * 0.7);

  // Right trunks
  ctx.fillRect(w * 0.82, h * 0.15, 22, h * 0.85);
  ctx.fillRect(w * 0.72, h * 0.3, 15, h * 0.7);

  // Perspective pathway covered in golden leaves
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.45);
  ctx.lineTo(w * 0.55, h * 0.45);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.22, h);
  ctx.fill();

  // Thick golden ginkgo foliage blanket and canopy
  const ginkgoColors = ['#fde047', '#eab308', '#ca8a04', '#f59e0b', '#fbbf24', '#f97316'];

  // Top arching canopy
  for (let i = 0; i < 350; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * (h * 0.45);
    ctx.fillStyle = ginkgoColors[Math.floor(Math.random() * ginkgoColors.length)];
    ctx.beginPath();
    ctx.arc(gx, gy, 8 + Math.random() * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fallen leaves carpeting ground
  for (let j = 0; j < 300; j++) {
    const lx = Math.random() * w;
    const ly = h * 0.5 + Math.random() * (h * 0.5);
    ctx.fillStyle = ginkgoColors[Math.floor(Math.random() * ginkgoColors.length)];
    ctx.beginPath();
    ctx.ellipse(lx, ly, 6 + Math.random() * 5, 3 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSunlitCat(ctx, w, h) {
  // Warm indoor cream wall
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, w, h);

  // Window frame on upper wall
  ctx.fillStyle = '#92400e';
  ctx.fillRect(w * 0.08, h * 0.06, w * 0.45, h * 0.48);
  ctx.fillStyle = '#bae6fd'; // Blue outdoor sky
  ctx.fillRect(w * 0.1, h * 0.08, w * 0.41, h * 0.44);

  // Window mullions
  ctx.fillStyle = '#92400e';
  ctx.fillRect(w * 0.3, h * 0.08, 6, h * 0.44);
  ctx.fillRect(w * 0.1, h * 0.3, w * 0.41, 6);

  // Window sill with potted green plant
  ctx.fillStyle = '#b45309';
  ctx.fillRect(w * 0.06, h * 0.52, w * 0.49, 12);

  // Flowerpot & leaves
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(w * 0.14, h * 0.44, 24, 18);
  ctx.fillStyle = '#15803d';
  for (let l = 0; l < 8; l++) {
    ctx.beginPath();
    ctx.ellipse(w * 0.16 + (l % 4) * 5, h * 0.41 - (l > 3 ? 6 : 0), 9, 5, (l * Math.PI) / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden floor planks
  const floorGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  floorGrad.addColorStop(0, '#78350f');
  floorGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Floor plank lines
  ctx.strokeStyle = '#291811';
  ctx.lineWidth = 1.5;
  for (let f = 1; f <= 5; f++) {
    const fy = h * 0.55 + f * (h * 0.09);
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(w, fy);
    ctx.stroke();
  }

  // Diagonal sunbeam pouring from window onto floor
  const beam = ctx.createLinearGradient(w * 0.2, h * 0.2, w * 0.65, h * 0.85);
  beam.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
  beam.addColorStop(0.5, 'rgba(253, 224, 71, 0.4)');
  beam.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.08);
  ctx.lineTo(w * 0.51, h * 0.08);
  ctx.lineTo(w * 0.85, h);
  ctx.lineTo(w * 0.25, h);
  ctx.closePath();
  ctx.fill();

  // Curled up sleeping ginger cat in sunbeam
  const cx = w * 0.58;
  const cy = h * 0.76;

  // Soft cat shadow
  ctx.fillStyle = 'rgba(41, 24, 17, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 55, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cat body (curled donut circle)
  ctx.fillStyle = '#f97316'; // Ginger fur
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();

  // Cat head tucked in
  ctx.beginPath();
  ctx.arc(cx - 24, cy - 8, 22, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 24);
  ctx.lineTo(cx - 30, cy - 38);
  ctx.lineTo(cx - 18, cy - 26);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 28);
  ctx.lineTo(cx - 6, cy - 40);
  ctx.lineTo(cx + 2, cy - 24);
  ctx.fill();

  // Curled tail
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0.5, Math.PI * 1.2);
  ctx.stroke();

  // White markings on belly and paws
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy + 6, 20, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Cute closed sleeping eyes (^ ^)
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - 30, cy - 8, 4, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 18, cy - 8, 4, Math.PI, 0);
  ctx.stroke();

  // Pink nose
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(cx - 24, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRainyCafe(ctx, w, h) {
  // Moody evening city exterior seen through wet glass
  const outGrad = ctx.createLinearGradient(0, 0, 0, h);
  outGrad.addColorStop(0, '#0f172a');
  outGrad.addColorStop(0.5, '#1e293b');
  outGrad.addColorStop(1, '#334155');
  ctx.fillStyle = outGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft bokeh streetlights in rain
  const bokeh = [
    { x: w * 0.2, y: h * 0.28, r: 35, c: 'rgba(251, 191, 36, 0.45)' },
    { x: w * 0.35, y: h * 0.2, r: 50, c: 'rgba(249, 115, 22, 0.35)' },
    { x: w * 0.72, y: h * 0.35, r: 42, c: 'rgba(239, 68, 68, 0.4)' },
    { x: w * 0.55, y: h * 0.25, r: 30, c: 'rgba(56, 189, 248, 0.35)' },
    { x: w * 0.85, y: h * 0.22, r: 55, c: 'rgba(251, 191, 36, 0.35)' },
    { x: w * 0.15, y: h * 0.48, r: 28, c: 'rgba(239, 68, 68, 0.3)' }
  ];
  bokeh.forEach((b) => {
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rain water trails down the glass
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 24; r++) {
    const rx = (r / 24) * w + (Math.sin(r) * 15);
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx + 4, h * 0.3, rx - 3, h * 0.5, rx + 2, h * 0.72);
    ctx.stroke();
  }

  // Droplets on glass
  for (let d = 0; d < 120; d++) {
    const dx = Math.random() * w;
    const dy = Math.random() * (h * 0.72);
    const dr = 1.5 + Math.random() * 3.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight on drop
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dx - dr * 0.4, dy - dr * 0.4, 1.2, 1.2);
  }

  // Cafe Window Counter
  const tableGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
  tableGrad.addColorStop(0, '#291811');
  tableGrad.addColorStop(0.3, '#1c100b');
  tableGrad.addColorStop(1, '#0e0805');
  ctx.fillStyle = tableGrad;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#452618';
  ctx.fillRect(0, h * 0.72, w, 5);

  // Steaming Ceramic Coffee Mug
  const mx = w * 0.5;
  const my = h * 0.81;

  // Saucer
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(mx, my + 38, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mug body
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(mx - 32, my - 15, 64, 52, [4, 4, 16, 16]) : ctx.rect(mx - 32, my - 15, 64, 52);
  ctx.fill();

  // Mug handle
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(mx + 34, my + 10, 14, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Coffee surface & creamy latte foam
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.ellipse(mx, my - 15, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Latte heart art
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(mx, my - 12);
  ctx.bezierCurveTo(mx - 8, my - 20, mx - 16, my - 16, mx, my - 8);
  ctx.bezierCurveTo(mx + 16, my - 16, mx + 8, my - 20, mx, my - 12);
  ctx.fill();

  // Steam swirls rising from cup
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let s = -1; s <= 1; s++) {
    ctx.beginPath();
    ctx.moveTo(mx + s * 12, my - 24);
    ctx.bezierCurveTo(mx + s * 16 - 8, my - 45, mx + s * 12 + 10, my - 60, mx + s * 14, my - 80);
    ctx.stroke();
  }
}

export function drawFirstSnow(ctx, w, h) {
  // Silent winter night sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#070b14');
  skyGrad.addColorStop(0.5, '#111d33');
  skyGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Soft snow-covered cottage roofs in background
  ctx.fillStyle = '#0a101d';
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.72);
  ctx.lineTo(w * 0.2, h * 0.58);
  ctx.lineTo(w * 0.35, h * 0.72);
  ctx.lineTo(w * 0.35, h * 0.85);
  ctx.lineTo(w * 0.05, h * 0.85);
  ctx.fill();

  // Warm window in cottage
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(w * 0.16, h * 0.68, 22, 22);
  ctx.strokeStyle = '#0a101d';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.16, h * 0.68, 22, 22);

  // Mounds of soft powdery snow on ground
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.8);
  ctx.quadraticCurveTo(w * 0.35, h * 0.75, w * 0.7, h * 0.82);
  ctx.quadraticCurveTo(w * 0.85, h * 0.84, w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Forefront crisp white snow drift
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.88);
  ctx.quadraticCurveTo(w * 0.5, h * 0.84, w, h * 0.9);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // Vintage Streetlamp
  const lx = w * 0.65;
  const ly = h * 0.42;

  // Golden circular lantern glow
  const lampGlow = ctx.createRadialGradient(lx, ly, 10, lx, ly, 140);
  lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
  lampGlow.addColorStop(0.3, 'rgba(251, 191, 36, 0.45)');
  lampGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.15)');
  lampGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = lampGlow;
  ctx.beginPath();
  ctx.arc(lx, ly, 140, 0, Math.PI * 2);
  ctx.fill();

  // Streetlamp iron pole
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(lx - 4, ly, 8, h * 0.46); // Pole
  ctx.fillRect(lx - 16, h * 0.86, 32, 8); // Base

  // Lantern glass & frame
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(lx - 14, ly - 22, 28, 22);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(lx - 14, ly - 22, 28, 22);

  // Lantern cap with snow on top
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(lx - 20, ly - 22);
  ctx.lineTo(lx, ly - 36);
  ctx.lineTo(lx + 20, ly - 22);
  ctx.closePath();
  ctx.fill();

  // Puffy snow on lamp cap
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(lx, ly - 37, 7, 0, Math.PI * 2);
  ctx.arc(lx - 10, ly - 30, 8, 0, Math.PI * 2);
  ctx.arc(lx + 10, ly - 30, 8, 0, Math.PI * 2);
  ctx.fill();

  // Whimsical falling snowflakes
  for (let s = 0; s < 220; s++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const distToLamp = Math.hypot(sx - lx, sy - ly);
    const radius = Math.random() * 2.8 + 0.8;

    // Snowflakes glistening in lamplight
    if (distToLamp < 120) {
      ctx.fillStyle = '#fffbeb';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    }
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Scene dispatcher by slot
export function drawScene(ctx, slot, w = 640, h = 480) {
  switch (slot) {
    case 1:
      drawSunsetBeach(ctx, w, h);
      break;
    case 2:
      drawCherryBlossoms(ctx, w, h);
      break;
    case 3:
      drawCampfireStars(ctx, w, h);
      break;
    case 4:
      drawCozyBookstore(ctx, w, h);
      break;
    case 5:
      drawGinkgoWalk(ctx, w, h);
      break;
    case 6:
      drawSunlitCat(ctx, w, h);
      break;
    case 7:
      drawRainyCafe(ctx, w, h);
      break;
    case 8:
      drawFirstSnow(ctx, w, h);
      break;
    default:
      drawSunsetBeach(ctx, w, h);
      break;
  }
}

// Fallback procedural SVG data URL when Canvas is absent (e.g. headless Node)
export function getFallbackDataUrl(slot, w = 640, h = 480) {
  const meta = PRESET_METADATA.find((m) => m.slot === slot) || PRESET_METADATA[0];
  const bgColors = [
    '#f97316', '#f472b6', '#1e1b4b', '#451a03',
    '#eab308', '#ea580c', '#0f172a', '#0284c7'
  ];
  const bg = bgColors[(slot - 1) % bgColors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${bg}"/>
    <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-size="28" font-family="sans-serif" font-weight="bold">${meta.title}</text>
    <text x="50%" y="58%" text-anchor="middle" fill="#fed7aa" font-size="18" font-family="sans-serif">${meta.date}</text>
  </svg>`;
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } else if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Generate base64 data URL for a preset slot
export function generatePresetDataUrl(slot, width = 640, height = 480) {
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawScene(ctx, slot, width, height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.warn(`[defaultPresets] Canvas generation failed for slot ${slot}, using fallback:`, e);
    }
  }
  return getFallbackDataUrl(slot, width, height);
}

// Builds fresh curated default memories
export function getDefaultPresets() {
  return PRESET_METADATA.map((item) => ({
    ...item,
    imageUrl: generatePresetDataUrl(item.slot)
  }));
}

// Pre-initialized default memories export
export const DEFAULT_MEMORIES = getDefaultPresets();
