import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Grid, Timer, Trophy } from 'lucide-react';

interface TicTacToeProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const TicTacToeView: React.FC<TicTacToeProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | 'DRAW' | null>(null);

  const p1 = players[0] || { id: 'p1', nickname: 'Player 1', avatar: '😀' };
  const p2 = players[1] || { id: 'p2', nickname: 'Player 2', avatar: '😎' };

  const currentTurnPlayer = turn === 'X' ? p1 : p2;

  // Handle cell pick
  useEffect(() => {
    if (inputEvents.length === 0 || winner) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'PICK_CELL' && latest.payload) {
      if (latest.playerId !== currentTurnPlayer.id) return;

      const idx = latest.payload.index as number;
      if (board[idx] === null) {
        sound.playClick();
        const nextBoard = [...board];
        nextBoard[idx] = turn;
        setBoard(nextBoard);

        const winResult = checkWinner(nextBoard);
        if (winResult) {
          setWinner(winResult);
          if (winResult === 'DRAW') {
            sound.playPongHit();
          } else {
            sound.playVictory();
          }

          setTimeout(() => {
            const isP1Win = winResult === 'X';
            const isDraw = winResult === 'DRAW';
            const rankings = [
              { playerId: p1.id, rank: isP1Win ? 1 : isDraw ? 1 : 2, score: isP1Win ? 150 : isDraw ? 50 : 20 },
              { playerId: p2.id, rank: !isP1Win && !isDraw ? 1 : isDraw ? 1 : 2, score: !isP1Win && !isDraw ? 150 : isDraw ? 50 : 20 },
            ];
            onGameEnd(rankings);
          }, 3000);
        } else {
          setTurn((t) => (t === 'X' ? 'O' : 'X'));
        }
      }
    }
  }, [inputEvents, currentTurnPlayer, board, turn, winner]);

  const checkWinner = (b: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, bIdx, c] of lines) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return b[a];
      }
    }
    if (b.every((cell) => cell !== null)) return 'DRAW';
    return null;
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Grid className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">TIC TAC TOE</span>
        </div>

        {/* Turn Status */}
        <div className="flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-4 py-1.5 rounded-xl border border-cyan-500/30 font-bold">
          <span>Giliran:</span>
          <span>{currentTurnPlayer.avatar}</span>
          <span className="text-white">{currentTurnPlayer.nickname} ({turn})</span>
        </div>
      </div>

      {/* Main 3x3 Grid */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 rounded-3xl border-4 border-cyan-500/50 shadow-2xl w-80 h-80 md:w-96 md:h-96">
          {board.map((cell, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border-2 flex items-center justify-center font-black text-5xl md:text-6xl shadow-inner transition-transform ${
                cell === 'X'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                  : cell === 'O'
                  ? 'border-rose-400 text-rose-400 bg-rose-950/40'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              {cell}
            </div>
          ))}
        </div>

        {winner && (
          <div className="mt-6 text-3xl font-black text-emerald-400 animate-bounce">
            {winner === 'DRAW' ? '🤝 HASIL IMBANG (DRAW)!' : `🎉 PEMENANG: ${winner === 'X' ? p1.nickname : p2.nickname}!`}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="flex justify-between items-center max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/40 p-3 rounded-2xl">
          <span className="text-3xl">{p1.avatar}</span>
          <div>
            <div className="font-bold text-white text-sm">{p1.nickname}</div>
            <div className="text-cyan-400 font-extrabold text-xs">Simbol: X</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 p-3 rounded-2xl">
          <span className="text-3xl">{p2.avatar}</span>
          <div>
            <div className="font-bold text-white text-sm">{p2.nickname}</div>
            <div className="text-rose-400 font-extrabold text-xs">Simbol: O</div>
          </div>
        </div>
      </div>
    </div>
  );
};
