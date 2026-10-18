/**
 * AudioStreamer receives raw 24kHz PCM16 audio chunks from Gemini Live API
 * and plays them sequentially through Web Audio API with zero-gap scheduling
 * and instant interruption cutoff.
 */

export interface AudioStreamerOptions {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onVolumeChange?: (rmsVolume: number) => void;
}

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextScheduledTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private options: AudioStreamerOptions;
  private animationFrameId: number | null = null;
  private endTimeoutId: any = null;

  constructor(options: AudioStreamerOptions = {}) {
    this.options = options;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Output sample rate for Gemini Live is 24000 Hz
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

      this.startAnalyserLoop();
    }
    return this.audioContext;
  }

  public async resume(): Promise<void> {
    const ctx = this.initAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Add a raw PCM16 chunk (base64 string) from Gemini
   */
  public addPCM16Chunk(base64Chunk: string): void {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 1. Decode base64 to binary Uint8Array
      const binaryString = window.atob(base64Chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Convert 16-bit PCM (little-endian) to Float32 [-1.0, 1.0]
      const int16Samples = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Samples.length);
      for (let i = 0; i < int16Samples.length; i++) {
        float32Data[i] = int16Samples[i] / 32768.0;
      }

      // 3. Create AudioBuffer (mono, 24000Hz)
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);

      // 4. Create BufferSourceNode
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!);

      // 5. Schedule playback
      const currentTime = ctx.currentTime;
      // Ensure smooth continuous playback schedule with minimal latency
      const startTime = Math.max(currentTime, this.nextScheduledTime);
      source.start(startTime);

      this.nextScheduledTime = startTime + audioBuffer.duration;
      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.options.onPlaybackStart?.();
      }

      // When the chunk finishes, clean up reference
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        this.checkPlaybackFinished();
      };

      // Reset any pending end timeout
      if (this.endTimeoutId) {
        clearTimeout(this.endTimeoutId);
      }
      // Set end timeout based on scheduled duration
      const delayMs = Math.max(0, (this.nextScheduledTime - currentTime) * 1000 + 100);
      this.endTimeoutId = setTimeout(() => {
        this.checkPlaybackFinished();
      }, delayMs);
    } catch (err) {
      console.error('[AudioStreamer] Error decoding and scheduling chunk:', err);
    }
  }

  /**
   * Immediately stops all audio output and clears the playback queue (Interruption)
   */
  public stopAll(): void {
    if (this.endTimeoutId) {
      clearTimeout(this.endTimeoutId);
      this.endTimeoutId = null;
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources = [];

    if (this.audioContext) {
      this.nextScheduledTime = this.audioContext.currentTime;
    } else {
      this.nextScheduledTime = 0;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.options.onPlaybackEnd?.();
    }
    this.options.onVolumeChange?.(0);
  }

  private checkPlaybackFinished(): void {
    if (this.activeSources.length === 0 && this.isPlaying) {
      if (this.audioContext && this.audioContext.currentTime >= this.nextScheduledTime - 0.05) {
        this.isPlaying = false;
        this.options.onPlaybackEnd?.();
        this.options.onVolumeChange?.(0);
      }
    }
  }

  private startAnalyserLoop(): void {
    if (this.animationFrameId !== null) return;

    const dataArray = new Uint8Array(this.analyserNode ? this.analyserNode.frequencyBinCount : 128);

    const update = () => {
      if (this.analyserNode && this.isPlaying) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        this.options.onVolumeChange?.(normalized);
      } else if (!this.isPlaying) {
        this.options.onVolumeChange?.(0);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  public getAnalyserData(frequencyArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(frequencyArray as any);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public destroy(): void {
    this.stopAll();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
