import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { AtmosphereTheme, THEMES } from '../types/assistant';

interface SassyPromptsProps {
  theme: AtmosphereTheme;
  isConnected: boolean;
}

const HINTS = [
  "Roast my day",
  "Are you flirting with me?",
  "Open Spotify",
  "Change mood to crimson",
  "What is your hottest take?",
  "Open YouTube",
];

export const SassyPrompts: React.FC<SassyPromptsProps> = ({ theme, isConnected }) => {
  const [index, setIndex] = useState(0);
  const themeConfig = THEMES[theme] || THEMES['cyber-cyan'];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HINTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-sm text-[11px] text-neutral-400 font-mono-code transition-all duration-500">
      <Sparkles size={11} style={{ color: themeConfig.primary }} />
      <span className="text-neutral-500">Try saying:</span>
      <span className="text-neutral-300 font-medium tracking-wide">
        "{HINTS[index]}"
      </span>
    </div>
  );
};
