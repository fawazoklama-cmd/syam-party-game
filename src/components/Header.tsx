import React from 'react';
import { Tv, Smartphone, Gamepad2, Volume2, VolumeX, Settings as SettingsIcon } from 'lucide-react';
import { sound } from '../lib/sound';

interface HeaderProps {
  onOpenSettings?: () => void;
  onGoHome?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onGoHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      {/* Brand Logo */}
      <div
        onClick={onGoHome}
        className="flex items-center gap-3 cursor-pointer group select-none"
      >
        <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
          <div className="flex items-center">
            <Tv className="w-5 h-5 text-white" />
            <Smartphone className="w-4 h-4 text-cyan-200 -ml-1.5" />
          </div>
          <Gamepad2 className="w-3.5 h-3.5 text-amber-300 absolute -bottom-1 -right-1" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 font-black text-xl tracking-tight text-white group-hover:text-cyan-400 transition">
            <span>SYAM</span>
            <span className="text-cyan-400">PARTY</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30">
              GAME
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium tracking-wide">
            Satu TV. Banyak HP. Satu Party.
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Pengaturan"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
