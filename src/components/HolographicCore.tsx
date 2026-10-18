import React, { useEffect, useRef } from 'react';
import { AssistantState, AtmosphereTheme, THEMES } from '../types/assistant';

interface HolographicCoreProps {
  state: AssistantState;
  theme: AtmosphereTheme;
  userVolume: number;
  assistantVolume: number;
  hapticPulseLevel: 'subtle' | 'medium' | 'explosive' | null;
  onToggleConnect: () => void;
}

export const HolographicCore: React.FC<HolographicCoreProps> = ({
  state,
  theme,
  userVolume,
  assistantVolume,
  hapticPulseLevel,
  onToggleConnect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeConfig = THEMES[theme] || THEMES['cyber-cyan'];
  const isConnected = state !== 'disconnected' && state !== 'error';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    let breathPhase = 0;

    // High-DPI crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const size = 360;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const primary = themeConfig.primary;
      const secondary = themeConfig.secondary;

      phase += 0.035;
      breathPhase += 0.018;

      const activeVol =
        state === 'speaking'
          ? assistantVolume
          : state === 'listening'
          ? userVolume
          : 0;

      // Base radius with gentle calm breathing
      const breath = Math.sin(breathPhase) * 4;
      const baseRadius = 88 + breath;

      // 1. Soft Ambient Luminous Aura (Multi-layer gradient)
      const auraRadius = baseRadius + 45 + activeVol * 30;
      const auraGradient = ctx.createRadialGradient(
        cx,
        cy,
        20,
        cx,
        cy,
        auraRadius
      );

      if (state === 'speaking') {
        auraGradient.addColorStop(0, `${primary}80`);
        auraGradient.addColorStop(0.4, `${secondary}35`);
        auraGradient.addColorStop(0.8, `${primary}10`);
        auraGradient.addColorStop(1, 'transparent');
      } else if (state === 'listening') {
        auraGradient.addColorStop(0, `${primary}55`);
        auraGradient.addColorStop(0.5, `${primary}20`);
        auraGradient.addColorStop(1, 'transparent');
      } else if (state === 'connecting') {
        const connGlow = (Math.sin(phase * 2) + 1) / 2;
        auraGradient.addColorStop(0, `${primary}${Math.floor(40 + connGlow * 30).toString(16)}`);
        auraGradient.addColorStop(0.7, 'transparent');
      } else {
        // Disconnected / Idle dormant aura
        auraGradient.addColorStop(0, `${primary}18`);
        auraGradient.addColorStop(0.8, 'transparent');
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Aesthetic Fluid Harmonic Waveform (When Speaking or Listening)
      if (state === 'speaking' || state === 'listening') {
        const points = 90;
        const waveAmp = state === 'speaking' ? 14 + activeVol * 28 : 6 + activeVol * 16;
        const waveSpeed = state === 'speaking' ? phase * 1.4 : phase * 0.8;

        // Draw multiple smooth layered harmonic ribbons for silk aesthetic
        for (let layer = 2; layer >= 0; layer--) {
          const layerOffset = layer * 0.35;
          const layerRadius = baseRadius - layer * 4;

          ctx.beginPath();
          for (let i = 0; i <= points; i++) {
            const theta = (i / points) * Math.PI * 2;
            // Smooth harmonic Fourier wave formula (organic, aesthetic, no harsh spikes)
            const harm1 = Math.sin(theta * 3 + waveSpeed + layerOffset);
            const harm2 = Math.cos(theta * 2 - waveSpeed * 0.7);
            const harm3 = Math.sin(theta * 5 + waveSpeed * 1.2) * 0.3;
            const r = layerRadius + (harm1 * harm2 + harm3) * waveAmp;

            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();

          if (layer === 0) {
            // Main glowing fluid stroke
            ctx.strokeStyle = primary;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = primary;
            ctx.shadowBlur = state === 'speaking' ? 24 : 14;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Soft translucent harmonic underlay
            ctx.strokeStyle = `${primary}${layer === 1 ? '55' : '25'}`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      } else if (state === 'connecting') {
        // Aesthetic rotating halo when connecting
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(phase);
        ctx.strokeStyle = `${primary}88`;
        ctx.lineWidth = 2;
        ctx.setLineDash([30, 20]);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Disconnected / Idle: Smooth elegant outer circle with soft breathing pulse
        ctx.save();
        ctx.strokeStyle = `${primary}40`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Central Glassy Dark Orb (The Core Vessel)
      const coreRadius = baseRadius - (state === 'speaking' ? 4 : 2);
      const coreGradient = ctx.createRadialGradient(
        cx - 20,
        cy - 20,
        10,
        cx,
        cy,
        coreRadius
      );

      if (state === 'speaking') {
        coreGradient.addColorStop(0, '#1a1f2c');
        coreGradient.addColorStop(0.6, '#0b0d14');
        coreGradient.addColorStop(1, '#06070a');
      } else if (state === 'listening') {
        coreGradient.addColorStop(0, '#151924');
        coreGradient.addColorStop(0.7, '#080a0f');
        coreGradient.addColorStop(1, '#040507');
      } else {
        coreGradient.addColorStop(0, '#13151c');
        coreGradient.addColorStop(0.8, '#08090d');
        coreGradient.addColorStop(1, '#040406');
      }

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Delicate inner rim highlight
      ctx.strokeStyle = isConnected ? `${primary}70` : `${primary}25`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius - 1, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, themeConfig, userVolume, assistantVolume, isConnected]);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Shockwave Rings on Haptic Pulse */}
      {hapticPulseLevel && (
        <div
          className={`absolute rounded-full pointer-events-none animate-ripple border ${
            hapticPulseLevel === 'explosive'
              ? 'border-red-400 border-2 w-96 h-96'
              : 'border-cyan-400 border w-80 h-80'
          }`}
          style={{ borderColor: themeConfig.primary }}
        />
      )}

      {/* State-based Ambient Backlight Bloom */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          state === 'speaking'
            ? 'opacity-70 scale-125'
            : state === 'listening'
            ? 'opacity-50 scale-110'
            : state === 'connecting'
            ? 'opacity-35 animate-pulse'
            : 'opacity-20 scale-95'
        }`}
        style={{
          backgroundColor: themeConfig.primary,
          boxShadow: `0 0 100px ${themeConfig.glow}`,
        }}
      />

      {/* Interactive Main Core Button - Direct Tap Trigger */}
      <button
        onClick={onToggleConnect}
        aria-label={isConnected ? 'Tap Dark to disconnect' : 'Tap Dark to activate'}
        className="relative group focus:outline-none cursor-pointer flex items-center justify-center transform active:scale-95 transition-transform duration-200"
        style={{ width: 340, height: 340 }}
      >
        {/* Canvas Fluid Aesthetic Waveform */}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          className="relative z-10 block pointer-events-none"
        />

        {/* Central Logo / Monogram Glyphs */}
        <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 group-hover:scale-105">
          {/* Aesthetic Logo Symbol: Stylized Minimalist Diamond 'D' */}
          <div className="relative flex items-center justify-center">
            {/* Soft inner glow behind logo */}
            <div
              className={`absolute w-16 h-16 rounded-full blur-md transition-opacity duration-500 ${
                isConnected ? 'opacity-80' : 'opacity-25'
              }`}
              style={{ backgroundColor: themeConfig.primary }}
            />

            {/* SVG Minimalist Aesthetic 'Dark' Logo Icon */}
            <svg
              className="w-16 h-16 sm:w-18 sm:h-18 relative z-10 transition-all duration-300"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: isConnected
                  ? `drop-shadow(0 0 12px ${themeConfig.primary})`
                  : 'drop-shadow(0 0 4px rgba(255,255,255,0.15))',
              }}
            >
              {/* Outer faceted geometric diamond crest */}
              <polygon
                points="32,6 56,32 32,58 8,32"
                stroke={isConnected ? themeConfig.primary : '#64748b'}
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill={isConnected ? `${themeConfig.primary}12` : 'rgba(255,255,255,0.02)'}
                className="transition-colors duration-500"
              />

              {/* Inner stylized modern 'D' monogram */}
              <path
                d="M24 20H33C39.6 20 44 24.8 44 32C44 39.2 39.6 44 33 44H24V20Z"
                stroke={isConnected ? '#ffffff' : '#94a3b8'}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <line
                x1="24"
                y1="20"
                x2="24"
                y2="44"
                stroke={isConnected ? themeConfig.primary : '#64748b'}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Minimal Aesthetic Status Ring / Subtle Label */}
          <div className="mt-3 flex items-center gap-1.5 transition-opacity duration-300">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                state === 'speaking'
                  ? 'animate-ping'
                  : state === 'listening'
                  ? 'animate-pulse'
                  : state === 'connecting'
                  ? 'animate-bounce'
                  : ''
              }`}
              style={{
                backgroundColor: isConnected ? themeConfig.primary : '#64748b',
              }}
            />
            <span
              className="text-[11px] font-mono-code tracking-widest uppercase transition-colors duration-300"
              style={{
                color: isConnected ? themeConfig.primary : '#94a3b8',
              }}
            >
              {state === 'disconnected'
                ? 'TAP TO WAKE'
                : state === 'connecting'
                ? 'CONNECTING'
                : state === 'speaking'
                ? 'DARK'
                : state === 'listening'
                ? 'LISTENING'
                : 'READY'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};
