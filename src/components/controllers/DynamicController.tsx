import React, { useState, useEffect, useRef } from 'react';
import { Player, Room } from '../../types';
import { RoomManager } from '../../lib/roomManager';
import { sound, vibrate } from '../../lib/sound';
import {
  Send,
  RotateCcw,
  Eraser,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface DynamicControllerProps {
  room: Room;
  player: Player;
  players: Player[];
  gameId: string;
}

export const DynamicController: React.FC<DynamicControllerProps> = ({
  room,
  player,
  players,
  gameId,
}) => {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const sendInput = (action: string, payload?: any) => {
    vibrate(40);
    sound.playClick();
    setLastAction(action);
    RoomManager.sendControllerInput(room.roomCode, player.id, gameId, action, payload);
    setTimeout(() => {
      setLastAction((prev) => (prev === action ? null : prev));
    }, 400);
  };

  // Render controller based on gameId
  switch (gameId) {
    case 'quiz-battle':
    case 'flag-quiz':
    case 'emoji-quiz':
    case 'logo-quiz':
    case 'sound-quiz':
      return <QuizButtonsController onSelect={(optIdx) => sendInput('ANSWER', { optionIndex: optIdx })} lastAction={lastAction} />;

    case 'snake':
      return <DPadController onDirection={(dir) => sendInput('MOVE', { direction: dir })} />;

    case 'racing':
      return <RacingControls onAction={(act) => sendInput(act)} />;

    case 'pong':
      return <PongPaddleControls onMove={(pos) => sendInput('MOVE_PADDLE', { y: pos })} />;

    case 'reaction':
      return <ReactionBuzzer onBuzz={() => sendInput('BUZZ')} />;

    case 'math-battle':
      return <NumericKeypad onSubmit={(val) => sendInput('SUBMIT_MATH', { answer: val })} />;

    case 'typing-race':
      return <TypingInput onUpdate={(text) => sendInput('TYPING_UPDATE', { text })} />;

    case 'word-chain':
      return <WordChainInput onSubmitWord={(word) => sendInput('SUBMIT_WORD', { word })} />;

    case 'word-guess':
      return <AlphabetKeyboard onLetter={(char) => sendInput('GUESS_LETTER', { letter: char })} />;

    case 'drawing':
      return <DrawingPad roomCode={room.roomCode} playerId={player.id} players={players} onGuess={(txt) => sendInput('GUESS_DRAWING', { text: txt })} />;

    case 'tic-tac-toe':
      return <TicTacToeGrid onPick={(idx) => sendInput('PICK_CELL', { index: idx })} />;

    case 'connect-four':
      return <ConnectFourColumns onPickCol={(col) => sendInput('PICK_COLUMN', { column: col })} />;

    case 'color-match':
      return <ColorMatchButtons onPick={(col) => sendInput('PICK_COLOR', { color: col })} />;

    case 'memory':
      return <MemoryPads onPad={(idx) => sendInput('PRESS_PAD', { index: idx })} />;

    case 'voting':
      return <VotingPicker players={players.filter((p) => p.id !== player.id)} onVote={(targetId) => sendInput('VOTE_PLAYER', { targetPlayerId: targetId })} />;

    case 'who-am-i':
      return <WhoAmIControls onGiveClue={(clue) => sendInput('SUBMIT_CLUE', { clue })} onGuessIdentity={(ans) => sendInput('GUESS_IDENTITY', { answer: ans })} />;

    default:
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
            <Zap className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white">Gamepad Aktif</h3>
          <p className="text-sm text-slate-400">Lihat layar TV dan tekan tombol di bawah untuk berinteraksi.</p>
          <button
            onClick={() => sendInput('ACTION_BUTTON')}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xl text-white shadow-lg active:scale-95 transition"
          >
            PENCET SAYA!
          </button>
        </div>
      );
  }
};

/* =========================================================================
   1. QUIZ BUTTONS CONTROLLER (A, B, C, D)
   ========================================================================= */
