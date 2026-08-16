import React, { useState, useEffect } from 'react';
import { Player, ControllerInputEvent } from '../types';
import { VOTING_PROMPTS } from '../data/quizData';
import { sound } from '../lib/sound';
import { Vote, Timer, Trophy } from 'lucide-react';

interface VotingProps {
  players: Player[];
  inputEvents: ControllerInputEvent[];
  onGameEnd: (rankings: { playerId: string; rank: number; score: number }[]) => void;
}

export const VotingBattleView: React.FC<VotingProps> = ({
  players,
  inputEvents,
  onGameEnd,
}) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [prompt, setPrompt] = useState(() => VOTING_PROMPTS[0]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [scores, setScores] = useState<{ [id: string]: number }>(() => {
    const s: { [id: string]: number } = {};
    players.forEach((p) => (s[p.id] = 0));
    return s;
  });
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    setPrompt(VOTING_PROMPTS[(round - 1) % VOTING_PROMPTS.length]);
    setVotes({});
    setShowResults(false);
    setTimeLeft(20);
  }, [round]);

  // Handle incoming vote
  useEffect(() => {
    if (inputEvents.length === 0 || showResults) return;
    const latest = inputEvents[inputEvents.length - 1];

    if (latest.action === 'VOTE_PLAYER' && latest.payload?.targetPlayerId) {
      const targetId = String(latest.payload.targetPlayerId);
      setVotes((prev) => ({ ...prev, [latest.playerId]: targetId }));
      sound.playClick();
    }
  }, [inputEvents, showResults]);

  // Check if all voted or timer end
  useEffect(() => {
    if (showResults) return;
    const allVoted = players.every((p) => votes[p.id] !== undefined);

    if (allVoted || timeLeft <= 0) {
      evaluateVotes();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [votes, timeLeft, showResults, players]);

  const evaluateVotes = () => {
    setShowResults(true);
    sound.playVictory();

    // Tally votes
    const tally: Record<string, number> = {};
    Object.values(votes).forEach((targetId: string) => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });

    setScores((prev) => {
      const next = { ...prev };
      Object.entries(tally).forEach(([targetId, count]) => {
        next[targetId] = (next[targetId] || 0) + count * 50;
      });
      return next;
    });

    setTimeout(() => {
      if (round >= totalRounds) {
        const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
        const rankings = sorted.map((p, idx) => ({
          playerId: p.id,
          rank: idx + 1,
          score: scores[p.id] || 0,
        }));
        onGameEnd(rankings);
      } else {
        setRound((r) => r + 1);
      }
    }, 4500);
  };

  // Compute vote counts for each player
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetId: string) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full w-full justify-between p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <Vote className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold text-xl text-white">VOTING BATTLE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400">Ronde {round} / {totalRounds}</span>
          <div className="flex items-center gap-2 bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-xl font-black text-xl border border-cyan-500/30">
            <Timer className="w-5 h-5" /> {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 text-center max-w-4xl mx-auto w-full">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/30">
          Voting Anonim Pemain Paling Sesuai di HP
        </span>

        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
          "{prompt}"
        </h2>
      </div>

      {/* Player Vote Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
        {players.map((p) => {
          const count = voteCounts[p.id] || 0;
          const hasVoted = votes[p.id] !== undefined;

          return (
            <div
              key={p.id}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 bg-slate-900/90 shadow transition-all ${
                showResults && count > 0
                  ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 scale-105'
                  : hasVoted
                  ? 'border-emerald-500/60'
                  : 'border-slate-800'
              }`}
            >
              <span className="text-4xl mb-2">{p.avatar}</span>
              <span className="font-bold text-white text-base truncate">{p.nickname}</span>

              {showResults ? (
                <div className="mt-2 text-2xl font-black text-amber-400">
                  🗳️ {count} Suara
                </div>
              ) : (
                <div className="mt-2 text-xs font-semibold text-slate-400">
                  {hasVoted ? '🟢 Sudah Memilih' : '⚪ Belum Memilih'}
                </div>
              )}

              <span className="text-xs font-bold text-cyan-400 mt-1">
                {scores[p.id] || 0} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
