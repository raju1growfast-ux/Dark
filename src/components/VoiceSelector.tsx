import React from 'react';
import { VoiceOption } from '../types/assistant';
import { Mic, Volume2 } from 'lucide-react';

interface VoiceSelectorProps {
  currentVoice: string;
  onSelectVoice: (voiceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_VOICES: VoiceOption[] = [
  { id: 'Puck', name: 'Puck (Recommended)', style: 'Young, witty, sassy & energetic male persona' },
  { id: 'Charon', name: 'Charon', style: 'Deep, confident, smooth & magnetic tone' },
  { id: 'Fenrir', name: 'Fenrir', style: 'Dark, edgy, velvet baritone' },
  { id: 'Zephyr', name: 'Zephyr', style: 'Crisp, punchy, articulate & modern' },
  { id: 'Aoede', name: 'Aoede', style: 'Melodic, playful & sophisticated' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  onSelectVoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-2xl p-5 text-neutral-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-sm tracking-wide">Dark AI Voice Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-neutral-400">
          Dark uses Google Gemini Live native speech synthesis. Select a persona profile:
        </p>

        <div className="flex flex-col gap-2">
          {AVAILABLE_VOICES.map((v) => {
            const isSelected = currentVoice === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  onSelectVoice(v.id);
                  onClose();
                }}
                className={`flex flex-col p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-medium ${isSelected ? 'text-cyan-300' : 'text-neutral-200'}`}>
                    {v.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-mono-code bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 mt-1">{v.style}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
