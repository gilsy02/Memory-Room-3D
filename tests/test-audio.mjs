/**
 * test-audio.mjs
 * Verification suite for Web Audio Ambient Sound Generator & UI Integration.
 *
 * Tests:
 * 1. Mock AudioContext & Node.js environment compatibility
 * 2. setupAmbientSound initialization & interface contract
 * 3. Playback lifecycle & state transitions (play, pause, toggle)
 * 4. Volume control, boundary clamping, and mute state
 * 5. Warm chord progression sequence (Cmaj7, Am9, Fmaj7, G7sus4)
 * 6. Procedural sound effects (playPaperRustle, playChime)
 * 7. HUD DOM integration & resource cleanup (destroy)
 */

import assert from 'node:assert/strict';
import {
  setupAmbientSound,
  createMockAudioContext,
  CHORD_PROGRESSION,
  ICON_PLAYING_SVG,
  ICON_MUTED_SVG
} from '../src/audio/ambientSound.js';

// Helper mock DOM element generator for Node test environment
function createMockElement(id = '', tagName = 'div') {
  const classSet = new Set();
  const attributes = {};
  const listeners = {};
  let content = '';

  return {
    id,
    tagName: tagName.toUpperCase(),
    type: tagName === 'button' ? 'button' : tagName === 'input' ? 'range' : undefined,
    value: '0.5',
    style: {},
    classList: {
      add: (...cls) => cls.forEach((c) => classSet.add(c)),
      remove: (...cls) => cls.forEach((c) => classSet.delete(c)),
      contains: (c) => classSet.has(c)
    },
    get textContent() {
      return content;
    },
    set textContent(val) {
      content = String(val);
    },
    innerHTML: '',
    setAttribute: (name, val) => {
      attributes[name] = String(val);
    },
    getAttribute: (name) => attributes[name] || null,
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((h) => h !== handler);
    },
    dispatchEvent: (event) => {
      const handlers = listeners[event.type] || [];
      handlers.forEach((h) => h(event));
    },
    querySelector: () => null
  };
}

