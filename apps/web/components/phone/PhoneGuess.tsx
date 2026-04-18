'use client';

import { useState } from 'react';
import type { PlayerColor } from '@ksero-se/types';
import PhoneCountdown from './PhoneCountdown';
import { Y2K } from '../../lib/y2k';

interface Props {
  subjectName: string;
  subjectColor: PlayerColor;
  questionText: string;
  timerEnd: number;
  onSubmit: (guess: string) => void;
}

function Sticker({ color, r = 14, rotate = 0, style = {}, children }: { color: string; r?: number; rotate?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `0 4px 0 rgba(11,4,41,0.45)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,255,255,0.15)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

export default function PhoneGuess({
  subjectName,
  subjectColor,
  questionText,
  timerEnd,
  onSubmit,
}: Props) {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!guess.trim() || submitted) return;
    setSubmitted(true);
    onSubmit(guess.trim());
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: Y2K.hotPink,
          border: `3px solid ${Y2K.dark}`,
          boxShadow: `0 4px 0 ${Y2K.dark}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 24,
          color: '#fff',
          WebkitTextStroke: `1px ${Y2K.dark}`,
        }}>
          ✓
        </div>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark }}>guess locked in!</p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>watch the tv for the reveal…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Subject header sticker */}
      <Sticker color={subjectColor.hex} r={16} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: `2.5px solid rgba(255,255,255,0.6)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 22,
          color: '#fff',
          flexShrink: 0,
        }}>
          {subjectName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>how did</p>
          <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: '#fff', WebkitTextStroke: `0.5px ${Y2K.dark}`, letterSpacing: '-0.5px' }}>{subjectName}</p>
          <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>answer this?</p>
        </div>
      </Sticker>

      <PhoneCountdown timerEnd={timerEnd} totalSeconds={60} />

      {/* Question sticker */}
      <Sticker color="#fff" r={16} style={{ padding: '16px 18px' }}>
        <p style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 18, color: Y2K.dark, lineHeight: 1.3, letterSpacing: '-0.3px' }}>
          {questionText}
        </p>
      </Sticker>

      {/* Guess textarea */}
      <div className="flex flex-col gap-1">
        <textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value.slice(0, 120))}
          placeholder={`what did ${subjectName} say?`}
          rows={3}
          autoFocus
          style={{
            width: '100%',
            borderRadius: 16,
            padding: '14px 16px',
            fontFamily: Y2K.display,
            fontWeight: 700,
            fontSize: 16,
            color: Y2K.dark,
            background: '#fff',
            border: `3px solid ${guess ? subjectColor.hex : '#E5E7EB'}`,
            boxShadow: `0 3px 0 ${Y2K.dark}`,
            outline: 'none',
            resize: 'none',
          }}
        />
        <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{guess.length}/120</span>
      </div>

      {/* Submit button */}
      <button
        type="button"
        disabled={!guess.trim()}
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: 99,
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 20,
          color: '#fff',
          background: guess.trim() ? subjectColor.hex : '#d1d5db',
          border: `3px solid ${Y2K.dark}`,
          boxShadow: guess.trim() ? `0 5px 0 ${Y2K.dark}` : 'none',
          cursor: guess.trim() ? 'pointer' : 'not-allowed',
          opacity: guess.trim() ? 1 : 0.4,
          WebkitTextStroke: guess.trim() ? `1px ${Y2K.dark}` : 'none',
          textShadow: guess.trim() ? `2px 2px 0 ${Y2K.dark}` : 'none',
          letterSpacing: '0.05em',
        }}
      >
        lock it in ✦
      </button>
    </div>
  );
}
