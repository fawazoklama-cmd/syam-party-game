import React, { useState, useEffect } from 'react';
import { Player, Room, ControllerInputEvent } from '../types';
import { GAME_REGISTRY } from '../data/games';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';

// Game View Components
import { QuizBattleView } from './QuizBattleView';
import { SnakeGameView } from './SnakeGameView';
import { RacingGameView } from './RacingGameView';
import { PongGameView } from './PongGameView';
import { ReactionGameView } from './ReactionGameView';
import { MathBattleView } from './MathBattleView';
import { TypingRaceView } from './TypingRaceView';
import { HangmanView } from './HangmanView';
import { WordChainView } from './WordChainView';
import { PictionaryView } from './PictionaryView';
import { TicTacToeView } from './TicTacToeView';
import { ConnectFourView } from './ConnectFourView';
import { ColorMatchView } from './ColorMatchView';
import { MemoryGameView } from './MemoryGameView';
import { VotingBattleView } from './VotingBattleView';
import { WhoAmIView } from './WhoAmIView';

interface GameHubProps {
  room: Room;
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onFinishGame: (rankings: { playerId: string; rank: number; score: number }[]) => void;
  onRematch: () => void;
  onChangeGame: () => void;
}

export const GameHub: React.FC<GameHubProps> = ({
  room,
  players,
  inputEvents,
  onFinishGame,
  onRematch,
  onChangeGame,
}) => {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [gameEnded, setGameEnded] = useState(false);
  const [rankings, setRankings] = useState<{ playerId: string; rank: number; score: number }[]>([]);

  const gameId = room.currentGameId || 'quiz-battle';
  const gameDef = GAME_REGISTRY.find((g) => g.id === gameId) || GAME_REGISTRY[0];

  // 3-2-1-GO Countdown Sequence
  useEffect(() => {
    setCountdown(3);
    setGameEnded(false);
    setRankings([]);
    sound.playCountdownTick();

    const t3 = setTimeout(() => {
      setCountdown(2);
      sound.playCountdownTick();
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdown(1);
      sound.playCountdownTick();
    }, 2000);

    const t1 = setTimeout(() => {
      setCountdown(0); // GO!
      sound.playCountdownGo();
    }, 3000);

    const t0 = setTimeout(() => {
      setCountdown(null); // Playing
    }, 3800);

    return () => {
      clearTimeout(t3);
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(t0);
    };
  }, [gameId]);

  const handleGameEnd = (finalRankings: { playerId: string; rank: number; score: number }[]) => {
    setRankings(finalRankings);
    setGameEnded(true);
    sound.playVictory();

    // Trigger Confetti
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {}

    onFinishGame(finalRankings);
  };

  // Render 3-2-1-GO Overlay
  if (countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full select-none bg-slate-950/90 backdrop-blur-md">
        <div className="p-4 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="font-extrabold text-2xl tracking-wide">{gameDef.name}</span>
        </div>

        <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border-8 border-cyan-300 flex items-center justify-center shadow-2xl shadow-cyan-500/50 animate-pulse">
          <span className="text-7xl font-black text-white drop-shadow-lg">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>

        <p className="text-slate-400 font-semibold text-lg mt-8">
          Pegang HP masing-masing dan bersiaplah!
        </p>
      </div>
    );
  }

  // Render Result / Victory Screen
  if (gameEnded) {
    const pointBonuses: { [rank: number]: number } = { 1: 100, 2: 75, 3: 50, 4: 25 };

    return (
      <div className="flex flex-col items-center justify-between h-full w-full p-8 select-none bg-slate-950">
        {/* Top Victory Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-6 py-2 rounded-full border border-amber-400/40 text-sm font-bold shadow">
            <Trophy className="w-5 h-5" /> HASIL PERTANDINGAN
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            {gameDef.name} Selesai!
          </h1>
        </div>

        {/* Podium Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full my-auto items-end">
          {rankings.slice(0, 3).map((r, idx) => {
            const player = players.find((p) => p.id === r.playerId) || {
              nickname: 'Pemain',
              avatar: '😀',
            };
            const bonus = pointBonuses[r.rank] || 10;
            const heights = ['h-64 md:h-72', 'h-52 md:h-60', 'h-44 md:h-52'];
            const order = idx === 0 ? 'order-1 md:order-2' : idx === 1 ? 'order-2 md:order-1' : 'order-3';

            return (
              <div
                key={r.playerId}
                className={`flex flex-col items-center ${order}`}
              >
                <div className="text-5xl mb-2 animate-bounce">{player.avatar}</div>
                <div className="font-extrabold text-white text-lg mb-1">{player.nickname}</div>
                <div className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 mb-3">
                  +{bonus} Party Points
                </div>

                <div
                  className={`w-full ${heights[idx]} rounded-3xl border-4 flex flex-col items-center justify-center p-4 shadow-2xl transition-transform ${
                    idx === 0
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 border-amber-200 text-slate-950 scale-105'
                      : idx === 1
                      ? 'bg-gradient-to-t from-slate-600 to-slate-400 border-slate-300 text-slate-950'
                      : 'bg-gradient-to-t from-amber-800 to-amber-700 border-amber-600 text-amber-100'
                  }`}
                >
                  <span className="text-4xl font-black mb-2">#{r.rank}</span>
                  <span className="text-xl font-bold">{r.score} Pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onRematch();
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-lg shadow-xl shadow-cyan-500/30 active:scale-95 transition"
          >
            <RotateCcw className="w-6 h-6" /> MAIN LAGI
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onChangeGame();
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black text-lg active:scale-95 transition shadow-lg"
          >
            <LayoutGrid className="w-6 h-6" /> PILIH GAME LAIN
          </button>
        </div>
      </div>
    );
  }

  // Active Game Render Switcher
  switch (gameId) {
    case 'quiz-battle':
    case 'flag-quiz':
    case 'emoji-quiz':
    case 'logo-quiz':
    case 'sound-quiz':
      return (
        <QuizBattleView
          gameId={gameId}
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'snake':
      return (
        <SnakeGameView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'racing':
      return (
        <RacingGameView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'pong':
      return (
        <PongGameView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'reaction':
      return (
        <ReactionGameView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'math-battle':
      return (
        <MathBattleView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'typing-race':
      return (
        <TypingRaceView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'word-guess':
      return (
        <HangmanView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'word-chain':
      return (
        <WordChainView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'drawing':
      return (
        <PictionaryView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'tic-tac-toe':
      return (
        <TicTacToeView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'connect-four':
      return (
        <ConnectFourView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'color-match':
      return (
        <ColorMatchView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'memory':
      return (
        <MemoryGameView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'voting':
      return (
        <VotingBattleView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    case 'who-am-i':
      return (
        <WhoAmIView
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );

    default:
      return (
        <QuizBattleView
          gameId="quiz-battle"
          players={players}
          inputEvents={inputEvents}
          onGameEnd={handleGameEnd}
        />
      );
  }
};
