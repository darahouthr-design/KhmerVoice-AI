import { AudioEffects } from '../types';

export class WebAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioBuffer: AudioBuffer | null = null;

  private startTime: number = 0;
  private pauseOffset: number = 0;
  private isPlaying: boolean = false;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private animationFrameId: number | null = null;

  private currentEffects: AudioEffects = {
    playbackRate: 1.0,
    pitchSemiTones: 0,
    bassGain: 0,
    trebleGain: 0,
    reverbAmount: 0,
    volume: 1.0,
  };

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Create an artificial impulse response for the studio reverb
  private createReverbImpulse(duration = 1.5, decay = 2.0): AudioBuffer | null {
    if (!this.audioCtx) return null;
    const rate = this.audioCtx.sampleRate;
    const length = rate * duration;
    const impulse = this.audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const env = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  public async loadFromBase64(base64Data: string, mimeType: string = 'audio/wav'): Promise<number> {
    this.stop();
    this.initContext();
    if (!this.audioCtx) throw new Error('AudioContext unavailable');

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decodedBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));
    this.audioBuffer = decodedBuffer;
    this.pauseOffset = 0;
    return decodedBuffer.duration;
  }

  public play(offsetSeconds?: number) {
    if (!this.audioBuffer) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (this.isPlaying) {
      this.stopSource();
    }

    if (offsetSeconds !== undefined) {
      this.pauseOffset = Math.max(0, Math.min(offsetSeconds, this.audioBuffer.duration));
    }

    // Build processing graph: Source -> Detune -> Bass -> Treble -> Analyser -> Gain -> Destination
    const src = this.audioCtx.createBufferSource();
    src.buffer = this.audioBuffer;
    src.playbackRate.value = this.currentEffects.playbackRate;
    if (src.detune) {
      src.detune.value = this.currentEffects.pitchSemiTones * 100;
    }

    // Bass Filter (Low Shelf @ 250Hz)
    const bass = this.audioCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 250;
    bass.gain.value = this.currentEffects.bassGain;

    // Treble Filter (High Shelf @ 3500Hz)
    const treble = this.audioCtx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 3500;
    treble.gain.value = this.currentEffects.trebleGain;

    // Gain (Volume)
    const gain = this.audioCtx.createGain();
    gain.gain.value = this.currentEffects.volume;

    // Analyser for real-time waveform visualizer
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Connect standard chain
    src.connect(bass);
    bass.connect(treble);
    treble.connect(gain);
    gain.connect(analyser);
    analyser.connect(this.audioCtx.destination);

    // Reverb Convolver if enabled
    if (this.currentEffects.reverbAmount > 0.05) {
      const convolver = this.audioCtx.createConvolver();
      const impulse = this.createReverbImpulse(1.2, 2.5);
      if (impulse) {
        convolver.buffer = impulse;
        const dryGain = this.audioCtx.createGain();
        const wetGain = this.audioCtx.createGain();
        dryGain.gain.value = 1.0 - this.currentEffects.reverbAmount * 0.5;
        wetGain.gain.value = this.currentEffects.reverbAmount;

        treble.disconnect();
        treble.connect(dryGain);
        dryGain.connect(gain);

        treble.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(gain);
      }
    }

    this.sourceNode = src;
    this.bassFilter = bass;
    this.trebleFilter = treble;
    this.gainNode = gain;
    this.analyserNode = analyser;

    this.startTime = this.audioCtx.currentTime - this.pauseOffset / this.currentEffects.playbackRate;
    src.start(0, this.pauseOffset);
    this.isPlaying = true;

    src.onended = () => {
      if (this.isPlaying) {
        const elapsed = (this.audioCtx!.currentTime - this.startTime) * this.currentEffects.playbackRate;
        if (elapsed >= (this.audioBuffer?.duration || 0) - 0.1) {
          this.isPlaying = false;
          this.pauseOffset = 0;
          if (this.onEndedCallback) this.onEndedCallback();
          this.stopLoop();
        }
      }
    };

    this.startLoop();
  }

  public pause() {
    if (!this.isPlaying || !this.audioCtx) return;
    this.pauseOffset = (this.audioCtx.currentTime - this.startTime) * this.currentEffects.playbackRate;
    if (this.audioBuffer && this.pauseOffset > this.audioBuffer.duration) {
      this.pauseOffset = 0;
    }
    this.stopSource();
    this.isPlaying = false;
    this.stopLoop();
  }

  public stop() {
    this.stopSource();
    this.pauseOffset = 0;
    this.isPlaying = false;
    this.stopLoop();
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.pauseOffset = Math.max(0, Math.min(seconds, this.audioBuffer?.duration || 0));
    if (wasPlaying) {
      this.play();
    } else if (this.onTimeUpdateCallback && this.audioBuffer) {
      this.onTimeUpdateCallback(this.pauseOffset, this.audioBuffer.duration);
    }
  }

  public applyEffects(effects: Partial<AudioEffects>) {
    this.currentEffects = { ...this.currentEffects, ...effects };

    if (this.sourceNode) {
      if (effects.playbackRate !== undefined) {
        this.sourceNode.playbackRate.value = this.currentEffects.playbackRate;
      }
      if (effects.pitchSemiTones !== undefined && this.sourceNode.detune) {
        this.sourceNode.detune.value = this.currentEffects.pitchSemiTones * 100;
      }
    }
    if (this.bassFilter && effects.bassGain !== undefined) {
      this.bassFilter.gain.value = this.currentEffects.bassGain;
    }
    if (this.trebleFilter && effects.trebleGain !== undefined) {
      this.trebleFilter.gain.value = this.currentEffects.trebleGain;
    }
    if (this.gainNode && effects.volume !== undefined) {
      this.gainNode.gain.value = this.currentEffects.volume;
    }
  }

  public getEffects(): AudioEffects {
    return { ...this.currentEffects };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.audioCtx) return this.pauseOffset;
    return (this.audioCtx.currentTime - this.startTime) * this.currentEffects.playbackRate;
  }

  public getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignored if already stopped
      }
      this.sourceNode = null;
    }
  }

  private startLoop() {
    this.stopLoop();
    const update = () => {
      if (this.isPlaying && this.onTimeUpdateCallback && this.audioBuffer) {
        const cur = this.getCurrentTime();
        this.onTimeUpdateCallback(Math.min(cur, this.audioBuffer.duration), this.audioBuffer.duration);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const globalAudioEngine = new WebAudioEngine();
