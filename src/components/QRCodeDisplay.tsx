import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Copy, Check, Maximize2, X } from 'lucide-react';
import { sound } from '../lib/sound';

interface QRCodeProps {
  url: string;
  size?: number;
  showActions?: boolean;
  title?: string;
}

export const QRCodeDisplay: React.FC<QRCodeProps> = ({
  url,
  size = 180,
  showActions = true,
  title = 'Scan to Join',
}) => {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = async () => {
    sound.playClick();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleDownloadPNG = () => {
    sound.playClick();
    const canvasElement = canvasRef.current?.querySelector('canvas');
    if (canvasElement) {
      const pngUrl = canvasElement.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `syam-party-qr-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* QR Box */}
      <div className="relative group bg-slate-950 p-4 rounded-3xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 flex items-center justify-center transition hover:border-cyan-400">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#030712"
          fgColor="#38bdf8"
          level="H"
          includeMargin={false}
          className="rounded-xl"
        />

        {/* Hidden Canvas for crisp PNG Export */}
        <div ref={canvasRef} className="hidden">
          <QRCodeCanvas
            value={url}
            size={512}
            bgColor="#030712"
            fgColor="#38bdf8"
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Floating Zoom overlay button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsZoomed(true);
          }}
          title="Perbesar QR Code"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition shadow-lg"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Salin Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPNG}
            title="Download QR PNG"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Unduh</span>
          </button>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-cyan-400 font-black text-lg">
              <QrCode className="w-6 h-6" />
              <span>{title}</span>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border-2 border-cyan-400 shadow-xl shadow-cyan-500/20">
              <QRCodeSVG
                value={url}
                size={260}
                bgColor="#030712"
                fgColor="#38bdf8"
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-slate-400 font-mono break-all px-2">
              {url}
            </p>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin Link'}
              </button>

              <button
                onClick={handleDownloadPNG}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Unduh PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
