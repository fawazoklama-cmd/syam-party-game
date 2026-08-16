import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import {
  QUIZ_BATTLE_QUESTIONS,
  FLAG_QUIZ_DATA,
  EMOJI_QUIZ_DATA,
  LOGO_QUIZ_DATA,
  SOUND_QUIZ_DATA,
} from '../data/quizData';
import { sound } from '../lib/sound';
import { HelpCircle, Timer, Award, Sparkles, Volume2 } from 'lucide-react';

interface QuizGameProps {
  gameId: string;
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const QuizBattleView: React.FC<QuizGameProps> = ({
  gameId,
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [playerAnswers, setPlayerAnswers] = useState<{ [playerId: string]: number }>({});
  const [playerScores, setPlayerScores] = useState<{ [playerId: string]: number }>(() => {
    const init: { [id: string]: number } = {};
    players.forEach((p) => (init[p.id] = 0));
    return init;
  });
  const [showAnswer, setShowAnswer] = useState(false);

  // Pick question set based on gameId
  const totalRounds = 5;
  const questions = React.useMemo(() => {
    if (gameId === 'flag-quiz') {
      return FLAG_QUIZ_DATA.slice(0, 10).map((f) => ({
        id: f.id,
        question: `Negara manakah pemilik bendera ini?`,
        flag: f.flagEmoji,
        options: f.options,
        answerIndex: f.answerIndex,
        category: 'Geografi',
      }));
    }
    if (gameId === 'emoji-quiz') {
      return EMOJI_QUIZ_DATA.slice(0, 10).map((e) => ({
        id: e.id,
        question: `Tebak ${e.clue} dari emoji ini:`,
        emoji: e.emojis,
        options: e.options,
        answerIndex: e.answerIndex,
        category: e.clue,
      }));
    }
    if (gameId === 'logo-quiz') {
      return LOGO_QUIZ_DATA.slice(0, 10).map((l) => ({
        id: l.id,
        question: `Merek atau brand apa yang memiliki logo ini?`,
        logoSymbol: l.iconSymbol,
        logoColor: l.brandColor,
        options: l.options,
        answerIndex: l.answerIndex,
        category: 'Brand',
      }));
    }
    if (gameId === 'sound-quiz') {
      return SOUND_QUIZ_DATA.map((s) => ({
        id: s.id,
        question: `Dengarkan suara yang diputar! Suara apakah ini?`,
        soundType: s.soundType,
        options: s.options as [string, string, string, string],
        answerIndex: s.answerIndex,
        category: s.category,
      }));
    }
    return QUIZ_BATTLE_QUESTIONS.slice(0, 10);
  }, [gameId]);

  const currentQ = questions[currentRound % questions.length];

  // Play sound effect if sound-quiz
  useEffect(() => {
    if (gameId === 'sound-quiz' && (currentQ as any)?.soundType && !showAnswer) {
      sound.playSoundEffectSample((currentQ as any).soundType);
    }
  }, [currentRound, showAnswer, gameId, currentQ]);

  // Handle incoming player inputs
  useEffect(() => {
    if (inputEvents.length === 0 || showAnswer) return;
    const latest = inputEvents[inputEvents.length - 1];
    if (latest.action === 'ANSWER' && latest.payload) {
      const { optionIndex } = latest.payload;
      setPlayerAnswers((prev) => {
        if (prev[latest.playerId] !== undefined) return prev; // Already answered
        return { ...prev, [latest.playerId]: optionIndex };
      });
    }
  }, [inputEvents, showAnswer]);

  // Round Timer Countdown
  useEffect(() => {
    if (showAnswer) return;
    if (timeLeft <= 0) {
      // Evaluate round
      evaluateRound();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
      if (timeLeft <= 5) sound.playCountdownTick();
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showAnswer]);

  const evaluateRound = () => {
    setShowAnswer(true);
    const correctIdx = currentQ.answerIndex;

    // Award scores
    setPlayerScores((prev) => {
      const next = { ...prev };
      players.forEach((p) => {
        if (playerAnswers[p.id] === correctIdx) {
          const speedBonus = Math.max(10, timeLeft * 10);
          next[p.id] = (next[p.id] || 0) + 100 + speedBonus;
        }
      });
      return next;
    });

    sound.playCorrect();

    // Next round or finish
    setTimeout(() => {
      if (currentRound + 1 >= totalRounds) {
        // Game Finish
        const sorted = [...players].sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0));
        const rankings = sorted.map((p, idx) => ({
          playerId: p.id,
          rank: idx + 1,
          score: playerScores[p.id] || 0,
        }));
        onGameEnd(rankings);
      } else {
        setCurrentRound((r) => r + 1);
        setShowAnswer(false);
        setPlayerAnswers({});
        setTimeLeft(15);
      }
    }, 3500);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionColors = [
    'from-rose-600 to-rose-700 border-rose-500',
    'from-blue-600 to-blue-700 border-blue-500',
    'from-amber-600 to-amber-700 border-amber-500',
    'from-emerald-600 to-emerald-700 border-emerald-500',
  ];

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Top Header: Round & Timer */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700/80 px-6 py-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {currentQ.category || 'Trivia'}
            </div>
            <div className="text-lg font-bold text-white">
              Ronde {currentRound + 1} / {totalRounds}
            </div>
          </div>
        </div>

        {/* Timer Bar & Pill */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-2xl ${timeLeft <= 5 ? 'bg-rose-500/30 text-rose-400 border border-rose-500 animate-pulse' : 'bg-slate-800 text-cyan-400 border border-cyan-500/30'}`}>
            <Timer className="w-6 h-6" />
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Center Question Display */}
      <div className="my-auto text-center space-y-6 max-w-4xl mx-auto w-full">
        {/* Custom Visual for Flag, Emoji, Logo, Sound */}
        {(currentQ as any).flag && (
          <div className="text-8xl drop-shadow-2xl animate-bounce">
            {(currentQ as any).flag}
          </div>
        )}

        {(currentQ as any).emoji && (
          <div className="text-6xl bg-slate-900/90 py-6 px-10 rounded-3xl border-2 border-cyan-500/40 inline-block shadow-2xl tracking-widest">
            {(currentQ as any).emoji}
          </div>
        )}

        {(currentQ as any).logoSymbol && (
          <div className="py-4 px-8 rounded-3xl bg-slate-900 border-2 border-slate-700 inline-block shadow-2xl">
            <span className="text-4xl font-black tracking-wide text-white">
              {(currentQ as any).logoSymbol}
            </span>
          </div>
        )}

        {gameId === 'sound-quiz' && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => sound.playSoundEffectSample((currentQ as any).soundType)}
              className="p-6 rounded-full bg-cyan-500/20 text-cyan-400 border-2 border-cyan-400 animate-pulse flex items-center justify-center hover:scale-105 transition"
            >
              <Volume2 className="w-12 h-12" />
            </button>
            <span className="text-sm text-cyan-300 font-semibold uppercase tracking-wider">
              Putar Ulang Efek Suara
            </span>
          </div>
        )}

        <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">
          {currentQ.question}
        </h2>
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
        {currentQ.options.map((opt, idx) => {
          const isCorrect = idx === currentQ.answerIndex;
          let cardStyle = `bg-gradient-to-r ${optionColors[idx]} opacity-95`;

          if (showAnswer) {
            if (isCorrect) {
              cardStyle = 'bg-emerald-500 border-emerald-300 scale-102 ring-4 ring-emerald-400 shadow-2xl';
            } else {
              cardStyle = 'bg-slate-900/60 border-slate-800 opacity-40';
            }
          }

          // Count players who chose this option
          const answeredPlayers = players.filter((p) => playerAnswers[p.id] === idx);

          return (
            <div
              key={idx}
              className={`relative flex items-center p-5 rounded-2xl border-2 text-white shadow-xl transition-all duration-300 ${cardStyle}`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-2xl mr-4 shrink-0 border border-white/30">
                {optionLetters[idx]}
              </div>
              <span className="text-xl font-bold flex-1 text-left">{opt}</span>

              {/* Show which players answered this option */}
              {answeredPlayers.length > 0 && (
                <div className="flex -space-x-2 ml-2">
                  {answeredPlayers.map((p) => (
                    <div
                      key={p.id}
                      title={p.nickname}
                      className="w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center text-sm shadow bg-slate-800"
                    >
                      {p.avatar}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Players Live Status */}
      <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
        {players.map((p) => {
          const hasAnswered = playerAnswers[p.id] !== undefined;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                hasAnswered
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xl">{p.avatar}</span>
              <span className="font-bold text-sm text-white">{p.nickname}</span>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-bold text-cyan-400">
                {playerScores[p.id] || 0} pts
              </span>
              {hasAnswered ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              ) : (
                <span className="text-xs text-slate-500">Berpikir...</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
