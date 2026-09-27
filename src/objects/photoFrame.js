import * as THREE from 'three';
import { getMemories } from '../storage/photoStorage.js';
import { createProceduralCanvas } from '../environment/textures.js';

/**
 * 8 Photo frame spatial layout configuration:
 * 3 on Left wall, 3 on Right wall, 2 on Back wall.
 */
export const FRAME_CONFIGS = [
  { slot: 1, position: new THREE.Vector3(-3.85, 2.0, -3.0), rotationY: Math.PI / 2 },
  { slot: 2, position: new THREE.Vector3(-3.85, 2.0, 0.0), rotationY: Math.PI / 2 },
  { slot: 3, position: new THREE.Vector3(-3.85, 2.0, 3.0), rotationY: Math.PI / 2 },
  { slot: 4, position: new THREE.Vector3(3.85, 2.0, -3.0), rotationY: -Math.PI / 2 },
  { slot: 5, position: new THREE.Vector3(3.85, 2.0, 0.0), rotationY: -Math.PI / 2 },
  { slot: 6, position: new THREE.Vector3(3.85, 2.0, 3.0), rotationY: -Math.PI / 2 },
  { slot: 7, position: new THREE.Vector3(-1.8, 2.1, 5.85), rotationY: Math.PI },
  { slot: 8, position: new THREE.Vector3(1.8, 2.1, 5.85), rotationY: Math.PI }
];

/**
 * Aesthetic frame styling color palette mapped by frameStyle key.
 */
export const FRAME_STYLE_COLORS = {
  'wood-gold': 0x3d2314,
  'natural-oak': 0x9c6e43,
  'dark-walnut': 0x2b1810,
  'vintage-bronze': 0x5c4033,
  'classic-gold': 0xb8860b,
  'wood-warm': 0x582918,
  'black-matte': 0x222222,
  'silver-ornate': 0x8a929a
};

/**
 * Safely loads a photo texture from image URL or base64 data URL.
 * Provides fallback procedural CanvasTexture in headless Node.js test environments.
 *
 * @param {string} imageUrl
 * @returns {THREE.Texture}
 */
export function createPhotoTexture(imageUrl) {
  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('[photoFrame] Texture failed to load:', err);
      }
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Headless mock texture for Node.js unit tests
  const canvas = createProceduralCanvas(64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData = { imageUrl };
  return texture;
}

/**
 * Creates 8 3D photo frames on attic walls with outer wooden/gold border,
 * inner passe-partout mat board, photo plane, and hover highlight border mesh.
 *
 * @param {THREE.Scene} scene
 * @param {Array<Object>} [memories]
 * @returns {{
 *   frameGroup: THREE.Group,
 *   interactiveMeshes: Array<THREE.Mesh>,
 *   updateFrameTexture: (slot: number, imageUrl: string) => boolean,
 *   getFrameBySlot: (slot: number) => Object|null
 * }}
 */
