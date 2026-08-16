import React, { useState, useEffect } from 'react';
import { Player, Room, ControllerInputEvent } from '../types';
import { DynamicController } from '../components/controllers/DynamicController';
import { sound } from '../lib/sound';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sparkles,
  LogOut,
  Gamepad2,
  Volume2,
} from 'lucide-react';

interface ControllerPageProps {
  initialCode?: string;
  room: Room | null;
  currentPlayer: Player | null;
  onJoinRoom: (code: string, nickname: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  onSendInput: (action: string, payload?: any) => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
}

const AVATARS = ['😀', '😎', '🤖', '🐱', '🐸', '🦊', '👾', '🐼', '🦄', '🦁', '🚀', '⚡', '👑', '🍕', '🎮', '🐯'];

export const ControllerPage: React.FC<ControllerPageProps> = ({
  initialCode = '',
  room,
  currentPlayer,
  onJoinRoom,
  onSendInput,
  onLeaveRoom,
  onToggleReady,
}) => {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Handle Join Submit
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nickname.trim()) {
      setErrorMsg('Mohon isi kode room dan nama panggilanmu');
      return;
    }

    setIsJoining(true);
    setErrorMsg('');
    sound.playClick();

    try {
      const res = await onJoinRoom(code.trim().toUpperCase(), nickname.trim(), avatar);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal bergabung. Pastikan kode room benar dan masih aktif.');
      } else {
        sound.playVictory();
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsJoining(false);
    }
  };

  // If NOT joined yet -> Show Join Form
  if (!room || !currentPlayer) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-73px)] justify-center items-center p-6 select-none bg-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mx-auto shadow-lg">
              <Smartphone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">PLAY CONTROLLER</h2>
            <p className="text-xs text-slate-400 font-medium">
              Gabung ke Room TV untuk mengontrol permainan dari HP
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-rose-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                Kode Room (4-8 Karakter):
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: SYAM-4821"
                maxLength={10}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-white font-black text-center text-xl tracking-widest outline-none transition"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Panggilan:
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ketik nama kamu..."
                maxLength={12}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-400 text-white font-bold text-base outline-none transition"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Pilih Avatar:
              </label>
              <div className="grid grid-cols-8 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAvatar(av);
                    }}
                    className={`text-2xl p-1.5 rounded-xl border transition-all ${
                      avatar === av
                        ? 'bg-indigo-500/30 border-indigo-400 scale-110 shadow-md ring-2 ring-indigo-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition disabled:opacity-50"
            >
              {isJoining ? 'Menghubungkan...' : 'GABUNG KE GAME'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If Room is WAITING / LOBBY -> Show Waiting Room
  if (room.status === 'LOBBY' || !room.currentGameId) {
    return (
      <div className="flex flex-col h-[calc(100vh-73px)] justify-between p-6 select-none bg-slate-950">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between bg-slate-900/90 px-5 py-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              TERHUBUNG KE ROOM {room.code}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="text-xs text-rose-400 font-bold hover:underline"
          >
            Keluar
          </button>
        </div>

        {/* Player Profile Card */}
        <div className="my-auto flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-indigo-500/20 border-4 border-indigo-400 flex items-center justify-center text-6xl shadow-2xl shadow-indigo-500/30 animate-bounce">
              {currentPlayer.avatar}
            </div>
            {currentPlayer.isHost && (
              <span className="absolute -top-3 -right-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full border border-amber-300 shadow">
                HOST
              </span>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-black text-white">{currentPlayer.nickname}</h2>
            <p className="text-sm text-indigo-400 font-semibold mt-1">
              Controller Smartphone Aktif
            </p>
          </div>

          {/* Ready Button Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleReady();
            }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition ${
              currentPlayer.isReady
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            {currentPlayer.isReady ? 'SUDAH SIAP (READY)' : 'TEKAN JIKA SIAP!'}
          </button>

          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Perhatikan Layar TV utama. Layar controller di HP akan otomatis berubah saat Host memulai mini-game!
          </p>
        </div>

        <div className="text-center text-[10px] text-slate-600">
          SYAM PARTY GAME Realtime Sync &bull; Web Controller Mode
        </div>
      </div>
    );
  }

  // If Room is IN_GAME -> Dynamically load the Active Controller for this game
  return (
    <div className="flex flex-col h-[calc(100vh-73px)] w-full overflow-hidden select-none bg-slate-950">
      {/* Mini top banner during gameplay */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <span>{currentPlayer.avatar}</span>
          <span>{currentPlayer.nickname}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black text-cyan-400 uppercase">
            {room.currentGameId}
          </span>
        </div>
      </div>

      {/* Controller Area */}
      <div className="flex-1 w-full overflow-hidden touch-manipulation">
        <DynamicController
          room={room}
          player={currentPlayer}
          players={room.players || []}
          gameId={room.currentGameId || 'game'}
          onSendAction={onSendInput}
        />
      </div>
    </div>
  );
};
