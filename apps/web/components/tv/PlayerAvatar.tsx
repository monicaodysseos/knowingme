'use client';

import type { PlayerColor, PlayerCharacter } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';

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
          <Y2KAvatar avatar={avatar} size={px} />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center font-black text-white select-none"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${color.hex}ee, ${color.hex}88)`,
              fontSize: px * 0.38,
              border: `3px solid ${Y2K.dark}`,
              boxShadow: `0 4px 0 ${Y2K.dark}`,
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
          className="font-black text-center leading-tight uppercase"
          style={{
            fontSize: nameFont,
            color: color.hex,
            maxWidth: px * 1.6,
            fontFamily: Y2K.display,
            WebkitTextStroke: `0.5px ${Y2K.dark}`,
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
