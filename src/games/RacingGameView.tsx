import React, { useRef, useEffect, useState } from 'react';
import { Player, ControllerInputEvent, PLAYER_COLORS } from '../types';
import { sound } from '../lib/sound';
import { Trophy, Timer, Flame, Flag } from 'lucide-react';

interface RacingProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

interface Car {
  id: string;
  player: Player;
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  boost: number;
  laps: number;
  lapCheckpoints: boolean[];
  color: string;
  finished: boolean;
  finishTime: number;
}

export const RacingGameView: React.FC<RacingProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [carsState, setCarsState] = useState<Car[]>([]);

  const carsRef = useRef<Car[]>([]);
  const TOTAL_LAPS = 3;

  // Initialize cars on the starting grid
  useEffect(() => {
    const initCars: Car[] = players.map((p, idx) => {
      const gridOffset = idx * 30;
      return {
        id: p.id,
        player: p,
        x: 400 + (idx % 2 === 0 ? 30 : -30),
        y: 430 - gridOffset,
        angle: -Math.PI / 2, // facing UP
        speed: 0,
        boost: 100,
        laps: 0,
        lapCheckpoints: [false, false, false, false],
        color: p.playerColor || PLAYER_COLORS[idx % PLAYER_COLORS.length],
        finished: false,
        finishTime: 0,
      };
    });

    carsRef.current = initCars;
    setCarsState(initCars);
  }, [players]);

  // Handle Controller actions (STEER_LEFT, STEER_RIGHT, GAS, BRAKE, BOOST)
  useEffect(() => {
    if (inputEvents.length === 0) return;
    const latest = inputEvents[inputEvents.length - 1];
    const car = carsRef.current.find((c) => c.id === latest.playerId);
    if (!car || car.finished) return;

    if (latest.action === 'STEER_LEFT') {
      car.angle -= 0.18;
    } else if (latest.action === 'STEER_RIGHT') {
      car.angle += 0.18;
    } else if (latest.action === 'GAS') {
      car.speed = Math.min(car.speed + 1.2, 7.5);
      sound.playEngineRev();
    } else if (latest.action === 'BRAKE') {
      car.speed = Math.max(car.speed - 1.8, 0);
    } else if (latest.action === 'BOOST') {
      if (car.boost > 20) {
        car.speed = 11.0;
        car.boost -= 30;
        sound.playPongHit();
      }
    }
  }, [inputEvents]);

  // Physics animation loop (60 FPS)
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const cars = carsRef.current;

      cars.forEach((car) => {
        if (car.finished) return;

        // Apply friction
        car.speed *= 0.97;
        if (car.speed < 0.05) car.speed = 0;

        // Recharge nitro slowly
        if (car.boost < 100) car.boost = Math.min(100, car.boost + 0.15);

        // Move car
        car.x += Math.cos(car.angle) * car.speed;
        car.y += Math.sin(car.angle) * car.speed;

        // Check bounds & track constraint (Oval track center 400, 250)
        const dx = car.x - 400;
        const dy = car.y - 250;
        const distFromCenter = Math.sqrt((dx * dx) / (320 * 320) + (dy * dy) / (180 * 180));

        // Off-road penalty
        if (distFromCenter < 0.5 || distFromCenter > 1.15) {
          car.speed *= 0.85; // grass slow-down
        }

        // Checkpoints detection around the oval
        // CP0: Top (y < 120), CP1: Left (x < 150), CP2: Bottom (y > 380), CP3: Right (x > 650)
        if (car.y < 130) car.lapCheckpoints[0] = true;
        if (car.x < 160 && car.lapCheckpoints[0]) car.lapCheckpoints[1] = true;
        if (car.y > 370 && car.lapCheckpoints[1]) car.lapCheckpoints[2] = true;
        if (car.x > 640 && car.lapCheckpoints[2]) car.lapCheckpoints[3] = true;

        // Finish line crossing (x > 380 && x < 420 && y > 360)
        if (
          car.lapCheckpoints[0] &&
          car.lapCheckpoints[1] &&
          car.lapCheckpoints[2] &&
          car.lapCheckpoints[3] &&
          car.x >= 390 &&
          car.x <= 420 &&
          car.y > 360
        ) {
          car.laps += 1;
          car.lapCheckpoints = [false, false, false, false];
          sound.playEat();

          if (car.laps >= TOTAL_LAPS) {
            car.finished = true;
            car.finishTime = Date.now();
            sound.playVictory();
          }
        }
      });

      setCarsState([...cars]);

      // Check if all finished
      if (cars.every((c) => c.finished)) {
        finishRacing();
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      finishRacing();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const finishRacing = () => {
    const sorted = [...carsRef.current].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return b.laps - a.laps;
    });

    const rankings = sorted.map((c, idx) => ({
      playerId: c.id,
      rank: idx + 1,
      score: (c.laps * 100) + (c.finished ? 150 - idx * 25 : 20),
    }));

    onGameEnd(rankings);
  };

  // Canvas Racetrack Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grass Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer Track Asphalt (Oval)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(400, 250, 360, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Track Curb Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(400, 250, 360, 200, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Infield Grass
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(400, 250, 180, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(400, 250, 180, 90, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Finish Line Checker
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(400, 370 + i * 15, 10, 8);
      ctx.fillStyle = ctx.fillStyle === '#ffffff' ? '#000000' : '#ffffff';
    }

    // Draw Cars
    carsRef.current.forEach((car) => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car Body
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-16, -10, 32, 20, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -8, 12, 16);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(14, -8, 3, 4);
      ctx.fillRect(14, 4, 3, 4);

      // Boost exhaust flame if high speed
      if (car.speed > 8) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-22, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Draw Player Tag above car
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(car.player.nickname, car.x, car.y - 18);
    });
  }, [carsState]);

  return (
    <div className="flex flex-col h-full w-full justify-between p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-2 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="font-black text-xl text-white tracking-wide">🏎️ MINI RACING ARENA</span>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold border border-amber-500/30">
            Target: {TOTAL_LAPS} Putaran (Laps)
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
          <Timer className="w-5 h-5" />
          {timeLeft}s
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 my-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full max-w-5xl aspect-[16/10] rounded-2xl border-2 border-slate-700 shadow-2xl"
        />
      </div>

      {/* Bottom Lap Standings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {carsState.map((c, idx) => (
          <div
            key={c.id}
            style={{ borderColor: c.color }}
            className={`flex items-center justify-between p-3 rounded-xl border-2 bg-slate-900/90 shadow ${
              c.finished ? 'ring-2 ring-emerald-400' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{c.player.avatar}</span>
              <div>
                <div className="font-bold text-sm text-white">{c.player.nickname}</div>
                <div className="text-xs font-semibold text-cyan-300">
                  {c.finished ? '🏁 FINISH!' : `Lap: ${c.laps}/${TOTAL_LAPS}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-amber-950/60 text-amber-400 px-2 py-1 rounded-lg">
              <Flame className="w-3.5 h-3.5" />
              {Math.round(c.boost)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
