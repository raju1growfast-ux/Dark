import React from 'react';
import { AssistantState } from '../types/assistant';

interface CyanCapsuleCoreProps {
  state: AssistantState;
  userVolume: number;
  assistantVolume: number;
  onToggleConnect: () => void;
}

export const CyanCapsuleCore: React.FC<CyanCapsuleCoreProps> = ({
  state,
  userVolume,
  assistantVolume,
  onToggleConnect,
}) => {
  const isConnected = state !== 'disconnected' && state !== 'error';
  const activeVol = state === 'speaking' ? assistantVolume : state === 'listening' ? userVolume : 0;

  // Dynamic scale and glow driven by real-time voice volume
  const dynamicScale = 1 + activeVol * 0.08;
  const glowIntensity = isConnected
    ? state === 'speaking'
      ? 0.75 + activeVol * 0.4
      : state === 'listening'
      ? 0.55 + activeVol * 0.3
      : 0.45
    : 0.25;

  return (
    <div className="relative w-full max-w-4xl h-[440px] sm:h-[500px] flex items-center justify-center select-none overflow-visible">
      {/* 1. Large Ambient Cyan Nebula Glow (Centered) */}
      <div
        className="pointer-events-none absolute w-[420px] sm:w-[540px] h-[360px] sm:h-[420px] rounded-full blur-[110px] transition-all duration-700"
        style={{
          background: isConnected
            ? 'radial-gradient(circle, rgba(0, 240, 255, 0.38) 0%, rgba(0, 160, 230, 0.22) 45%, rgba(0, 80, 150, 0.05) 75%, transparent 100%)'
            : 'radial-gradient(circle, rgba(0, 240, 255, 0.20) 0%, rgba(0, 140, 200, 0.10) 50%, transparent 80%)',
          transform: `scale(${dynamicScale})`,
          opacity: glowIntensity,
        }}
      />

      {/* 2. Tilted Dotted Orbital Capsule Tracks (Exact match to Zoya layout) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
        {/* Track 1: Tilted -35 deg */}
        <div
          className={`absolute w-[360px] sm:w-[460px] h-[190px] sm:h-[220px] rounded-full border border-dashed border-cyan-400/35 transition-transform duration-1000 ${
            isConnected ? 'animate-spin-slow' : 'opacity-40'
          }`}
          style={{
            transform: `rotate(-35deg) scale(${1 + activeVol * 0.05})`,
            boxShadow: isConnected ? '0 0 25px rgba(0, 240, 255, 0.08)' : 'none',
            borderWidth: '1.5px',
          }}
        />

        {/* Track 2: Tilted +35 deg (Counter-rotating) */}
        <div
          className={`absolute w-[390px] sm:w-[500px] h-[210px] sm:h-[240px] rounded-full border border-dashed border-cyan-300/40 transition-transform duration-1000 ${
            isConnected ? 'animate-spin-reverse' : 'opacity-35'
          }`}
          style={{
            transform: `rotate(35deg) scale(${1 + activeVol * 0.07})`,
            boxShadow: isConnected ? '0 0 30px rgba(0, 240, 255, 0.10)' : 'none',
            borderWidth: '1.5px',
          }}
        />

        {/* Track 3: Wider elliptical orbit Tilted +70 deg */}
        <div
          className={`absolute w-[440px] sm:w-[560px] h-[230px] sm:h-[270px] rounded-full border border-dotted border-cyan-400/25 transition-transform duration-1000 ${
            isConnected ? 'animate-spin-slow' : 'opacity-25'
          }`}
          style={{
            transform: `rotate(70deg) scale(${1 + activeVol * 0.04})`,
            borderWidth: '1.5px',
          }}
        />
      </div>

      {/* 3. Central Glassmorphism Pill Button: "D A R K" */}
      <button
        onClick={onToggleConnect}
        aria-label={isConnected ? 'Disconnect session' : 'Connect with Dark'}
        className="group relative z-20 flex items-center justify-center focus:outline-none cursor-pointer transition-all duration-300 active:scale-95"
        style={{
          transform: `scale(${dynamicScale})`,
        }}
      >
        {/* Soft Outer Neon Bloom behind pill */}
        <div
          className="absolute -inset-1.5 rounded-full blur-xl transition-all duration-500 opacity-60 group-hover:opacity-90"
          style={{
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.6), rgba(0, 180, 255, 0.4), rgba(0, 240, 255, 0.6))',
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.5)',
          }}
        />

        {/* The Capsule Container */}
        <div
          className="relative w-64 sm:w-80 md:w-96 h-24 sm:h-28 md:h-32 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: isConnected
              ? 'radial-gradient(ellipse at center, rgba(10, 35, 60, 0.75) 0%, rgba(4, 18, 36, 0.85) 60%, rgba(2, 10, 22, 0.95) 100%)'
              : 'radial-gradient(ellipse at center, rgba(12, 28, 48, 0.65) 0%, rgba(5, 14, 28, 0.80) 70%, rgba(3, 8, 16, 0.92) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(0, 240, 255, 0.55)',
            boxShadow: isConnected
              ? '0 0 35px rgba(0, 240, 255, 0.35), inset 0 0 25px rgba(0, 240, 255, 0.18)'
              : '0 0 20px rgba(0, 240, 255, 0.15), inset 0 0 15px rgba(0, 240, 255, 0.08)',
          }}
        >
          {/* Subtle interior glow ring */}
          <div className="absolute inset-1 rounded-full border border-cyan-400/20 pointer-events-none" />

          {/* Centered Typography: D A R K */}
          <div className="relative z-10 flex items-center justify-center">
            <span
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.45em] text-white select-none transition-all duration-300 font-sans"
              style={{
                textShadow: isConnected
                  ? '0 0 16px rgba(0, 240, 255, 0.75), 0 0 30px rgba(0, 240, 255, 0.45)'
                  : '0 0 8px rgba(0, 240, 255, 0.3)',
              }}
            >
              D&nbsp;A&nbsp;R&nbsp;K
            </span>
          </div>

          {/* Connecting spinner inside pill if syncing */}
          {state === 'connecting' && (
            <div className="absolute bottom-2 flex items-center gap-1.5 font-mono-code text-[10px] text-cyan-300 tracking-widest uppercase animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>SYNCING...</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
