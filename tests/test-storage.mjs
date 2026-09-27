/**
 * test-storage.mjs
 * Comprehensive test suite for defaultPresets.js and photoStorage.js.
 * Verifies serialization, preset generation, persistence, downscaling, export/import, and reset.
 */

import assert from 'node:assert/strict';

// Test Mock Storage for isolated testing
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// Polyfill globalThis.localStorage for test environment
globalThis.localStorage = new MockLocalStorage();

// Import modules under test
const { DEFAULT_MEMORIES, getDefaultPresets, drawScene, getFallbackDataUrl } = await import('../src/storage/defaultPresets.js');
const {
  STORAGE_KEY,
  MAX_DIMENSION,
  JPEG_QUALITY,
  getMemories,
  saveMemory,
  updateMemory,
  resetMemories,
  compressImage,
  exportMemoriesJSON,
  importMemoriesJSON
} = await import('../src/storage/photoStorage.js');

console.log('🧪 Starting Storage & Preset Data Layer Test Suite...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ----------------------------------------------------
// 1. Curated Presets Verification
// ----------------------------------------------------
console.log('[Group 1: Curated Default Presets]');

test('8 default presets exist with continuous slots 1 to 8', () => {
  assert.equal(DEFAULT_MEMORIES.length, 8, 'Must have exactly 8 presets');
  const slots = DEFAULT_MEMORIES.map((m) => m.slot);
  assert.deepEqual(slots, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('Preset schema has all required fields', () => {
  DEFAULT_MEMORIES.forEach((m) => {
    assert.ok(m.id && typeof m.id === 'string', `id missing for slot ${m.slot}`);
    assert.ok(typeof m.slot === 'number' && m.slot >= 1 && m.slot <= 8, `slot invalid for ${m.id}`);
    assert.ok(m.title && typeof m.title === 'string', `title missing for slot ${m.slot}`);
    assert.ok(m.date && typeof m.date === 'string', `date missing for slot ${m.slot}`);
    assert.ok(m.story && typeof m.story === 'string', `story missing for slot ${m.slot}`);
    assert.ok(m.imageUrl && typeof m.imageUrl === 'string', `imageUrl missing for slot ${m.slot}`);
    assert.ok(m.frameStyle && typeof m.frameStyle === 'string', `frameStyle missing for slot ${m.slot}`);
  });
});

test('Preset titles match the 8 heartwarming themes', () => {
  const expectedTitles = [
    '노을 지던 바닷가',
    '봄날의 벚꽃길',
    '별빛 쏟아지던 캠핑',
    '따스한 오후의 책방',
    '은행나무 단풍 산책',
    '햇살 속 낮잠 자는 고양이',
    '비 내리던 날의 카페',
    '첫눈 내리던 겨울밤'
  ];
  const actualTitles = DEFAULT_MEMORIES.map((m) => m.title);
  assert.deepEqual(actualTitles, expectedTitles);
});

test('Procedural canvas drawing functions execute without errors for all 8 slots', () => {
  // Mock canvas 2D context
  const mockCtx = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    stroke: () => {},
    closePath: () => {},
    ellipse: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    strokeRect: () => {},
    roundRect: () => {}
  };

  for (let slot = 1; slot <= 8; slot++) {
    assert.doesNotThrow(() => {
      drawScene(mockCtx, slot, 640, 480);
    }, `drawScene failed for slot ${slot}`);
  }
});

test('Fallback procedural SVG generator produces valid non-empty data URLs', () => {
  for (let slot = 1; slot <= 8; slot++) {
    const dataUrl = getFallbackDataUrl(slot, 640, 480);
    assert.ok(dataUrl.startsWith('data:image/svg+xml'), `Invalid dataUrl for slot ${slot}`);
    assert.ok(dataUrl.length > 50, `Data URL too short for slot ${slot}`);
  }
});

// ----------------------------------------------------
// 2. Photo Storage Core Functionality
// ----------------------------------------------------
console.log('\n[Group 2: Photo Storage Operations]');

test('getMemories() initializes localStorage on first run and returns 8 items', () => {
  globalThis.localStorage.clear();
  assert.equal(globalThis.localStorage.getItem(STORAGE_KEY), null);

  const memories = getMemories();
  assert.equal(memories.length, 8);
  assert.equal(memories[0].slot, 1);
  assert.equal(memories[0].title, '노을 지던 바닷가');

  // Verify saved in localStorage
  const stored = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.length, 8);
});

await asyncTest('saveMemory() successfully updates a specific memory slot and persists', async () => {
  const updatedItem = await saveMemory({
    slot: 3,
    title: '제주도 푸른 밤',
    date: '2024. 09. 15',
    story: '파도 소리가 들리던 협재 해변에서 바라본 은하수.',
    imageUrl: 'data:image/jpeg;base64,sample_updated_image_3',
    frameStyle: 'wood-warm'
  });

  assert.equal(updatedItem.slot, 3);
  assert.equal(updatedItem.title, '제주도 푸른 밤');
  assert.equal(updatedItem.story, '파도 소리가 들리던 협재 해변에서 바라본 은하수.');

  // Verify getMemories reads the update
  const memories = getMemories();
  const slot3 = memories.find((m) => m.slot === 3);
  assert.equal(slot3.title, '제주도 푸른 밤');
  assert.equal(slot3.date, '2024. 09. 15');
  assert.equal(slot3.imageUrl, 'data:image/jpeg;base64,sample_updated_image_3');

  // Ensure other slots remain intact
  const slot1 = memories.find((m) => m.slot === 1);
  assert.equal(slot1.title, '노을 지던 바닷가');
});

await asyncTest('updateMemory() acts as alias and updates slot correctly', async () => {
  const result = await updateMemory({
    slot: 5,
    title: '경복궁 단풍 구경',
    story: '가을빛으로 물든 궁궐을 산책했던 오후.'
  });

  assert.equal(result.slot, 5);
  assert.equal(result.title, '경복궁 단풍 구경');
  assert.equal(result.story, '가을빛으로 물든 궁궐을 산책했던 오후.');

  const memories = getMemories();
  const slot5 = memories.find((m) => m.slot === 5);
  assert.equal(slot5.title, '경복궁 단풍 구경');
  // Default values should be preserved if not overwritten
  assert.ok(slot5.imageUrl.length > 0);
});

await asyncTest('saveMemory() throws error for invalid slot numbers', async () => {
  await assert.rejects(
    async () => {
      await saveMemory({ slot: 9, title: 'Invalid slot' });
    },
    { message: /Invalid memory slot "9"/ }
  );

  await assert.rejects(
    async () => {
      await saveMemory({ slot: 0, title: 'Invalid slot' });
    },
    { message: /Invalid memory slot "0"/ }
  );
});

// ----------------------------------------------------
// 3. Export, Import & Reset Functionality
// ----------------------------------------------------
console.log('\n[Group 3: Export, Import & Reset]');

test('exportMemoriesJSON() generates valid JSON with 8 items', () => {
  const jsonStr = exportMemoriesJSON();
  assert.ok(typeof jsonStr === 'string');

  const parsed = JSON.parse(jsonStr);
  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.length, 8);
  assert.equal(parsed[2].title, '제주도 푸른 밤'); // From previous update
});

test('importMemoriesJSON() loads and validates imported JSON data', () => {
  const importData = [
    {
      slot: 1,
      title: '가족과 함께한 첫 캠핑',
      date: '2022. 05. 05',
      story: '아이들과 텐트를 치고 맛있는 바비큐를 먹었던 추억.',
      imageUrl: 'data:image/jpeg;base64,custom1',
      frameStyle: 'natural-oak'
    },
    {
      slot: 2,
      title: '졸업식 날의 꽃다발',
      date: '2023. 02. 24',
      story: '새로운 시작을 축하해주던 소중한 친구들.',
      imageUrl: 'data:image/jpeg;base64,custom2',
      frameStyle: 'wood-gold'
    }
  ];

  const imported = importMemoriesJSON(JSON.stringify(importData));
  assert.equal(imported.length, 8, 'Missing slots should be filled automatically');
  assert.equal(imported[0].title, '가족과 함께한 첫 캠핑');
  assert.equal(imported[1].title, '졸업식 날의 꽃다발');
  // Missing slots (3~8) filled with defaults
  assert.equal(imported[2].slot, 3);
});

test('importMemoriesJSON() handles wrapped object format { memories: [...] }', () => {
  const wrapped = {
    memories: [
      { slot: 4, title: '골목길 베이커리', date: '2024. 01. 10', story: '갓 구운 빵 냄새' }
    ]
  };
  const imported = importMemoriesJSON(JSON.stringify(wrapped));
  assert.equal(imported.length, 8);
  assert.equal(imported.find((m) => m.slot === 4).title, '골목길 베이커리');
});

test('importMemoriesJSON() throws descriptive errors for malformed JSON or invalid data', () => {
  assert.throws(
    () => importMemoriesJSON('invalid-json-string{]'),
    { message: /JSON 파싱에 실패했습니다/ }
  );

  assert.throws(
    () => importMemoriesJSON('[]'),
    { message: /가져올 추억 데이터가 비어 있거나/ }
  );
});

test('resetMemories() restores all 8 initial curated presets', () => {
  const resetList = resetMemories();
  assert.equal(resetList.length, 8);
  assert.equal(resetList[0].title, '노을 지던 바닷가');
  assert.equal(resetList[2].title, '별빛 쏟아지던 캠핑'); // Reset from '제주도 푸른 밤'
  assert.equal(resetList[4].title, '은행나무 단풍 산책'); // Reset from '경복궁 단풍 구경'

  // Confirm in localStorage as well
  const stored = getMemories();
  assert.equal(stored[2].title, '별빛 쏟아지던 캠핑');
});

// ----------------------------------------------------
// 4. Image Downscaling & Compression Logic
// ----------------------------------------------------
console.log('\n[Group 4: Image Compression & Canvas Scaling]');

await asyncTest('compressImage() handles string fallback gracefully in Node without Canvas', async () => {
  const inputStr = 'data:image/jpeg;base64,sample_raw_string';
  const result = await compressImage(inputStr, 1200, 0.8);
  assert.equal(result, inputStr);
});

await asyncTest('compressImage() downscales dimensions preserving aspect ratio with mocked Canvas API', async () => {
  // Setup mock DOM canvas & Image in global scope to simulate browser environment
  let drawnWidth = 0;
  let drawnHeight = 0;
  let exportedQuality = 0;

  class MockImage {
    constructor() {
      this.naturalWidth = 2400;
      this.naturalHeight = 1600;
      this.width = 2400;
      this.height = 1600;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 5);
    }
  }

  const mockCanvasElement = {
    width: 0,
    height: 0,
    getContext: (type) => ({
      fillStyle: '',
      fillRect: () => {},
      drawImage: (img, sx, sy, sw, sh) => {
        drawnWidth = sw;
        drawnHeight = sh;
      }
    }),
    toDataURL: (mime, q) => {
      exportedQuality = q;
      return `data:image/jpeg;base64,mock_compressed_${drawnWidth}x${drawnHeight}`;
    }
  };

  const originalDocument = globalThis.document;
  const originalImage = globalThis.Image;

  globalThis.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return mockCanvasElement;
      return {};
    }
  };
  globalThis.Image = MockImage;

  try {
    const res = await compressImage('data:image/png;base64,raw_large_image', 1200, 0.8);

    // 2400 x 1600 downscaled to max 1200 -> 1200 x 800
    assert.equal(drawnWidth, 1200, 'Width must scale to max dimension 1200');
    assert.equal(drawnHeight, 800, 'Height must preserve 3:2 aspect ratio -> 800');
    assert.equal(exportedQuality, 0.8, 'Quality must be 0.8');
    assert.ok(res.includes('1200x800'));
  } finally {
    globalThis.document = originalDocument;
    globalThis.Image = originalImage;
  }
});

console.log(`\n🎉 All ${passedTests} tests passed successfully!\n`);
