import React, { useRef, useEffect, useState } from 'react';
import { Player, ControllerInputEvent, PLAYER_COLORS } from '../types';
import { sound } from '../lib/sound';
import { Trophy, Timer, Heart } from 'lucide-react';

interface SnakeProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

interface Point {
  x: number;
  y: number;
}

interface SnakeEntity {
  id: string;
  player: Player;
  body: Point[];
  dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  nextDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  alive: boolean;
  score: number;
  color: string;
}

export const SnakeGameView: React.FC<SnakeProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(75);
  const [snakesState, setSnakesState] = useState<SnakeEntity[]>([]);

  const GRID_SIZE = 30; // 30x20 grid
  const COLS = 40;
  const ROWS = 25;

  const snakesRef = useRef<SnakeEntity[]>([]);
  const foodRef = useRef<Point[]>([]);

  // Initialize snakes
  useEffect(() => {
    const initialSnakes: SnakeEntity[] = players.map((p, idx) => {
      const startX = 5 + (idx % 4) * 8;
      const startY = 5 + Math.floor(idx / 4) * 10;
      return {
        id: p.id,
        player: p,
        body: [
          { x: startX, y: startY },
          { x: startX - 1, y: startY },
          { x: startX - 2, y: startY },
        ],
        dir: 'RIGHT',
        nextDir: 'RIGHT',
        alive: true,
        score: 0,
        color: p.playerColor || PLAYER_COLORS[idx % PLAYER_COLORS.length],
      };
    });

    snakesRef.current = initialSnakes;
    setSnakesState(initialSnakes);

    // Spawn initial food
    foodRef.current = [
      { x: 10, y: 12 },
      { x: 25, y: 8 },
      { x: 18, y: 18 },
      { x: 32, y: 15 },
    ];
  }, [players]);

  // Handle D-Pad input from players
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];
    if (latest.action === 'MOVE' && latest.payload?.direction) {
      const dir = latest.payload.direction as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
      const target = snakesRef.current.find((s) => s.id === latest.playerId);
      if (target && target.alive) {
        // Prevent 180 reverse
        if (
          (dir === 'UP' && target.dir !== 'DOWN') ||
          (dir === 'DOWN' && target.dir !== 'UP') ||
          (dir === 'LEFT' && target.dir !== 'RIGHT') ||
          (dir === 'RIGHT' && target.dir !== 'LEFT')
        ) {
          target.nextDir = dir;
        }
      }
    }
  }, [inputEvents]);

  // Main game loop (120ms tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const snakes = snakesRef.current;
      const foods = foodRef.current;

      // Update positions
      snakes.forEach((s) => {
        if (!s.alive) return;
        s.dir = s.nextDir;
        const head = { ...s.body[0] };

        if (s.dir === 'UP') head.y -= 1;
        if (s.dir === 'DOWN') head.y += 1;
        if (s.dir === 'LEFT') head.x -= 1;
        if (s.dir === 'RIGHT') head.x += 1;

        // Check wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          s.alive = false;
          sound.playWrong();
          return;
        }

        // Check self & other snake collision
        for (const other of snakes) {
          if (!other.alive) continue;
          for (let i = 0; i < other.body.length; i++) {
            if (other.id === s.id && i === 0) continue; // ignore head with itself
            if (head.x === other.body[i].x && head.y === other.body[i].y) {
              s.alive = false;
              sound.playWrong();
              return;
            }
          }
        }

        // Add new head
        s.body.unshift(head);

        // Check food collision
        const foodIdx = foods.findIndex((f) => f.x === head.x && f.y === head.y);
        if (foodIdx >= 0) {
          s.score += 20;
          sound.playEat();
          // Remove and spawn new food
          foods.splice(foodIdx, 1);
          foods.push({
            x: Math.floor(Math.random() * (COLS - 2)) + 1,
            y: Math.floor(Math.random() * (ROWS - 2)) + 1,
          });
        } else {
          s.body.pop(); // Normal move, remove tail
        }
      });

      setSnakesState([...snakes]);

      // Check if all dead or timer end
      const aliveCount = snakes.filter((s) => s.alive).length;
      if (snakes.length > 1 && aliveCount <= 1) {
        finishGame();
      }
    }, 130);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const finishGame = () => {
    const sorted = [...snakesRef.current].sort((a, b) => b.score - a.score);
    const rankings = sorted.map((s, idx) => ({
      playerId: s.id,
      rank: idx + 1,
      score: s.score + (s.alive ? 50 : 0),
    }));
    sound.playVictory();
    onGameEnd(rankings);
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += cellWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += cellHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Food
    foodRef.current.forEach((f) => {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(
        f.x * cellWidth + cellWidth / 2,
        f.y * cellHeight + cellHeight / 2,
        cellWidth * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Snakes
    snakesRef.current.forEach((s) => {
      if (!s.alive) {
        // Draw ghost / faint dead body
        ctx.fillStyle = '#475569';
        s.body.forEach((b) => {
          ctx.fillRect(b.x * cellWidth + 2, b.y * cellHeight + 2, cellWidth - 4, cellHeight - 4);
        });
        return;
      }

      // Draw active snake
      s.body.forEach((b, idx) => {
        ctx.fillStyle = s.color;
        if (idx === 0) {
          // Head
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.roundRect(
            b.x * cellWidth + 1,
            b.y * cellHeight + 1,
            cellWidth - 2,
            cellHeight - 2,
            6
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          // Eyes
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(b.x * cellWidth + cellWidth * 0.35, b.y * cellHeight + cellHeight * 0.35, 2, 0, Math.PI * 2);
          ctx.arc(b.x * cellWidth + cellWidth * 0.65, b.y * cellHeight + cellHeight * 0.35, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body
          ctx.globalAlpha = 0.85;
          ctx.fillRect(b.x * cellWidth + 2, b.y * cellHeight + 2, cellWidth - 4, cellHeight - 4);
          ctx.globalAlpha = 1.0;
        }
      });
    });
  }, [snakesState]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-2 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-xl text-white tracking-wide">🐍 SNAKE MULTIPLAYER</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold">
            Gunakan D-Pad di HP
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" />
          {timeLeft}s
        </div>
      </div>

      {/* Main Canvas Arena */}
      <div className="flex-1 my-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full max-w-5xl aspect-[16/10] rounded-2xl border-2 border-cyan-500/40 shadow-2xl bg-slate-950"
        />
      </div>

      {/* Bottom Player Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {snakesState.map((s) => (
          <div
            key={s.id}
            style={{ borderColor: s.color }}
            className={`flex items-center justify-between p-3 rounded-xl border-2 bg-slate-900/90 shadow ${
              !s.alive ? 'opacity-40 grayscale' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{s.player.avatar}</span>
              <div>
                <div className="font-bold text-sm text-white">{s.player.nickname}</div>
                <div className="text-xs font-semibold" style={{ color: s.color }}>
                  {s.alive ? '🟢 Hidup' : '🔴 Gugur'}
                </div>
              </div>
            </div>
            <div className="text-xl font-black text-cyan-400">{s.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
};