export function createPhotoFrames(scene, memories) {
  const memoryList = (Array.isArray(memories) && memories.length > 0)
    ? memories
    : getMemories();

  const frameGroup = new THREE.Group();
  frameGroup.name = 'PhotoFrames';

  const interactiveMeshes = [];
  const framesBySlot = new Map();

  // Outer frame dimensions
  const OUTER_WIDTH = 1.10;
  const OUTER_HEIGHT = 0.85;
  const FRAME_DEPTH = 0.04;

  // Mat board dimensions
  const MAT_WIDTH = 0.96;
  const MAT_HEIGHT = 0.72;

  // Photo dimensions (approx 4:3)
  const PHOTO_WIDTH = 0.82;
  const PHOTO_HEIGHT = 0.58;

  FRAME_CONFIGS.forEach((config) => {
    const slot = config.slot;
    const memory = memoryList.find((m) => Number(m.slot) === slot) || {
      id: `mem_0${slot}`,
      slot,
      title: `기억 #${slot}`,
      date: '2024. 01. 01',
      story: '',
      imageUrl: '',
      frameStyle: 'wood-gold'
    };

    const singleFrame = new THREE.Group();
    singleFrame.name = `PhotoFrame_Slot_${slot}`;
    singleFrame.position.copy(config.position);
    singleFrame.rotation.y = config.rotationY;

    // 1. Outer Wooden/Gold Frame Box
    const frameColor = FRAME_STYLE_COLORS[memory.frameStyle] || 0x3d2314;
    const frameGeo = new THREE.BoxGeometry(OUTER_WIDTH, OUTER_HEIGHT, FRAME_DEPTH);
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.55,
      metalness: 0.2
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.name = `FrameOuter_${slot}`;
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    singleFrame.add(frameMesh);

    // Frame Gold Inner Trim Lip
    const trimGeo = new THREE.BoxGeometry(MAT_WIDTH + 0.02, MAT_HEIGHT + 0.02, 0.005);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.65
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.name = `FrameTrim_${slot}`;
    trimMesh.position.set(0, 0, FRAME_DEPTH / 2 + 0.001);
    trimMesh.castShadow = false;
    trimMesh.receiveShadow = true;
    singleFrame.add(trimMesh);

    // 2. Inner White Mat Board (Passe-partout)
    const matGeo = new THREE.PlaneGeometry(MAT_WIDTH, MAT_HEIGHT);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.9,
      metalness: 0.0
    });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.name = `FrameMat_${slot}`;
    matMesh.position.set(0, 0, FRAME_DEPTH / 2 + 0.003);
    matMesh.receiveShadow = true;
    singleFrame.add(matMesh);

    // 3. Photo Plane Mesh
    const photoGeo = new THREE.PlaneGeometry(PHOTO_WIDTH, PHOTO_HEIGHT);
    const photoTexture = createPhotoTexture(memory.imageUrl);
    const photoMat = new THREE.MeshStandardMaterial({
      map: photoTexture,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.FrontSide
    });
    const photoMesh = new THREE.Mesh(photoGeo, photoMat);
    photoMesh.name = `FramePhoto_${slot}`;
    photoMesh.position.set(0, 0, FRAME_DEPTH / 2 + 0.005);
    photoMesh.receiveShadow = true;
    singleFrame.add(photoMesh);

    // 4. Highlight Glow Border Mesh (Initially invisible / emissive 0, ready for hover raycasting in Task 7)
    const highlightGeo = new THREE.BoxGeometry(
      OUTER_WIDTH + 0.04,
      OUTER_HEIGHT + 0.04,
      FRAME_DEPTH + 0.01
    );
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffe57f,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      depthWrite: false
    });
    const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    highlightMesh.name = `FrameHighlight_${slot}`;
    highlightMesh.visible = false;
    singleFrame.add(highlightMesh);

    // 5. Build userData Contract
    const frameData = {
      isPhotoFrame: true,
      slot,
      memoryId: memory.id,
      memory,
      highlightMesh,
      photoMesh,
      frameMesh,
      group: singleFrame
    };

    photoMesh.userData = frameData;
    frameMesh.userData = frameData;
    singleFrame.userData = frameData;

    // Register interactive targets for raycasting
    interactiveMeshes.push(photoMesh, frameMesh);

    framesBySlot.set(slot, {
      slot,
      group: singleFrame,
      frameMesh,
      matMesh,
      photoMesh,
      highlightMesh,
      userData: frameData
    });

    frameGroup.add(singleFrame);
  });

  scene.add(frameGroup);

  /**
   * Dynamically updates the photo texture displayed in a specific frame slot.
   *
   * @param {number} slot
   * @param {string} imageUrl
   * @returns {boolean}
   */
  function updateFrameTexture(slot, imageUrl) {
    const frame = framesBySlot.get(Number(slot));
    if (!frame) {
      console.warn(`[photoFrame] Frame slot ${slot} not found.`);
      return false;
    }

    const newTex = createPhotoTexture(imageUrl);
    if (frame.photoMesh && frame.photoMesh.material) {
      if (frame.photoMesh.material.map && typeof frame.photoMesh.material.map.dispose === 'function') {
        frame.photoMesh.material.map.dispose();
      }
      frame.photoMesh.material.map = newTex;
      frame.photoMesh.material.needsUpdate = true;
    }

    if (frame.userData && frame.userData.memory) {
      frame.userData.memory.imageUrl = imageUrl;
    }

    return true;
  }

  /**
   * Retrieves frame components and metadata by slot number.
   *
   * @param {number} slot
   * @returns {Object|null}
   */
  function getFrameBySlot(slot) {
    return framesBySlot.get(Number(slot)) || null;
  }

  return {
    frameGroup,
    interactiveMeshes,
    updateFrameTexture,
    getFrameBySlot
  };
}
