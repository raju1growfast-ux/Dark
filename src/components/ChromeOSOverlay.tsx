import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sun,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Wifi,
  Bluetooth,
  Sliders,
  X,
  ExternalLink,
  Calculator as CalcIcon,
  FolderOpen,
} from 'lucide-react';
import { ChromeOSService, SystemEvent } from '../services/ChromeOSService';

export const ChromeOSOverlay: React.FC = () => {
  const [volume, setVolume] = useState<number>(75);
  const [brightness, setBrightness] = useState<number>(90);
  const [showVolumeHud, setShowVolumeHud] = useState(false);
  const [showBrightnessHud, setShowBrightnessHud] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [settingsSection, setSettingsSection] = useState('general');
  const [mediaInfo, setMediaInfo] = useState<{ isPlaying: boolean; track: any } | null>(null);

  // Calculator internal state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcResetOnInput, setCalcResetOnInput] = useState(false);

  useEffect(() => {
    const unsubscribe = ChromeOSService.subscribe((event: SystemEvent) => {
      if (event.type === 'volume') {
        setVolume(event.value);
        setShowVolumeHud(true);
        const timer = setTimeout(() => setShowVolumeHud(false), 2400);
        return () => clearTimeout(timer);
      } else if (event.type === 'brightness') {
        setBrightness(event.value);
        setShowBrightnessHud(true);
        const timer = setTimeout(() => setShowBrightnessHud(false), 2400);
        return () => clearTimeout(timer);
      } else if (event.type === 'settings') {
        setSettingsSection(event.value || 'general');
        setShowSettingsModal(true);
      } else if (event.type === 'calculator') {
        setShowCalculator(true);
      } else if (event.type === 'media') {
        setMediaInfo(event.value);
      }
    });

    return unsubscribe;
  }, []);

  // Calculator operations
  const handleCalcNumber = (digit: string) => {
    if (calcDisplay === '0' || calcResetOnInput) {
      setCalcDisplay(digit);
      setCalcResetOnInput(false);
    } else {
      setCalcDisplay(calcDisplay + digit);
    }
  };

  const handleCalcOp = (op: string) => {
    const current = parseFloat(calcDisplay);
    if (calcPrev !== null && calcOp) {
      const result = calculate(calcPrev, current, calcOp);
      setCalcDisplay(String(result));
      setCalcPrev(result);
    } else {
      setCalcPrev(current);
    }
    setCalcOp(op);
    setCalcResetOnInput(true);
  };

  const handleCalcEquals = () => {
    const current = parseFloat(calcDisplay);
    if (calcPrev !== null && calcOp) {
      const result = calculate(calcPrev, current, calcOp);
      setCalcDisplay(String(result));
      setCalcPrev(null);
      setCalcOp(null);
      setCalcResetOnInput(true);
    }
  };

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? Math.round((a / b) * 10000) / 10000 : 0;
      default: return b;
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcResetOnInput(false);
  };

  // Screen Dimmer factor: 100 brightness = 0 overlay opacity, 10 brightness = 0.85 black overlay
  const dimmerOpacity = Math.max(0, Math.min(0.85, (100 - brightness) / 100 * 0.9));

  return (
    <>
      {/* 1. Hardware Screen Dimmer Filter Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-40 bg-black transition-opacity duration-500"
        style={{ opacity: dimmerOpacity }}
      />

      {/* 2. ChromeOS Volume HUD (Top Center / Side) */}
      {showVolumeHud && (
        <div className="fixed top-6 inset-x-0 mx-auto w-64 z-50 animate-fade-in pointer-events-none">
          <div className="bg-[#121622]/95 border border-cyan-400/40 rounded-full px-4 py-2.5 shadow-[0_0_25px_rgba(0,240,255,0.25)] backdrop-blur-xl flex items-center gap-3">
            {volume === 0 ? (
              <VolumeX size={17} className="text-rose-400 shrink-0" />
            ) : (
              <Volume2 size={17} className="text-cyan-300 shrink-0" />
            )}
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                style={{ width: `${volume}%` }}
              />
            </div>
            <span className="text-[11px] font-mono-code font-bold text-cyan-200 min-w-[28px] text-right">
              {volume}%
            </span>
          </div>
        </div>
      )}

      {/* 3. ChromeOS Brightness HUD */}
      {showBrightnessHud && (
        <div className="fixed top-18 inset-x-0 mx-auto w-64 z-50 animate-fade-in pointer-events-none">
          <div className="bg-[#121622]/95 border border-amber-400/40 rounded-full px-4 py-2.5 shadow-[0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-xl flex items-center gap-3">
            <Sun size={17} className="text-amber-300 shrink-0" />
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                style={{ width: `${brightness}%` }}
              />
            </div>
            <span className="text-[11px] font-mono-code font-bold text-amber-200 min-w-[28px] text-right">
              {brightness}%
            </span>
          </div>
        </div>
      )}

      {/* 4. ChromeOS Floating Media Player Bar (Bottom Right if media active) */}
      {mediaInfo && (
        <div className="fixed bottom-24 right-6 z-40 animate-fade-in">
          <div className="bg-[#0f1420]/90 border border-cyan-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs w-72">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center text-cyan-200 shrink-0 shadow-md">
              <CalcIcon size={16} />
            </div>
            <div className="flex-1 truncate">
              <div className="font-semibold text-neutral-100 truncate">{mediaInfo.track.title}</div>
              <div className="text-[10px] text-cyan-400/80 font-mono-code truncate">{mediaInfo.track.artist}</div>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <button
                onClick={() => ChromeOSService.controlMusic('previous')}
                className="p-1 hover:text-white"
              >
                <SkipBack size={14} />
              </button>
              <button
                onClick={() => ChromeOSService.controlMusic('toggle')}
                className="p-1.5 rounded-full bg-cyan-400 text-black hover:bg-cyan-300"
              >
                {mediaInfo.isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={() => ChromeOSService.controlMusic('next')}
                className="p-1 hover:text-white"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ChromeOS Quick Settings / Wi-Fi & Bluetooth Tray Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0c111c]/95 border border-cyan-400/30 p-5 text-neutral-100 shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400" />
                <h3 className="font-semibold text-sm">ChromeOS Flex Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-neutral-400 hover:text-white p-1">
                <X size={15} />
              </button>
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-xl border flex flex-col gap-2 ${settingsSection === 'wifi' ? 'bg-cyan-950/40 border-cyan-400/60' : 'bg-white/[0.03] border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <Wifi size={17} className="text-cyan-400" />
                  <span className="text-[10px] text-emerald-400 font-mono-code">CONNECTED</span>
                </div>
                <div>
                  <div className="text-xs font-semibold">Wi-Fi Network</div>
                  <div className="text-[11px] text-neutral-400">Flex_Gigabit_5G</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col gap-2 ${settingsSection === 'bluetooth' ? 'bg-cyan-950/40 border-cyan-400/60' : 'bg-white/[0.03] border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <Bluetooth size={17} className="text-cyan-400" />
                  <span className="text-[10px] text-cyan-300 font-mono-code">ON</span>
                </div>
                <div>
                  <div className="text-xs font-semibold">Bluetooth</div>
                  <div className="text-[11px] text-neutral-400">Audio Headset</div>
                </div>
              </div>
            </div>

            {/* Sliders in settings */}
            <div className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <Volume2 size={15} className="text-cyan-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => ChromeOSService.setVolume(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[11px] font-mono-code text-neutral-400 w-8 text-right">{volume}%</span>
              </div>

              <div className="flex items-center gap-3">
                <Sun size={15} className="text-amber-400 shrink-0" />
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brightness}
                  onChange={(e) => ChromeOSService.setBrightness(parseInt(e.target.value, 10))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                />
                <span className="text-[11px] font-mono-code text-neutral-400 w-8 text-right">{brightness}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href="chrome://os-settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono-code"
              >
                <span>Launch chrome://os-settings</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-400 text-black font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ChromeOS Built-in Glass Calculator Widget */}
      {showCalculator && (
        <div className="fixed top-20 left-6 sm:left-12 z-50 animate-fade-in select-none">
          <div className="w-68 rounded-2xl bg-[#0c121e]/95 border border-cyan-400/40 p-4 text-white shadow-[0_10px_35px_rgba(0,240,255,0.2)] backdrop-blur-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <CalcIcon size={14} />
                <span>ChromeOS Calculator</span>
              </div>
              <button onClick={() => setShowCalculator(false)} className="text-neutral-400 hover:text-white p-0.5">
                <X size={14} />
              </button>
            </div>

            {/* Display */}
            <div className="bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-right font-mono-code text-xl font-bold text-cyan-200 tracking-wider truncate">
              {calcDisplay}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
              <button onClick={handleCalcClear} className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 col-span-2">C</button>
              <button onClick={() => handleCalcOp('÷')} className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60">÷</button>
              <button onClick={() => handleCalcOp('×')} className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60">×</button>

              <button onClick={() => handleCalcNumber('7')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">7</button>
              <button onClick={() => handleCalcNumber('8')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">8</button>
              <button onClick={() => handleCalcNumber('9')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">9</button>
              <button onClick={() => handleCalcOp('-')} className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60">-</button>

              <button onClick={() => handleCalcNumber('4')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">4</button>
              <button onClick={() => handleCalcNumber('5')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">5</button>
              <button onClick={() => handleCalcNumber('6')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">6</button>
              <button onClick={() => handleCalcOp('+')} className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60">+</button>

              <button onClick={() => handleCalcNumber('1')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">1</button>
              <button onClick={() => handleCalcNumber('2')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">2</button>
              <button onClick={() => handleCalcNumber('3')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">3</button>
              <button onClick={handleCalcEquals} className="p-2.5 rounded-lg bg-cyan-400 text-black font-bold hover:bg-cyan-300 row-span-2 flex items-center justify-center">=</button>

              <button onClick={() => handleCalcNumber('0')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10 col-span-2">0</button>
              <button onClick={() => handleCalcNumber('.')} className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/10">.</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