const QuizButtonsController: React.FC<{
  onSelect: (index: number) => void;
  lastAction: string | null;
}> = ({ onSelect, lastAction }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handlePick = (idx: number) => {
    setSelected(idx);
    onSelect(idx);
  };

  const buttons = [
    { label: 'A', bg: 'bg-rose-500 active:bg-rose-600 border-rose-400', glow: 'shadow-rose-500/30' },
    { label: 'B', bg: 'bg-blue-500 active:bg-blue-600 border-blue-400', glow: 'shadow-blue-500/30' },
    { label: 'C', bg: 'bg-amber-500 active:bg-amber-600 border-amber-400', glow: 'shadow-amber-500/30' },
    { label: 'D', bg: 'bg-emerald-500 active:bg-emerald-600 border-emerald-400', glow: 'shadow-emerald-500/30' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full w-full p-2 select-none">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          id={`controller-quiz-btn-${idx}`}
          onClick={() => handlePick(idx)}
          className={`relative flex flex-col items-center justify-center rounded-3xl ${btn.bg} text-white font-extrabold text-4xl shadow-xl ${btn.glow} border-2 active:scale-95 transition-transform duration-75 min-h-[140px]`}
        >
          {btn.label}
          {selected === idx && (
            <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mt-2 font-medium">
              Dipilih
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

/* =========================================================================
   2. D-PAD CONTROLLER (Snake & Arcade)
   ========================================================================= */
const DPadController: React.FC<{ onDirection: (dir: string) => void }> = ({ onDirection }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 select-none">
      <div className="relative w-64 h-64 grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <button
          id="dpad-up"
          onClick={() => onDirection('UP')}
          className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl flex items-center justify-center active:bg-cyan-500 active:scale-95 text-cyan-400 active:text-white shadow-lg transition"
        >
          <ArrowUp className="w-10 h-10" />
        </button>
        <div />

        <button
          id="dpad-left"
          onClick={() => onDirection('LEFT')}
          className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl flex items-center justify-center active:bg-cyan-500 active:scale-95 text-cyan-400 active:text-white shadow-lg transition"
        >
          <ArrowLeft className="w-10 h-10" />
        </button>
        <div className="flex items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-700">
          <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <button
          id="dpad-right"
          onClick={() => onDirection('RIGHT')}
          className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl flex items-center justify-center active:bg-cyan-500 active:scale-95 text-cyan-400 active:text-white shadow-lg transition"
        >
          <ArrowRight className="w-10 h-10" />
        </button>

        <div />
        <button
          id="dpad-down"
          onClick={() => onDirection('DOWN')}
          className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl flex items-center justify-center active:bg-cyan-500 active:scale-95 text-cyan-400 active:text-white shadow-lg transition"
        >
          <ArrowDown className="w-10 h-10" />
        </button>
        <div />
      </div>
    </div>
  );
};

/* =========================================================================
   3. RACING CONTROLS (Left, Right, Gas, Brake, Boost)
   ========================================================================= */
const RacingControls: React.FC<{ onAction: (act: string) => void }> = ({ onAction }) => {
  return (
    <div className="flex flex-col justify-between w-full h-full p-2 select-none gap-3">
      {/* Top Boost */}
      <button
        id="racing-boost"
        onClick={() => onAction('BOOST')}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 border border-amber-300 active:scale-95"
      >
        <Flame className="w-6 h-6 animate-bounce" /> NITRO BOOST!
      </button>

      {/* Main Steering & Pedals */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Left Side: Steering */}
        <div className="grid grid-rows-2 gap-3">
          <button
            id="racing-steer-left"
            onClick={() => onAction('STEER_LEFT')}
            className="rounded-2xl bg-slate-800 border-2 border-blue-500 text-blue-400 font-extrabold text-2xl flex items-center justify-center active:bg-blue-600 active:text-white active:scale-95 shadow-md"
          >
            <ChevronLeft className="w-12 h-12" /> KIRI
          </button>
          <button
            id="racing-steer-right"
            onClick={() => onAction('STEER_RIGHT')}
            className="rounded-2xl bg-slate-800 border-2 border-blue-500 text-blue-400 font-extrabold text-2xl flex items-center justify-center active:bg-blue-600 active:text-white active:scale-95 shadow-md"
          >
            KANAN <ChevronRight className="w-12 h-12" />
          </button>
        </div>

        {/* Right Side: Gas & Brake */}
        <div className="grid grid-rows-2 gap-3">
          <button
            id="racing-gas"
            onClick={() => onAction('GAS')}
            className="rounded-2xl bg-emerald-600 border-2 border-emerald-400 text-white font-black text-2xl flex flex-col items-center justify-center active:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <ArrowUp className="w-8 h-8" />
            GAS POL
          </button>
          <button
            id="racing-brake"
            onClick={() => onAction('BRAKE')}
            className="rounded-2xl bg-rose-600 border-2 border-rose-400 text-white font-black text-xl flex flex-col items-center justify-center active:bg-rose-700 active:scale-95 shadow-lg shadow-rose-500/30"
          >
            <ArrowDown className="w-7 h-7" />
            REM
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. PONG PADDLE CONTROLS
   ========================================================================= */
const PongPaddleControls: React.FC<{ onMove: (pos: number) => void }> = ({ onMove }) => {
  const [val, setVal] = useState(50);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVal(v);
    onMove(v);
  };

  return (
    <div className="flex flex-col items-center justify-around h-full w-full p-4 select-none">
      <div className="flex gap-4 w-full">
        <button
          onClick={() => {
            const next = Math.max(0, val - 15);
            setVal(next);
            onMove(next);
          }}
          className="flex-1 py-10 rounded-2xl bg-cyan-600 border-2 border-cyan-400 text-white font-black text-3xl flex items-center justify-center active:scale-95 shadow-lg"
        >
          <ArrowUp className="w-10 h-10 mr-1" /> ATAS
        </button>
        <button
          onClick={() => {
            const next = Math.min(100, val + 15);
            setVal(next);
            onMove(next);
          }}
          className="flex-1 py-10 rounded-2xl bg-blue-600 border-2 border-blue-400 text-white font-black text-3xl flex items-center justify-center active:scale-95 shadow-lg"
        >
          <ArrowDown className="w-10 h-10 mr-1" /> BAWAH
        </button>
      </div>

      <div className="w-full bg-slate-900/80 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
        <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">
          Touch Slider Paddle
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={val}
          onChange={handleChange}
          className="w-full h-8 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};

/* =========================================================================
   5. REACTION BUZZER CONTROLLER
   ========================================================================= */
const ReactionBuzzer: React.FC<{ onBuzz: () => void }> = ({ onBuzz }) => {
  const [buzzed, setBuzzed] = useState(false);

  const handlePress = () => {
    setBuzzed(true);
    onBuzz();
    setTimeout(() => setBuzzed(false), 800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      <button
        id="reaction-buzzer-btn"
        onClick={handlePress}
        className={`w-64 h-64 rounded-full flex flex-col items-center justify-center text-white font-black text-3xl border-8 shadow-2xl transition-transform duration-75 active:scale-90 ${
          buzzed
            ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/50 scale-95'
            : 'bg-rose-600 border-rose-400 shadow-rose-600/50 hover:bg-rose-500'
        }`}
      >
        <Zap className="w-16 h-16 mb-2 animate-bounce" />
        {buzzed ? 'TERKIRIM!' : 'TEKAN!'}
      </button>
      <p className="text-slate-400 text-sm mt-6 font-medium text-center">
        Tunggu sampai TV berubah hijau & beri perintah TEKAN!
      </p>
    </div>
  );
};

/* =========================================================================
   6. NUMERIC KEYPAD (Math Battle)
   ========================================================================= */
const NumericKeypad: React.FC<{ onSubmit: (val: number) => void }> = ({ onSubmit }) => {
  const [val, setVal] = useState('');

  const handleNum = (n: number) => {
    if (val.length < 5) {
      setVal((prev) => prev + n.toString());
      sound.playClick();
    }
  };

  const handleClear = () => {
    setVal('');
    sound.playClick();
  };

  const handleSubmit = () => {
    if (!val) return;
    const num = parseInt(val, 10);
    onSubmit(num);
    setVal('');
  };

  return (
    <div className="flex flex-col h-full w-full p-2 select-none gap-2">
      {/* Screen */}
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-3 flex justify-between items-center text-white">
        <span className="text-xs text-slate-400 uppercase font-semibold">Jawaban:</span>
        <span className="text-3xl font-black tracking-widest text-cyan-400">{val || '—'}</span>
      </div>

      {/* 3x4 Grid */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleNum(n)}
            className="rounded-2xl bg-slate-800 border border-slate-700 text-white font-extrabold text-2xl flex items-center justify-center active:bg-cyan-600 active:scale-95 shadow"
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="rounded-2xl bg-rose-900/60 border border-rose-700 text-rose-300 font-bold text-lg flex items-center justify-center active:bg-rose-700 active:scale-95"
        >
          HAPUS
        </button>
        <button
          onClick={() => handleNum(0)}
          className="rounded-2xl bg-slate-800 border border-slate-700 text-white font-extrabold text-2xl flex items-center justify-center active:bg-cyan-600 active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          className="rounded-2xl bg-emerald-600 border border-emerald-400 text-white font-black text-xl flex items-center justify-center active:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/30"
        >
          KIRIM
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   7. TYPING INPUT (Typing Race)
   ========================================================================= */
const TypingInput: React.FC<{ onUpdate: (text: string) => void }> = ({ onUpdate }) => {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t);
    onUpdate(t);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 space-y-4">
      <div className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700">
        <label className="text-xs text-cyan-400 font-semibold uppercase block mb-2">
          Ketik kalimat di TV secepat & seakurat mungkin:
        </label>
        <input
          type="text"
          value={text}
          onChange={handleChange}
          autoFocus
          placeholder="Mulai ketik di sini..."
          className="w-full py-4 px-4 bg-slate-800 border-2 border-cyan-500 rounded-xl text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>
      <p className="text-xs text-slate-400 text-center">
        Progres ketikanmu akan langsung tercermin pada mobil di TV!
      </p>
    </div>
  );
};

/* =========================================================================
   8. WORD CHAIN INPUT (Sambung Kata)
   ========================================================================= */
const WordChainInput: React.FC<{ onSubmitWord: (word: string) => void }> = ({ onSubmitWord }) => {
  const [word, setWord] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    onSubmitWord(word.trim().toUpperCase());
    setWord('');
  };

  return (
    <form onSubmit={handleSend} className="flex flex-col justify-center h-full w-full p-4 space-y-4">
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">
          Masukkan kata berawalan huruf terakhir:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Contoh: MOBIL..."
            className="flex-1 py-3 px-4 bg-slate-800 border-2 border-amber-500 rounded-xl text-white font-black text-xl uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 rounded-xl flex items-center justify-center active:scale-95 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
};

/* =========================================================================
   9. ALPHABET KEYBOARD (Hangman)
   ========================================================================= */
const AlphabetKeyboard: React.FC<{ onLetter: (char: string) => void }> = ({ onLetter }) => {
  const [guessed, setGuessed] = useState<string[]>([]);
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const handlePick = (char: string) => {
    if (guessed.includes(char)) return;
    setGuessed((prev) => [...prev, char]);
    onLetter(char);
  };

  return (
    <div className="flex flex-col justify-center items-center h-full w-full p-2 select-none gap-2">
      {rows.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center gap-1 w-full">
          {row.map((char) => {
            const isUsed = guessed.includes(char);
            return (
              <button
                key={char}
                disabled={isUsed}
                onClick={() => handlePick(char)}
                className={`flex-1 py-4 rounded-xl font-black text-lg transition active:scale-95 ${
                  isUsed
                    ? 'bg-slate-900 text-slate-600 border border-slate-800'
                    : 'bg-slate-800 border border-cyan-500/40 text-white hover:bg-cyan-600 active:bg-cyan-500 shadow'
                }`}
              >
                {char}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* =========================================================================
   10. DRAWING PAD & GUESSING (Gambar & Tebak)
   ========================================================================= */
const DrawingPad: React.FC<{
  roomCode: string;
  playerId: string;
  players: Player[];
  onGuess: (txt: string) => void;
}> = ({ roomCode, playerId, onGuess }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [guessInput, setGuessInput] = useState('');

  const broadcastStroke = (type: string, data?: any) => {
    RoomManager.sendControllerInput(roomCode, playerId, 'drawing', 'DRAW_EVENT', {
      type,
      ...data,
    });
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    broadcastStroke('start', { x, y, color, brushSize });
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    broadcastStroke('draw', { x, y, color, brushSize });
  };

  const stopDraw = () => {
    setIsDrawing(false);
    broadcastStroke('stop');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    broadcastStroke('clear');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="flex flex-col h-full w-full p-2 select-none gap-2">
      {/* Canvas */}
      <div className="relative flex-1 bg-slate-900 rounded-2xl border-2 border-cyan-500/60 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full h-full cursor-crosshair bg-slate-950"
        />
      </div>

      {/* Palette & Controls */}
      <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-slate-800 gap-2">
        <div className="flex gap-2">
          {['#ffffff', '#f43f5e', '#38bdf8', '#fbbf24', '#10b981'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white scale-110 ring-2 ring-cyan-400' : 'border-transparent'}`}
            />
          ))}
        </div>
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
        >
          <Eraser className="w-4 h-4" /> Bersihkan
        </button>
      </div>

      {/* Guess Input for other players */}
      <form onSubmit={handleGuess} className="flex gap-2">
        <input
          type="text"
          value={guessInput}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder="Tebak lukisan ini..."
          className="flex-1 px-3 py-2 bg-slate-800 border border-cyan-500/50 rounded-xl text-white text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-sm"
        >
          Tebak
        </button>
      </form>
    </div>
  );
};

/* =========================================================================
   11. TIC TAC TOE GRID
   ========================================================================= */
const TicTacToeGrid: React.FC<{ onPick: (idx: number) => void }> = ({ onPick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      <div className="grid grid-cols-3 gap-3 w-64 h-64">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <button
            key={idx}
            onClick={() => onPick(idx)}
            className="rounded-2xl bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-300 font-black text-2xl active:bg-cyan-500 active:text-white active:scale-95 shadow"
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">
        Pilih nomor kotak sesuai giliranmu di TV
      </p>
    </div>
  );
};

/* =========================================================================
   12. CONNECT FOUR COLUMNS
   ========================================================================= */
const ConnectFourColumns: React.FC<{ onPickCol: (col: number) => void }> = ({ onPickCol }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      <label className="text-xs text-cyan-400 font-bold uppercase mb-4">
        Pilih Kolom untuk Menjatuhkan Koin:
      </label>
      <div className="grid grid-cols-7 gap-1.5 w-full">
        {[0, 1, 2, 3, 4, 5, 6].map((col) => (
          <button
            key={col}
            onClick={() => onPickCol(col)}
            className="py-8 rounded-xl bg-slate-800 border-2 border-cyan-500/60 text-white font-black text-xl active:bg-cyan-500 active:scale-95 shadow flex flex-col items-center"
          >
            <ArrowDown className="w-5 h-5 mb-1 text-cyan-400" />
            {col + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   13. COLOR MATCH (Stroop Effect)
   ========================================================================= */
const ColorMatchButtons: React.FC<{ onPick: (color: string) => void }> = ({ onPick }) => {
  const colors = [
    { name: 'MERAH', code: '#f43f5e' },
    { name: 'BIRU', code: '#3b82f6' },
    { name: 'HIJAU', code: '#10b981' },
    { name: 'KUNING', code: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full w-full p-2 select-none">
      {colors.map((c) => (
        <button
          key={c.name}
          onClick={() => onPick(c.name)}
          style={{ backgroundColor: c.code }}
          className="rounded-3xl text-white font-black text-3xl shadow-xl flex items-center justify-center active:scale-95 border-2 border-white/30"
        >
          {c.name}
        </button>
      ))}
    </div>
  );
};

/* =========================================================================
   14. MEMORY PADS (Simon Says)
   ========================================================================= */
const MemoryPads: React.FC<{ onPad: (idx: number) => void }> = ({ onPad }) => {
  const pads = [
    { label: '1', bg: 'bg-rose-500' },
    { label: '2', bg: 'bg-cyan-500' },
    { label: '3', bg: 'bg-amber-500' },
    { label: '4', bg: 'bg-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full w-full p-2 select-none">
      {pads.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onPad(idx)}
          className={`rounded-3xl ${p.bg} text-white font-black text-4xl shadow-xl flex items-center justify-center active:scale-95 border-2 border-white/20`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

/* =========================================================================
   15. VOTING PICKER (Voting Battle)
   ========================================================================= */
const VotingPicker: React.FC<{
  players: Player[];
  onVote: (playerId: string) => void;
}> = ({ players, onVote }) => {
  const [votedId, setVotedId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    setVotedId(id);
    onVote(id);
  };

  return (
    <div className="flex flex-col h-full w-full p-2 select-none">
      <h4 className="text-xs text-slate-400 uppercase font-semibold text-center mb-3">
        Pilih Pemain yang Paling Sesuai:
      </h4>
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => handleVote(p.id)}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition active:scale-95 ${
              votedId === p.id
                ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400'
                : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className="text-4xl">{p.avatar}</span>
            <span className="font-bold text-sm text-white truncate max-w-full">{p.nickname}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   16. WHO AM I CONTROLS
   ========================================================================= */
const WhoAmIControls: React.FC<{
  onGiveClue: (clue: string) => void;
  onGuessIdentity: (ans: string) => void;
}> = ({ onGiveClue, onGuessIdentity }) => {
  const [clue, setClue] = useState('');
  const [guess, setGuess] = useState('');

  return (
    <div className="flex flex-col justify-around h-full w-full p-3 space-y-4">
      {/* Clue form */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <label className="text-xs text-cyan-400 font-bold uppercase block mb-1">
          Beri Clue untuk Pemain Rahasia:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            placeholder="Clue: berkaki 4..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
          />
          <button
            onClick={() => {
              if (clue.trim()) {
                onGiveClue(clue.trim());
                setClue('');
              }
            }}
            className="px-4 bg-cyan-500 text-slate-950 font-bold rounded-xl text-sm"
          >
            Kirim Clue
          </button>
        </div>
      </div>

      {/* Guess form */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <label className="text-xs text-emerald-400 font-bold uppercase block mb-1">
          Tebak Siapa Dia:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Tebakanmu..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
          />
          <button
            onClick={() => {
              if (guess.trim()) {
                onGuessIdentity(guess.trim());
                setGuess('');
              }
            }}
            className="px-4 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm"
          >
            Tebak!
          </button>
        </div>
      </div>
    </div>
  );
};
