import { MemoryItem } from '../types/assistant';

const STORAGE_KEY = 'dark_ai_memory_store_v1';

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_init_1',
    fact: 'Loves the electric cyan blue aesthetic',
    category: 'preference',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'mem_init_2',
    fact: 'Prefers witty, confident banter with zero fluff',
    category: 'preference',
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
  },
];

export class MemoryStore {
  public static getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMORIES));
        return DEFAULT_MEMORIES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('[MemoryStore] Failed to read from localStorage:', e);
      return DEFAULT_MEMORIES;
    }
  }

  public static addMemory(fact: string, category = 'personal'): MemoryItem {
    const list = this.getMemories();
    // Prevent duplicate entries
    const existing = list.find((m) => m.fact.toLowerCase().trim() === fact.toLowerCase().trim());
    if (existing) {
      return existing;
    }

    const newItem: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fact: fact.trim(),
      category,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...list];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[MemoryStore] Failed to save memory:', e);
    }
    return newItem;
  }

  public static removeMemory(id: string): void {
    const list = this.getMemories();
    const updated = list.filter((m) => m.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[MemoryStore] Failed to delete memory:', e);
    }
  }

  public static removeByKeyword(keyword: string): boolean {
    const list = this.getMemories();
    const lowerKey = keyword.toLowerCase().trim();
    const filtered = list.filter((m) => !m.fact.toLowerCase().includes(lowerKey));
    const wasRemoved = filtered.length !== list.length;
    if (wasRemoved) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch {}
    }
    return wasRemoved;
  }

  public static clearAll(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {}
  }

  public static toPromptStrings(): string[] {
    return this.getMemories().map((m) => m.fact);
  }
}
