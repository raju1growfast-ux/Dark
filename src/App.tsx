/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Trash2,
  MicOff,
  Headphones,
  Brain,
  X,
} from 'lucide-react';
import { LiveSession } from './services/LiveSession';
import { MemoryStore } from './services/MemoryStore';
import { AssistantState, ToolCallItem, MemoryItem } from './types/assistant';
import { CyanCapsuleCore } from './components/CyanCapsuleCore';
import { VoiceSelector } from './components/VoiceSelector';
import { ToolActionOverlay } from './components/ToolActionOverlay';
import { MemoryModal } from './components/MemoryModal';
import { ChromeOSOverlay } from './components/ChromeOSOverlay';

export default function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [userVolume, setUserVolume] = useState<number>(0);
  const [assistantVolume, setAssistantVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeVoice, setActiveVoice] = useState<string>('Puck');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [memories, setMemories] = useState<MemoryItem[]>(() => MemoryStore.getMemories());
  const [activeToolCall, setActiveToolCall] = useState<ToolCallItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const liveSessionRef = useRef<LiveSession | null>(null);
  const isConnected = state !== 'disconnected' && state !== 'error';

  const refreshMemories = useCallback(() => {
    setMemories(MemoryStore.getMemories());
  }, []);

  // Initialize or get LiveSession instance
  const getLiveSession = useCallback(() => {
    if (!liveSessionRef.current) {
      liveSessionRef.current = new LiveSession({
        onStateChange: (newState) => {
          setState(newState);
          if (newState === 'disconnected' || newState === 'idle') {
            setUserVolume(0);
            setAssistantVolume(0);
          }
        },
        onVolumeChange: (vol, source) => {
          if (source === 'user') {
            setUserVolume(vol);
          } else {
            setAssistantVolume(vol);
          }
        },
        onToolCall: (toolCall) => {
          setActiveToolCall(toolCall);
        },
        onMemoryUpdated: () => {
          refreshMemories();
        },
        onError: (errText) => {
          setErrorMessage(errText);
        },
      });
    }
    return liveSessionRef.current;
  }, [refreshMemories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveSessionRef.current?.disconnect();
      liveSessionRef.current = null;
    };
  }, []);

  const handleToggleConnect = async () => {
    setErrorMessage(null);
    const session = getLiveSession();

    if (state === 'disconnected' || state === 'error') {
      try {
        await session.connect(activeVoice);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not connect to Dark.');
      }
    } else {
      session.disconnect();
    }
  };

  const handleToggleMute = () => {
    const session = getLiveSession();
    const newMuted = !isMuted;
    session.setMute(newMuted);
    setIsMuted(newMuted);
  };

  const handleResetSession = () => {
    const session = getLiveSession();
    session.disconnect();
    setUserVolume(0);
    setAssistantVolume(0);
    setState('disconnected');
    setErrorMessage(null);
  };

  const handleSelectVoice = (voiceId: string) => {
    setActiveVoice(voiceId);
    if (isConnected) {
      getLiveSession().changeVoice(voiceId);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] text-white flex flex-col justify-between select-none">
      {/* Background Subtle Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.12)_0%,_rgba(2,6,12,0.98)_70%)]" />

      {/* TOP HEADER BAR (Logo and text removed from top left as requested) */}
      <header className="relative z-30 w-full px-6 py-5 flex items-center justify-between">
        {/* Bilingual Language Mode indicator */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.03] border border-cyan-400/20 text-[10px] font-mono-code text-cyan-300">
          <span>EN</span>
          <span className="opacity-40">/</span>
          <span>हिन्दी</span>
        </div>

        {/* Center: Minimal Subdued Title */}
        <div className="hidden sm:block text-xs font-mono-code text-neutral-500 tracking-wider">
          Dark - Bilingual Voice Assistant
        </div>

        {/* Right: Circular Action Icons (Memory, Reset, Voice, Mute) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Memory Bank Button */}
          <button
            onClick={() => setIsMemoryModalOpen(true)}
            aria-label="Open Memory Bank"
            title={`Memory Bank (${memories.length} memories)`}
            className="relative w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 text-neutral-400 hover:text-cyan-300 transition-all flex items-center justify-center backdrop-blur-md"
          >
            <Brain size={16} />
            {memories.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-bold flex items-center justify-center font-mono-code shadow-[0_0_8px_rgba(0,240,255,0.8)]">
                {memories.length}
              </span>
            )}
          </button>

          {/* Reset / Clear Session Button */}
          <button
            onClick={handleResetSession}
            aria-label="Reset session"
            title="Reset session"
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-400 hover:text-white transition-all flex items-center justify-center backdrop-blur-md"
          >
            <Trash2 size={16} />
          </button>

          {/* Voice profile switcher */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            aria-label="Change voice"
            title={`Voice: ${activeVoice}`}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-400 hover:text-cyan-300 transition-all flex items-center justify-center backdrop-blur-md"
          >
            <Headphones size={16} />
          </button>

          {/* Audio Mute/Unmute */}
          {isConnected && (
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              title={isMuted ? 'Unmute' : 'Mute'}
              className={`w-9 h-9 rounded-full border transition-all flex items-center justify-center backdrop-blur-md ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* ERROR TOAST NOTIFICATION */}
      {errorMessage && (
        <div className="fixed top-18 inset-x-0 mx-auto max-w-sm px-4 z-50">
          <div className="rounded-xl p-3 bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-2xl backdrop-blur-md flex items-center justify-between gap-2">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-100 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* CHROMEOS FLEX SYSTEM OVERLAY (Volume, Brightness, Dimmer, Quick Settings, Calculator) */}
      <ChromeOSOverlay />

      {/* TOOL ACTION HUD CARD */}
      <ToolActionOverlay
        toolCall={activeToolCall}
        theme="cyber-cyan"
        onDismiss={() => setActiveToolCall(null)}
      />

      {/* MAIN CENTER: Cyan Capsule Pill "D A R K" & Dotted Tracks */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 overflow-visible">
        <CyanCapsuleCore
          state={state}
          userVolume={userVolume}
          assistantVolume={assistantVolume}
          onToggleConnect={handleToggleConnect}
        />

        {/* Right Edge Status Indicator (matches position in screenshot) */}
        <div className="absolute right-4 sm:right-8 md:right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-20">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              state === 'speaking'
                ? 'bg-cyan-400 animate-ping'
                : state === 'listening'
                ? 'bg-cyan-400 animate-pulse'
                : state === 'connecting'
                ? 'bg-cyan-300 animate-bounce'
                : 'bg-cyan-500/40'
            }`}
          />
          <span className="text-xs sm:text-sm font-sans tracking-wide text-cyan-300/80 italic font-medium">
            {state === 'speaking'
              ? 'Dark is talking...'
              : state === 'listening'
              ? 'Listening / सुन रहा हूँ...'
              : state === 'connecting'
              ? 'Connecting...'
              : 'Tap DARK to speak'}
          </span>
        </div>
      </main>

      {/* BOTTOM ACTION BAR */}
      <footer className="relative z-30 w-full pb-10 flex flex-col items-center justify-center">
        {/* Red Tinted "End Session" Pill Button (matches screenshot) */}
        {isConnected ? (
          <button
            onClick={handleToggleConnect}
            aria-label="End Session"
            className="group px-6 py-2.5 rounded-full bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 hover:border-red-500/70 text-red-400 hover:text-red-300 transition-all duration-300 flex items-center gap-2.5 text-xs sm:text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 cursor-pointer"
          >
            <MicOff size={15} className="group-hover:scale-110 transition-transform" />
            <span>End Session</span>
          </button>
        ) : (
          <div className="text-[12px] text-cyan-400/50 tracking-widest font-mono-code uppercase">
            TAP D A R K TO ACTIVATE
          </div>
        )}
      </footer>

      {/* MEMORY BANK MODAL */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onMemoriesChanged={refreshMemories}
      />

      {/* VOICE SELECTION MODAL */}
      <VoiceSelector
        currentVoice={activeVoice}
        onSelectVoice={handleSelectVoice}
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