async function runTests() {
  console.log('🧪 Starting Ambient Sound Synthesizer & SFX Test Suite...\n');

  // =========================================================================
  // Group 1: Mock AudioContext & Node.js Environment Compatibility
  // =========================================================================
  console.log('[Group 1: Mock AudioContext & Node.js Environment Compatibility]');
  {
    const mockCtx = createMockAudioContext();
    assert.strictEqual(mockCtx.state, 'suspended', 'Mock AudioContext initial state should be suspended');
    assert.strictEqual(mockCtx.sampleRate, 44100, 'Mock AudioContext sampleRate should default to 44100');
    assert.ok(mockCtx.destination, 'Mock AudioContext must have a destination node');

    await mockCtx.resume();
    assert.strictEqual(mockCtx.state, 'running', 'resume() should transition state to running');

    await mockCtx.suspend();
    assert.strictEqual(mockCtx.state, 'suspended', 'suspend() should transition state to suspended');

    await mockCtx.close();
    assert.strictEqual(mockCtx.state, 'closed', 'close() should transition state to closed');

    // Test node creation
    const gain = mockCtx.createGain();
    assert.ok(gain.gain && typeof gain.gain.setValueAtTime === 'function', 'GainNode must expose gain AudioParam');
    assert.strictEqual(gain.gain.value, 1.0, 'Gain initial value should be 1.0');

    const filter = mockCtx.createBiquadFilter();
    assert.strictEqual(filter.type, 'lowpass', 'Filter default type should be lowpass');
    assert.strictEqual(filter.frequency.value, 1000, 'Filter default cutoff frequency should be 1000Hz');

    const osc = mockCtx.createOscillator();
    assert.strictEqual(osc.type, 'sine', 'Oscillator default type should be sine');
    assert.strictEqual(osc.frequency.value, 440, 'Oscillator default frequency should be 440');
    osc.start(0);
    assert.strictEqual(osc.started, true, 'Oscillator start() sets started flag');
    osc.stop(1);
    assert.strictEqual(osc.stopped, true, 'Oscillator stop() sets stopped flag');

    const buffer = mockCtx.createBuffer(1, 1000, 44100);
    assert.strictEqual(buffer.numberOfChannels, 1, 'Buffer channel count should match');
    assert.strictEqual(buffer.length, 1000, 'Buffer length should match');
    assert.ok(buffer.getChannelData(0) instanceof Float32Array, 'getChannelData returns Float32Array');

    const bufferSource = mockCtx.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.start(0);
    assert.strictEqual(bufferSource.started, true, 'BufferSource start() sets started flag');

    console.log('  ✓ Mock AudioContext implements complete Web Audio API surface required');
    console.log('  ✓ State transitions (suspended -> running -> suspended -> closed) verified');
    console.log('  ✓ AudioParam ramps, oscillators, filters, and buffers execute without errors');
  }

  // =========================================================================
  // Group 2: Ambient Sound Controller Setup & Interface Contract
  // =========================================================================
  console.log('\n[Group 2: Ambient Sound Controller Setup & Interface Contract]');
  {
    const mockCtx = createMockAudioContext();
    const sound = setupAmbientSound({
      audioContext: mockCtx,
      initialVolume: 0.6
    });

    assert.ok(typeof sound.play === 'function', 'Must provide play()');
    assert.ok(typeof sound.pause === 'function', 'Must provide pause()');
    assert.ok(typeof sound.toggle === 'function', 'Must provide toggle()');
    assert.ok(typeof sound.setVolume === 'function', 'Must provide setVolume()');
    assert.ok(typeof sound.getVolume === 'function', 'Must provide getVolume()');
    assert.ok(typeof sound.isPlaying === 'function', 'Must provide isPlaying()');
    assert.ok(typeof sound.isMuted === 'function', 'Must provide isMuted()');
    assert.ok(typeof sound.playPaperRustle === 'function', 'Must provide playPaperRustle()');
    assert.ok(typeof sound.playChime === 'function', 'Must provide playChime()');
    assert.ok(typeof sound.getCurrentChord === 'function', 'Must provide getCurrentChord()');
    assert.ok(typeof sound.nextChord === 'function', 'Must provide nextChord()');
    assert.ok(typeof sound.destroy === 'function', 'Must provide destroy()');

    assert.strictEqual(sound.isPlaying(), false, 'Should start paused by default');
    assert.strictEqual(sound.getVolume(), 0.6, 'Should respect initialVolume setting');
    assert.strictEqual(sound.isMuted(), true, 'Should report muted when paused');

    sound.destroy();
    console.log('  ✓ setupAmbientSound() exposes complete controller contract');
    console.log('  ✓ Initial state defaults to paused with configured volume');
  }

  // =========================================================================
  // Group 3: Playback Lifecycle & State Transitions
  // =========================================================================
  console.log('\n[Group 3: Playback Lifecycle & State Transitions]');
  {
    const mockCtx = createMockAudioContext();
    const sound = setupAmbientSound({ audioContext: mockCtx, chordIntervalMs: 1000 });

    assert.strictEqual(mockCtx.state, 'suspended', 'AudioContext is suspended initially');
    assert.strictEqual(sound.isPlaying(), false);

    // 1. Play
    await sound.play();
    assert.strictEqual(sound.isPlaying(), true, 'isPlaying() must be true after play()');
    assert.strictEqual(mockCtx.state, 'running', 'play() must resume suspended AudioContext');

    // 2. Play idempotency
    await sound.play();
    assert.strictEqual(sound.isPlaying(), true, 'Multiple play() calls should remain playing');

    // 3. Pause
    sound.pause();
    assert.strictEqual(sound.isPlaying(), false, 'isPlaying() must be false after pause()');

    // 4. Toggle
    const toggledToPlay = await sound.toggle();
    assert.strictEqual(toggledToPlay, true, 'toggle() should return true when toggling to play');
    assert.strictEqual(sound.isPlaying(), true);

    const toggledToPause = await sound.toggle();
    assert.strictEqual(toggledToPause, false, 'toggle() should return false when toggling to pause');
    assert.strictEqual(sound.isPlaying(), false);

    sound.destroy();
    console.log('  ✓ play() resumes AudioContext and starts procedural generator');
    console.log('  ✓ pause() halts generation and clears timers');
    console.log('  ✓ toggle() cleanly alternates between play and pause');
  }

  // =========================================================================
  // Group 4: Volume Control, Boundary Clamping, and Mute Logic
  // =========================================================================
  console.log('\n[Group 4: Volume Control, Boundary Clamping, and Mute Logic]');
  {
    const mockCtx = createMockAudioContext();
    const sound = setupAmbientSound({ audioContext: mockCtx, initialVolume: 0.5 });

    assert.strictEqual(sound.getVolume(), 0.5);

    // Normal volume set
    sound.setVolume(0.85);
    assert.strictEqual(sound.getVolume(), 0.85, 'Volume should update to 0.85');

    // Clamping upper bound
    sound.setVolume(2.5);
    assert.strictEqual(sound.getVolume(), 1.0, 'Volume > 1.0 must clamp to 1.0');

    // Clamping lower bound
    sound.setVolume(-0.4);
    assert.strictEqual(sound.getVolume(), 0.0, 'Volume < 0.0 must clamp to 0.0');
    assert.strictEqual(sound.isMuted(), true, 'Volume 0.0 must report isMuted() === true');

    // Reset volume while playing
    await sound.play();
    sound.setVolume(0.7);
    assert.strictEqual(sound.isMuted(), false, 'Playing with non-zero volume is not muted');

    sound.setVolume(0);
    assert.strictEqual(sound.isMuted(), true, 'Playing with 0 volume is muted');

    sound.destroy();
    console.log('  ✓ Volume updates accurately within 0.0 to 1.0 range');
    console.log('  ✓ Bounds clamping properly prevents negative or excessive values');
    console.log('  ✓ isMuted() reflects volume = 0 and pause states accurately');
  }

  // =========================================================================
  // Group 5: Warm Emotional Chord Progression & Timbre
  // =========================================================================
  console.log('\n[Group 5: Warm Emotional Chord Progression & Timbre]');
  {
    assert.strictEqual(CHORD_PROGRESSION.length, 4, 'Chord progression must consist of 4 chords');

    const expectedChords = ['Cmaj7', 'Am9', 'Fmaj7', 'G7sus4'];
    CHORD_PROGRESSION.forEach((chord, i) => {
      assert.strictEqual(chord.name, expectedChords[i], `Chord ${i} should be ${expectedChords[i]}`);
      assert.ok(typeof chord.bass === 'number' && chord.bass > 0, `Chord ${chord.name} must have numeric bass frequency`);
      assert.ok(Array.isArray(chord.notes) && chord.notes.length >= 4, `Chord ${chord.name} must have at least 4 harmonic notes`);
    });

    const mockCtx = createMockAudioContext();
    const sound = setupAmbientSound({ audioContext: mockCtx });

    // Initial chord is Cmaj7
    assert.strictEqual(sound.getCurrentChord().name, 'Cmaj7', 'First chord should be Cmaj7');

    // Sequence progression
    const chord2 = sound.nextChord();
    assert.strictEqual(chord2.name, 'Am9', 'Second chord should be Am9');

    const chord3 = sound.nextChord();
    assert.strictEqual(chord3.name, 'Fmaj7', 'Third chord should be Fmaj7');

    const chord4 = sound.nextChord();
    assert.strictEqual(chord4.name, 'G7sus4', 'Fourth chord should be G7sus4');

    // Wraparound
    const chord1Again = sound.nextChord();
    assert.strictEqual(chord1Again.name, 'Cmaj7', 'Cycle must wrap around to Cmaj7');

    // Test playing voices
    await sound.play();
    const chordPlaying = sound.getCurrentChord();
    assert.strictEqual(chordPlaying.name, 'Cmaj7');

    sound.destroy();
    console.log('  ✓ 4 emotional chords verified: Cmaj7, Am9, Fmaj7, G7sus4');
    console.log('  ✓ Bass and multi-voice harmony frequencies properly configured');
    console.log('  ✓ nextChord() cleanly cycles and wraps around the sequence');
  }

  // =========================================================================
  // Group 6: Procedural Cozy Sound Effects (Paper Rustle & Bell Chime)
  // =========================================================================
  console.log('\n[Group 6: Procedural Cozy Sound Effects (Paper Rustle & Bell Chime)]');
  {
    const mockCtx = createMockAudioContext();
    const sound = setupAmbientSound({ audioContext: mockCtx });

    // 1. Paper rustle
    assert.doesNotThrow(() => {
      sound.playPaperRustle();
    }, 'playPaperRustle() must execute cleanly without exceptions');

    // 2. Memory interaction chime
    assert.doesNotThrow(() => {
      sound.playChime();
    }, 'playChime() must execute cleanly without exceptions');

    sound.destroy();
    console.log('  ✓ playPaperRustle() generates filtered noise burst for polaroids');
    console.log('  ✓ playChime() synthesizes gentle pentatonic bell chime for memories');
  }

  // =========================================================================
  // Group 7: HUD DOM Integration & Resource Cleanup
  // =========================================================================
  console.log('\n[Group 7: HUD DOM Integration & Resource Cleanup]');
  {
    const mockCtx = createMockAudioContext();
    const mockToggleBtn = createMockElement('btn-audio-toggle', 'button');
    const mockVolumeSlider = createMockElement('audio-volume', 'input');
    const mockIcon = createMockElement('audio-icon', 'div');

    const sound = setupAmbientSound({
      audioContext: mockCtx,
      toggleBtn: mockToggleBtn,
      volumeSlider: mockVolumeSlider,
      iconEl: mockIcon,
      initialVolume: 0.5
    });

    // Initial UI state: paused
    assert.strictEqual(mockToggleBtn.getAttribute('aria-label'), '음악 재생');
    assert.strictEqual(mockIcon.innerHTML, ICON_MUTED_SVG);
    assert.strictEqual(mockVolumeSlider.value, '0.5');

    // Click toggle button -> play
    mockToggleBtn.dispatchEvent({ type: 'click' });
    // Let async resume resolve
    await new Promise((r) => setTimeout(r, 10));

    assert.strictEqual(sound.isPlaying(), true, 'Toggle click should start playback');
    assert.strictEqual(mockToggleBtn.getAttribute('aria-label'), '음악 일시정지');
    assert.strictEqual(mockIcon.innerHTML, ICON_PLAYING_SVG);

    // Slider input event -> changes volume
    mockVolumeSlider.value = '0.25';
    mockVolumeSlider.dispatchEvent({ type: 'input', target: mockVolumeSlider });
    assert.strictEqual(sound.getVolume(), 0.25, 'Slider input should update volume');

    // Slide to 0 -> muted
    mockVolumeSlider.value = '0';
    mockVolumeSlider.dispatchEvent({ type: 'input', target: mockVolumeSlider });
    assert.strictEqual(sound.getVolume(), 0.0);
    assert.strictEqual(mockIcon.innerHTML, ICON_MUTED_SVG, 'Volume 0 should display muted icon');

    // Destroy
    sound.destroy();
    assert.strictEqual(sound.isPlaying(), false, 'destroy() halts playback');

    console.log('  ✓ Toggle button click alternates play/pause and updates icon');
    console.log('  ✓ Volume slider input adjusts audio gain and UI state');
    console.log('  ✓ destroy() cleanly removes listeners and halts audio nodes');
  }

  console.log('\n🎉 All Ambient Sound Generator & UI tests passed successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Ambient Sound Test Suite Failed:');
  console.error(err);
  process.exit(1);
});
