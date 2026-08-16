import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Link,
  Wifi,
  Type,
  Tv,
  Printer,
  Sliders,
} from 'lucide-react';
import { sound } from '../lib/sound';

interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomCode?: string;
}

type QRType = 'room' | 'url' | 'wifi' | 'text';

const COLOR_PRESETS = [
  { name: 'Neon Cyan', fg: '#38bdf8', bg: '#030712' },
  { name: 'Electric Purple', fg: '#c084fc', bg: '#0f0728' },
  { name: 'Emerald Green', fg: '#34d399', bg: '#022c22' },
  { name: 'Amber Gold', fg: '#fbbf24', bg: '#1c1917' },
  { name: 'Rose Red', fg: '#fb7185', bg: '#1c050c' },
  { name: 'Classic Dark', fg: '#f8fafc', bg: '#020617' },
];

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultRoomCode = '',
}) => {
  const [qrType, setQrType] = useState<QRType>('room');
  const [roomCode, setRoomCode] = useState(defaultRoomCode || 'SYAM-7777');
  const [customUrl, setCustomUrl] = useState('https://');
  const [customText, setCustomText] = useState('Selamat Datang di SYAM PARTY GAME!');
  const [wifiSsid, setWifiSsid] = useState('Party-WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiAuth, setWifiAuth] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[0]);
  const [qrSize, setQrSize] = useState(220);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Compute final QR text payload based on selected type
  let qrValue = '';
  switch (qrType) {
    case 'room': {
      const code = (roomCode || 'SYAM-0000').trim().toUpperCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      qrValue = `${origin}/#controller?code=${encodeURIComponent(code)}`;
      break;
    }
    case 'url':
      qrValue = customUrl || 'https://';
      break;
    case 'wifi':
      qrValue = `WIFI:T:${wifiAuth};S:${wifiSsid};P:${wifiPassword};;`;
      break;
    case 'text':
      qrValue = customText;
      break;
  }

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(qrValue);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadPNG = () => {
    sound.playClick();
    const canvasElement = canvasRef.current?.querySelector('canvas');
    if (canvasElement) {
      const pngUrl = canvasElement.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `syam-party-qr-${qrType}-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                QR Code Generator & Stiker Party
              </h2>
              <p className="text-xs text-slate-400">
                Buat dan unduh QR code kustom untuk room game, link web, atau Wi-Fi tamu
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Type Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'room', label: 'Room Game', icon: <Tv className="w-4 h-4" /> },
            { id: 'url', label: 'Website Link', icon: <Link className="w-4 h-4" /> },
            { id: 'wifi', label: 'Wi-Fi Tamu', icon: <Wifi className="w-4 h-4" /> },
            { id: 'text', label: 'Teks Bebas', icon: <Type className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setQrType(tab.id as QRType);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black transition ${
                qrType === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Grid: Settings on Left, Preview on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* LEFT: Inputs & Color Config (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* 1. Dynamic Type Inputs */}
            {qrType === 'room' && (
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300">Room Code Game</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: SYAM-4821"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base tracking-wider focus:border-cyan-400 outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Pemain yang scan QR code ini akan langsung membuka controller & otomatis mengisi kode room.
                </p>
              </div>
            )}

            {qrType === 'url' && (
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300">URL Tautan</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 outline-none"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nama Wi-Fi (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Password Wi-Fi</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Kosongkan jika tanpa password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'text' && (
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300">Isi Pesan / Teks</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none resize-none"
                />
              </div>
            )}

            {/* 2. Theme & Color Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Pilihan Tema Warna:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      sound.playClick();
                      setColorPreset(preset);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition text-xs font-bold ${
                      colorPreset.name === preset.name
                        ? 'border-cyan-400 bg-slate-800 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 border border-slate-700"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Error Correction Level */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Tingkat Koreksi Error:</span>
              <div className="flex gap-1">
                {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setErrorLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                      errorLevel === lvl
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Preview & Export (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-slate-950 p-6 rounded-3xl border-2 border-slate-800 text-center space-y-4">
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Hasil QR Code
            </span>

            {/* Live QR Render */}
            <div
              className="p-4 rounded-2xl shadow-xl transition-transform hover:scale-105 duration-200 border"
              style={{ backgroundColor: colorPreset.bg, borderColor: `${colorPreset.fg}40` }}
            >
              <QRCodeSVG
                value={qrValue || 'SYAM PARTY'}
                size={qrSize}
                bgColor={colorPreset.bg}
                fgColor={colorPreset.fg}
                level={errorLevel}
                includeMargin={true}
              />
            </div>

            {/* Hidden Canvas for High-Resolution PNG export */}
            <div ref={canvasRef} className="hidden">
              <QRCodeCanvas
                value={qrValue || 'SYAM PARTY'}
                size={600}
                bgColor={colorPreset.bg}
                fgColor={colorPreset.fg}
                level={errorLevel}
                includeMargin={true}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-mono break-all max-w-[200px] line-clamp-2">
              {qrValue}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={handleDownloadPNG}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <Download className="w-4 h-4" /> Unduh Gambar PNG
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Salin Isi Teks / Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
