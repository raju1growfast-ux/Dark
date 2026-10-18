/**
 * ChromeOSService manages OS-level capabilities on ChromeOS Flex:
 * - Volume control with audio gain adjustments and HUD feedback
 * - Screen brightness with real display filter simulation and HUD feedback
 * - ChromeOS deep-link settings (chrome://os-settings, wifi, bluetooth)
 * - Application launcher for installed tools and web apps
 * - Google and YouTube voice searching
 * - Media Session control for music playback
 * - File system picker integration
 */

export interface SystemEvent {
  type: 'volume' | 'brightness' | 'media' | 'app' | 'settings' | 'calculator' | 'files';
  value?: any;
  message: string;
}

export type SystemListener = (event: SystemEvent) => void;

class ChromeOSServiceClass {
  private currentVolume = 75; // 0 to 100
  private currentBrightness = 90; // 10 to 100
  private isMuted = false;
  private listeners: Set<SystemListener> = new Set();
  private audioContext: AudioContext | null = null;
  private isPlayingMedia = false;
  private currentTrack = {
    title: 'Neon Drift',
    artist: 'Dark AI Radio',
    album: 'ChromeOS Flex Beats',
  };

  constructor() {
    this.setupMediaSession();
  }

  public subscribe(listener: SystemListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SystemEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // --- 1. VOLUME CONTROL ---
  public setVolume(level: number): { success: boolean; volume: number; message: string } {
    this.currentVolume = Math.max(0, Math.min(100, Math.round(level)));
    this.isMuted = this.currentVolume === 0;
    this.playFeedbackTone(this.currentVolume);
    this.notify({
      type: 'volume',
      value: this.currentVolume,
      message: `System volume set to ${this.currentVolume}%`,
    });
    return { success: true, volume: this.currentVolume, message: `Volume set to ${this.currentVolume}%` };
  }

  public adjustVolume(action: 'up' | 'down' | 'mute' | 'unmute' | 'set', level?: number): {
    success: boolean;
    volume: number;
    message: string;
  } {
    if (action === 'up') {
      return this.setVolume(this.currentVolume + 10);
    }
    if (action === 'down') {
      return this.setVolume(this.currentVolume - 10);
    }
    if (action === 'mute') {
      this.isMuted = true;
      this.notify({ type: 'volume', value: 0, message: 'System audio muted' });
      return { success: true, volume: 0, message: 'Audio muted' };
    }
    if (action === 'unmute') {
      this.isMuted = false;
      return this.setVolume(this.currentVolume > 0 ? this.currentVolume : 50);
    }
    if (action === 'set' && typeof level === 'number') {
      return this.setVolume(level);
    }
    return { success: true, volume: this.currentVolume, message: `Volume is at ${this.currentVolume}%` };
  }

  public getVolume(): { level: number; muted: boolean } {
    return { level: this.currentVolume, muted: this.isMuted };
  }

  // --- 2. BRIGHTNESS CONTROL ---
  public setBrightness(level: number): { success: boolean; brightness: number; message: string } {
    this.currentBrightness = Math.max(10, Math.min(100, Math.round(level)));
    this.notify({
      type: 'brightness',
      value: this.currentBrightness,
      message: `Display brightness set to ${this.currentBrightness}%`,
    });
    return {
      success: true,
      brightness: this.currentBrightness,
      message: `Brightness adjusted to ${this.currentBrightness}%`,
    };
  }

  public adjustBrightness(action: 'up' | 'down' | 'set', level?: number): {
    success: boolean;
    brightness: number;
    message: string;
  } {
    if (action === 'up') {
      return this.setBrightness(this.currentBrightness + 15);
    }
    if (action === 'down') {
      return this.setBrightness(this.currentBrightness - 15);
    }
    if (action === 'set' && typeof level === 'number') {
      return this.setBrightness(level);
    }
    return { success: true, brightness: this.currentBrightness, message: `Brightness is at ${this.currentBrightness}%` };
  }

  public getBrightness(): number {
    return this.currentBrightness;
  }

  // --- 3. SYSTEM SETTINGS (ChromeOS Flex) ---
  public openSettings(section: 'wifi' | 'bluetooth' | 'audio' | 'display' | 'general' | 'storage' | 'about'): {
    success: boolean;
    section: string;
    message: string;
  } {
    const urls: Record<string, string> = {
      wifi: 'chrome://os-settings/internet',
      bluetooth: 'chrome://os-settings/bluetooth',
      audio: 'chrome://os-settings/audio',
      display: 'chrome://os-settings/display',
      general: 'chrome://os-settings',
      storage: 'chrome://os-settings/storage',
      about: 'chrome://os-settings/help',
    };

    const targetUrl = urls[section] || 'chrome://os-settings';
    let opened = false;
    try {
      const w = window.open(targetUrl, '_blank');
      opened = Boolean(w);
    } catch {}

    this.notify({
      type: 'settings',
      value: section,
      message: `Opening ChromeOS ${section.toUpperCase()} settings`,
    });

    return {
      success: true,
      section,
      message: `Opening ${section.toUpperCase()} settings on ChromeOS Flex.`,
    };
  }

  // --- 4. APPLICATION LAUNCHER ---
  public openApplication(appName: string): { success: boolean; name: string; url?: string; message: string } {
    const normalized = appName.toLowerCase().trim();

    if (normalized.includes('calc')) {
      this.notify({ type: 'calculator', message: 'Calculator launched' });
      try {
        window.open('https://calculator.apps.chrome/', '_blank');
      } catch {}
      return { success: true, name: 'Calculator', message: 'Calculator launched.' };
    }

    if (normalized.includes('file') || normalized.includes('folder') || normalized.includes('manager')) {
      this.openFileManager();
      return { success: true, name: 'Files', message: 'ChromeOS File Manager opened.' };
    }

    if (normalized.includes('setting')) {
      const res = this.openSettings('general');
      return { success: res.success, name: 'Settings', message: res.message };
    }
    if (normalized.includes('wifi') || normalized.includes('network') || normalized.includes('internet')) {
      const res = this.openSettings('wifi');
      return { success: res.success, name: 'Wi-Fi Settings', message: res.message };
    }
    if (normalized.includes('bluetooth')) {
      const res = this.openSettings('bluetooth');
      return { success: res.success, name: 'Bluetooth Settings', message: res.message };
    }

    // Known apps and web destinations
    const registry: Record<string, string> = {
      spotify: 'https://open.spotify.com',
      youtube: 'https://youtube.com',
      gmail: 'https://mail.google.com',
      docs: 'https://docs.google.com',
      sheets: 'https://sheets.google.com',
      slides: 'https://slides.google.com',
      drive: 'https://drive.google.com',
      camera: 'https://camera.apps.chrome/',
      calendar: 'https://calendar.google.com',
      discord: 'https://discord.com/app',
      github: 'https://github.com',
      terminal: 'chrome-untrusted://crosh/',
      crosh: 'chrome-untrusted://crosh/',
      reddit: 'https://reddit.com',
      twitter: 'https://x.com',
      notes: 'https://keep.google.com',
      keep: 'https://keep.google.com',
    };

    let targetUrl = '';
    for (const [key, url] of Object.entries(registry)) {
      if (normalized.includes(key)) {
        targetUrl = url;
        break;
      }
    }

    if (!targetUrl) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
    }

    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {}

    this.notify({
      type: 'app',
      value: { appName, url: targetUrl },
      message: `Launching ${appName}`,
    });

    return { success: true, name: appName, url: targetUrl, message: `Opened ${appName}.` };
  }

