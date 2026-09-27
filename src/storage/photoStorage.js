/**
 * photoStorage.js
 * LocalStorage photo & memory management layer for 3D Memory Room.
 * Handles downscaling, persistence, slot mapping, export/import, and preset reset.
 */

import { DEFAULT_MEMORIES, getDefaultPresets } from './defaultPresets.js';

export const STORAGE_KEY = 'memory_room_photos';
export const MAX_DIMENSION = 1200;
export const JPEG_QUALITY = 0.8;

// Fallback in-memory store for Node or environments without localStorage
const memoryFallback = new Map();

/**
 * Safely resolves the storage provider (localStorage or in-memory map)
 */
function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (key) => memoryFallback.get(key) || null,
    setItem: (key, val) => memoryFallback.set(key, String(val)),
    removeItem: (key) => memoryFallback.delete(key),
    clear: () => memoryFallback.clear()
  };
}

/**
 * Compresses an image (File, Blob, or base64 data URL) down to maxDimension preserving aspect ratio.
 * Encodes as JPEG at given quality. Handles Node fallback gracefully.
 *
 * @param {File|Blob|string} fileOrDataUrl
 * @param {number} [maxDimension=1200]
 * @param {number} [quality=0.8]
 * @returns {Promise<string>} Base64 data URL
 */
export async function compressImage(fileOrDataUrl, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY) {
  if (!fileOrDataUrl) {
    return '';
  }

  // Graceful fallback for Node.js / non-browser environments where document/canvas is absent
  const hasCanvasSupport =
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    typeof Image !== 'undefined';

  if (!hasCanvasSupport) {
    if (typeof fileOrDataUrl === 'string') {
      return fileOrDataUrl;
    }
    // Return minimal base64 JPEG fallback if raw File/Blob was passed in Node
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  }

  // Convert File / Blob to Data URL if needed
  let dataUrl = '';
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else if (fileOrDataUrl instanceof Blob || (typeof File !== 'undefined' && fileOrDataUrl instanceof File)) {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err || new Error('Failed to read file as Data URL'));
      reader.readAsDataURL(fileOrDataUrl);
    });
  } else {
    throw new Error('Unsupported image input format. Expected File, Blob, or Data URL string.');
  }

  // Load into Image element to read natural dimensions
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to decode image for compression'));
    img.src = dataUrl;
  });

  let width = img.naturalWidth || img.width || 600;
  let height = img.naturalHeight || img.height || 450;

  // Scale down preserving aspect ratio if exceeding maxDimension
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Render to canvas and encode as JPEG
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return dataUrl;
  }

  // Fill white background to support transparent PNG conversion to JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Normalizes an array of memory items, guaranteeing slots 1 through 8.
 * Fills any missing slots with default presets.
 *
 * @param {Array<Object>} items
 * @returns {Array<Object>}
 */
function normalizeMemories(items) {
  const defaults = getDefaultPresets();
  const slotMap = new Map();

  // Populate defaults first
  defaults.forEach((def) => {
    slotMap.set(def.slot, { ...def });
  });

  // Overlay user items
  if (Array.isArray(items)) {
    items.forEach((item) => {
      const slotNum = Number(item.slot);
      if (slotNum >= 1 && slotNum <= 8) {
        const fallback = slotMap.get(slotNum);
        slotMap.set(slotNum, {
          id: item.id || fallback.id || `mem_0${slotNum}`,
          slot: slotNum,
          title: typeof item.title === 'string' ? item.title.trim() : fallback.title,
          date: typeof item.date === 'string' ? item.date.trim() : fallback.date,
          story: typeof item.story === 'string' ? item.story.trim() : fallback.story,
          imageUrl: item.imageUrl || fallback.imageUrl,
          frameStyle: item.frameStyle || fallback.frameStyle || 'wood-gold'
        });
      }
    });
  }

  // Return sorted 1 through 8
  return Array.from({ length: 8 }, (_, i) => slotMap.get(i + 1));
}

/**
 * Returns the current 8 memory items from LocalStorage or default presets.
 *
 * @returns {Array<Object>}
 */
