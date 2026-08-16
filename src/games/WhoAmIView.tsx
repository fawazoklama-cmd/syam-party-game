import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { UserCheck, Timer, Award } from 'lucide-react';

interface WhoAmIProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const IDENTITIES = [
  { name: 'SINGA', category: 'Hewan', secretClues: 'Raja hutan, punya surai lebat' },
  { name: 'PIZZA', category: 'Makanan', secretClues: 'Berasal dari Italia, potongan segitiga' },
  { name: 'DOKTER', category: 'Profesi', secretClues: 'Pakai jas putih dan stetoskop' },
  { name: 'SPIDER-MAN', category: 'Karakter', secretClues: 'Bisa merayap di dinding dan menembak jaring' },
  { name: 'JEPANG', category: 'Negara', secretClues: 'Negara sakura dengan Gunung Fuji' },
];

export const WhoAmIView: React.FC<WhoAmIProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [identityObj] = useState(() => IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)]);
  const [clues, setClues] = useState<{ player: Player; clue: string }[]>([]);
  const [solvedBy, setSolvedBy] = useState<Player | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  // Handle clue submission and identity guesses
  useEffect(() => {
    if (inputEvents.length === 0 || solvedBy) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'SUBMIT_CLUE' && latest.payload?.clue) {
      const p = players.find((pl) => pl.id === latest.playerId);
      if (p) {
        sound.playClick();
        setClues((prev) => [...prev, { player: p, clue: latest.payload.clue }]);
        setScores((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 30 }));
      }
    }

    if (latest.action === 'GUESS_IDENTITY' && latest.payload?.answer) {
      const ans = (latest.payload.answer as string).trim().toUpperCase();
      const p = players.find((pl) => pl.id === latest.playerId);
      if (p && ans === identityObj.name) {
        // Correct identity guess!
        sound.playVictory();
        setSolvedBy(p);
        setScores((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 150 + timeLeft * 2 }));

        setTimeout(() => {
          const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
          const rankings = sorted.map((pl, idx) => ({
            playerId: pl.id,
            rank: idx + 1,
            score: scores[pl.id] || 0,
          }));
          onGameEnd(rankings);
        }, 3500);
      } else {
        sound.playWrong();
      }
    }
  }, [inputEvents, solvedBy, identityObj, timeLeft, players, scores, onGameEnd]);

  // Timer
  useEffect(() => {
    if (solvedBy) return;
    if (timeLeft <= 0) {
      sound.playWrong();
      const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
      const rankings = sorted.map((pl, idx) => ({
        playerId: pl.id,
        rank: idx + 1,
        score: scores[pl.id] || 0,
      }));
      onGameEnd(rankings);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, solvedBy]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">SIAPA AKU?</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" /> {timeLeft}s
        </div>
      </div>

      {/* Main Secret Card Display */}
      <div className="my-auto flex flex-col items-center justify-center space-y-4 max-w-3xl mx-auto w-full text-center">
        <div className="bg-cyan-500/20 text-cyan-300 px-6 py-2 rounded-full border border-cyan-400/40 font-bold text-sm">
          🎭 Kategori: {identityObj.category}
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/90 border-4 border-cyan-500/50 shadow-2xl w-full">
          <h2 className="text-4xl font-black text-white mb-2">
            {solvedBy ? `🎉 AKU ADALAH: ${identityObj.name}!` : '❓ SIAPAKAH IDENTITAS RAHASIA INI?'}
          </h2>
          <p className="text-sm text-slate-400">
            Kirimkan petunjuk (clue) atau tebak langsung melalui HP!
          </p>
        </div>

        {/* Live Clues Feed */}
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          {clues.map((c, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl text-sm"
            >
              <span>{c.player.avatar}</span>
              <span className="font-bold text-white">{c.player.nickname}:</span>
              <span className="text-cyan-300 font-semibold">"{c.clue}"</span>
            </div>
          ))}
          {clues.length === 0 && (
            <p className="text-xs text-slate-500 italic">Belum ada petunjuk yang masuk...</p>
          )}
        </div>
      </div>

      {/* Players Scores */}
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
