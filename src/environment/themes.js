import * as THREE from 'three';
import { generateGradientSkyTexture } from './textures.js';

const STORAGE_KEY = 'memory-room-theme';

/**
 * Room theme presets. The attic geometry is shared; each theme only reskins
 * materials, lights, sky, particles and adds a few props.
 */
export const THEMES = {
  attic: {
    id: 'attic',
    label: '원목 다락방',
    particles: { color: 0xffdf88, size: 0.08 }
  },
  louvre: {
    id: 'louvre',
    label: '루브르 박물관',
    background: 0x1e1c1a,
    fogDensity: 0.02,
    floor: { color: 0xf2ece2, roughness: 0.25, metalness: 0.05, plainMap: true },
    walls: { color: 0xf3ead8 },
    timber: { color: 0xc9a227, roughness: 0.35, metalness: 0.7, plainMap: true },
    windowFrame: 0xb8922a,
    sky: ['#0d1b3d', '#24407a', '#5a7fbf', '#a9c1e6'],
    lights: { dir: 0xfff4e0, lamp: 0xfff1d6, fairy: 0xffe7b0, hemiSky: 0xffffff, hemiGround: 0x6b5a45 },
    particles: null, // no dust in the museum
    props: 'columns'
  },
  shrine: {
    id: 'shrine',
    label: '벚꽃 신사',
    background: 0x8fc4ee,
    fogDensity: 0.015,
    floor: { color: 0x8a6a45, roughness: 0.8 },
    walls: { color: 0xfbf7f0 },
    timber: { color: 0xc8361f, roughness: 0.6, plainMap: true },
    windowFrame: 0xa52a17,
    sky: ['#1f6fd1', '#3d8ee6', '#6fb1f2', '#a8d4fa'], // clear sky, no clouds
    lights: { dir: 0xffffff, lamp: 0xffd9e3, fairy: 0xffc2d4, hemiSky: 0xd6ecff, hemiGround: 0x6b3b2f },
    particles: { color: 0xff9ec0, size: 0.12, falling: true },
    props: 'torii'
  }
};

/** @returns {object} The saved theme, falling back to the attic. */
export function getSavedTheme() {
  let id = 'attic';
  try {
    id = localStorage.getItem(STORAGE_KEY) || 'attic';
  } catch (e) {
    // storage unavailable: keep default
  }
  return THEMES[id] || THEMES.attic;
}

/** @param {string} id */
export function saveTheme(id) {
  try {
    localStorage.setItem(STORAGE_KEY, THEMES[id] ? id : 'attic');
  } catch (e) {
    // storage unavailable: ignore
  }
}

function restyle(material, style) {
  if (!material || !style) return;
  if (style.plainMap) material.map = null;
  if (style.color !== undefined) material.color.set(style.color);
  if (style.roughness !== undefined) material.roughness = style.roughness;
  if (style.metalness !== undefined) material.metalness = style.metalness;
  material.needsUpdate = true;
}

function addColumns(roomGroup) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xf5efe4, roughness: 0.3 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.7 });
  const shaftGeo = new THREE.CylinderGeometry(0.16, 0.18, 1.1, 20);
  const capGeo = new THREE.BoxGeometry(0.42, 0.08, 0.42);
  [-3.5, 3.5].forEach((x) => {
    [-4.0, 0.0, 4.0].forEach((z) => {
      const shaft = new THREE.Mesh(shaftGeo, mat);
      shaft.position.set(x, 0.55, z);
      shaft.castShadow = true;
      roomGroup.add(shaft);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 1.14, z);
      roomGroup.add(cap);
    });
  });
}

function addTorii(roomGroup) {
  const red = new THREE.MeshStandardMaterial({ color: 0xd23a22, roughness: 0.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
  const torii = new THREE.Group();
  torii.name = 'Torii';
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.6, 16);
  [-0.9, 0.9].forEach((x) => {
    const post = new THREE.Mesh(postGeo, red);
    post.position.set(x, 1.8, 0);
    torii.add(post);
  });
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), red);
  nuki.position.y = 3.0;
  torii.add(nuki);
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 0.3), black);
  kasagi.position.y = 3.6;
  torii.add(kasagi);
  // Seen through the window, in front of the sky backdrop
  torii.position.set(0, -1.1, -8.2);
  roomGroup.add(torii);
}

/**
 * Applies a theme on top of the default attic scene. Attic is a no-op.
 * @param {object} theme
 * @param {{ scene: THREE.Scene, roomGroup: THREE.Group, lights: object }} parts
 */
export function applyTheme(theme, { scene, roomGroup, lights }) {
  if (!theme || theme.id === 'attic') return;

  if (theme.background !== undefined) {
    scene.background = new THREE.Color(theme.background);
    scene.fog = new THREE.FogExp2(theme.background, theme.fogDensity ?? 0.03);
  }

  const get = (name) => roomGroup.getObjectByName(name);
  restyle(get('RoomFloor')?.material, theme.floor);
  restyle(get('BackWall')?.material, theme.walls); // plaster is shared by walls & ceiling
  restyle(get('RidgeBeam')?.material, theme.timber); // timber is shared by beams & baseboards
  if (theme.windowFrame !== undefined) {
    restyle(get('WindowSill')?.material, { color: theme.windowFrame });
  }

  const sky = get('SunsetSkyBackdrop');
  if (sky && theme.sky) {
    sky.material.map = generateGradientSkyTexture(theme.sky);
    sky.material.needsUpdate = true;
  }

  if (theme.lights && lights) {
    lights.dirLight?.color.set(theme.lights.dir);
    lights.lampLight?.color.set(theme.lights.lamp);
    lights.fairyLight?.color.set(theme.lights.fairy);
    lights.hemiLight?.color.set(theme.lights.hemiSky);
    lights.hemiLight?.groundColor.set(theme.lights.hemiGround);
  }

  if (theme.props === 'columns') addColumns(roomGroup);
  if (theme.props === 'torii') addTorii(roomGroup);
}
