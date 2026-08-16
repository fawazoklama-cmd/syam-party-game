import React, { useState, useEffect } from 'react';
import { Player, Room, ControllerInputEvent } from '../types';
import { DynamicController } from '../components/controllers/DynamicController';
import { sound } from '../lib/sound';
import { roomManager } from '../lib/roomManager';
import { WebRTCStatus } from '../lib/webrtcManager';
import { GAME_REGISTRY } from '../data/games';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sparkles,
  LogOut,
  Gamepad2,
  Volume2,
  Radio,
  Clipboard,
  Copy,
  Check,
  Edit3,
  Users,
  Play,
  RotateCcw,
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
const STORAGE_PROFILE_KEY = 'syam_player_profile';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState(AVATARS[0]);
  const [webrtcStatus, setWebrtcStatus] = useState<WebRTCStatus>(roomManager.getWebRTCStatus());

  // Load saved profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        const { nickname: savedName, avatar: savedAv } = JSON.parse(saved);
        if (savedName) setNickname(savedName);
        if (savedAv) setAvatar(savedAv);
      }
    } catch {}
  }, []);

  useEffect(() => {
    return roomManager.onWebRTCStatusChange((status) => {
      setWebrtcStatus(status);
    });
  }, []);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Handle Paste from Clipboard
  const handlePasteCode = async () => {
    sound.playClick();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          // Extract code if text is a URL like ...?code=SYAM-1234
          let extracted = text.trim();
          if (extracted.includes('code=')) {
            const match = extracted.match(/code=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) extracted = match[1];
          }
          setCode(extracted.toUpperCase());
        }
      }
    } catch (err) {
      console.warn('Clipboard paste error:', err);
    }
  };

  // Handle Join Submit
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nickname.trim()) {
      setErrorMsg('Mohon isi kode room dan nama panggilanmu');
      sound.playCountdownTick();
      return;
    }

    setIsJoining(true);
    setErrorMsg('');
    sound.playClick();

    try {
      const cleanCode = code.trim().toUpperCase();
      const res = await onJoinRoom(cleanCode, nickname.trim(), avatar);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal bergabung. Pastikan kode room benar dan masih aktif.');
        sound.playCountdownTick();
      } else {
        // Save profile for subsequent sessions
        try {
          localStorage.setItem(
            STORAGE_PROFILE_KEY,
            JSON.stringify({ nickname: nickname.trim(), avatar })
          );
        } catch {}
        sound.playVictory();
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsJoining(false);
    }
  };

  // Copy invitation link to share
  const handleCopyInviteLink = async () => {
    if (!room) return;
    sound.playClick();
    const roomCode = room.code || room.roomCode;
    const inviteUrl = `${window.location.origin}/#controller?code=${roomCode}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = inviteUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  // Save edited profile in Lobby
  const handleSaveProfileEdit = async () => {
    if (!editNickname.trim()) return;
    sound.playClick();
    await roomManager.updateProfile(editNickname.trim(), editAvatar);
    try {
      localStorage.setItem(
        STORAGE_PROFILE_KEY,
        JSON.stringify({ nickname: editNickname.trim(), avatar: editAvatar })
      );
    } catch {}
    setIsEditingProfile(false);
  };

  // If NOT joined yet -> Show Join Form
  if (!room || !currentPlayer) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-73px)] justify-center items-center p-4 sm:p-6 select-none bg-slate-950">
        <div className="w-full max-w-md bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mx-auto shadow-lg">
              <Smartphone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">PLAY CONTROLLER</h2>
            <p className="text-xs text-slate-400 font-medium">
              Gabung ke Room TV untuk mengontrol permainan dari smartphone
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-rose-300 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Room Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  Kode Room (4-8 Karakter):
                </label>
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Tempel</span>
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: 4821 atau SYAM-4821"
                maxLength={14}
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
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
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
              {isJoining ? 'Menghubungkan...' : 'GABUNG KE GAME 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If Room is WAITING / LOBBY -> Show Waiting Room
  if (room.status === 'LOBBY' || !room.currentGameId) {
    const roomCode = room.code || room.roomCode;
    const isPlayerHost = currentPlayer.isHost || room.hostPlayerId === currentPlayer.id;

    return (
      <div className="flex flex-col min-h-[calc(100vh-73px)] justify-between p-4 sm:p-6 select-none bg-slate-950 max-w-lg mx-auto w-full">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                webrtcStatus.quality === 'webrtc_connected'
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {roomCode}
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                webrtcStatus.quality === 'webrtc_connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {webrtcStatus.quality === 'webrtc_connected'
                ? `P2P ${webrtcStatus.rttMs ? `${webrtcStatus.rttMs}ms` : '⚡'}`
                : 'REALTIME'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInviteLink}
              title="Salin Link Controller"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin!' : 'Bagikan'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onLeaveRoom();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-500/30 transition"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Player Profile Card / Profile Edit Modal */}
        <div className="my-auto flex flex-col items-center justify-center text-center space-y-5 py-4">
          {!isEditingProfile ? (
            <>
              <div className="relative">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 flex items-center justify-center text-6xl shadow-2xl animate-bounce"
                  style={{
                    backgroundColor: `${currentPlayer.playerColor || '#6366f1'}20`,
                    borderColor: currentPlayer.playerColor || '#6366f1',
                    boxShadow: `0 20px 40px ${currentPlayer.playerColor || '#6366f1'}30`,
                  }}
                >
                  {currentPlayer.avatar}
                </div>
                {isPlayerHost && (
                  <span className="absolute -top-3 -right-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full border border-amber-300 shadow">
                    👑 HOST
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{currentPlayer.nickname}</h2>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setEditNickname(currentPlayer.nickname);
                      setEditAvatar(currentPlayer.avatar);
                      setIsEditingProfile(true);
                    }}
                    title="Ubah Nama & Avatar"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-indigo-400 font-bold mt-1">
                  Controller Smartphone Siap Digunakan
                </p>
              </div>

              {/* Ready Button Toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleReady();
                }}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl active:scale-95 transition ${
                  currentPlayer.isReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
                {currentPlayer.isReady ? 'SUDAH SIAP (READY) ✅' : 'TEKAN JIKA SIAP!'}
              </button>
            </>
          ) : (
            /* In-Lobby Profile Editor */
            <div className="w-full bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white">Ubah Profil Pemain</h3>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="Nama kamu..."
                maxLength={12}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm outline-none"
              />
              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    className={`text-xl p-1 rounded-lg border ${
                      editAvatar === av ? 'bg-indigo-500/30 border-indigo-400 ring-1 ring-indigo-400' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfileEdit}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Simpan Profil
                </button>
              </div>
            </div>
          )}

          {/* Connected Players in Lobby */}
          <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Pemain di Room ({room.players?.length || 1}/{room.maxPlayers || 8})
              </span>
              <span className="text-[10px] text-slate-500">Lobby TV</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {room.players?.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs ${
                    p.id === currentPlayer.id
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-lg">{p.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold truncate text-white">
                      {p.nickname} {p.id === currentPlayer.id ? '(Kamu)' : ''}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {p.isReady ? 'Siap' : 'Menunggu'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Host Launcher if this device is the Host */}
          {isPlayerHost && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  👑 Kontrol Host dari HP
                </span>
                <span className="text-[10px] text-amber-400/80">Luncurkan Mini-Game</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  defaultValue={room.currentGameId || 'quiz-battle'}
                  onChange={(e) => roomManager.startGame(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none"
                >
                  {GAME_REGISTRY.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.name} ({g.category})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => roomManager.startGame(room.currentGameId || 'quiz-battle')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai</span>
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            Perhatikan Layar TV utama. Layar controller di HP akan otomatis berganti saat game dimulai!
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
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <span className="text-base">{currentPlayer.avatar}</span>
          <span className="truncate max-w-[120px]">{currentPlayer.nickname}</span>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
              webrtcStatus.quality === 'webrtc_connected'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            }`}
          >
            {webrtcStatus.quality === 'webrtc_connected'
              ? `P2P ${webrtcStatus.rttMs ? `${webrtcStatus.rttMs}ms` : '⚡'}`
              : 'SYNC'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black text-cyan-400 uppercase truncate max-w-[140px]">
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
