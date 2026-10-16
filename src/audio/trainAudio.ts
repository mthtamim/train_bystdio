/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class TrainAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Diesel Engine Nodes
  private engineRumbleOsc1: OscillatorNode | null = null;
  private engineRumbleOsc2: OscillatorNode | null = null;
  private engineNoiseNode: AudioBufferSourceNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Track clatter
  private lastClackTime: number = 0;

  // Horn Nodes
  private hornGain: GainNode | null = null;
  private isHornPlaying: boolean = false;

  // Rain Ambient Nodes
  private rainGain: GainNode | null = null;
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupDieselEngine();
      this.setupRainAmbient();
      this.isInitialized = true;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      // AudioContext may require user gesture
    }
  }

  public resumeContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createWhiteNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private setupDieselEngine() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.engineGain.connect(this.masterGain);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);
    this.engineFilter.connect(this.engineGain);

    // Deep piston oscillator 1 (Triangle)
    this.engineRumbleOsc1 = this.ctx.createOscillator();
    this.engineRumbleOsc1.type = 'triangle';
    this.engineRumbleOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);
    this.engineRumbleOsc1.connect(this.engineFilter);
    this.engineRumbleOsc1.start();

    // Harmonics oscillator 2 (Sawtooth)
    this.engineRumbleOsc2 = this.ctx.createOscillator();
    this.engineRumbleOsc2.type = 'sawtooth';
    this.engineRumbleOsc2.frequency.setValueAtTime(84, this.ctx.currentTime);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.engineRumbleOsc2.connect(subGain);
    subGain.connect(this.engineFilter);
    this.engineRumbleOsc2.start();
  }

  private setupRainAmbient() {
    if (!this.ctx || !this.masterGain) return;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.rainFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);
    this.rainFilter.connect(this.rainGain);

    try {
      const buffer = this.createWhiteNoiseBuffer();
      this.rainNoiseNode = this.ctx.createBufferSource();
      this.rainNoiseNode.buffer = buffer;
      this.rainNoiseNode.loop = true;
      this.rainNoiseNode.connect(this.rainFilter);
      this.rainNoiseNode.start();
    } catch {
      // Ignore fallback
    }
  }

  public updateTrainPhysicsAudio(speedKmh: number, throttleNotch: number) {
    if (!this.ctx || !this.engineGain || !this.engineFilter) return;

    const targetGain = 0.04 + (throttleNotch / 8) * 0.16 + (speedKmh / 100) * 0.12;
    const baseFreq = 38 + throttleNotch * 4.5 + (speedKmh / 100) * 18;
    const filterFreq = 110 + throttleNotch * 35 + (speedKmh / 100) * 75;

    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.15);

    if (this.engineRumbleOsc1 && this.engineRumbleOsc2) {
      this.engineRumbleOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
      this.engineRumbleOsc2.frequency.setTargetAtTime(baseFreq * 2, this.ctx.currentTime, 0.1);
    }

    // Wheel track click-clack: triggered at intervals inversely proportional to speed
    if (speedKmh > 3) {
      const intervalMs = Math.max(160, 1600 - (speedKmh / 100) * 1250);
      const now = performance.now();
      if (now - this.lastClackTime > intervalMs) {
        this.playTrackClack(speedKmh);
        this.lastClackTime = now;
      }
    }
  }

  private playTrackClack(speedKmh: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const volume = Math.min(0.22, (speedKmh / 100) * 0.22);

    // Dual clatter pulse: Front bogie wheel hitting joint then rear bogie wheel (60ms later)
    [0, 0.065].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, t + offset);
      filter.Q.setValueAtTime(3.0, t + offset);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, t + offset);
      osc.frequency.exponentialRampToValueAtTime(35, t + offset + 0.045);

      gain.gain.setValueAtTime(volume, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + offset);
      osc.stop(t + offset + 0.055);
    });
  }

  public setHorn(active: boolean) {
    if (!this.ctx || !this.masterGain) {
      if (active) this.init();
      return;
    }

    if (active && !this.isHornPlaying) {
      this.isHornPlaying = true;
      const t = this.ctx.currentTime;

      // Realistic Bangladesh Railway Dual-tone Brass Locomotive Horn:
      // Primary tones: F#4 (approx 370Hz) & A4 (approx 440Hz) with subtle 3rd harmonic
      const hornFrequencies = [369.99, 440.0, 554.37];
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.001, t);
      this.hornGain.gain.linearRampToValueAtTime(0.35, t + 0.04); // Sharp air attack
      this.hornGain.connect(this.masterGain);

      hornFrequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.hornGain) return;
        const osc = this.ctx.createOscillator();
        const toneGain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        // Vibrato / horn resonance modulation
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, t);
        lfoGain.gain.setValueAtTime(2.2, t);
        lfo.connect(osc.frequency);
        lfo.start(t);

        const relativeVol = idx === 0 ? 0.6 : idx === 1 ? 0.5 : 0.25;
        toneGain.gain.setValueAtTime(relativeVol, t);

        osc.connect(toneGain);
        toneGain.connect(this.hornGain);
        osc.start(t);
      });
    } else if (!active && this.isHornPlaying) {
      this.isHornPlaying = false;
      if (this.hornGain) {
        const t = this.ctx.currentTime;
        this.hornGain.gain.linearRampToValueAtTime(0.001, t + 0.12);
        setTimeout(() => {
          this.hornGain?.disconnect();
          this.hornGain = null;
        }, 150);
      }
    }
  }

  public playAirBrakeHiss() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const buffer = this.createWhiteNoiseBuffer();
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.48);
    } catch {
      // Safe fallback
    }
  }

  public playStationBell() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Resonant brass bell chime "Ding-Ding"
    const t = this.ctx.currentTime;
    [0, 0.22].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, t + offset);
      osc.frequency.exponentialRampToValueAtTime(940, t + offset + 0.35);

      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + offset);
      osc.stop(t + offset + 0.42);
    });
  }

  public playAnnouncementChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    // Iconic 3-tone electronic Bangladesh Railway chime (F#5, A5, C#6)
    const notes = [739.99, 880.0, 1108.73];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.24);

      gain.gain.setValueAtTime(0.18, t + idx * 0.24);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.24 + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.24);
      osc.stop(t + idx * 0.24 + 0.34);
    });
  }

  public updateWeatherAudio(weather: 'CLEAR' | 'CLOUDY' | 'DRIZZLE' | 'MONSOON_RAIN') {
    if (!this.ctx || !this.rainGain || !this.rainFilter) return;

    const t = this.ctx.currentTime;
    let targetGain = 0;
    let filterFreq = 1200;

    if (weather === 'DRIZZLE') {
      targetGain = 0.08;
      filterFreq = 1800;
    } else if (weather === 'MONSOON_RAIN') {
      targetGain = 0.22;
      filterFreq = 950;
    }

    this.rainGain.gain.setTargetAtTime(targetGain, t, 0.4);
    this.rainFilter.frequency.setTargetAtTime(filterFreq, t, 0.4);
  }

  public triggerThunder() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Low rumbling thunder
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.linearRampToValueAtTime(32, t + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 2.25);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public speakAnnouncement(textBn: string, textEn: string) {
    if (this.isMuted) return;

    this.playAnnouncementChime();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Look for Bengali voice or English fallback
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.startsWith('bn'));
      const enVoice = voices.find((v) => v.lang.startsWith('en'));

      setTimeout(() => {
        if (bnVoice && textBn) {
          const utterBn = new SpeechSynthesisUtterance(textBn);
          utterBn.voice = bnVoice;
          utterBn.lang = 'bn-BD';
          utterBn.rate = 0.95;
          utterBn.pitch = 1.05;
          window.speechSynthesis.speak(utterBn);
        } else if (textEn) {
          const utterEn = new SpeechSynthesisUtterance(textEn);
          if (enVoice) utterEn.voice = enVoice;
          utterEn.rate = 0.95;
          utterEn.pitch = 1.0;
          window.speechSynthesis.speak(utterEn);
        }
      }, 850);
    }
  }
}

export const trainAudio = new TrainAudioEngine();
