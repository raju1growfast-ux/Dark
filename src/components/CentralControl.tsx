import React from 'react';
import { Mic, MicOff, Square, PhoneOff } from 'lucide-react';
import { AssistantState, AtmosphereTheme, THEMES } from '../types/assistant';

interface CentralControlProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  isMuted: boolean;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const CentralControl: React.FC<CentralControlProps> = ({
  state,
  theme,
  isMuted,
  onToggleConnect,
  onToggleMute,
  onInterrupt,
}) => {
  const themeConfig = THEMES[theme] || THEMES['cyber-cyan'];
  const isConnected = state !== 'disconnected' && state !== 'error';

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 py-2 animate-fade-in">
      {/* Minimal Mute Toggle */}
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${
          isMuted
            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
            : 'bg-neutral-900/70 border-white/10 text-neutral-300 hover:text-white hover:border-white/20'
        }`}
        title={isMuted ? 'Unmute' : 'Mute mic'}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Interrupt Button (When Dark is actively speaking) */}
      {state === 'speaking' && (
        <button
          onClick={onInterrupt}
          aria-label="Interrupt Dark"
          title="Interrupt speech"
          className="px-4 h-11 rounded-full flex items-center gap-2 bg-neutral-900/80 border border-amber-500/50 text-amber-300 hover:bg-amber-500/20 transition-all backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse text-xs font-mono-code"
        >
          <Square size={13} fill="currentColor" />
          <span>PAUSE</span>
        </button>
      )}

      {/* End Session Button */}
      <button
        onClick={onToggleConnect}
        aria-label="Disconnect"
        title="Put Dark to sleep"
        className="w-11 h-11 rounded-full flex items-center justify-center bg-neutral-900/70 border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 transition-all duration-300 backdrop-blur-md"
      >
        <PhoneOff size={17} />
      </button>
    </div>
  );
};
