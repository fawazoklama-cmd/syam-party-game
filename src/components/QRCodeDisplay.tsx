import React from 'react';
import { QrCode } from 'lucide-react';

interface QRCodeProps {
  url: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeProps> = ({ url, size = 200 }) => {
  // Using high-speed dynamic SVG QR API with clean fallback
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&bgcolor=090d16&color=38bdf8&margin=6`;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
      <img
        src={qrApiUrl}
        alt="Scan QR Code to Join"
        width={size}
        height={size}
        className="rounded-xl"
        loading="eager"
      />
    </div>
  );
};
