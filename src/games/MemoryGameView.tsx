import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { BrainCircuit, Timer } from 'lucide-react';

interface MemoryProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const PADS = [
  { id: 0, color: '#f43f5e', name: 'MERAH' },
  { id: 1, color: '#38bdf8', name: 'BIRU' },
  { id: 2, color: '#fbbf24', name: 'KUNING' },
  { id: 3, color: '#10b981', name: 'HIJAU' },
];

export const MemoryGameView: React.FC<MemoryProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [level, setLevel] = useState(1);
  const maxLevels = 5;
  const [sequence, setSequence] = useState<number[]>([]);
  const [flashingPad, setFlashingPad] = useState<number | null>(null);
  const [phase, setPhase] = useState<'SHOWING' | 'PLAYER_INPUT'>('SHOWING');
  const [playerInputs, setPlayerInputs] = useState<{ [id: string]: number[] }>({});
  const [playerEliminated, setPlayerEliminated] = useState<{ [id: string]: boolean }>({});
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  // Generate sequence for current level
  useEffect(() => {
    const newSeq: number[] = [];
    for (let i = 0; i < level + 2; i++) {
      newSeq.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSeq);
    setPhase('SHOWING');
    setPlayerInputs({});

    // Flash sequence one by one
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < newSeq.length) {
        const padIdx = newSeq[idx];
        setFlashingPad(padIdx);
        sound.playPongHit();
        setTimeout(() => setFlashingPad(null), 400);
        idx++;
      } else {
        clearInterval(interval);
        setFlashingPad(null);
        setPhase('PLAYER_INPUT');
      }
    }, 700);

    return () => clearInterval(interval);
  }, [level]);

  // Handle player pad input
  useEffect(() => {
    if (phase !== 'PLAYER_INPUT' || inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'PRESS_PAD' && latest.payload) {
      const padIdx = latest.payload.index as number;
      const pId = latest.playerId;
      if (playerEliminated[pId]) return;

      const currentInputs = playerInputs[pId] || [];
      const nextStepIdx = currentInputs.length;

      if (sequence[nextStepIdx] === padIdx) {
        // Correct step!
        const updated = [...currentInputs, padIdx];
        sound.playClick();
        setPlayerInputs((prev) => ({ ...prev, [pId]: updated }));

        if (updated.length === sequence.length) {
          // Completed this level!
          sound.playCorrect();
          setScores((prev) => ({ ...prev, [pId]: (prev[pId] || 0) + level * 50 }));
        }
      } else {
        // Wrong step! Eliminated for this round
        sound.playWrong();
        setPlayerEliminated((prev) => ({ ...prev, [pId]: true }));
      }
    }
  }, [inputEvents, phase, sequence, playerInputs, playerEliminated, level]);

  // Check if all players finished or eliminated
  useEffect(() => {
    if (phase !== 'PLAYER_INPUT') return;
    const allDone = players.every(
      (p) => playerEliminated[p.id] || (playerInputs[p.id] && playerInputs[p.id].length === sequence.length)
    );

    if (allDone) {
      setTimeout(() => {
        if (level >= maxLevels) {
          const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
          const rankings = sorted.map((p, idx) => ({
            playerId: p.id,
            rank: idx + 1,
            score: scores[p.id] || 0,
          }));
          sound.playVictory();
          onGameEnd(rankings);
        } else {
          setLevel((l) => l + 1);
        }
      }, 1500);
    }
  }, [playerInputs, playerEliminated, phase, level, players, sequence]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
          <span className="font-extrabold text-xl text-white">MEMORY BATTLE</span>
        </div>
        <div className="bg-purple-950/80 border border-purple-500/40 text-purple-300 px-4 py-1.5 rounded-xl font-bold">
          Level {level} / {maxLevels} (Panjang: {sequence.length})
        </div>
      </div>

      {/* Main 4 Pads Grid */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6">
        <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
          {phase === 'SHOWING' ? '👀 Perhatikan Urutan Pola yang Menyala!' : '📱 Masukkan Urutan Pola di HP!'}
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl w-72 h-72 md:w-80 md:h-80">
          {PADS.map((pad) => {
            const isLit = flashingPad === pad.id;
            return (
              <div
                key={pad.id}
                style={{
                  backgroundColor: isLit ? pad.color : `${pad.color}33`,
                  borderColor: pad.color,
                }}
                className={`rounded-2xl border-4 flex items-center justify-center font-black text-3xl shadow-xl transition-all duration-150 ${
                  isLit ? 'scale-105 shadow-2xl brightness-125' : 'opacity-60'
                }`}
              >
                {pad.id + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Players progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {players.map((p) => {
          const inp = playerInputs[p.id] || [];
          const isElim = playerEliminated[p.id];
          const isDone = inp.length === sequence.length;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                isDone
                  ? 'border-emerald-500 bg-emerald-950/40'
                  : isElim
                  ? 'border-rose-500 bg-rose-950/40 opacity-50'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.avatar}</span>
                <div>
                  <div className="font-bold text-sm text-white truncate">{p.nickname}</div>
                  <div className="text-xs text-slate-400">
                    {isDone ? '✅ Berhasil' : isElim ? '❌ Salah' : `${inp.length}/${sequence.length}`}
                  </div>
                </div>
              </div>
              <span className="text-lg font-black text-cyan-400">{scores[p.id] || 0} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
