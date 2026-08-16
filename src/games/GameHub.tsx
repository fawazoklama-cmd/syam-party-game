import React, { useState, useEffect } from 'react';
import { Player, Room, ControllerInputEvent } from '../types';
import { GAME_REGISTRY } from '../data/games';
import { sound } from '../lib/sound';
import { RoomManager } from '../lib/roomManager';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Flame,
  Gamepad2,
  X,
  ChevronUp,
  ChevronDown,
  Keyboard,
} from 'lucide-react';
import { DynamicController } from '../components/controllers/DynamicController';

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
  const [showVirtualGamepad, setShowVirtualGamepad] = useState(false);

  const gameId = room.currentGameId || 'quiz-battle';
  const gameDef = GAME_REGISTRY.find((g) => g.id === gameId) || GAME_REGISTRY[0];
  const roomCode = room.code || room.roomCode;
  const hostPlayer = players.find((p) => p.isHost) || players[0] || {
    id: 'host_tv',
    nickname: 'Host TV',
    avatar: '📺',
    playerColor: '#06b6d4',
  };

  // Keyboard Controller Listener for TV player
  useEffect(() => {
    if (countdown !== null || gameEnded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Toggle Virtual Controller with key 'c'
      if (key === 'c' && !e.ctrlKey && !e.metaKey) {
        setShowVirtualGamepad((prev) => !prev);
        return;
      }

      // Quiz Battle / Choice questions (1, 2, 3, 4 or A, B, C, D)
      if (['Digit1', 'Numpad1', 'Key1'].includes(code) || (key === 'a' && gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ANSWER', { optionIndex: 0 });
      } else if (['Digit2', 'Numpad2', 'Key2'].includes(code) || (key === 'b' && gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ANSWER', { optionIndex: 1 });
      } else if (['Digit3', 'Numpad3', 'Key3'].includes(code) || (key === 'c' && gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ANSWER', { optionIndex: 2 });
      } else if (['Digit4', 'Numpad4', 'Key4'].includes(code) || (key === 'd' && gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ANSWER', { optionIndex: 3 });
      }

      // Arrow Keys / WASD for Navigation & Movement
      if (code === 'ArrowUp' || (key === 'w' && !gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'MOVE', { direction: 'UP' });
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ACCEL');
      } else if (code === 'ArrowDown' || (key === 's' && !gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'MOVE', { direction: 'DOWN' });
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'BRAKE');
      } else if (code === 'ArrowLeft' || (key === 'a' && !gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'MOVE', { direction: 'LEFT' });
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'STEER_LEFT');
      } else if (code === 'ArrowRight' || (key === 'd' && !gameId.includes('quiz'))) {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'MOVE', { direction: 'RIGHT' });
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'STEER_RIGHT');
      }

      // Space / Enter -> Buzzer / Action
      if (code === 'Space' || code === 'Enter') {
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'BUZZ');
        RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, 'ACTION_BUTTON');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countdown, gameEnded, roomCode, hostPlayer.id, gameId]);

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
      <div className="flex flex-col items-center justify-center h-full w-full min-h-[calc(100vh-73px)] select-none bg-slate-950/95 backdrop-blur-md">
        <div className="p-4 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="font-extrabold text-2xl tracking-wide">{gameDef.name}</span>
        </div>

        <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border-8 border-cyan-300 flex items-center justify-center shadow-2xl shadow-cyan-500/50 animate-pulse">
          <span className="text-7xl font-black text-white drop-shadow-lg">
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 mt-8">
          <p className="text-slate-200 font-semibold text-lg">
            Pegang HP Anda atau gunakan kontrol di layar TV!
          </p>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-4 py-1.5 rounded-full text-xs text-cyan-300">
            <Keyboard className="w-4 h-4" />
            <span>Kontrol TV Aktif: <b>[WASD]</b> / <b>[Panah]</b> / <b>[1-4]</b> / <b>[Spasi]</b></span>
          </div>
        </div>
      </div>
    );
  }

  // Render Result / Victory Screen
  if (gameEnded) {
    const pointBonuses: { [rank: number]: number } = { 1: 100, 2: 75, 3: 50, 4: 25 };

    return (
      <div className="flex flex-col items-center justify-between h-full min-h-[calc(100vh-73px)] w-full p-8 select-none bg-slate-950">
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
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce">{player.avatar}</div>
                <div className="font-extrabold text-base sm:text-lg text-white truncate max-w-[150px] mb-1">
                  {player.nickname}
                </div>
                <div className="text-xs text-amber-300 font-black mb-3">
                  +{bonus} Party Pts ({r.score} Skor)
                </div>
                <div
                  className={`w-full ${heights[idx]} rounded-t-3xl flex flex-col items-center justify-center p-4 border-t-4 shadow-2xl ${
                    idx === 0
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 border-amber-200 text-slate-950'
                      : idx === 1
                      ? 'bg-gradient-to-t from-slate-600 to-slate-400 border-slate-200 text-white'
                      : 'bg-gradient-to-t from-amber-800 to-amber-700 border-amber-500 text-white'
                  }`}
                >
                  <span className="text-4xl sm:text-5xl font-black">#{r.rank}</span>
                  <span className="text-xs uppercase tracking-widest font-extrabold mt-1">
                    {idx === 0 ? 'JUARA 1' : idx === 1 ? 'JUARA 2' : 'JUARA 3'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => {
              sound.playClick();
              onRematch();
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-lg shadow-xl shadow-cyan-500/30 active:scale-95 transition"
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

  // Active Game Render Function
  const renderGameView = () => {
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

  return (
    <div className="relative flex flex-col w-full h-full min-h-[calc(100vh-73px)]">
      {/* Game Arena View */}
      <div className="flex-1 w-full overflow-hidden">
        {renderGameView()}
      </div>

      {/* Floating Bottom TV Gamepad & Keyboard Bar */}
      <div className="fixed bottom-3 right-4 z-40 flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 backdrop-blur shadow-lg">
          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
          <span><b>[WASD/Panah]</b> gerak &bull; <b>[1-4]</b> kuis &bull; <b>[Spasi]</b> aksi &bull; <b>[C]</b> gamepad</span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setShowVirtualGamepad((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xl transition active:scale-95 border ${
            showVirtualGamepad
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400'
              : 'bg-slate-900/95 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{showVirtualGamepad ? 'Tutup Gamepad TV' : '🎮 Buka Gamepad TV'}</span>
          {showVirtualGamepad ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Slide-Up / Floating Virtual Controller Panel for TV Host / Player */}
      {showVirtualGamepad && (
        <div className="fixed bottom-14 right-4 z-50 w-80 sm:w-96 max-h-[70vh] bg-slate-900/95 border-2 border-cyan-500/50 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="text-lg">{hostPlayer.avatar}</span>
              <span>Gamepad Layar TV ({hostPlayer.nickname})</span>
            </div>
            <button
              onClick={() => setShowVirtualGamepad(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] p-1">
            <DynamicController
              room={room}
              player={hostPlayer as Player}
              players={players}
              gameId={gameId}
              onSendAction={(act, payload) => {
                RoomManager.sendControllerInput(roomCode, hostPlayer.id, gameId, act, payload);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
