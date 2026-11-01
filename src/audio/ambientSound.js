/**
 * ambientSound.js
 * Procedural Web Audio Ambient Music Synthesizer & Cozy Sound Effects.
 *
 * Features:
 * - 100% offline procedural music generator (zero external audio file downloads)
 * - Warm emotional chord progression (Cmaj7, Am9, Fmaj7, G7sus4)
 * - Soft vintage sine/triangle voices with lowpass filter (lofi warmth) and subtle detune
 * - Procedural SFX: playPaperRustle() for polaroids, playChime() for memory interactions
 * - Master volume control, mute toggle, and safe autoplay initialization
 * - Headless mock AudioContext fallback for test environments without Web Audio API
 */

/**
 * Warm emotional chord progression for nostalgic, cozy attic atmosphere.
 * Cmaj7 -> Am9 -> Fmaj7 -> G7sus4
 */
export const CHORD_PROGRESSION = [
  {
    name: 'Cmaj7',
    bass: 130.81, // C3
    notes: [261.63, 329.63, 392.00, 493.88], // C4, E4, G4, B4
    description: 'Cmaj7 - Warm nostalgic homecoming'
  },
  {
    name: 'Am9',
    bass: 110.00, // A2
    notes: [220.00, 261.63, 329.63, 392.00, 493.88], // A3, C4, E4, G4, B4
    description: 'Am9 - Soft wistful longing'
  },
  {
    name: 'Fmaj7',
    bass: 87.31, // F2
    notes: [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4
    description: 'Fmaj7 - Gentle comforting warmth'
  },
  {
    name: 'G7sus4',
    bass: 98.00, // G2
    notes: [196.00, 261.63, 293.66, 349.23, 392.00], // G3, C4, D4, F4, G4
    description: 'G7sus4 - Soft suspended resolution'
  }
];

export const ICON_PLAYING_SVG = `<svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>`;

export const ICON_MUTED_SVG = `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>`;

/**
 * Creates a headless mock Web Audio Context for test environments (Node.js).
 */
export function createMockAudioContext() {
  let currentTime = 0;
  let state = 'suspended';

  const createAudioParam = (initialValue = 0) => ({
    value: initialValue,
    setValueAtTime(val) {
      this.value = val;
      return this;
    },
    linearRampToValueAtTime(val) {
      this.value = val;
      return this;
    },
    exponentialRampToValueAtTime(val) {
      this.value = val;
      return this;
    },
    cancelScheduledValues() {
      return this;
    }
  });

  const createNode = () => ({
    connectedTo: [],
    connect(target) {
      this.connectedTo.push(target);
      return target;
    },
    disconnect(target) {
      if (target) {
        this.connectedTo = this.connectedTo.filter((n) => n !== target);
      } else {
        this.connectedTo = [];
      }
    }
  });

  return {
    get state() {
      return state;
    },
    get currentTime() {
      return currentTime;
    },
    sampleRate: 44100,
    destination: {
      ...createNode(),
      maxChannelCount: 2
    },
    async resume() {
      state = 'running';
      return Promise.resolve();
    },
    async suspend() {
      state = 'suspended';
      return Promise.resolve();
    },
    async close() {
      state = 'closed';
      return Promise.resolve();
    },
    createGain() {
      return {
        ...createNode(),
        gain: createAudioParam(1.0)
      };
    },
    createBiquadFilter() {
      return {
        ...createNode(),
        type: 'lowpass',
        frequency: createAudioParam(1000),
        Q: createAudioParam(1.0),
        gain: createAudioParam(0)
      };
    },
    createOscillator() {
      return {
        ...createNode(),
        type: 'sine',
        frequency: createAudioParam(440),
        detune: createAudioParam(0),
        started: false,
        stopped: false,
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        }
      };
    },
    createBuffer(channels, length, sampleRate) {
      const buffers = [];
      for (let i = 0; i < channels; i++) {
        buffers.push(new Float32Array(length));
      }
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData(channelIndex) {
          return buffers[channelIndex] || buffers[0];
        }
      };
    },
    createBufferSource() {
      return {
        ...createNode(),
        buffer: null,
        loop: false,
        started: false,
        stopped: false,
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        }
      };
    },
    advanceTime(seconds) {
      currentTime += seconds;
    }
  };
}

/**
 * Resolves a DOM element from a selector string or element reference.
 * Returns null if running in headless/test environments without DOM.
 *
 * @param {string|HTMLElement|null} target
 * @returns {HTMLElement|null}
 */
