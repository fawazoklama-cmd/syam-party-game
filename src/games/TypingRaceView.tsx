import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent, PLAYER_COLORS } from '../types';
import { sound } from '../lib/sound';
import { Keyboard, Timer, Trophy, Car } from 'lucide-react';

interface TypingProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const SENTENCES = [
  'Kucing belang tiga melompat riang di atas meja kayu bundar.',
  'Pesta game paling seru malam ini bersama teman-teman terbaik.',
  'Teknologi canggih mengubah cara manusia berkomunikasi dan bermain.',
  'Segelas kopi susu hangat di pagi hari membuat semangat bekerja.',
  'Indonesia memiliki ribuan pulau indah dari Sabang hingga Merauke.',
];

export const TypingRaceView: React.FC<TypingProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [targetSentence] = useState(() => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [progress, setProgress] = useState<{ [playerId: string]: { text: string; pct: number; finished: boolean; finishTime: number } }>(() => {
    const p: any = {};
    players.forEach((pl) => (p[pl.id] = { text: '', pct: 0, finished: false, finishTime: 0 }));
    return p;
  });

  // Handle typing input
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'TYPING_UPDATE' && latest.payload) {
      const typed = (latest.payload.text || '') as string;
      const target = targetSentence;

      // Count matching prefix
      let matchCount = 0;
      for (let i = 0; i < typed.length; i++) {
        if (i < target.length && typed[i] === target[i]) {
          matchCount++;
        } else {
          break;
        }
      }

      const pct = Math.min(100, Math.round((matchCount / target.length) * 100));
      const isFinished = matchCount >= target.length;

      setProgress((prev) => {
        const current = prev[latest.playerId] || { text: '', pct: 0, finished: false, finishTime: 0 };
        if (current.finished) return prev;

        if (isFinished && !current.finished) {
          sound.playVictory();
        }

        return {
          ...prev,
          [latest.playerId]: {
            text: typed,
            pct,
            finished: isFinished,
            finishTime: isFinished ? Date.now() : 0,
          },
        };
      });
    }
  }, [inputEvents, targetSentence]);

  // Check all finished or timer end
  useEffect(() => {
    const allDone = players.every((p) => progress[p.id]?.finished);
    if (allDone || timeLeft <= 0) {
      finishGame();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, progress, players]);

  const finishGame = () => {
    const sorted = [...players].sort((a, b) => {
      const pA = progress[a.id] || { pct: 0, finished: false, finishTime: 0 };
      const pB = progress[b.id] || { pct: 0, finished: false, finishTime: 0 };
      if (pA.finished && !pB.finished) return -1;
      if (!pA.finished && pB.finished) return 1;
      if (pA.finished && pB.finished) return pA.finishTime - pB.finishTime;
      return pB.pct - pA.pct;
    });

    const rankings = sorted.map((p, idx) => {
      const prog = progress[p.id] || { pct: 0, finished: false };
      return {
        playerId: p.id,
        rank: idx + 1,
        score: prog.pct * 2 + (prog.finished ? 100 - idx * 20 : 0),
      };
    });

    onGameEnd(rankings);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Keyboard className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">TYPING RACE</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" /> {timeLeft}s
        </div>
      </div>

      {/* Target Sentence Display */}
      <div className="my-2 bg-slate-900/90 border-2 border-cyan-500/40 p-6 rounded-3xl text-center shadow-xl max-w-4xl mx-auto w-full">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-2">
          Ketik Kalimat Berikut Persis di HP:
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-relaxed">
          "{targetSentence}"
        </h2>
      </div>

      {/* Race Lanes */}
      <div className="flex-1 my-2 flex flex-col justify-center space-y-3 max-w-5xl mx-auto w-full">
        {players.map((p, idx) => {
          const prog = progress[p.id] || { pct: 0, finished: false };
          const color = p.playerColor || PLAYER_COLORS[idx % PLAYER_COLORS.length];

          return (
            <div key={p.id} className="relative bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.avatar}</span>
                  <span className="text-white font-bold">{p.nickname}</span>
                </div>
                <span className="text-cyan-400 font-extrabold">{prog.pct}%</span>
              </div>

              {/* Lane Bar */}
              <div className="relative h-8 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${prog.pct}%`, backgroundColor: color }}
                  className="h-full transition-all duration-150 rounded-xl opacity-80"
                />

                {/* Car Marker */}
                <div
                  style={{ left: `calc(${Math.min(94, prog.pct)}%)` }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-2 text-xl drop-shadow-md transition-all duration-150"
                >
                  🚗
                </div>

                {/* Finish Line */}
                <div className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-black text-amber-400">
                  🏁
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-400">
        Mobilmu melaju secara realtime seiring ketikanmu yang benar di HP!
      </div>
    </div>
  );
};
