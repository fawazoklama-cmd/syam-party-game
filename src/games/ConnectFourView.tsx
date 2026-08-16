import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { CircleDot, Timer, Trophy } from 'lucide-react';

interface ConnectFourProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

const ROWS = 6;
const COLS = 7;

export const ConnectFourView: React.FC<ConnectFourProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  // 6 rows x 7 cols (null | 'P1' | 'P2')
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
  const [winner, setWinner] = useState<string | 'DRAW' | null>(null);

  const p1 = players[0] || { id: 'p1', nickname: 'Player 1', avatar: '😀' };
  const p2 = players[1] || { id: 'p2', nickname: 'Player 2', avatar: '😎' };

  const currentTurnPlayer = turn === 'P1' ? p1 : p2;

  // Handle column drop
  useEffect(() => {
    if (inputEvents.length === 0 || winner) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'PICK_COLUMN' && latest.payload) {
      if (latest.playerId !== currentTurnPlayer.id) return;

      const col = latest.payload.column as number;
      if (col < 0 || col >= COLS) return;

      // Find lowest available row
      let availableRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r][col] === null) {
          availableRow = r;
          break;
        }
      }

      if (availableRow !== -1) {
        sound.playPongHit();
        const nextGrid = grid.map((row) => [...row]);
        nextGrid[availableRow][col] = turn;
        setGrid(nextGrid);

        // Check connect 4
        if (checkConnect4(nextGrid, availableRow, col, turn)) {
          setWinner(turn);
          sound.playVictory();
          setTimeout(() => {
            const isP1Win = turn === 'P1';
            const rankings = [
              { playerId: p1.id, rank: isP1Win ? 1 : 2, score: isP1Win ? 150 : 30 },
              { playerId: p2.id, rank: !isP1Win ? 1 : 2, score: !isP1Win ? 150 : 30 },
            ];
            onGameEnd(rankings);
          }, 3000);
        } else if (nextGrid.every((r) => r.every((c) => c !== null))) {
          setWinner('DRAW');
          setTimeout(() => {
            const rankings = [
              { playerId: p1.id, rank: 1, score: 50 },
              { playerId: p2.id, rank: 1, score: 50 },
            ];
            onGameEnd(rankings);
          }, 3000);
        } else {
          setTurn((t) => (t === 'P1' ? 'P2' : 'P1'));
        }
      }
    }
  }, [inputEvents, currentTurnPlayer, grid, turn, winner]);

  const checkConnect4 = (g: (string | null)[][], row: number, col: number, player: string) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal \
      [1, -1],  // diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;

      // forward
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && g[r][c] === player) {
          count++;
        } else break;
      }

      // backward
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && g[r][c] === player) {
          count++;
        } else break;
      }

      if (count >= 4) return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <CircleDot className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">CONNECT 4</span>
        </div>

        {/* Turn */}
        <div className="flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-4 py-1.5 rounded-xl border border-cyan-500/30 font-bold">
          <span>Giliran:</span>
          <span>{currentTurnPlayer.avatar}</span>
          <span className="text-white">{currentTurnPlayer.nickname}</span>
        </div>
      </div>

      {/* Main 7x6 Board */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="bg-blue-800 p-4 rounded-3xl border-4 border-blue-500 shadow-2xl">
          <div className="grid grid-cols-7 gap-3">
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center shadow-inner transition-all ${
                    cell === 'P1'
                      ? 'bg-amber-400 border-amber-200 shadow-amber-500/50'
                      : cell === 'P2'
                      ? 'bg-rose-500 border-rose-300 shadow-rose-500/50'
                      : 'bg-slate-950/80 border-blue-900'
                  }`}
                />
              ))
            )}
          </div>
        </div>

        {winner && (
          <div className="mt-6 text-3xl font-black text-emerald-400 animate-bounce">
            {winner === 'DRAW' ? '🤝 HASIL IMBANG!' : `🎉 PEMENANG: ${winner === 'P1' ? p1.nickname : p2.nickname}!`}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="flex justify-between items-center max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 p-3 rounded-2xl">
          <span className="text-3xl">{p1.avatar}</span>
          <div>
            <div className="font-bold text-white text-sm">{p1.nickname}</div>
            <div className="text-amber-400 font-extrabold text-xs">Koin: Kuning</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 p-3 rounded-2xl">
          <span className="text-3xl">{p2.avatar}</span>
          <div>
            <div className="font-bold text-white text-sm">{p2.nickname}</div>
            <div className="text-rose-400 font-extrabold text-xs">Koin: Merah</div>
          </div>
        </div>
      </div>
    </div>
  );
};
