import React, { useState } from 'react';
import { Brain, Trash2, Plus, X, Sparkles, Check } from 'lucide-react';
import { MemoryItem } from '../types/assistant';
import { MemoryStore } from '../services/MemoryStore';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onMemoriesChanged: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onMemoriesChanged,
}) => {
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    MemoryStore.addMemory(newFact.trim(), newCategory);
    setNewFact('');
    setShowAddForm(false);
    onMemoriesChanged();
  };

  const handleDelete = (id: string) => {
    MemoryStore.removeMemory(id);
    onMemoriesChanged();
  };

  const handleClearAll = () => {
    if (confirm('Clear all memories stored in Dark\'s memory bank?')) {
      MemoryStore.clearAll();
      onMemoriesChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-[#0c121e]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] p-5 text-neutral-100 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Brain size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide text-white flex items-center gap-2">
                Dark's Memory Bank
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono-code border border-cyan-400/30">
                  {memories.length} stored
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Explanatory note */}
        <p className="text-xs text-neutral-400 leading-relaxed">
          Tell Dark anything in conversation (e.g. <em>"remember that I love espresso"</em> or <em>"remember my dog's name is Milo"</em>) and he saves it automatically to recall later.
        </p>

        {/* Add Memory Form Toggle */}
        {showAddForm ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-2 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <input
              type="text"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="e.g. Favorite hobby is rock climbing"
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-neutral-700 text-xs text-neutral-100 focus:outline-none focus:border-cyan-400 font-sans"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2 mt-1">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-black/50 border border-neutral-700 text-[11px] rounded px-2 py-1 text-neutral-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="personal">Personal</option>
                <option value="preference">Preference</option>
                <option value="work">Work</option>
                <option value="hobby">Hobby</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-300 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            <span>Add a Memory Manually</span>
          </button>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px] max-h-[300px]">
          {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-500 text-xs text-center">
              <Brain size={24} className="mb-2 opacity-40 text-cyan-400" />
              <span>No memories stored yet.</span>
              <span className="text-[11px] text-neutral-600 mt-0.5">Talk to Dark to create memories.</span>
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 transition-all text-xs"
              >
                <div className="flex items-start gap-2.5 flex-1 pr-2">
                  <Sparkles size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-neutral-200 leading-snug">{m.fact}</span>
                    {m.category && (
                      <span className="text-[10px] uppercase font-mono-code text-cyan-400/60 mt-0.5">
                        {m.category}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(m.id)}
                  aria-label="Delete memory"
                  className="text-neutral-600 hover:text-rose-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Forget this"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-neutral-500">
          <button
            onClick={handleClearAll}
            disabled={memories.length === 0}
            className="text-[11px] text-neutral-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
