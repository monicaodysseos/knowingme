'use client';

import type { PlayerColor, PlayerCharacter } from '@ksero-se/types';
import CharacterShape from './CharacterShape';

interface Props {
  name: string;
  color: PlayerColor;
  avatar?: PlayerCharacter;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isConnected?: boolean;
  showName?: boolean;
}

const sizes = {
  sm: { px: 40,  nameFont: 14 },
  md: { px: 56,  nameFont: 16 },
  lg: { px: 80,  nameFont: 20 },
  xl: { px: 120, nameFont: 28 },
};

export default function PlayerAvatar({
  name,
  color,
  avatar,
  size = 'md',
  isConnected = true,
  showName = false,
}: Props) {
  const { px, nameFont } = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          width: px,
          height: px,
          opacity: isConnected ? 1 : 0.4,
          filter: isConnected ? 'none' : 'grayscale(80%)',
        }}
      >
        {avatar ? (
          <CharacterShape shape={avatar} color={color.hex} size={px} />
        ) : (
          /* Fallback initials circle */
          <div
            className="w-full h-full rounded-full flex items-center justify-center font-black text-white select-none"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color.hex}ee, ${color.hex}88)`,
              fontSize: px * 0.38,
              boxShadow: isConnected
                ? `0 0 0 3px ${color.hex}55, 0 0 24px ${color.hex}44`
                : `0 0 0 2px #333`,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {!isConnected && (
          <div
            className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-black text-white"
            style={{
              width: px * 0.32,
              height: px * 0.32,
              background: '#374151',
              fontSize: px * 0.18,
            }}
          >
            !
          </div>
        )}
      </div>

      {showName && (
        <span
          className="font-bold text-center leading-tight"
          style={{ fontSize: nameFont, color: color.hex, maxWidth: px * 1.6 }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
