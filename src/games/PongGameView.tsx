import React, { useRef, useEffect, useState } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { sound } from '../lib/sound';
import { Timer, Trophy } from 'lucide-react';

interface PongProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const PongGameView: React.FC<PongProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const p1 = players[0] || { id: 'p1', nickname: 'Player 1', avatar: '😀' };
  const p2 = players[1] || { id: 'p2', nickname: 'Player 2', avatar: '😎' };

  const p1YRef = useRef(150);
  const p2YRef = useRef(150);
  const ballRef = useRef({ x: 300, y: 150, dx: 4.5, dy: 3.5, radius: 8 });

  // Handle paddle input (slider percentage 0 - 100)
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];
    if (latest.action === 'MOVE_PADDLE' && latest.payload) {
      const pct = latest.payload.y; // 0 to 100
      const paddleY = (pct / 100) * 220 + 20; // range 20 to 240
      if (latest.playerId === p1.id) {
        p1YRef.current = paddleY;
      } else if (latest.playerId === p2.id) {
        p2YRef.current = paddleY;
      }
    }
  }, [inputEvents, p1.id, p2.id]);

  // Main 60 FPS physics loop
  useEffect(() => {
    let animId: number;
    let s1 = scoreP1;
    let s2 = scoreP2;

    const loop = () => {
      const ball = ballRef.current;
      const PADDLE_HEIGHT = 70;
      const PADDLE_WIDTH = 12;

      // Ball move
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Top and bottom bounce
      if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= 300) {
        ball.dy = -ball.dy;
        sound.playPongHit();
      }

      // Left paddle collision (P1 at x = 30)
      if (
        ball.x - ball.radius <= 42 &&
        ball.x - ball.radius >= 25 &&
        ball.y >= p1YRef.current - PADDLE_HEIGHT / 2 &&
        ball.y <= p1YRef.current + PADDLE_HEIGHT / 2
      ) {
        ball.dx = Math.abs(ball.dx) * 1.05; // speed up slightly
        sound.playPongHit();
      }

      // Right paddle collision (P2 at x = 570)
      if (
        ball.x + ball.radius >= 558 &&
        ball.x + ball.radius <= 575 &&
        ball.y >= p2YRef.current - PADDLE_HEIGHT / 2 &&
        ball.y <= p2YRef.current + PADDLE_HEIGHT / 2
      ) {
        ball.dx = -Math.abs(ball.dx) * 1.05;
        sound.playPongHit();
      }

      // Score Left (P2 scores)
      if (ball.x < 0) {
        s2 += 1;
        setScoreP2(s2);
        sound.playCorrect();
        ball.x = 300;
        ball.y = 150;
        ball.dx = 4.5;
        ball.dy = 3.5;
      }

      // Score Right (P1 scores)
      if (ball.x > 600) {
        s1 += 1;
        setScoreP1(s1);
        sound.playCorrect();
        ball.x = 300;
        ball.y = 150;
        ball.dx = -4.5;
        ball.dy = -3.5;
      }

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, 600, 300);

          // Center dotted line
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.moveTo(300, 0);
          ctx.lineTo(300, 300);
          ctx.stroke();
          ctx.setLineDash([]);

          // P1 Paddle (Cyan)
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fillRect(30, p1YRef.current - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);

          // P2 Paddle (Rose)
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.fillRect(558, p2YRef.current - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);

          // Ball
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Timer & End
  useEffect(() => {
    if (timeLeft <= 0) {
      const winnerIsP1 = scoreP1 >= scoreP2;
      const rankings = [
        { playerId: p1.id, rank: winnerIsP1 ? 1 : 2, score: scoreP1 * 100 },
        { playerId: p2.id, rank: winnerIsP1 ? 2 : 1, score: scoreP2 * 100 },
      ];
      sound.playVictory();
      onGameEnd(rankings);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, scoreP1, scoreP2]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="text-xl font-black text-white">🏓 PONG DUEL RETRO</div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" />
          {timeLeft}s
        </div>
      </div>

      {/* Score Header */}
      <div className="flex justify-between items-center max-w-2xl mx-auto w-full px-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{p1.avatar}</span>
          <div>
            <div className="font-extrabold text-cyan-400 text-lg">{p1.nickname}</div>
            <div className="text-5xl font-black text-white">{scoreP1}</div>
          </div>
        </div>

        <div className="text-2xl font-black text-slate-600">VS</div>

        <div className="flex items-center gap-3 text-right flex-row-reverse">
          <span className="text-4xl">{p2.avatar}</span>
          <div>
            <div className="font-extrabold text-rose-400 text-lg">{p2.nickname}</div>
            <div className="text-5xl font-black text-white">{scoreP2}</div>
          </div>
        </div>
      </div>

      {/* Pong Arena Canvas */}
      <div className="flex items-center justify-center my-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="rounded-3xl border-2 border-cyan-500/40 shadow-2xl bg-slate-950 w-full max-w-4xl aspect-[2/1]"
        />
      </div>

      <div className="text-center text-xs text-slate-400">
        Gunakan tombol Atas / Bawah atau Touch Slider pada HP untuk mengontrol paddle
      </div>
    </div>
  );
};