function resolveElement(target) {
  if (!target) return null;
  if (typeof target === 'string') {
    if (typeof document !== 'undefined') {
      const selectors = target.split(',').map((s) => s.trim());
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
    }
    return null;
  }
  return target;
}

/**
 * Initializes and manages Web Audio ambient sound synthesizer and procedural SFX.
 *
 * @param {object} [options]
 * @param {AudioContext} [options.audioContext] Custom AudioContext or mock
 * @param {string|HTMLElement} [options.toggleBtn='#btn-audio-toggle, #bgm-toggle']
 * @param {string|HTMLElement} [options.volumeSlider='#audio-volume, #bgm-volume']
 * @param {string|HTMLElement} [options.iconEl='#audio-icon, #bgm-icon']
 * @param {number} [options.initialVolume=0.5]
 * @param {number} [options.chordIntervalMs=4200]
 * @param {number} [options.lowpassCutoff=1000]
 * @param {boolean} [options.autoStart=false]
 * @returns {object} Ambient sound controller interface
 */
export function setupAmbientSound(options = {}) {
  // Resolve or initialize Web Audio Context
  let audioCtx = options.audioContext || null;
  let isMock = false;

  if (!audioCtx) {
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    } else {
      audioCtx = createMockAudioContext();
      isMock = true;
    }
  }

  // Master Gain & Output Routing
  const masterGain = audioCtx.createGain();
  const initialVol = typeof options.initialVolume === 'number' ? Math.max(0, Math.min(1, options.initialVolume)) : 0.5;
  masterGain.gain.setValueAtTime(initialVol, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  // Music Sub-bus: Lowpass filter (vintage lofi warmth) -> Music Gain -> Master
  const musicFilter = audioCtx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  const cutoffFreq = options.lowpassCutoff || 1000;
  musicFilter.frequency.setValueAtTime(cutoffFreq, audioCtx.currentTime);
  musicFilter.Q.setValueAtTime(0.85, audioCtx.currentTime);

  const musicGain = audioCtx.createGain();
  musicGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
  musicGain.connect(musicFilter);
  musicFilter.connect(masterGain);

  // SFX Sub-bus: Direct to Master
  const sfxGain = audioCtx.createGain();
  sfxGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
  sfxGain.connect(masterGain);

  // Internal state
  let currentVolume = initialVol;
  let previousNonZeroVolume = initialVol > 0 ? initialVol : 0.5;
  let isPlayingState = false;
  let currentChordIndex = 0;
  let chordTimerId = null;
  const activeVoices = new Set();

  const chordInterval = options.chordIntervalMs || 4200;
  // Theme overrides: chord list, 'sustain' (default pad) or 'pluck' (koto-like), chime notes
  const progression = Array.isArray(options.progression) && options.progression.length > 0
    ? options.progression
    : CHORD_PROGRESSION;
  const voicing = options.voicing === 'pluck' ? 'pluck' : 'sustain';
  const chimeNotes = Array.isArray(options.chimeNotes) && options.chimeNotes.length > 0
    ? options.chimeNotes
    : [659.25, 783.99, 1046.50]; // E5, G5, C6

  // DOM Elements
  const toggleBtn = resolveElement(options.toggleBtn || '#btn-audio-toggle, #bgm-toggle');
  const volumeSlider = resolveElement(options.volumeSlider || '#audio-volume, #bgm-volume');
  const iconEl = resolveElement(options.iconEl || '#audio-icon, #bgm-icon');

  /**
   * Updates HUD button and icon state.
   */
  function updateUI() {
    const isMuted = currentVolume <= 0.001 || !isPlayingState;

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', isMuted ? '음악 재생' : '음악 일시정지');
      toggleBtn.setAttribute('title', isMuted ? '음악 켜기' : '음악 끄기');
    }

    if (iconEl) {
      iconEl.innerHTML = isMuted ? ICON_MUTED_SVG : ICON_PLAYING_SVG;
    } else if (toggleBtn && !toggleBtn.querySelector('svg')) {
      toggleBtn.innerHTML = isMuted ? ICON_MUTED_SVG : ICON_PLAYING_SVG;
    }

    if (volumeSlider && typeof volumeSlider.value !== 'undefined') {
      volumeSlider.value = String(currentVolume);
    }
  }

  /**
   * Safely resumes Web Audio Context on user interaction to handle browser autoplay policies.
   */
  async function ensureAudioContextRunning() {
    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('[AmbientSound] Failed to resume AudioContext:', err);
      }
    }
  }

  /**
   * Synthesizes a gentle, emotional voice tone with soft attack and decay.
   *
   * @param {number} freq - Frequency in Hz
   * @param {string} type - Oscillator type ('sine' | 'triangle')
   * @param {number} startTime - Start time in seconds
   * @param {number} duration - Note duration in seconds
   * @param {number} peakGain - Peak gain level
   * @param {number} [detuneCents=0] - Detune offset in cents
   */
  function playVoice(freq, type, startTime, duration, peakGain, detuneCents = 0, attackTime = 0.12) {
    if (!audioCtx || audioCtx.state === 'closed') return null;

    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      if (detuneCents !== 0 && osc.detune) {
        osc.detune.setValueAtTime(detuneCents, startTime);
      }

      // Soft envelope: gentle attack, warm decay
      const decayTime = duration - attackTime;

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + attackTime + decayTime);

      osc.connect(gainNode);
      gainNode.connect(musicGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      activeVoices.add(osc);

      const cleanupTimeout = setTimeout(() => {
        activeVoices.delete(osc);
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch (_) {}
      }, (duration + 0.2) * 1000);
      if (cleanupTimeout && typeof cleanupTimeout.unref === 'function') {
        cleanupTimeout.unref();
      }

      // In mock/test environments without real timers, keep voice reference
      return { osc, gainNode, cleanupTimeout };
    } catch (e) {
      console.warn('[AmbientSound] Voice synthesis error:', e);
      return null;
    }
  }

  /**
   * Plays the current chord in the progression.
   */
  function playCurrentChord() {
    if (!isPlayingState || !audioCtx) return;

    const chord = progression[currentChordIndex];
    if (!chord) return;

    const now = audioCtx.currentTime;
    const noteDuration = (chordInterval / 1000) * 0.95;

    // 1. Warm bass voice (triangle wave, deep and grounded)
    if (chord.bass) {
      playVoice(chord.bass, 'triangle', now, noteDuration, 0.12, 0);
    }

    if (voicing === 'pluck') {
      // Koto-like: sparse plucked notes, fast attack and short ring
      chord.notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.55;
        playVoice(freq, 'triangle', startTime, 1.6, 0.09, 0, 0.005);
        playVoice(freq * 2, 'sine', startTime, 0.6, 0.02, 0, 0.005);
      });
      return;
    }

    // 2. Upper chord voices with gentle arpeggiation and subtle detune
    chord.notes.forEach((freq, idx) => {
      // Gentle arpeggio stagger (0.05s - 0.12s per voice)
      const noteDelay = idx * 0.08;
      const startTime = now + noteDelay;
      const voiceDuration = Math.max(1.0, noteDuration - noteDelay);

      // Subtle detune (-3 to +3 cents) for nostalgic tape drift
      const detune = (idx % 2 === 0 ? 1 : -1) * (2.0 + idx * 0.5);

      // Layered sine & triangle for celesta / electric piano tone
      playVoice(freq, 'sine', startTime, voiceDuration, 0.055, detune);
      playVoice(freq, 'triangle', startTime, voiceDuration * 0.7, 0.025, -detune);
    });
  }

  /**
   * Advances and plays the next chord in the progression cycle.
   */
  function nextChord() {
    currentChordIndex = (currentChordIndex + 1) % progression.length;
    if (isPlayingState) {
      playCurrentChord();
    }
    return progression[currentChordIndex];
  }

  /**
   * Starts or resumes procedural ambient sound playback.
   */
  async function play() {
    await ensureAudioContextRunning();

    if (isPlayingState) return true;
    isPlayingState = true;

    // Play initial chord immediately
    playCurrentChord();

    // Schedule subsequent chord changes
    if (chordTimerId) {
      clearInterval(chordTimerId);
    }
    chordTimerId = setInterval(() => {
      if (isPlayingState) {
        nextChord();
      }
    }, chordInterval);

    updateUI();
    return true;
  }

  /**
   * Pauses procedural ambient sound playback.
   */
  function pause() {
    if (!isPlayingState) return false;
    isPlayingState = false;

    if (chordTimerId) {
      clearInterval(chordTimerId);
      chordTimerId = null;
    }

    // Stop active voices gracefully
    activeVoices.forEach((osc) => {
      try {
        osc.stop();
      } catch (_) {}
    });
    activeVoices.clear();

    updateUI();
    return false;
  }

  /**
   * Toggles playback between play and pause.
   */
  async function toggle() {
    if (isPlayingState) {
      pause();
      return false;
    } else {
      await play();
      return true;
    }
  }

  /**
   * Sets master volume level (clamped between 0.0 and 1.0).
   *
   * @param {number} volume
   */
  function setVolume(volume) {
    if (typeof volume !== 'number' || isNaN(volume)) return currentVolume;
    const clamped = Math.max(0, Math.min(1, volume));
    currentVolume = clamped;

    if (currentVolume > 0) {
      previousNonZeroVolume = currentVolume;
    }

    if (audioCtx && masterGain) {
      masterGain.gain.setValueAtTime(clamped, audioCtx.currentTime);
    }

    updateUI();
    return currentVolume;
  }

  /**
   * Plays a delicate filtered noise sweep simulating a physical polaroid card rustle.
   */
  function playPaperRustle() {
    if (!audioCtx || audioCtx.state === 'closed') return;
    ensureAudioContextRunning();

    try {
      const sampleRate = audioCtx.sampleRate || 44100;
      const duration = 0.22;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate gentle noise with exponential amplitude decay
      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const decay = Math.exp(-progress * 5.0);
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;

      // Filter noise through a bandpass filter (simulating card cardstock texture)
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, audioCtx.currentTime);
      filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);

      noiseSource.start(now);
      noiseSource.stop(now + duration + 0.05);
    } catch (e) {
      console.warn('[AmbientSound] playPaperRustle error:', e);
    }
  }

  /**
   * Plays a soft, heartwarming pentatonic celesta chime on memory selection or save.
   */
  function playChime() {
    if (!audioCtx || audioCtx.state === 'closed') return;
    ensureAudioContextRunning();

    try {
      const now = audioCtx.currentTime;

      chimeNotes.forEach((freq, idx) => {
        const startTime = now + idx * 0.085;
        const duration = 0.95;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(sfxGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        // Add subtle harmonic overtone for warm celesta ring
        const harmonicOsc = audioCtx.createOscillator();
        const harmonicGain = audioCtx.createGain();

        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(freq * 2.76, startTime);

        harmonicGain.gain.setValueAtTime(0.0001, startTime);
        harmonicGain.gain.linearRampToValueAtTime(0.02, startTime + 0.008);
        harmonicGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.5);

        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(sfxGain);

        harmonicOsc.start(startTime);
        harmonicOsc.stop(startTime + duration * 0.5 + 0.05);
      });
    } catch (e) {
      console.warn('[AmbientSound] playChime error:', e);
    }
  }

  // Event Listeners for UI
  const onToggleClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    toggle();
  };

  const onVolumeInput = (e) => {
    if (e && e.target) {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (val > 0 && !isPlayingState) {
        play();
      }
    }
  };

  if (toggleBtn && typeof toggleBtn.addEventListener === 'function') {
    toggleBtn.addEventListener('click', onToggleClick);
  }

  if (volumeSlider && typeof volumeSlider.addEventListener === 'function') {
    volumeSlider.addEventListener('input', onVolumeInput);
    volumeSlider.addEventListener('change', onVolumeInput);
  }

  // Update initial UI state
  updateUI();

  if (options.autoStart) {
    play();
  }

  /**
   * Destroys the ambient sound controller and cleans up resources.
   */
  function destroy() {
    pause();
    if (chordTimerId) {
      clearInterval(chordTimerId);
      chordTimerId = null;
    }
    if (toggleBtn && typeof toggleBtn.removeEventListener === 'function') {
      toggleBtn.removeEventListener('click', onToggleClick);
    }
    if (volumeSlider && typeof volumeSlider.removeEventListener === 'function') {
      volumeSlider.removeEventListener('input', onVolumeInput);
      volumeSlider.removeEventListener('change', onVolumeInput);
    }
    try {
      masterGain.disconnect();
      musicFilter.disconnect();
      musicGain.disconnect();
      sfxGain.disconnect();
    } catch (_) {}
  }

  return {
    play,
    pause,
    toggle,
    setVolume,
    getVolume: () => currentVolume,
    isPlaying: () => isPlayingState,
    isMuted: () => currentVolume <= 0.001 || !isPlayingState,
    playPaperRustle,
    playChime,
    getCurrentChord: () => progression[currentChordIndex],
    nextChord,
    destroy,
    getAudioContext: () => audioCtx,
    isMockContext: () => isMock,
    getElements: () => ({ toggleBtn, volumeSlider, iconEl })
  };
}
