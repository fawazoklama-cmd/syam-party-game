import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Share2, Timer, ArrowRight } from 'lucide-react';

interface WordChainProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const WordChainView: React.FC<WordChainProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [chain, setChain] = useState<string[]>(['MOBIL']);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [round, setRound] = useState(1);
  const totalRounds = 6;
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  const activePlayer = players[currentTurnIdx % players.length];
  const lastWord = chain[chain.length - 1];
  const requiredChar = lastWord.charAt(lastWord.length - 1).toUpperCase();

  // Handle word submit
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'SUBMIT_WORD' && latest.payload?.word) {
      if (latest.playerId !== activePlayer.id) return; // Only active turn

      const submitted = (latest.payload.word as string).trim().toUpperCase();
      if (submitted.length >= 3 && submitted.startsWith(requiredChar) && !chain.includes(submitted)) {
        // Valid word
        sound.playCorrect();
        setChain((prev) => [...prev, submitted]);
        setScores((prev) => ({
          ...prev,
          [activePlayer.id]: (prev[activePlayer.id] || 0) + submitted.length * 15,
        }));
        nextTurn();
      } else {
        sound.playWrong();
      }
    }
  }, [inputEvents, activePlayer, requiredChar, chain]);

  const nextTurn = () => {
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
      setCurrentTurnIdx((i) => i + 1);
      setRound((r) => r + 1);
      setTimeLeft(15);
    }
  };

  // Turn Timer
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
          <Share2 className="w-6 h-6 text-amber-400" />
          <span className="font-extrabold text-xl text-white">SAMBUNG KATA</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400">Ronde {round} / {totalRounds}</span>
          <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
            <Timer className="w-5 h-5" /> {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Chain Visual */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 max-w-4xl mx-auto w-full">
        {/* Active Turn Banner */}
        <div className="flex items-center gap-3 bg-cyan-500/20 border-2 border-cyan-400 px-6 py-3 rounded-2xl animate-pulse">
          <span className="text-3xl">{activePlayer.avatar}</span>
          <span className="text-xl font-black text-cyan-300">
            Giliran {activePlayer.nickname}!
          </span>
        </div>

        {/* Required Letter Target */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Mulai kata baru dari huruf:
          </span>
          <div className="w-24 h-24 rounded-3xl bg-amber-500 border-4 border-amber-300 flex items-center justify-center text-6xl font-black text-slate-950 shadow-2xl shadow-amber-500/50">
            {requiredChar}
          </div>
        </div>

        {/* Word History Sequence */}
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-2xl">
          {chain.slice(-5).map((w, idx, arr) => (
            <React.Fragment key={idx}>
              <span className={`px-4 py-2 rounded-xl font-black text-lg border ${
                idx === arr.length - 1 ? 'bg-slate-900 border-cyan-400 text-cyan-300 scale-105' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                {w}
              </span>
              {idx < arr.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              p.id === activePlayer.id ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 bg-slate-900/80'
            }`}
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