export function getMemories() {
  const storage = getStorage();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getDefaultPresets();
      storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return JSON.parse(JSON.stringify(defaults));
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = getDefaultPresets();
      storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return JSON.parse(JSON.stringify(defaults));
    }

    return normalizeMemories(parsed);
  } catch (err) {
    console.warn('[photoStorage] Error reading memories from storage, falling back to defaults:', err);
    const defaults = getDefaultPresets();
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // ignore write error
    }
    return JSON.parse(JSON.stringify(defaults));
  }
}

/**
 * Saves or updates a memory item by slot.
 * Automatically downscales large images.
 *
 * @param {Object} item
 * @returns {Promise<Object>} The saved memory item
 */
export async function saveMemory(item) {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid memory item: must be an object');
  }

  const slot = Number(item.slot);
  if (!slot || slot < 1 || slot > 8) {
    throw new Error(`Invalid memory slot "${item.slot}". Must be an integer between 1 and 8.`);
  }

  const memories = getMemories();
  const existingIdx = memories.findIndex((m) => m.slot === slot);
  const fallback = memories[existingIdx] || {
    id: `mem_0${slot}`,
    slot,
    title: '',
    date: '',
    story: '',
    imageUrl: '',
    frameStyle: 'wood-gold'
  };

  let imageUrl = item.imageUrl !== undefined ? item.imageUrl : fallback.imageUrl;

  // If new image is provided and requires compression
  if (imageUrl) {
    try {
      imageUrl = await compressImage(imageUrl, MAX_DIMENSION, JPEG_QUALITY);
    } catch (err) {
      console.warn('[photoStorage] Image compression failed, using original:', err);
    }
  }

  const updatedItem = {
    id: item.id || fallback.id || `mem_0${slot}`,
    slot,
    title: item.title !== undefined ? String(item.title).trim() : fallback.title,
    date: item.date !== undefined ? String(item.date).trim() : fallback.date,
    story: item.story !== undefined ? String(item.story).trim() : fallback.story,
    imageUrl: imageUrl || fallback.imageUrl,
    frameStyle: item.frameStyle || fallback.frameStyle || 'wood-gold'
  };

  if (existingIdx !== -1) {
    memories[existingIdx] = updatedItem;
  } else {
    memories.push(updatedItem);
  }

  const normalized = normalizeMemories(memories);
  const storage = getStorage();

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      throw new Error('저장 공간(LocalStorage)이 부족합니다. 이미지 용량을 확인해주세요.');
    }
    throw err;
  }

  return updatedItem;
}

/**
 * Updates an existing memory item (alias for saveMemory).
 *
 * @param {Object} item
 * @returns {Promise<Object>}
 */
export async function updateMemory(item) {
  return saveMemory(item);
}

/**
 * Resets all memories back to the initial 8 curated presets.
 *
 * @returns {Array<Object>}
 */
export function resetMemories() {
  const storage = getStorage();
  const freshPresets = getDefaultPresets();
  storage.setItem(STORAGE_KEY, JSON.stringify(freshPresets));
  return JSON.parse(JSON.stringify(freshPresets));
}

/**
 * Exports all current memories as a formatted JSON string.
 *
 * @returns {string}
 */
export function exportMemoriesJSON() {
  const memories = getMemories();
  return JSON.stringify(memories, null, 2);
}

/**
 * Validates and imports memories from a JSON string.
 *
 * @param {string} jsonString
 * @returns {Array<Object>} The imported memories array
 */
export function importMemoriesJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('유효하지 않은 JSON 데이터입니다.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('JSON 파싱에 실패했습니다. 올바른 JSON 형식인지 확인해주세요.');
  }

  // Handle case where export wrapped items in an object like { memories: [...] }
  let items = parsed;
  if (!Array.isArray(parsed) && parsed && Array.isArray(parsed.memories)) {
    items = parsed.memories;
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('가져올 추억 데이터가 비어 있거나 올바르지 않은 배열 형식입니다.');
  }

  const normalized = normalizeMemories(items);
  const storage = getStorage();

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      throw new Error('저장 공간(LocalStorage)이 부족합니다. 파일 크기를 확인해주세요.');
    }
    throw err;
  }

  return normalized;
}
