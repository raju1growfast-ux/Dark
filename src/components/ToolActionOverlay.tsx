import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Zap,
  Brain,
  X,
  Volume2,
  Sun,
  Search,
  Music,
  Laptop,
  Settings,
  Calculator,
  FolderOpen,
} from 'lucide-react';
import { ToolCallItem, AtmosphereTheme, THEMES } from '../types/assistant';

interface ToolActionOverlayProps {
  toolCall: ToolCallItem | null;
  theme: AtmosphereTheme;
  onDismiss: () => void;
}

export const ToolActionOverlay: React.FC<ToolActionOverlayProps> = ({
  toolCall,
  theme,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const themeConfig = THEMES[theme] || THEMES['cyber-cyan'];

  useEffect(() => {
    if (toolCall) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toolCall, onDismiss]);

  if (!toolCall || !visible) return null;

  const { name, args, result } = toolCall;
  const isWebsite = name === 'openWebsite';
  const isApp = name === 'openApplication';
  const isTool = name === 'openLaptopTool';
  const isVolume = name === 'adjustVolume';
  const isBrightness = name === 'adjustBrightness';
  const isSettings = name === 'openSystemSettings';
  const isSearchGoogle = name === 'searchGoogle';
  const isSearchYouTube = name === 'searchYouTube';
  const isMusic = name === 'controlMusic';
  const isSaveMemory = name === 'saveMemory';
  const isForgetMemory = name === 'forgetMemory';

  const targetUrl = args?.url || result?.url;
  const targetTitle = args?.title || result?.title || targetUrl;

  return (
    <div className="fixed top-18 sm:top-20 inset-x-0 mx-auto max-w-sm px-4 z-40 transition-all duration-300">
      <div
        className="rounded-2xl p-4 bg-black/85 backdrop-blur-xl border shadow-2xl flex flex-col gap-2 relative overflow-hidden"
        style={{
          borderColor: `${themeConfig.primary}66`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${themeConfig.glow}`,
        }}
      >
        {/* Glow corner line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${themeConfig.primary}, transparent)`,
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isWebsite && <ExternalLink className="w-4 h-4 text-cyan-400" />}
            {isApp && <Laptop className="w-4 h-4 text-cyan-400" />}
            {isTool && <Calculator className="w-4 h-4 text-cyan-400" />}
            {isVolume && <Volume2 className="w-4 h-4 text-cyan-300" />}
            {isBrightness && <Sun className="w-4 h-4 text-amber-300" />}
            {isSettings && <Settings className="w-4 h-4 text-cyan-400" />}
            {(isSearchGoogle || isSearchYouTube) && <Search className="w-4 h-4 text-cyan-400" />}
            {isMusic && <Music className="w-4 h-4 text-emerald-400" />}
            {(isSaveMemory || isForgetMemory) && <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />}
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-300">
              ⚡ CHROMEOS: <strong className="text-white">{name}</strong>
            </span>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-neutral-500 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content details */}
        {isVolume && (
          <div className="flex items-center justify-between mt-1 text-xs text-neutral-200">
            <span>Volume Action: <strong className="text-cyan-300">{args?.action}</strong></span>
            {result?.volume !== undefined && (
              <span className="font-mono-code text-cyan-300 font-bold">{result.volume}%</span>
            )}
          </div>
        )}

        {isBrightness && (
          <div className="flex items-center justify-between mt-1 text-xs text-neutral-200">
            <span>Brightness: <strong className="text-amber-300">{args?.action}</strong></span>
            {result?.brightness !== undefined && (
              <span className="font-mono-code text-amber-300 font-bold">{result.brightness}%</span>
            )}
          </div>
        )}

        {isApp && (
          <div className="flex flex-col gap-1 mt-1 text-xs">
            <div className="text-neutral-300">
              Launched App: <strong className="text-cyan-300">{args?.appName || result?.name}</strong>
            </div>
            {result?.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono-code mt-0.5 truncate"
              >
                <span>{result.url}</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {isTool && (
          <div className="text-xs text-neutral-300 mt-1">
            Laptop Tool: <strong className="text-cyan-300">{args?.tool}</strong> launched.
          </div>
        )}

        {isSettings && (
          <div className="text-xs text-neutral-300 mt-1 flex items-center justify-between">
            <span>Section: <strong className="text-cyan-300">{args?.section}</strong></span>
            <span className="text-[10px] text-emerald-400 font-mono-code">OS Synced</span>
          </div>
        )}

        {isSearchGoogle && (
          <div className="flex flex-col gap-1 mt-1 text-xs text-neutral-300">
            <span>Google Search: <strong className="text-cyan-300">"{args?.query}"</strong></span>
            <span className="text-[10px] text-emerald-400 font-mono-code">Results Opened</span>
          </div>
        )}

        {isSearchYouTube && (
          <div className="flex flex-col gap-1 mt-1 text-xs text-neutral-300">
            <span>YouTube Search: <strong className="text-cyan-300">"{args?.query}"</strong></span>
            <span className="text-[10px] text-rose-400 font-mono-code">Video Query Dispatched</span>
          </div>
        )}

        {isMusic && (
          <div className="text-xs text-neutral-300 mt-1 flex items-center justify-between">
            <span>Media: <strong className="text-emerald-300">{args?.action}</strong></span>
            <span className="text-[10px] text-emerald-400 font-mono-code">MediaSession Updated</span>
          </div>
        )}

        {isSaveMemory && (
          <div className="flex flex-col gap-1 mt-1 text-xs text-neutral-200">
            <span className="text-neutral-400 text-[11px]">Saved to memory bank:</span>
            <span className="text-cyan-300 font-medium italic">"{args?.fact}"</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-mono-code">
              <CheckCircle2 size={12} /> Permanent Recall Active
            </div>
          </div>
        )}

        {isForgetMemory && (
          <div className="flex flex-col gap-1 mt-1 text-xs text-neutral-200">
            <span className="text-neutral-400 text-[11px]">Memory deleted:</span>
            <span className="text-rose-300 font-medium">"{args?.keyword}"</span>
          </div>
        )}

        {isWebsite && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="text-xs text-neutral-300 font-medium">
              Target: <span className="text-cyan-300">{targetTitle}</span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate font-mono-code bg-black/50 p-1.5 rounded border border-neutral-800">
              {targetUrl}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-black transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: themeConfig.primary }}
              >
                <span>Open in Tab</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono-code">
                <CheckCircle2 size={12} /> Handled
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
