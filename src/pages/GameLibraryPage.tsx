import React, { useState } from 'react';
import { GAME_REGISTRY } from '../data/games';
import { GameDefinition } from '../types';
import { sound } from '../lib/sound';
import {
  Gamepad2,
  Search,
  Users,
  Clock,
  ArrowLeft,
  Play,
  Shuffle,
  Sparkles,
} from 'lucide-react';

interface GameLibraryProps {
  onBack: () => void;
  onSelectGameToPlay: (gameId: string) => void;
}

export const GameLibraryPage: React.FC<GameLibraryProps> = ({
  onBack,
  onSelectGameToPlay,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGameModal, setSelectedGameModal] = useState<GameDefinition | null>(null);

  const categories = ['all', 'quiz', 'party', 'arcade', 'racing', 'word', 'puzzle', 'battle'];

  const filteredGames = GAME_REGISTRY.filter((game) => {
    const matchesSearch =
      game.name.toLowerCase().includes(search.toLowerCase()) ||
      game.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || game.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] p-6 md:p-10 max-w-7xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-cyan-400" />
              Game Library
            </h1>
            <p className="text-xs text-slate-400">
              Koleksi 20 Mini-Game Multiplayer TV + HP
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul game..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-cyan-400 transition"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              sound.playClick();
              setActiveCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'all' ? `Semua (${GAME_REGISTRY.length})` : cat}
          </button>
        ))}
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-4 flex-1">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => {
              sound.playClick();
              setSelectedGameModal(game);
            }}
            className="group flex flex-col justify-between p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl p-2.5 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition">
                  {game.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/20">
                  {game.category}
                </span>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition">
                {game.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {game.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> {game.minPlayers}-{game.maxPlayers} P
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> {game.duration}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Game Details Modal */}
      {selectedGameModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-6xl p-4 bg-slate-950 rounded-2xl border border-slate-700">
                {selectedGameModal.icon}
              </span>
              <div>
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                  {selectedGameModal.category} Game
                </span>
                <h2 className="text-2xl font-black text-white">{selectedGameModal.name}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>👥 {selectedGameModal.minPlayers}-{selectedGameModal.maxPlayers} Pemain</span>
                  <span>⏱️ {selectedGameModal.duration}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Deskripsi Permainan:
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                {selectedGameModal.description}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectGameToPlay(selectedGameModal.id);
                }}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/30 transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-slate-950" /> MAIN SEKARANG
              </button>

              <button
                onClick={() => setSelectedGameModal(null)}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
