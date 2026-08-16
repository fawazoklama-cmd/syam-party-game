import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Sparkles, Timer } from 'lucide-react';

interface ColorMatchProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const COLOR_MAP = [
  { name: 'MERAH', code: '#f43f5e' },
  { name: 'BIRU', code: '#3b82f6' },
  { name: 'HIJAU', code: '#10b981' },
  { name: 'KUNING', code: '#f59e0b' },
];

export const ColorMatchView: React.FC<ColorMatchProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 6;
  const [timeLeft, setTimeLeft] = useState(8);
  const [currentPrompt, setCurrentPrompt] = useState({ word: 'MERAH', fontColor: '#3b82f6', targetIsFont: true });
  const [playerAnswers, setPlayerAnswers] = useState<{ [id: string]: string }>({});
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  // Generate new Stroop puzzle
  useEffect(() => {
    const wordItem = COLOR_MAP[Math.floor(Math.random() * COLOR_MAP.length)];
    const colorItem = COLOR_MAP[Math.floor(Math.random() * COLOR_MAP.length)];
    const isTargetFont = Math.random() > 0.5;

    setCurrentPrompt({
      word: wordItem.name,
      fontColor: colorItem.code,
      targetIsFont: isTargetFont,
    });
    setTimeLeft(Math.max(4, 9 - round));
    setPlayerAnswers({});
  }, [round]);

  // Handle player answer
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'PICK_COLOR' && latest.payload?.color) {
      const chosenColor = latest.payload.color as string;
      setPlayerAnswers((prev) => {
        if (prev[latest.playerId] !== undefined) return prev;
        return { ...prev, [latest.playerId]: chosenColor };
      });
    }
  }, [inputEvents]);

  // Evaluate Round
  useEffect(() => {
    if (timeLeft <= 0) {
      // Find correct answer
      const correctColorName = currentPrompt.targetIsFont
        ? COLOR_MAP.find((c) => c.code === currentPrompt.fontColor)?.name
        : currentPrompt.word;

      setScores((prev) => {
        const next = { ...prev };
        players.forEach((p) => {
          if (playerAnswers[p.id] === correctColorName) {
            next[p.id] = (next[p.id] || 0) + 50 + timeLeft * 10;
          }
        });
        return next;
      });

      sound.playCorrect();

      setTimeout(() => {
        if (round >= totalRounds) {
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
      }, 1500);
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
          <Sparkles className="w-6 h-6 text-amber-400" />
          <span className="font-extrabold text-xl text-white">COLOR MATCH (STROOP EFFECT)</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" /> {timeLeft}s
        </div>
      </div>

      {/* Main Display */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-cyan-500/10 text-cyan-300 px-6 py-2 rounded-full border border-cyan-500/30 text-sm font-bold">
          {currentPrompt.targetIsFont
            ? '🎯 PILIH WARNA TINTA / FONT TULISAN INI:'
            : '🎯 PILIH ARTI KATA DARI TULISAN INI:'}
        </div>

        <div className="p-12 rounded-3xl bg-slate-900/90 border-4 border-slate-700 shadow-2xl max-w-xl w-full">
          <h1
            style={{ color: currentPrompt.fontColor }}
            className="text-6xl md:text-7xl font-black tracking-widest drop-shadow-lg"
          >
            {currentPrompt.word}
          </h1>
        </div>
      </div>

      {/* Players response status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {players.map((p) => {
          const ans = playerAnswers[p.id];
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                ans ? 'border-emerald-500 bg-emerald-950/40' : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-bold text-sm text-white truncate">{p.nickname}</span>
              </div>
              <span className="text-lg font-black text-cyan-400">{scores[p.id] || 0} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