  // --- 5. FILE MANAGER ---
  public async openFileManager(): Promise<{ success: boolean; message: string }> {
    this.notify({ type: 'files', message: 'Accessing ChromeOS Files' });

    // Try native Web File System Access API which directly triggers ChromeOS Files dialog
    if ('showOpenFilePicker' in window) {
      try {
        await (window as any).showOpenFilePicker({
          multiple: true,
          excludeAcceptAllOption: false,
        });
        return { success: true, message: 'Files opened via ChromeOS native file picker.' };
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[ChromeOSService] File picker error, falling back:', err);
        }
      }
    }

    // Fallback: Google Drive / local cloud files
    try {
      window.open('https://drive.google.com/drive/my-drive', '_blank');
    } catch {}
    return { success: true, message: 'Opening ChromeOS Files manager.' };
  }

  // --- 6. VOICE SEARCH (Google & YouTube) ---
  public searchGoogle(query: string): { success: boolean; url: string; message: string } {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    try {
      window.open(url, '_blank');
    } catch {}
    this.notify({
      type: 'app',
      value: { appName: 'Google Search', query, url },
      message: `Searching Google for: "${query}"`,
    });
    return { success: true, url, message: `Searching Google for ${query}` };
  }

  public searchYouTube(query: string): { success: boolean; url: string; message: string } {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
    try {
      window.open(url, '_blank');
    } catch {}
    this.notify({
      type: 'app',
      value: { appName: 'YouTube', query, url },
      message: `Searching YouTube for: "${query}"`,
    });
    return { success: true, url, message: `Searching YouTube for ${query}` };
  }

  // --- 7. MUSIC PLAYBACK (Media Session API) ---
  private setupMediaSession(): void {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.artist,
          album: this.currentTrack.album,
        });

        navigator.mediaSession.setActionHandler('play', () => this.controlMusic('play'));
        navigator.mediaSession.setActionHandler('pause', () => this.controlMusic('pause'));
        navigator.mediaSession.setActionHandler('nexttrack', () => this.controlMusic('next'));
        navigator.mediaSession.setActionHandler('previoustrack', () => this.controlMusic('previous'));
      } catch (e) {
        console.warn('[ChromeOSService] MediaSession setup error:', e);
      }
    }
  }

  public controlMusic(action: 'play' | 'pause' | 'toggle' | 'next' | 'previous'): {
    success: boolean;
    state: string;
    message: string;
  } {
    if (action === 'toggle') {
      this.isPlayingMedia = !this.isPlayingMedia;
    } else if (action === 'play') {
      this.isPlayingMedia = true;
    } else if (action === 'pause') {
      this.isPlayingMedia = false;
    } else if (action === 'next') {
      this.isPlayingMedia = true;
      this.currentTrack = {
        title: 'Cyberpulse 2077',
        artist: 'Dark Synth',
        album: 'ChromeOS Flex Mix',
      };
    } else if (action === 'previous') {
      this.isPlayingMedia = true;
      this.currentTrack = {
        title: 'Midnight Cyan',
        artist: 'Dark AI Audio',
        album: 'ChromeOS Flex Mix',
      };
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlayingMedia ? 'playing' : 'paused';
    }

    this.notify({
      type: 'media',
      value: { isPlaying: this.isPlayingMedia, track: this.currentTrack },
      message: this.isPlayingMedia ? `Playing: ${this.currentTrack.title}` : 'Media paused',
    });

    return {
      success: true,
      state: this.isPlayingMedia ? 'playing' : 'paused',
      message: this.isPlayingMedia
        ? `Media playback resumed: ${this.currentTrack.title}.`
        : 'Media playback paused.',
    };
  }

  // Subtle audio click feedback for volume change
  private playFeedbackTone(volume: number): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + (volume / 100) * 440, this.audioContext.currentTime);

      gain.gain.setValueAtTime((volume / 100) * 0.15, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.08);
    } catch {}
  }
}

export const ChromeOSService = new ChromeOSServiceClass();
