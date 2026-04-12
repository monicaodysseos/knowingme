'use client';

import type { PlayerColor } from '@ksero-se/types';

interface Props {
  name: string;
  color: PlayerColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isConnected?: boolean;
  showName?: boolean;
}

const sizes = {
  sm: { circle: 40,  font: 16, gap: 6,  nameFont: 14 },
  md: { circle: 56,  font: 22, gap: 8,  nameFont: 16 },
  lg: { circle: 80,  font: 32, gap: 10, nameFont: 20 },
  xl: { circle: 120, font: 48, gap: 14, nameFont: 28 },
};

export default function PlayerAvatar({
  name,
  color,
  size = 'md',
  isConnected = true,
  showName = false,
}: Props) {
  const s = sizes[size];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center" style={{ gap: s.gap }}>
      <div
        className="rounded-full flex items-center justify-center font-black relative transition-all duration-300"
        style={{
          width: s.circle,
          height: s.circle,
          background: `radial-gradient(circle at 35% 35%, ${color.hex}ee, ${color.hex}88)`,
          boxShadow: isConnected
            ? `0 0 0 3px ${color.hex}55, 0 0 24px ${color.hex}44`
            : `0 0 0 2px #333`,
          fontSize: s.font,
          color: '#ffffff',
          opacity: isConnected ? 1 : 0.4,
          filter: isConnected ? 'none' : 'grayscale(0.8)',
        }}
      >
        {initial}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 text-xs bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
            ⚡
          </span>
        )}
      </div>
      {showName && (
        <span
          className="font-bold text-center leading-tight max-w-[100px] truncate"
          style={{ fontSize: s.nameFont, color: color.hex }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
