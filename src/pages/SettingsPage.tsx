import React, { useState } from 'react';
import { Settings, ArrowLeft, Volume2, VolumeX, Smartphone, Tv, HelpCircle, Shield, Info } from 'lucide-react';
import { sound } from '../lib/sound';

interface SettingsProps {
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(80);

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] p-6 md:p-10 max-w-3xl mx-auto w-full select-none">
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
            <Settings className="w-8 h-8 text-purple-400" />
            Pengaturan & Panduan
          </h1>
          <p className="text-xs text-slate-400">
            Atur preferensi suara, controller, dan panduan bermain
          </p>
        </div>
      </div>

      <div className="space-y-6 my-6">
        {/* AUDIO SECTION */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
            Audio & Efek Suara
          </h3>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-base">Sound FX Web Audio</div>
              <div className="text-xs text-slate-400">Synthesizer efek suara klik, countdown, dan victory</div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onToggleSound();
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-slate-950 transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-300 font-bold">
              <span>Volume Suara</span>
              <span>{musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* CONTROLLER SECTION */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider">
            Controller Smartphone
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-base">Getaran Haptic Touch</div>
              <div className="text-xs text-slate-400">Getaran saat menekan tombol kontrol di HP</div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setVibrationEnabled(!vibrationEnabled);
                if (navigator.vibrate) navigator.vibrate(50);
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                vibrationEnabled ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-slate-950 transition-transform ${
                  vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* HOW TO PLAY GUIDE */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Cara Bermain (Panduan Singkat)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-black text-cyan-400 text-sm">1. Siapkan TV / Layar</span>
              <p className="text-slate-400 leading-relaxed">
                Buka SYAM PARTY GAME di TV atau Laptop, lalu pilih <strong className="text-white">PLAY TV</strong> untuk membuat Room baru.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-black text-indigo-400 text-sm">2. Gabung Lewat HP</span>
              <p className="text-slate-400 leading-relaxed">
                Scan QR Code di layar TV dengan kamera HP atau buka web dan pilih <strong className="text-white">PLAY CONTROLLER</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-black text-amber-400 text-sm">3. Mainkan Pesta!</span>
              <p className="text-slate-400 leading-relaxed">
                Host memilih 1 dari 20 mini-game dan layar HP pemain akan otomatis berubah menjadi stik controller!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
