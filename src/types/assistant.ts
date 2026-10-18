export type AssistantState =
  | 'disconnected'
  | 'connecting'
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type AtmosphereTheme =
  | 'cyber-cyan'
  | 'crimson-noir'
  | 'violet-pulse'
  | 'matrix-emerald'
  | 'amber-gold';

export interface ThemeConfig {
  id: AtmosphereTheme;
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  bgGradient: string;
  accentText: string;
  orbColor: string;
}

export const THEMES: Record<AtmosphereTheme, ThemeConfig> = {
  'cyber-cyan': {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    primary: '#00f0ff',
    secondary: '#0070f3',
    glow: 'rgba(0, 240, 255, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, rgba(0, 240, 255, 0.12) 0%, rgba(7, 8, 11, 0.95) 75%)',
    accentText: 'text-cyan-400',
    orbColor: '#00f0ff',
  },
  'crimson-noir': {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    primary: '#ff0055',
    secondary: '#990033',
    glow: 'rgba(255, 0, 85, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, rgba(255, 0, 85, 0.14) 0%, rgba(7, 8, 11, 0.95) 75%)',
    accentText: 'text-rose-500',
    orbColor: '#ff0055',
  },
  'violet-pulse': {
    id: 'violet-pulse',
    name: 'Neon Violet',
    primary: '#a855f7',
    secondary: '#6366f1',
    glow: 'rgba(168, 85, 247, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, rgba(168, 85, 247, 0.14) 0%, rgba(7, 8, 11, 0.95) 75%)',
    accentText: 'text-purple-400',
    orbColor: '#c084fc',
  },
  'matrix-emerald': {
    id: 'matrix-emerald',
    name: 'Matrix Emerald',
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, rgba(16, 185, 129, 0.14) 0%, rgba(7, 8, 11, 0.95) 75%)',
    accentText: 'text-emerald-400',
    orbColor: '#34d399',
  },
  'amber-gold': {
    id: 'amber-gold',
    name: 'Amber Gold',
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.14) 0%, rgba(7, 8, 11, 0.95) 75%)',
    accentText: 'text-amber-400',
    orbColor: '#fbbf24',
  },
};

export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface VoiceOption {
  id: string;
  name: string;
  style: string;
}

export interface MemoryItem {
  id: string;
  fact: string;
  category?: string;
  timestamp: number;
}
