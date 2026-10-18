import { AudioRecorder } from './AudioRecorder';
import { AudioStreamer } from './AudioStreamer';
import { MemoryStore } from './MemoryStore';
import { ChromeOSService } from './ChromeOSService';
import { AssistantState, AtmosphereTheme, ToolCallItem, MemoryItem } from '../types/assistant';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onVolumeChange: (volume: number, source: 'user' | 'assistant') => void;
  onToolCall: (toolCall: ToolCallItem) => void;
  onAtmosphereChange?: (theme: AtmosphereTheme) => void;
  onHapticPulse?: (intensity: 'subtle' | 'medium' | 'explosive') => void;
  onMemoryUpdated?: (memory: MemoryItem) => void;
  onError: (message: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private state: AssistantState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private selectedVoice = 'Puck';
  private pingIntervalId: any = null;
  private reconnectTimeoutId: any = null;
  private isManuallyClosed = false;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): AssistantState {
    return this.state;
  }

  private setState(newState: AssistantState): void {
    if (this.state !== newState) {
      console.log(`[LiveSession] State: ${this.state} -> ${newState}`);
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public async connect(voice = 'Puck'): Promise<void> {
    this.isManuallyClosed = false;
    this.selectedVoice = voice;
    this.setState('connecting');

    try {
      // 1. Initialize AudioStreamer (Web Audio API 24kHz)
      if (!this.audioStreamer) {
        this.audioStreamer = new AudioStreamer({
          onPlaybackStart: () => {
            if (this.state !== 'disconnected' && this.state !== 'connecting') {
              this.setState('speaking');
            }
          },
          onPlaybackEnd: () => {
            if (this.state === 'speaking') {
              this.setState('listening');
            }
          },
          onVolumeChange: (vol) => {
            if (this.state === 'speaking') {
              this.callbacks.onVolumeChange(vol, 'assistant');
            }
          },
        });
      }
      await this.audioStreamer.resume();

      // 2. Initialize AudioRecorder (Mic 16kHz PCM)
      if (!this.audioRecorder) {
        this.audioRecorder = new AudioRecorder({
          onAudioChunk: (base64Chunk) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'audio', data: base64Chunk }));
            }
          },
          onVolumeChange: (vol) => {
            if (this.state === 'listening' || this.state === 'idle') {
              this.callbacks.onVolumeChange(vol, 'user');
            }
          },
          onError: (err) => {
            this.callbacks.onError(err.message);
          },
        });
      }
      await this.audioRecorder.start();

      // 3. Connect WebSocket to /live with initial memories and voice
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const promptMemories = MemoryStore.toPromptStrings();
      const encodedMemories = encodeURIComponent(JSON.stringify(promptMemories));
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(voice)}&memories=${encodedMemories}`;
      console.log(`[LiveSession] Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[LiveSession] WebSocket connection established');
        this.setState('idle');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('[LiveSession] WebSocket error:', err);
        this.callbacks.onError('Connection error to Dark AI live server.');
        this.setState('error');
      };

      this.ws.onclose = (event) => {
        console.log('[LiveSession] WebSocket closed:', event.code, event.reason);
        this.stopPing();
        if (!this.isManuallyClosed) {
          this.setState('disconnected');
        }
      };
    } catch (err: any) {
      console.error('[LiveSession] Error during connect:', err);
      this.setState('error');
      this.callbacks.onError(err?.message || 'Failed to start voice session.');
      this.disconnect();
    }
  }

  private handleServerMessage(dataStr: string): void {
    try {
      const msg = JSON.parse(dataStr);

      switch (msg.type) {
        case 'ready':
          console.log('[LiveSession] Gemini Live is ready with voice:', msg.voice);
          this.setState('listening');
          break;

        case 'audio':
          if (msg.data && this.audioStreamer) {
            this.audioStreamer.addPCM16Chunk(msg.data);
          }
          break;

        case 'interrupted':
          console.log('[LiveSession] Interruption triggered: stopping model playback');
          if (this.audioStreamer) {
            this.audioStreamer.stopAll();
          }
          this.setState('listening');
          break;

        case 'turn_complete':
          console.log('[LiveSession] Turn complete from model');
          if (!this.audioStreamer?.getIsPlaying()) {
            this.setState('listening');
          }
          break;

        case 'tool_call':
          if (msg.functionCalls && Array.isArray(msg.functionCalls)) {
            this.executeToolCalls(msg.functionCalls);
          }
          break;

        case 'error':
          console.error('[LiveSession] Server error message:', msg.message);
          this.callbacks.onError(msg.message || 'Server error occurred');
          break;

        case 'closed':
          console.log('[LiveSession] Session closed by server:', msg.reason);
          this.setState('disconnected');
          break;

        case 'pong':
          // Heartbeat ok
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[LiveSession] Failed to parse server message:', err);
    }
  }

  private executeToolCalls(functionCalls: any[]): void {
    const responses: any[] = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      console.log(`[LiveSession] Executing tool: ${name}`, args);

      const toolItem: ToolCallItem = {
        id: id || `call_${Date.now()}`,
        name,
        args: args || {},
        timestamp: Date.now(),
        status: 'executing',
      };

      let resultOutput: any = { success: true };

      try {
        if (name === 'openWebsite') {
          let url = args?.url || '';
          if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
          }

          // Execute browser action
          let opened = false;
          try {
            const newTab = window.open(url, '_blank', 'noopener,noreferrer');
            opened = Boolean(newTab);
          } catch (e) {
            console.warn('[LiveSession] Browser popup blocked or restricted:', e);
          }

          resultOutput = {
            success: true,
            url,
            title: args?.title || url,
            popupOpened: opened,
            message: opened
              ? `Opened ${args?.title || url} in a new tab.`
              : `Navigating to ${args?.title || url}. Link is ready on the HUD.`
          };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'changeAtmosphere') {
          const theme = args?.theme as AtmosphereTheme;
          if (theme) {
            this.callbacks.onAtmosphereChange?.(theme);
          }
          resultOutput = {
            success: true,
            theme,
            mood: args?.mood || 'Vibe shifted',
            message: `Dark atmosphere shifted to ${theme}.`
          };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'saveMemory') {
          const fact = args?.fact || '';
          const category = args?.category || 'personal';
          const savedItem = MemoryStore.addMemory(fact, category);
          this.callbacks.onMemoryUpdated?.(savedItem);
          resultOutput = {
            success: true,
            fact,
            category,
            message: `Memory '${fact}' permanently saved to memory bank. Dark will remember this forever.`
          };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'forgetMemory') {
          const keyword = args?.keyword || '';
          const removed = MemoryStore.removeByKeyword(keyword);
          resultOutput = {
            success: true,
            keyword,
            message: removed
              ? `Memory matching '${keyword}' was removed.`
              : `No memory found matching '${keyword}'.`
          };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'openApplication') {
          const appName = args?.appName || 'application';
          resultOutput = ChromeOSService.openApplication(appName);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'openLaptopTool') {
          const tool = args?.tool || 'files';
          if (tool === 'files') {
            ChromeOSService.openFileManager();
            resultOutput = { success: true, message: 'ChromeOS Files opened.' };
          } else {
            resultOutput = ChromeOSService.openApplication(tool);
          }
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'adjustVolume') {
          const action = args?.action || 'up';
          const level = typeof args?.level === 'number' ? args.level : undefined;
          resultOutput = ChromeOSService.adjustVolume(action, level);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'adjustBrightness') {
          const action = args?.action || 'up';
          const level = typeof args?.level === 'number' ? args.level : undefined;
          resultOutput = ChromeOSService.adjustBrightness(action, level);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'openSystemSettings') {
          const section = args?.section || 'general';
          resultOutput = ChromeOSService.openSettings(section);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'searchGoogle') {
          const query = args?.query || '';
          resultOutput = ChromeOSService.searchGoogle(query);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'searchYouTube') {
          const query = args?.query || '';
          resultOutput = ChromeOSService.searchYouTube(query);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'controlMusic') {
          const action = args?.action || 'toggle';
          resultOutput = ChromeOSService.controlMusic(action);
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else if (name === 'triggerHapticPulse') {
          const intensity = args?.intensity || 'medium';
          this.callbacks.onHapticPulse?.(intensity);
          resultOutput = {
            success: true,
            intensity,
            message: `Pulse shockwave emitted at ${intensity} intensity.`
          };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        } else {
          resultOutput = { success: true, message: `Tool ${name} executed.` };
          toolItem.status = 'completed';
          toolItem.result = resultOutput;
        }
      } catch (execErr: any) {
        console.error(`[LiveSession] Error executing tool ${name}:`, execErr);
        resultOutput = { success: false, error: execErr?.message || 'Tool execution failed' };
        toolItem.status = 'failed';
        toolItem.result = resultOutput;
      }

      this.callbacks.onToolCall(toolItem);

      responses.push({
        id,
        name,
        response: {
          output: resultOutput,
        },
      });
    }

    // Instantly send toolResponse back to Gemini Live
    if (responses.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[LiveSession] Sending tool responses back immediately:', responses);
      this.ws.send(JSON.stringify({
        type: 'tool_response',
        functionResponses: responses,
      }));
    }
  }

  public changeVoice(voice: string): void {
    this.selectedVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'change_voice',
        voice,
      }));
    }
  }

  public setMute(muted: boolean): void {
    if (this.audioRecorder) {
      this.audioRecorder.setMute(muted);
    }
  }

  public getMuted(): boolean {
    return this.audioRecorder?.getMuted() ?? false;
  }

  public disconnect(): void {
    this.isManuallyClosed = true;
    this.stopPing();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.audioRecorder) {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }

    if (this.audioStreamer) {
      this.audioStreamer.destroy();
      this.audioStreamer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setState('disconnected');
    this.callbacks.onVolumeChange(0, 'user');
    this.callbacks.onVolumeChange(0, 'assistant');
  }

  private startPing(): void {
    this.stopPing();
    this.pingIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  }

  private stopPing(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }
}
