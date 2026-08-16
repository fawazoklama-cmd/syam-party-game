import React, { useState, useEffect } from 'react';
import { Room, Player, GameDefinition } from '../types';
import { GAME_REGISTRY } from '../data/games';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { GameIcon } from '../components/GameIcon';
import { sound } from '../lib/sound';
import {
  Users,
  Play,
  Shuffle,
  Crown,
  Sparkles,
  Gamepad2,
  Tv,
  X,
  Volume2,
  CheckCircle2,
  Clock,
  Flame,
  QrCode,
} from 'lucide-react';

interface TVModeProps {
  room: Room;
  players: Player[];
  onStartGame: (gameId: string) => void;
  onKickPlayer?: (playerId: string) => void;
  onLeaveRoom: () => void;
  onOpenQRGenerator?: () => void;
}

export const TVModePage: React.FC<TVModeProps> = ({
  room,
  players,
  onStartGame,
  onKickPlayer,
  onLeaveRoom,
  onOpenQRGenerator,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(room.currentGameId || 'quiz-battle');
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const selectedGame = GAME_REGISTRY.find((g) => g.id === selectedGameId) || GAME_REGISTRY[0];

  // Join URL for QR code
  const joinUrl = `${window.location.origin}/#controller?code=${room.code}`;

  const handleRandomSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    sound.playCountdownTick();

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * GAME_REGISTRY.length);
      setSelectedGameId(GAME_REGISTRY[randomIdx].id);
      sound.playClick();
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        sound.playCorrect();
      }
    }, 120);
  };

  const filteredGames = activeCategory === 'all'
    ? GAME_REGISTRY
    : GAME_REGISTRY.filter((g) => g.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] justify-between p-4 sm:p-6 select-none bg-slate-950">
      {/* Top TV Lobby Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 px-6 sm:px-8 py-4 rounded-3xl border border-slate-800 backdrop-blur shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Layar TV Utama &bull; Room Code
            </span>
            <span className="text-3xl font-black text-cyan-400 tracking-wider">
              {room.code}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl text-slate-300 border border-slate-700">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-white text-lg">{players.length}</span>
            <span className="text-xs text-slate-400">/ {room.maxPlayers} Pemain</span>
          </div>

          {onOpenQRGenerator && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenQRGenerator();
              }}
              title="Buka QR Generator Kustom"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden md:inline">Kustom QR</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs transition"
          >
            Tutup Room
          </button>
        </div>
      </div>

      {/* Main Grid: Left QR & Players, Right Game Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 flex-1 items-stretch">
        {/* LEFT COLUMN: QR Code & Joined Players (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-800">
            <QRCodeDisplay url={joinUrl} size={135} title={`Scan Room ${room.code}`} />
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20 inline-block">
                Scan Untuk Gabung
              </span>
              <h3 className="font-extrabold text-white text-base">Buka di Smartphone:</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono break-all">
                {window.location.host}/#controller
              </p>
              <div className="text-xs text-amber-400 font-bold pt-1">
                Atau masukkan kode <span className="underline font-black">{room.code}</span>
              </div>
            </div>
          </div>

          {/* Player Grid List */}
          <div className="my-2 flex-1 overflow-y-auto max-h-72">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daftar Pemain di Room:
              </span>
              <span className="text-xs text-cyan-400 font-bold">
                {players.length >= selectedGame.minPlayers ? '✅ Siap Main' : `Butuh Min. ${selectedGame.minPlayers} Pemain`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: Math.max(room.maxPlayers, 4) }).map((_, idx) => {
                const player = players[idx];
                return (
                  <div
                    key={idx}
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      player
                        ? 'bg-slate-900 border-cyan-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 border-dashed text-slate-600'
                    }`}
                  >
                    {player ? (
                      <>
                        <span className="text-2xl sm:text-3xl">{player.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-white truncate">
                              {player.nickname}
                            </span>
                            {player.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {player.isReady ? 'Ready' : 'Tersambung'}
                          </div>
                        </div>
                        {onKickPlayer && !player.isHost && (
                          <button
                            onClick={() => onKickPlayer(player.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                            title="Keluarkan pemain"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-slate-600 text-xs font-semibold">
                        <span className="w-7 h-7 rounded-full border border-slate-800 flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span>Menunggu...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Pemain akan otomatis terhubung secara realtime saat bergabung
          </div>
        </div>

        {/* RIGHT COLUMN: Game Selection & Start (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          {/* Active Selected Game Showcase */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/40 shadow-lg">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner text-cyan-400">
              <GameIcon iconName={selectedGame.icon} className="w-12 h-12" />
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                  {selectedGame.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {selectedGame.duration}s
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-amber-400" /> {selectedGame.minPlayers}-{selectedGame.maxPlayers} P
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">{selectedGame.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedGame.description}
              </p>
            </div>

            <button
              onClick={handleRandomSpin}
              disabled={isSpinning}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs transition active:scale-95 whitespace-nowrap"
            >
              <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              Acak Game
            </button>
          </div>

          {/* Game Library Fast Carousel */}
          <div className="my-2">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['all', 'quiz', 'party', 'arcade', 'racing', 'word', 'puzzle', 'battle'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playClick();
                    setActiveCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Semua (20)' : cat}
                </button>
              ))}
            </div>

            {/* Games grid scroll */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto mt-2 pr-1">
              {filteredGames.map((game) => {
                const isSelected = game.id === selectedGameId;
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedGameId(game.id);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40 scale-[1.02]'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <GameIcon iconName={game.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-white truncate">{game.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{game.category}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Big Start Button */}
          <button
            onClick={() => {
              sound.playClick();
              onStartGame(selectedGameId);
            }}
            disabled={players.length === 0}
            className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-lg sm:text-2xl shadow-2xl shadow-cyan-500/40 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            MULAI PERMAINAN ({selectedGame.name.toUpperCase()})
          </button>
        </div>
      </div>
    </div>
  );
};

