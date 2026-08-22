/**
 * ============================================================================
 * AMBIENT INDIAN INSTRUMENTAL AUDIO ENGINE (Web Audio API)
 * ============================================================================
 * Generates an ambient Tanpura drone + Bansuri flute harmonics + Temple Bell resonance.
 * Zero external audio dependencies needed, but also supports custom audio files!
 */

export class AmbientAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.volume = 0.6;
    this.masterGain = null;
    this.nodes = [];
    this.melodyTimer = null;
    this.bellTimer = null;
    this.customAudio = null;
    this.useCustomAudio = false;

    this.initUI();
  }

  initUI() {
    this.playBtn = document.getElementById('audio-play-toggle');
    this.volumeSlider = document.getElementById('audio-volume');
    this.widget = document.querySelector('.audio-widget');
    this.statusText = document.getElementById('audio-status');

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  startDrone() {
    // Tanpura Root Frequencies (Key of D3 = 146.83 Hz, Pa = 220.00 Hz, Sa Octave = 293.66 Hz)
    const baseFreqs = [146.83, 220.00, 293.66, 146.83 * 0.5];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      // Soft warm saw/triangle synthesis
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), this.audioCtx.currentTime);

      // Lowpass warmth filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420 + idx * 80, this.audioCtx.currentTime);

      // Gentle LFO for the organic Tanpura pulsing rhythm
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.25 + idx * 0.08, this.audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      lfo.connect(gain.gain);
      lfo.start();

      gain.gain.setValueAtTime(0.08 / (idx + 1), this.audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.nodes.push(osc, lfo);
    });
  }

  playFluteNote(freq, duration = 3.5) {
    if (!this.audioCtx || !this.isPlaying) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    // Subtle breath vibrato
    const vibrato = this.audioCtx.createOscillator();
    const vibratoGain = this.audioCtx.createGain();
    vibrato.frequency.setValueAtTime(5, this.audioCtx.currentTime);
    vibratoGain.gain.setValueAtTime(2.5, this.audioCtx.currentTime);
    vibrato.connect(osc.frequency);
    vibrato.start();

    // Soft warm filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.audioCtx.currentTime);

    // Attack - Decay - Sustain - Release envelope
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
    vibrato.stop(now + duration);
  }

  playTempleBell() {
    if (!this.audioCtx || !this.isPlaying) return;
    const bellFreqs = [587.33, 880.00, 1174.66]; // D5, A5, D6 harmonic chime

    bellFreqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.04 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }

  playDiyaChime() {
    this.ensureContext();
    const bellFreqs = [587.33, 739.99, 880.00, 1174.66];
    bellFreqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.06 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(gain);
      gain.connect(this.masterGain || this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 3.5);
    });
  }

  startMelodyLoop() {
    // Pentatonic Raga scale notes (D, E, F#, A, B, D5)
    const ragaScale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25];

    const triggerNextNote = () => {
      if (!this.isPlaying) return;
      const note = ragaScale[Math.floor(Math.random() * ragaScale.length)];
      const duration = 2.5 + Math.random() * 2;
      this.playFluteNote(note, duration);

      const delay = 3500 + Math.random() * 3000;
      this.melodyTimer = setTimeout(triggerNextNote, delay);
    };

    triggerNextNote();

    // Occasional gentle temple bell
    const triggerBell = () => {
      if (!this.isPlaying) return;
      this.playTempleBell();
      this.bellTimer = setTimeout(triggerBell, 14000 + Math.random() * 8000);
    };

    this.bellTimer = setTimeout(triggerBell, 6000);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    this.ensureContext();
    this.isPlaying = true;
    this.startDrone();
    this.startMelodyLoop();

    if (this.widget) this.widget.classList.add('audio-playing');
    if (this.playBtn) {
      this.playBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      `;
      this.playBtn.setAttribute('title', 'Pause Ambient Music');
    }
    if (this.statusText) this.statusText.textContent = "Music Playing";
  }

  stop() {
    this.isPlaying = false;
    if (this.melodyTimer) clearTimeout(this.melodyTimer);
    if (this.bellTimer) clearTimeout(this.bellTimer);

    this.nodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Ignore stopped nodes
      }
    });
    this.nodes = [];

    if (this.widget) this.widget.classList.remove('audio-playing');
    if (this.playBtn) {
      this.playBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
      this.playBtn.setAttribute('title', 'Play Ambient Music');
    }
    if (this.statusText) this.statusText.textContent = "Music Paused";
  }

  setVolume(val) {
    this.volume = val;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(val, this.audioCtx.currentTime);
    }
  }
}
