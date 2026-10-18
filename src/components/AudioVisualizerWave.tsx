import React, { useMemo } from 'react';
import { AssistantState, AtmosphereTheme, THEMES } from '../types/assistant';

interface AudioVisualizerWaveProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  volume: number;
}

export const AudioVisualizerWave: React.FC<AudioVisualizerWaveProps> = ({
  state,
  theme,
  volume,
}) => {
  const themeConfig = THEMES[theme] || THEMES['cyber-cyan'];
  const barCount = 32;

  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
      const curveFactor = Math.max(0.1, 1 - centerDist * 0.9);
      return { id: i, curveFactor };
    });
  }, [barCount]);

  const isActive = state === 'speaking' || state === 'listening';

  if (!isActive && state !== 'connecting') {
    return null;
  }

  return (
    <div className="w-full max-w-xs px-6 flex items-center justify-center gap-1 h-8 animate-fade-in">
      {bars.map((bar) => {
        let heightPercent = 10;
        if (isActive) {
          const pseudoNoise = (Math.sin(bar.id * 1.4 + Date.now() / 250) + 1) / 2;
          const dynamicBoost = volume * 75 * bar.curveFactor * (0.6 + pseudoNoise * 0.4);
          heightPercent = Math.min(100, Math.max(12, dynamicBoost));
        } else if (state === 'connecting') {
          const scan = (Math.sin(bar.id * 0.35 + Date.now() / 200) + 1) / 2;
          heightPercent = 10 + scan * 22;
        }

        return (
          <div
            key={bar.id}
            className="w-[2.5px] rounded-full transition-all duration-75"
            style={{
              height: `${heightPercent}%`,
              backgroundColor: themeConfig.primary,
              boxShadow: `0 0 6px ${themeConfig.glow}`,
              opacity: isActive ? 0.85 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};
