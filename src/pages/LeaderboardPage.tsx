import React, { useState } from 'react';
import { Trophy, ArrowLeft, Medal, Flame, Star, Award } from 'lucide-react';
import { sound } from '../lib/sound';

interface LeaderboardProps {
  onBack: () => void;
}

interface LeaderboardEntry {
  rank: number;
  avatar: string;
  name: string;
  points: number;
  wins: number;
  gamesPlayed: number;
}

const DUMMY_LEADERBOARD: { [tab: string]: LeaderboardEntry[] } = {
  daily: [
    { rank: 1, avatar: '👑', name: 'SyamMaster', points: 1450, wins: 8, gamesPlayed: 10 },
    { rank: 2, avatar: '⚡', name: 'KilatBoy', points: 1120, wins: 5, gamesPlayed: 7 },
    { rank: 3, avatar: '🐱', name: 'MeowGamer', points: 980, wins: 4, gamesPlayed: 8 },
    { rank: 4, avatar: '🍕', name: 'PizzaKing', points: 840, wins: 3, gamesPlayed: 6 },
    { rank: 5, avatar: '🤖', name: 'CyberBot', points: 760, wins: 2, gamesPlayed: 5 },
  ],
  weekly: [
    { rank: 1, avatar: '👑', name: 'SyamMaster', points: 8450, wins: 34, gamesPlayed: 45 },
    { rank: 2, avatar: '🦄', name: 'StarGazer', points: 7200, wins: 29, gamesPlayed: 40 },
    { rank: 3, avatar: '⚡', name: 'KilatBoy', points: 6800, wins: 24, gamesPlayed: 38 },
    { rank: 4, avatar: '🦁', name: 'RajaHutan', points: 5400, wins: 18, gamesPlayed: 30 },
    { rank: 5, avatar: '🐱', name: 'MeowGamer', points: 4900, wins: 16, gamesPlayed: 28 },
  ],
  allTime: [
    { rank: 1, avatar: '👑', name: 'SyamMaster', points: 34200, wins: 142, gamesPlayed: 200 },
    { rank: 2, avatar: '🦄', name: 'StarGazer', points: 28500, wins: 118, gamesPlayed: 175 },
    { rank: 3, avatar: '👾', name: 'RetroPixel', points: 24100, wins: 95, gamesPlayed: 150 },
    { rank: 4, avatar: '⚡', name: 'KilatBoy', points: 21900, wins: 88, gamesPlayed: 140 },
    { rank: 5, avatar: '🚀', name: 'AstroRacer', points: 19800, wins: 76, gamesPlayed: 120 },
  ],
};

export const LeaderboardPage: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'daily' | 'weekly' | 'allTime'>('daily');
  const data = DUMMY_LEADERBOARD[tab];

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] p-6 md:p-10 max-w-4xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Party Leaderboard
          </h1>
          <p className="text-xs text-slate-400">
            Peringkat Juara Pesta Mini-Game SYAM PARTY GAME
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 my-6 max-w-md">
        {(['daily', 'weekly', 'allTime'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              sound.playClick();
              setTab(t);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              tab === t
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'daily' ? 'Harian' : t === 'weekly' ? 'Mingguan' : 'Sepanjang Masa'}
          </button>
        ))}
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-3 gap-4 mb-8 items-end">
        {/* Rank 2 */}
        {data[1] && (
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-1">{data[1].avatar}</span>
            <span className="font-extrabold text-sm text-white truncate max-w-full">{data[1].name}</span>
            <span className="text-xs font-bold text-slate-400 mb-2">{data[1].points} Pts</span>
            <div className="w-full h-32 rounded-3xl bg-slate-800 border-2 border-slate-600 flex flex-col items-center justify-center p-3 shadow-lg">
              <span className="text-2xl font-black text-slate-300">#2</span>
              <span className="text-[10px] text-slate-400 font-semibold">{data[1].wins} Menang</span>
            </div>
          </div>
        )}

        {/* Rank 1 */}
        {data[0] && (
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-1 animate-bounce">{data[0].avatar}</div>
            <span className="font-black text-base text-amber-300 truncate max-w-full">{data[0].name}</span>
            <span className="text-xs font-black text-cyan-400 mb-2">{data[0].points} Pts</span>
            <div className="w-full h-44 rounded-3xl bg-gradient-to-t from-amber-600 to-amber-400 border-2 border-amber-200 flex flex-col items-center justify-center p-3 shadow-2xl scale-105">
              <Trophy className="w-8 h-8 text-slate-950 mb-1" />
              <span className="text-3xl font-black text-slate-950">#1</span>
              <span className="text-xs text-slate-900 font-bold">{data[0].wins} Menang</span>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {data[2] && (
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-1">{data[2].avatar}</span>
            <span className="font-extrabold text-sm text-white truncate max-w-full">{data[2].name}</span>
            <span className="text-xs font-bold text-slate-400 mb-2">{data[2].points} Pts</span>
            <div className="w-full h-24 rounded-3xl bg-amber-900/60 border-2 border-amber-700 flex flex-col items-center justify-center p-3 shadow-lg">
              <span className="text-2xl font-black text-amber-500">#3</span>
              <span className="text-[10px] text-amber-300 font-semibold">{data[2].wins} Menang</span>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table List */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.rank}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-4">
              <span className="font-black text-lg text-slate-400 w-6 text-center">
                #{item.rank}
              </span>
              <span className="text-3xl">{item.avatar}</span>
              <div>
                <div className="font-bold text-white text-base">{item.name}</div>
                <div className="text-xs text-slate-400 font-medium">
                  {item.wins}x Juara 1 &bull; {item.gamesPlayed} Permainan
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-cyan-400">{item.points} Pts</div>
              <div className="text-[10px] text-slate-500 font-semibold">Total Skor</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
