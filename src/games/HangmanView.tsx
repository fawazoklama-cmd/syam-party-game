import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { HANGMAN_WORDS } from '../data/quizData';
import { sound } from '../lib/sound';
import { Type, Timer, Award } from 'lucide-react';

interface HangmanProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const HangmanView: React.FC<HangmanProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [wordObj] = useState(() => HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [playerScores, setPlayerScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });
  const [timeLeft, setTimeLeft] = useState(90);

  const targetWord = wordObj.word.toUpperCase();
  const maxWrongs = 6;

  // Handle letter guesses
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'GUESS_LETTER' && latest.payload?.letter) {
      const char = (latest.payload.letter as string).toUpperCase();
      if (guessedLetters.includes(char)) return;

      setGuessedLetters((prev) => [...prev, char]);

      if (targetWord.includes(char)) {
        // Correct letter
        sound.playCorrect();
        setPlayerScores((prev) => ({
          ...prev,
          [latest.playerId]: (prev[latest.playerId] || 0) + 40,
        }));
      } else {
        // Wrong letter
        sound.playWrong();
        setWrongCount((w) => w + 1);
      }
    }
  }, [inputEvents, guessedLetters, targetWord]);

  // Check victory / defeat
  const isWon = targetWord.split('').every((c) => guessedLetters.includes(c));
  const isLost = wrongCount >= maxWrongs;

  useEffect(() => {
    if (isWon || isLost || timeLeft <= 0) {
      sound.playVictory();
      const sorted = [...players].sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0));
      const rankings = sorted.map((p, idx) => ({
        playerId: p.id,
        rank: idx + 1,
        score: (playerScores[p.id] || 0) + (isWon ? 100 : 0),
      }));

      const timeout = setTimeout(() => {
        onGameEnd(rankings);
      }, 3500);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isWon, isLost, timeLeft]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Type className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">TEBAK KATA (HANGMAN)</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" /> {timeLeft}s
        </div>
      </div>

      {/* Center Game Arena */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 max-w-4xl mx-auto w-full">
        {/* Clue Badge */}
        <div className="bg-cyan-500/20 text-cyan-300 px-6 py-2 rounded-full border border-cyan-400/40 text-sm font-bold shadow">
          💡 Petunjuk: {wordObj.clue}
        </div>

        {/* Hangman Visual */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: maxWrongs }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                i < wrongCount ? 'bg-rose-600 border-rose-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {i < wrongCount ? '💀' : '❤️'}
            </div>
          ))}
        </div>

        {/* Hidden Word Letters */}
        <div className="flex gap-3 flex-wrap justify-center">
          {targetWord.split('').map((char, idx) => {
            const revealed = guessedLetters.includes(char) || isLost;
            return (
              <div
                key={idx}
                className={`w-14 h-16 md:w-16 md:h-20 rounded-2xl border-4 flex items-center justify-center font-black text-3xl md:text-4xl shadow-xl transition-all ${
                  revealed
                    ? 'bg-slate-900 border-cyan-400 text-cyan-300 scale-105'
                    : 'bg-slate-950 border-slate-700 text-transparent'
                }`}
              >
                {revealed ? char : '_'}
              </div>
            );
          })}
        </div>

        {isWon && (
          <div className="text-3xl font-black text-emerald-400 animate-bounce">
            🎉 SELAMAT! KATA BERHASIL DITEBAK!
          </div>
        )}

        {isLost && (
          <div className="text-2xl font-black text-rose-400">
            😢 KESEMPATAN HABIS! Kata yang benar adalah: {targetWord}
          </div>
        )}
      </div>

      {/* Bottom Scores */}
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
            <span className="text-lg font-black text-cyan-400">{playerScores[p.id] || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
