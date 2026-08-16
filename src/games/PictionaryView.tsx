import React, { useRef, useEffect, useState } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Palette, Timer, Award } from 'lucide-react';

interface PictionaryProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const SECRET_WORDS = [
  'KUCING', 'MOBIL', 'RUMAH', 'POHON', 'PESAWAT', 'PIZZA', 'SEPATU', 'BUNGA', 'BINTANG', 'GITAR'
];

export const PictionaryView: React.FC<PictionaryProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawerIndex, setDrawerIndex] = useState(0);
  const [secretWord, setSecretWord] = useState(() => SECRET_WORDS[0]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [guesses, setGuesses] = useState<{ player: Player; text: string; correct: boolean }[]>([]);
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  const activeDrawer = players[drawerIndex % players.length];

  // Process controller inputs (both DRAW_EVENT and GUESS_DRAWING)
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    // Realtime Drawing stroke broadcast
    if (latest.action === 'DRAW_EVENT' && latest.payload) {
      const { type, x, y, color, brushSize } = latest.payload;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (type === 'start') {
        ctx.beginPath();
        ctx.moveTo(x * (canvas.width / 400), y * (canvas.height / 300));
      } else if (type === 'draw') {
        ctx.strokeStyle = color || '#ffffff';
        ctx.lineWidth = (brushSize || 4) * 1.5;
        ctx.lineCap = 'round';
        ctx.lineTo(x * (canvas.width / 400), y * (canvas.height / 300));
        ctx.stroke();
      } else if (type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Guesses
    if (latest.action === 'GUESS_DRAWING' && latest.payload?.text) {
      if (latest.playerId === activeDrawer.id) return; // Drawer can't guess

      const guessText = (latest.payload.text as string).trim().toUpperCase();
      const p = players.find((pl) => pl.id === latest.playerId);
      if (!p) return;

      const isCorrect = guessText === secretWord;
      setGuesses((prev) => [{ player: p, text: guessText, correct: isCorrect }, ...prev.slice(0, 6)]);

      if (isCorrect) {
        sound.playCorrect();
        // Award points to guesser and drawer
        setScores((prev) => ({
          ...prev,
          [p.id]: (prev[p.id] || 0) + 120 + timeLeft * 2,
          [activeDrawer.id]: (prev[activeDrawer.id] || 0) + 60,
        }));
        nextTurn();
      } else {
        sound.playWrong();
      }
    }
  }, [inputEvents, activeDrawer, secretWord, timeLeft, players]);

  const nextTurn = () => {
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (drawerIndex + 1 >= Math.min(players.length, 4)) {
      // Game end
      const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
      const rankings = sorted.map((p, idx) => ({
        playerId: p.id,
        rank: idx + 1,
        score: scores[p.id] || 0,
      }));
      sound.playVictory();
      onGameEnd(rankings);
    } else {
      setDrawerIndex((i) => i + 1);
      setSecretWord(SECRET_WORDS[(drawerIndex + 1) % SECRET_WORDS.length]);
      setTimeLeft(45);
      setGuesses([]);
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      sound.playWrong();
      nextTurn();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-pink-400" />
          <span className="font-extrabold text-xl text-white">GAMBAR & TEBAK</span>
        </div>

        {/* Drawer Tag */}
        <div className="flex items-center gap-2 bg-pink-500/20 text-pink-300 px-4 py-1.5 rounded-xl border border-pink-500/30 font-bold">
          <span>🎨 Pelukis:</span>
          <span>{activeDrawer.avatar}</span>
          <span className="text-white">{activeDrawer.nickname}</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" /> {timeLeft}s
        </div>
      </div>

      {/* Main Canvas & Live Feed */}
      <div className="flex-1 my-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Drawing Screen (3 cols) */}
        <div className="md:col-span-3 h-full flex items-center justify-center bg-slate-950 rounded-3xl border-2 border-slate-700 p-2 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={600}
            height={450}
            className="w-full h-full aspect-[4/3] rounded-2xl bg-slate-950"
          />
        </div>

        {/* Live Guesses Feed (1 col) */}
        <div className="h-full flex flex-col justify-between bg-slate-900/90 rounded-3xl border border-slate-800 p-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Tebakan Pemain:
            </h4>
            <div className="space-y-2">
              {guesses.map((g, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                    g.correct
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-black animate-bounce'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{g.player.avatar}</span>
                  <span className="font-bold">{g.player.nickname}:</span>
                  <span>{g.text}</span>
                </div>
              ))}
              {guesses.length === 0 && (
                <p className="text-xs text-slate-500 italic">Belum ada tebakan...</p>
              )}
            </div>
          </div>

          <div className="text-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1 font-semibold">Petunjuk Huruf:</span>
            <span className="text-xl font-black tracking-widest text-cyan-400">
              {secretWord.length} HURUF ({secretWord.charAt(0)} _ _ ...)
            </span>
          </div>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-900/80 shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p.avatar}</span>
              <span className="font-bold text-sm text-white truncate">{p.nickname}</span>
            </div>
            <span className="text-lg font-black text-cyan-400">{scores[p.id] || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
