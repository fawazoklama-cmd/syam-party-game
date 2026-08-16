import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Calculator, Timer, Award } from 'lucide-react';

interface MathProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

interface MathProblem {
  text: string;
  answer: number;
}

export const MathBattleView: React.FC<MathProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 5;
  const [timeLeft, setTimeLeft] = useState(15);
  const [problem, setProblem] = useState<MathProblem>({ text: '12 + 15', answer: 27 });
  const [solvedBy, setSolvedBy] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [playerId: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });

  // Generate math problem based on round difficulty
  const generateProblem = (r: number): MathProblem => {
    if (r <= 2) {
      // Easy addition/subtraction
      const a = Math.floor(Math.random() * 40) + 10;
      const b = Math.floor(Math.random() * 40) + 5;
      const isAdd = Math.random() > 0.4;
      return isAdd ? { text: `${a} + ${b}`, answer: a + b } : { text: `${Math.max(a, b)} - ${Math.min(a, b)}`, answer: Math.abs(a - b) };
    } else if (r <= 4) {
      // Medium multiplication / addition
      const a = Math.floor(Math.random() * 12) + 4;
      const b = Math.floor(Math.random() * 12) + 3;
      return { text: `${a} × ${b}`, answer: a * b };
    } else {
      // Hard combination
      const a = Math.floor(Math.random() * 10) + 5;
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor(Math.random() * 20) + 10;
      return { text: `(${a} × ${b}) + ${c}`, answer: a * b + c };
    }
  };

  useEffect(() => {
    setProblem(generateProblem(round));
    setTimeLeft(15);
    setSolvedBy(null);
  }, [round]);

  // Handle player numpad answers
  useEffect(() => {
    if (inputEvents.length === 0 || solvedBy) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'SUBMIT_MATH' && latest.payload) {
      const { answer } = latest.payload;
      if (answer === problem.answer) {
        // Correct answer! First to solve
        setSolvedBy(latest.playerId);
        sound.playCorrect();

        const speedBonus = timeLeft * 10;
        setScores((prev) => ({
          ...prev,
          [latest.playerId]: (prev[latest.playerId] || 0) + 100 + speedBonus,
        }));

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
        }, 2500);
      } else {
        sound.playWrong();
      }
    }
  }, [inputEvents, problem, solvedBy, timeLeft, round, scores, players, onGameEnd]);

  // Timer
  useEffect(() => {
    if (solvedBy) return;
    if (timeLeft <= 0) {
      // Timeout, move to next round
      sound.playWrong();
      setTimeout(() => {
        if (round >= totalRounds) {
          const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
          const rankings = sorted.map((p, idx) => ({
            playerId: p.id,
            rank: idx + 1,
            score: scores[p.id] || 0,
          }));
          onGameEnd(rankings);
        } else {
          setRound((r) => r + 1);
        }
      }, 2000);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, solvedBy, round]);

  const solverPlayer = players.find((p) => p.id === solvedBy);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">MATH BATTLE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 font-bold">Ronde {round} / {totalRounds}</span>
          <div className="flex items-center gap-1.5 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
            <Timer className="w-5 h-5" /> {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Math Formula Card */}
      <div className="my-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/30">
          Hitung Jawaban dengan Cepat di HP
        </div>

        <div className="p-10 rounded-3xl bg-slate-900/90 border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 max-w-2xl w-full">
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-wide">
            {problem.text} = ?
          </h1>
        </div>

        {solvedBy && solverPlayer && (
          <div className="flex items-center gap-3 bg-emerald-500/20 border-2 border-emerald-400 px-6 py-3 rounded-2xl animate-bounce">
            <span className="text-3xl">{solverPlayer.avatar}</span>
            <span className="text-xl font-extrabold text-emerald-300">
              {solverPlayer.nickname} menjawab benar duluan! (+{100 + timeLeft * 10} pts)
            </span>
          </div>
        )}
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-900/80 shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p.avatar}</span>
              <span className="font-bold text-sm text-white truncate max-w-[100px]">{p.nickname}</span>
            </div>
            <span className="text-lg font-black text-cyan-400">{scores[p.id] || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
