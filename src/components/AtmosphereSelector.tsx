import React from 'react';
import { AtmosphereTheme, THEMES } from '../types/assistant';

interface AtmosphereSelectorProps {
  currentTheme: AtmosphereTheme;
  onSelectTheme: (theme: AtmosphereTheme) => void;
}

export const AtmosphereSelector: React.FC<AtmosphereSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const themeKeys = Object.keys(THEMES) as AtmosphereTheme[];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-neutral-800/80 backdrop-blur-md">
      {themeKeys.map((key) => {
        const theme = THEMES[key];
        const isSelected = currentTheme === key;

        return (
          <button
            key={key}
            onClick={() => onSelectTheme(key)}
            title={`Atmosphere: ${theme.name}`}
            aria-label={`Switch atmosphere to ${theme.name}`}
            className={`relative w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
              isSelected ? 'scale-115 ring-2 ring-white/60' : 'hover:scale-105 opacity-60 hover:opacity-100'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full block shadow-sm"
              style={{
                backgroundColor: theme.primary,
                boxShadow: isSelected ? `0 0 10px ${theme.primary}` : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
