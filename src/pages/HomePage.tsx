import React, { useState } from 'react';
import { Tv, Smartphone, Gamepad2, Trophy, Settings, Shuffle, HelpCircle, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { GAME_REGISTRY } from '../data/games';
import { sound } from '../lib/sound';

interface HomePageProps {
  onSelectPlayTV: () => void;
  onSelectPlayController: () => void;
  onJoinWithCode?: (code: string) => void;
  onOpenLibrary: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onQuickRandomGame: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectPlayTV,
  onSelectPlayController,
  onJoinWithCode,
  onOpenLibrary,
  onOpenLeaderboard,
  onOpenSettings,
  onQuickRandomGame,
}) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    sound.playClick();
    if (onJoinWithCode) {
      onJoinWithCode(quickCode.trim());
    } else {
      onSelectPlayController();
    }
  };
  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] justify-between p-6 md:p-12 max-w-7xl mx-auto w-full select-none">
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          Platform Multiplayer Party Game Interaktif No. 1
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Satu TV. Banyak HP.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Satu Party.
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Ubah Smart TV atau Laptopmu menjadi arena permainan bersama teman dan keluarga, menggunakan smartphone sebagai stik controller realtime tanpa download aplikasi!
        </p>
      </div>

      {/* Two Main Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 my-8 max-w-5xl mx-auto w-full">
        {/* CARD 1: PLAY TV */}
        <div
          onClick={() => {
            sound.playClick();
            onSelectPlayTV();
          }}
          className="group relative flex flex-col justify-between p-8 md:p-10 rounded-3xl bg-slate-900/80 border-2 border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
        >
          <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-500/30">
            Layar TV / PC
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition shadow-lg">
              <Tv className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white group-hover:text-cyan-300 transition">
                📺 PLAY TV
              </h2>
              <p className="text-xs md:text-sm text-cyan-400 font-bold mt-1">
                Gunakan perangkat ini sebagai layar utama game
              </p>
            </div>

            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Buat Room baru dan tampilkan QR Code di Smart TV, Android TV, Google TV, atau Laptop agar pemain lain bisa join.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
              Buka Layar TV & Buat Room
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black group-hover:translate-x-1.5 transition shadow-lg shadow-cyan-500/30">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CARD 2: PLAY CONTROLLER */}
        <div
          onClick={() => {
            sound.playClick();
            onSelectPlayController();
          }}
          className="group relative flex flex-col justify-between p-8 md:p-10 rounded-3xl bg-slate-900/80 border-2 border-indigo-500/40 hover:border-indigo-400 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
        >
          <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30">
            Pemain / HP
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition shadow-lg">
              <Smartphone className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white group-hover:text-indigo-300 transition">
                📱 PLAY CONTROLLER
              </h2>
              <p className="text-xs md:text-sm text-indigo-400 font-bold mt-1">
                Gunakan smartphone sebagai stik controller
              </p>
            </div>

            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Masukkan Kode Room 4 digit atau Scan QR dari TV untuk langsung bergabung dan bermain bersama.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Gabung Room Permainan
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black group-hover:translate-x-1.5 transition shadow-lg shadow-indigo-500/30">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Join With Room Code Bar */}
      <div className="max-w-2xl mx-auto w-full mb-6">
        <form
          onSubmit={handleQuickJoinSubmit}
          className="flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 w-full">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider whitespace-nowrap">
              Kode Room:
            </span>
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="Contoh: 4821 atau SYAM-4821"
              maxLength={12}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-400 text-white font-black text-center sm:text-left text-sm tracking-wider uppercase outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={!quickCode.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider transition active:scale-95 shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            ⚡ Masuk Room
          </button>
        </form>
      </div>

      {/* Quick Menu Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto w-full pt-2">
        <button
          onClick={() => {
            sound.playClick();
            onOpenLibrary();
          }}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow"
        >
          <Gamepad2 className="w-4 h-4 text-cyan-400" />
          <span>20 Mini-Games</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onQuickRandomGame();
          }}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow"
        >
          <Shuffle className="w-4 h-4 text-amber-400" />
          <span>Random Game</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenLeaderboard();
          }}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow"
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition shadow"
        >
          <Settings className="w-4 h-4 text-purple-400" />
          <span>Pengaturan</span>
        </button>
      </div>

      {/* Footer credits */}
      <div className="text-center text-xs text-slate-500 pt-8">
        SYAM PARTY GAME &bull; Pesta Game TV & Smartphone &bull; Made with Modern Realtime Tech
      </div>
    </div>
  );
};
