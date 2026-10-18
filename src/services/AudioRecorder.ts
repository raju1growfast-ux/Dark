/**
 * AudioRecorder captures microphone input and streams 16kHz PCM16 mono audio
 * suitable for Gemini Live API's real-time input.
 */

export interface AudioRecorderOptions {
  onAudioChunk: (base64Chunk: string) => void;
  onVolumeChange?: (rmsVolume: number) => void;
  onError?: (error: Error) => void;
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isRecording = false;
  private isMuted = false;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions) {
    this.options = options;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      // Request mic stream with AEC, AGC, and noise suppression
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Target sample rate: 16000 Hz for Gemini Live API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      // Resume context if suspended (browser auto-play policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessor buffer size: 2048 samples (~128ms chunks at 16kHz)
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // 1. Calculate RMS volume for UI waveform
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        const normalizedVolume = Math.min(1, rms * 5); // Boost scale for responsive visualizer
        this.options.onVolumeChange?.(normalizedVolume);

        // 2. Convert Float32Array to 16-bit PCM little-endian
        const pcm16 = this.floatTo16BitPCM(inputData);

        // 3. Convert ArrayBuffer to Base64
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        // 4. Send chunk
        this.options.onAudioChunk(base64);
      };

      this.sourceNode.connect(this.processorNode);
      // ScriptProcessor requires connection to destination to trigger process in some browsers
      this.processorNode.connect(this.audioContext.destination);

      this.isRecording = true;
    } catch (err: any) {
      this.stop();
      const friendlyError = new Error(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access to talk to Dark.'
          : `Failed to access microphone: ${err.message || 'Unknown error'}`
      );
      this.options.onError?.(friendlyError);
      throw friendlyError;
    }
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.options.onVolumeChange?.(0);
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      this.options.onVolumeChange?.(0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      // Convert float [-1.0, 1.0] to 16-bit signed integer [-32768, 32767]
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
