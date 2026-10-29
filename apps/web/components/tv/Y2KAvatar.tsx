'use client';

import type { PlayerCharacter } from '@ksero-se/types';
import { AVATAR_MAP } from '../../lib/y2k';

interface Props {
  avatar?: PlayerCharacter | string;
  size?: number;
  style?: React.CSSProperties;
}

const OUT = '#0b0429';
const SW = 3;

type PresetKey = 'ghost' | 'frog' | 'alien' | 'bunny' | 'tamago' | 'mushroom' | 'melt' | 'robot';

const presets: Record<PresetKey, { defs?: () => React.ReactNode; render: () => React.ReactNode }> = {
  ghost: {
    defs: () => (
      <radialGradient id="ghost-g" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#D3E3FF" />
      </radialGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="28" ry="4" fill="rgba(11,4,41,0.2)" />
        <path d="M 18 42 Q 18 12 50 12 Q 82 12 82 42 L 82 82 Q 76 88 70 82 Q 64 76 58 82 Q 52 88 46 82 Q 40 76 34 82 Q 28 88 22 82 Q 18 78 18 74 Z"
          fill="url(#ghost-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <g>
          <ellipse cx="50" cy="14" rx="28" ry="4" fill="#8B3A2E" stroke={OUT} strokeWidth="2.5" />
          <path d="M 36 14 Q 32 -4 50 -4 Q 68 -4 64 14 Z" fill="#A84632" stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="36" y="10" width="28" height="4" fill="#6B2419" stroke={OUT} strokeWidth="1.5" />
          <circle cx="50" cy="12" r="2" fill="#FFE24A" stroke={OUT} strokeWidth="1" />
        </g>
        <ellipse cx="38" cy="48" rx="6" ry="8" fill={OUT} />
        <ellipse cx="62" cy="48" rx="6" ry="8" fill={OUT} />
        <circle cx="40" cy="46" r="2.5" fill="#fff" />
        <circle cx="64" cy="46" r="2.5" fill="#fff" />
        <ellipse cx="50" cy="66" rx="4" ry="5" fill={OUT} />
        <circle cx="28" cy="60" r="4" fill="#FF4FB4" opacity="0.55" />
        <circle cx="72" cy="60" r="4" fill="#FF4FB4" opacity="0.55" />
      </g>
    ),
  },

  frog: {
    defs: () => (
      <radialGradient id="frog-g" cx="50%" cy="60%" r="60%">
        <stop offset="0" stopColor="#A8E847" />
        <stop offset="1" stopColor="#3D8A1F" />
      </radialGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="30" ry="4" fill="rgba(11,4,41,0.2)" />
        <path d="M 10 70 Q 10 35 50 35 Q 90 35 90 70 Q 90 88 50 88 Q 10 88 10 70 Z" fill="url(#frog-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <ellipse cx="50" cy="76" rx="18" ry="8" fill="#E8F5B8" opacity="0.7" />
        <circle cx="32" cy="32" r="14" fill="url(#frog-g)" stroke={OUT} strokeWidth={SW} />
        <circle cx="68" cy="32" r="14" fill="url(#frog-g)" stroke={OUT} strokeWidth={SW} />
        <circle cx="32" cy="32" r="8" fill="#fff" stroke={OUT} strokeWidth="2" />
        <circle cx="68" cy="32" r="8" fill="#fff" stroke={OUT} strokeWidth="2" />
        <circle cx="34" cy="34" r="4.5" fill={OUT} />
        <circle cx="70" cy="34" r="4.5" fill={OUT} />
        <circle cx="36" cy="32" r="1.5" fill="#fff" />
        <circle cx="72" cy="32" r="1.5" fill="#fff" />
        <path d="M 38 16 L 38 4 L 44 10 L 50 0 L 56 10 L 62 4 L 62 16 Z" fill="#FFD23F" stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="50" cy="6" r="2" fill="#FF1E8E" stroke={OUT} strokeWidth="1" />
        <path d="M 32 66 Q 50 78 68 66" stroke={OUT} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },

  alien: {
    defs: () => (
      <radialGradient id="alien-g" cx="50%" cy="35%" r="70%">
        <stop offset="0" stopColor="#E0B6FF" />
        <stop offset="1" stopColor="#7B2FD9" />
      </radialGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="26" ry="3" fill="rgba(11,4,41,0.2)" />
        <path d="M 20 50 Q 20 15 50 15 Q 80 15 80 50 Q 80 72 70 76 Q 50 82 30 76 Q 20 72 20 50 Z" fill="url(#alien-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <circle cx="50" cy="46" r="22" fill="#fff" stroke={OUT} strokeWidth={SW} />
        <circle cx="50" cy="46" r="15" fill="#00D5FF" stroke={OUT} strokeWidth="2" />
        <circle cx="50" cy="46" r="8" fill={OUT} />
        <circle cx="54" cy="42" r="3" fill="#fff" />
        <circle cx="46" cy="50" r="1.5" fill="#fff" />
        <path d="M 30 78 Q 26 92 32 96" stroke={OUT} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 50 82 Q 50 96 54 96" stroke={OUT} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 70 78 Q 74 92 68 96" stroke={OUT} strokeWidth="4" fill="none" strokeLinecap="round" />
        <line x1="50" y1="15" x2="50" y2="4" stroke={OUT} strokeWidth="3" />
        <circle cx="50" cy="2" r="4" fill="#FFE24A" stroke={OUT} strokeWidth="2" />
        <path d="M 14 24 L 16 28 L 20 30 L 16 32 L 14 36 L 12 32 L 8 30 L 12 28 Z" fill="#FFE24A" stroke={OUT} strokeWidth="1" />
      </g>
    ),
  },

  bunny: {
    defs: () => (
      <linearGradient id="bunny-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD6E8" />
        <stop offset="1" stopColor="#FF6DAB" />
      </linearGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="25" ry="3" fill="rgba(11,4,41,0.2)" />
        <path d="M 28 16 Q 24 -4 36 0 Q 42 4 40 34 Z" fill="url(#bunny-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 72 16 Q 76 -4 64 0 Q 58 4 60 34 Z" fill="url(#bunny-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 30 12 Q 30 2 34 2 Q 36 4 36 28 Z" fill="#FF4FB4" opacity="0.6" />
        <circle cx="50" cy="54" r="30" fill="url(#bunny-g)" stroke={OUT} strokeWidth={SW} />
        <circle cx="38" cy="50" r="4.5" fill={OUT} />
        <rect x="56" y="45" width="12" height="10" fill={OUT} stroke={OUT} strokeWidth="1" rx="1" />
        <rect x="58" y="47" width="8" height="2" fill="#00D5FF" />
        <rect x="58" y="51" width="4" height="2" fill="#00D5FF" />
        <path d="M 47 60 L 53 60 L 50 65 Z" fill="#FF1E8E" stroke={OUT} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M 50 65 L 50 68" stroke={OUT} strokeWidth="2" />
        <path d="M 44 72 Q 50 76 50 68" stroke={OUT} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 56 72 Q 50 76 50 68" stroke={OUT} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="48" y="72" width="4" height="4" fill="#fff" stroke={OUT} strokeWidth="1.2" />
        <circle cx="28" cy="62" r="5" fill="#FF1E8E" opacity="0.5" />
        <circle cx="72" cy="62" r="5" fill="#FF1E8E" opacity="0.5" />
      </g>
    ),
  },

  tamago: {
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="26" ry="3" fill="rgba(11,4,41,0.2)" />
        <ellipse cx="50" cy="50" rx="40" ry="44" fill="#FF4FB4" stroke={OUT} strokeWidth={SW} />
        <rect x="22" y="30" width="56" height="40" fill="#D1EDC2" stroke={OUT} strokeWidth={SW} rx="4" />
        <g fill={OUT}>
          <rect x="32" y="40" width="6" height="6" />
          <rect x="62" y="40" width="6" height="6" />
          <rect x="40" y="58" width="20" height="4" />
          <rect x="36" y="54" width="4" height="4" />
          <rect x="60" y="54" width="4" height="4" />
        </g>
        <circle cx="32" cy="82" r="5" fill="#FFE24A" stroke={OUT} strokeWidth="2" />
        <circle cx="50" cy="85" r="5" fill="#00D5FF" stroke={OUT} strokeWidth="2" />
        <circle cx="68" cy="82" r="5" fill="#A0FF5C" stroke={OUT} strokeWidth="2" />
        <circle cx="50" cy="10" r="3" fill={OUT} />
        <line x1="50" y1="10" x2="50" y2="2" stroke={OUT} strokeWidth="2" />
        <ellipse cx="34" cy="22" rx="10" ry="6" fill="#fff" opacity="0.5" />
      </g>
    ),
  },

  mushroom: {
    defs: () => (
      <radialGradient id="shroom-g" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#FF1E8E" />
        <stop offset="1" stopColor="#7B1446" />
      </radialGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="22" ry="3" fill="rgba(11,4,41,0.2)" />
        <path d="M 35 60 Q 32 88 50 88 Q 68 88 65 60 Z" fill="#FFF5DA" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 8 50 Q 8 10 50 10 Q 92 10 92 50 Q 92 58 80 60 L 20 60 Q 8 58 8 50 Z" fill="url(#shroom-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <g stroke={OUT} strokeWidth="1.5">
          <circle cx="24" cy="30" r="5" fill="#fff" opacity="0.9" />
          <circle cx="46" cy="22" r="5" fill="#fff" opacity="0.9" />
          <circle cx="68" cy="28" r="5" fill="#fff" opacity="0.9" />
          <circle cx="80" cy="42" r="4" fill="#fff" opacity="0.9" />
          <circle cx="32" cy="46" r="4" fill="#fff" opacity="0.9" />
          <circle cx="58" cy="44" r="4" fill="#fff" opacity="0.9" />
        </g>
        <circle cx="43" cy="72" r="1.8" fill={OUT} />
        <circle cx="57" cy="72" r="1.8" fill={OUT} />
        <path d="M 43 78 Q 50 83 57 78" stroke={OUT} strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="38" cy="78" r="2.5" fill="#FF4FB4" opacity="0.5" />
        <circle cx="62" cy="78" r="2.5" fill="#FF4FB4" opacity="0.5" />
      </g>
    ),
  },

  melt: {
    defs: () => (
      <radialGradient id="melt-g" cx="40%" cy="30%" r="70%">
        <stop offset="0" stopColor="#FFF4A8" />
        <stop offset="1" stopColor="#FFB800" />
      </radialGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="26" ry="3" fill="rgba(11,4,41,0.2)" />
        <path d="M 8 44 Q 8 8 50 8 Q 92 8 92 44 Q 92 70 86 74 Q 84 88 74 84 Q 70 96 62 88 Q 58 72 52 78 Q 48 92 42 82 Q 38 68 30 76 Q 24 90 18 82 Q 14 68 12 66 Q 8 58 8 44 Z"
          fill="url(#melt-g)" stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M 30 36 Q 30 28 36 28 Q 42 28 42 36 Q 42 50 38 58 Q 36 62 34 58 Q 30 50 30 36 Z" fill={OUT} />
        <path d="M 58 36 Q 58 28 64 28 Q 70 28 70 36 Q 70 48 66 54 Q 64 58 62 54 Q 58 46 58 36 Z" fill={OUT} />
        <path d="M 28 54 Q 50 72 72 54 Q 70 66 60 66 Q 62 74 58 74 Q 54 66 50 66 Q 46 74 42 72 Q 38 66 40 66 Q 32 66 28 54 Z" fill={OUT} />
        <circle cx="22" cy="50" r="5" fill="#FF6B6B" opacity="0.5" />
        <circle cx="80" cy="50" r="5" fill="#FF6B6B" opacity="0.5" />
      </g>
    ),
  },

  robot: {
    defs: () => (
      <linearGradient id="robot-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E8ECF5" />
        <stop offset="0.4" stopColor="#BDC5D8" />
        <stop offset="1" stopColor="#5C6B8A" />
      </linearGradient>
    ),
    render: () => (
      <g>
        <ellipse cx="52" cy="91" rx="30" ry="3" fill="rgba(11,4,41,0.2)" />
        <line x1="30" y1="20" x2="22" y2="4" stroke={OUT} strokeWidth="3" strokeLinecap="round" />
        <circle cx="22" cy="4" r="4" fill="#FF1E8E" stroke={OUT} strokeWidth="2" />
        <line x1="70" y1="20" x2="78" y2="4" stroke={OUT} strokeWidth="3" strokeLinecap="round" />
        <circle cx="78" cy="4" r="4" fill="#00D5FF" stroke={OUT} strokeWidth="2" />
        <rect x="14" y="20" width="72" height="66" rx="14" fill="url(#robot-g)" stroke={OUT} strokeWidth={SW} />
        <rect x="22" y="30" width="56" height="36" rx="8" fill="#0b0429" stroke={OUT} strokeWidth={SW} />
        <g stroke="#00D5FF" strokeWidth="0.8" opacity="0.4">
          <line x1="22" y1="38" x2="78" y2="38" />
          <line x1="22" y1="46" x2="78" y2="46" />
          <line x1="22" y1="54" x2="78" y2="54" />
          <line x1="22" y1="62" x2="78" y2="62" />
        </g>
        <rect x="32" y="42" width="8" height="8" fill="#00D5FF" />
        <rect x="60" y="42" width="8" height="8" fill="#00D5FF" />
        <rect x="40" y="56" width="20" height="4" fill="#FF1E8E" />
        <circle cx="30" cy="76" r="3" fill="#FFE24A" stroke={OUT} strokeWidth="1.5" />
        <circle cx="70" cy="76" r="3" fill="#FFE24A" stroke={OUT} strokeWidth="1.5" />
        <g fill={OUT}>
          <circle cx="44" cy="76" r="1" />
          <circle cx="50" cy="76" r="1" />
          <circle cx="56" cy="76" r="1" />
        </g>
        <path d="M 26 34 Q 26 30 30 30 L 74 30 Q 78 30 78 34 L 78 44 Q 50 50 22 44 Z" fill="#fff" opacity="0.12" />
      </g>
    ),
  },
};

export default function Y2KAvatar({ avatar, size = 48, style = {} }: Props) {
  const creatureId = (avatar ? (AVATAR_MAP[avatar] ?? avatar) : 'ghost') as PresetKey;
  const preset = presets[creatureId] ?? presets.ghost;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <defs>{preset.defs?.()}</defs>
      {preset.render()}
    </svg>
  );
}
