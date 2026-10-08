// ============================================================
// SoundManager.js — Web Audio API based sound system
// Generates all sounds procedurally (no external files needed)
// ============================================================

export class SoundManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._musicEnabled = true;
    this._sfxVolume = 0.7;
    this._musicVolume = 0.3;
    this._musicOscillators = [];
    this._musicPlaying = false;

    // Load settings from localStorage
    this._loadSettings();
  }

  _loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('chibiChessSettings') || '{}');
      this._enabled = s.sfxEnabled !== false;
      this._musicEnabled = s.musicEnabled !== false;
      this._sfxVolume = s.sfxVolume ?? 0.7;
      this._musicVolume = s.musicVolume ?? 0.3;
    } catch {}
  }

  saveSettings() {
    try {
      const existing = JSON.parse(localStorage.getItem('chibiChessSettings') || '{}');
      localStorage.setItem('chibiChessSettings', JSON.stringify({
        ...existing,
        sfxEnabled: this._enabled,
        musicEnabled: this._musicEnabled,
        sfxVolume: this._sfxVolume,
        musicVolume: this._musicVolume
      }));
    } catch {}
  }

  get ctx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  // Resume suspended context (browser autoplay policy)
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  get sfxEnabled() { return this._enabled; }
  set sfxEnabled(v) { this._enabled = v; this.saveSettings(); }
  
  get musicEnabled() { return this._musicEnabled; }
  set musicEnabled(v) {
    this._musicEnabled = v;
    this.saveSettings();
    if (!v) this.stopMusic();
    else if (!this._musicPlaying) this.startAmbientMusic();
  }

  get sfxVolume() { return this._sfxVolume; }
  set sfxVolume(v) { this._sfxVolume = Math.max(0, Math.min(1, v)); this.saveSettings(); }

  get musicVolume() { return this._musicVolume; }
  set musicVolume(v) { 
    this._musicVolume = Math.max(0, Math.min(1, v));
    this.saveSettings();
    // Update live gain if music is playing
    if (this._musicGain) this._musicGain.gain.setTargetAtTime(this._musicVolume * 0.4, this.ctx.currentTime, 0.1);
  }

  // ============================================================
  // Sound effects (procedurally generated)
  // ============================================================

  /** Piece move — soft click */
  playMove() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);
    gain.gain.setValueAtTime(this._sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t); osc.stop(t + 0.12);
  }

  /** Piece capture — sharper impact */
  playCapture() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;

    // Noise burst
    const buffer = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.03));
    
    const source = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.5;
    gain.gain.setValueAtTime(this._sfxVolume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    source.connect(filter); filter.connect(gain); gain.connect(c.destination);
    source.start(t);

    // Tone hit
    const osc = c.createOscillator();
    const g2 = c.createGain();
    osc.connect(g2); g2.connect(c.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    g2.gain.setValueAtTime(this._sfxVolume * 0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  }

  /** Check — alert ding */
  playCheck() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    
    [880, 1100].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.5, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.2);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.22);
    });
  }

  /** Castling — double move sound */
  playCastle() {
    if (!this._enabled) return;
    this.playMove();
    setTimeout(() => this.playMove(), 120);
  }

  /** Promotion — fanfare */
  playPromotion() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const notes = [523, 659, 784, 1047]; // C E G C
    
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.start(start); osc.stop(start + 0.28);
    });
  }

  /** Game over — dramatic chord */
  playGameOver(win = false) {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    
    const chords = win 
      ? [[523, 659, 784], [587, 698, 880], [659, 784, 1047]]   // C E G → D F A → E G C (triumphant)
      : [[440, 523, 622], [415, 494, 622], [392, 466, 587]];    // Am → G# minor → Gm (sad)
    
    chords.forEach((chord, ci) => {
      chord.forEach(freq => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = t + ci * 0.5;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.25, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.start(start); osc.stop(start + 0.85);
      });
    });
  }

  /** Timer warning — tick */
  playTimerWarn() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'square';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(this._sfxVolume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.06);
  }

  /** Button click */
  playClick() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(this._sfxVolume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t); osc.stop(t + 0.08);
  }

  /** Undo sound */
  playUndo() {
    if (!this._enabled) return;
    const c = this.ctx;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    gain.gain.setValueAtTime(this._sfxVolume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.12);
  }

  // ============================================================
  // Ambient Background Music
  // ============================================================
  startAmbientMusic() {
    if (!this._musicEnabled || this._musicPlaying) return;
    const c = this.ctx;
    this._musicPlaying = true;
    this._musicGain = c.createGain();
    this._musicGain.gain.value = this._musicVolume * 0.4;
    this._musicGain.connect(c.destination);

    // Ambient drone — two detuned oscillators for warmth
    const createDrone = (freq, type = 'sine', detune = 0) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(this._musicGain);
      osc.start();
      return osc;
    };

    // Pad chord: A minor — A C E
    this._musicOscillators = [
      createDrone(110, 'sine', 0),    // A1
      createDrone(220, 'sine', -8),   // A2 slightly detuned
      createDrone(130.8, 'sine', 5),  // C3
      createDrone(164.8, 'sine', -3), // E3
      createDrone(55, 'sine', 0),     // A0 (bass)
    ];

    // Slowly modulate the volume for breathing effect
    this._musicBreathInterval = setInterval(() => {
      if (!this._musicPlaying || !this._musicGain) return;
      const t = c.currentTime;
      const target = this._musicVolume * (0.3 + Math.random() * 0.15);
      this._musicGain.gain.setTargetAtTime(target, t, 2.0);
    }, 4000);
  }

  stopMusic() {
    this._musicPlaying = false;
    if (this._musicBreathInterval) {
      clearInterval(this._musicBreathInterval);
      this._musicBreathInterval = null;
    }
    this._musicOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this._musicOscillators = [];
    if (this._musicGain) {
      this._musicGain.disconnect();
      this._musicGain = null;
    }
  }

  destroy() {
    this.stopMusic();
    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
    }
  }
}

// Singleton
export const soundManager = new SoundManager();
