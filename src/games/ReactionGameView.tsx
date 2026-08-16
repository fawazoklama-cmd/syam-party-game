import React, { useState, useEffect, useRef } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Zap, Timer, Award } from 'lucide-react';

interface ReactionProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const ReactionGameView: React.FC<ReactionProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [gameState, setGameState] = useState<'WAITING' | 'TRIGGERED' | 'EVALUATED'>('WAITING');
  const [triggerTime, setTriggerTime] = useState<number>(0);
  const [reactions, setReactions] = useState<{ [playerId: string]: number | 'FALSE_START' }>({});
  const [scores, setScores] = useState<{ [playerId: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start round cycle
  useEffect(() => {
    setGameState('WAITING');
    setReactions({});
    sound.playCountdownTick();

    // Random delay between 2.5s and 5.5s
    const delay = Math.floor(Math.random() * 3000) + 2500;
    timerRef.current = setTimeout(() => {
      setTriggerTime(Date.now());
      setGameState('TRIGGERED');
      sound.playCountdownGo();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [round]);

  // Listen for buzz inputs
  useEffect(() => {
    if (inputEvents.length === 0 || gameState === 'EVALUATED') return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'BUZZ') {
      const pId = latest.playerId;
      if (reactions[pId] !== undefined) return; // Already buzzed

      if (gameState === 'WAITING') {
        // FALSE START!
        sound.playWrong();
        setReactions((prev) => ({ ...prev, [pId]: 'FALSE_START' }));
      } else if (gameState === 'TRIGGERED') {
        // Valid reaction time
        const ms = Date.now() - triggerTime;
        sound.playCorrect();
        setReactions((prev) => ({ ...prev, [pId]: ms }));
      }
    }
  }, [inputEvents, gameState, triggerTime, reactions]);

  // Check if all players reacted or timeout
  useEffect(() => {
    if (gameState !== 'TRIGGERED') return;
    const allReacted = players.every((p) => reactions[p.id] !== undefined);

    if (allReacted) {
      evaluateRound();
    }
  }, [reactions, gameState]);

  // Max 5s after trigger to evaluate
  useEffect(() => {
    if (gameState !== 'TRIGGERED') return;
    const timeout = setTimeout(() => {
      evaluateRound();
    }, 4000);
    return () => clearTimeout(timeout);
  }, [gameState]);

  const evaluateRound = () => {
    setGameState('EVALUATED');

    // Calculate round points
    const validPlayers = players
      .filter((p) => typeof reactions[p.id] === 'number')
      .sort((a, b) => (reactions[a.id] as number) - (reactions[b.id] as number));

    setScores((prev) => {
      const next = { ...prev };
      validPlayers.forEach((p, idx) => {
        const bonus = Math.max(20, 150 - idx * 30);
        next[p.id] = (next[p.id] || 0) + bonus;
      });
      return next;
    });

    // Next round or end
    setTimeout(() => {
      if (round >= totalRounds) {
        // End Game
        const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
        const rankings = sorted.map((p, idx) => ({
          playerId: p.id,
          rank: idx + 1,
          score: scores[p.id] || 0,
        }));
        sound.playVictory();
        onGameEnd(rankings);
      } else {
        setRound((r) => r + 1);
      }
    }, 3500);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-400" />
          <span className="font-extrabold text-xl text-white">REACTION BATTLE</span>
        </div>
        <div className="bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-bold">
          Ronde {round} / {totalRounds}
        </div>
      </div>

      {/* Main Signal Display */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        {gameState === 'WAITING' && (
          <div className="space-y-4">
            <div className="w-48 h-48 rounded-full bg-rose-600/30 border-8 border-rose-500 flex items-center justify-center shadow-2xl mx-auto animate-pulse">
              <span className="text-3xl font-black text-rose-300">BERSIAP...</span>
            </div>
            <p className="text-slate-400 text-sm font-semibold">
              Jangan tekan dulu sebelum berubah menjadi hijau!
            </p>
          </div>
        )}

        {gameState === 'TRIGGERED' && (
          <div className="space-y-4 animate-bounce">
            <div className="w-56 h-56 rounded-full bg-emerald-500 border-8 border-emerald-300 flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/80 mx-auto">
              <Zap className="w-16 h-16 text-white" />
              <span className="text-4xl font-black text-white tracking-widest">TEKAN!</span>
            </div>
            <p className="text-emerald-400 font-extrabold text-lg">PENCET TOMBOL DI HP SEKARANG!</p>
          </div>
        )}

        {gameState === 'EVALUATED' && (
          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold text-cyan-400">Hasil Ronde Ini</h3>
            <p className="text-slate-400 text-sm">Menyiapkan ronde berikutnya...</p>
          </div>
        )}
      </div>

      {/* Reaction Times Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        {players.map((p) => {
          const res = reactions[p.id];
          return (
            <div
              key={p.id}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 bg-slate-900/90 shadow transition-all ${
                res === 'FALSE_START'
                  ? 'border-rose-500 bg-rose-950/30 text-rose-400'
                  : typeof res === 'number'
                  ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-3xl mb-1">{p.avatar}</span>
              <span className="font-bold text-sm text-white">{p.nickname}</span>
              <div className="mt-2 text-lg font-black">
                {res === 'FALSE_START' ? (
                  <span className="text-rose-400 text-sm">⚠️ FALSE START</span>
                ) : typeof res === 'number' ? (
                  <span>⚡ {res} ms</span>
                ) : (
                  <span className="text-xs text-slate-500">Menunggu...</span>
                )}
              </div>
              <div className="text-xs font-bold text-cyan-400 mt-1">
                Total: {scores[p.id] || 0} pts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
