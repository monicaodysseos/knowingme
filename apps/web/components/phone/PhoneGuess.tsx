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
          width: 64, height: 64, borderRadius: '50%',
          background: Y2K.hotPink, border: `3px solid ${Y2K.dark}`,
          boxShadow: `0 4px 0 ${Y2K.dark}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 24,
          color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`,
        }}>✓</div>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark }}>guess locked in!</p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>watch the tv for the reveal…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── "WHAT WILL [NAME] SAY?" header banner ── */}
      <div style={{
        background: subjectColor.hex,
        borderRadius: 16, border: `3px solid ${Y2K.dark}`,
        boxShadow: `0 4px 0 ${Y2K.dark}`,
        padding: '14px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* gloss */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.2)', borderRadius: '16px 16px 50% 50%', pointerEvents: 'none' }} />
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 1 }}>
          what did
        </p>
        <p style={{
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 26,
          color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`,
          textShadow: `2px 2px 0 ${Y2K.dark}`,
          letterSpacing: '-0.5px', lineHeight: 1, textTransform: 'uppercase',
        }}>
          {subjectName}
        </p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 1 }}>
          answer?
        </p>
      </div>

      {/* Timer */}
      <PhoneCountdown timerEnd={timerEnd} totalSeconds={60} />

      {/* ── Question card ── */}
      <div style={{
        background: Y2K.dark, borderRadius: 16,
        border: `3px solid ${Y2K.dark}`,
        boxShadow: `0 4px 0 rgba(11,4,41,0.4)`,
        padding: '16px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 8, right: 8, height: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: '0 0 50% 50%', pointerEvents: 'none' }} />
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
          {questionText}
        </p>
      </div>

      {/* ── Guess input ── */}
      <div className="flex flex-col gap-1">
        <label style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, color: '#3a1555', letterSpacing: 2, textTransform: 'uppercase' }}>
          ur guess ✦
        </label>
        <textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value.slice(0, 120))}
          placeholder={`what did ${subjectName} say?`}
          rows={3}
          autoFocus
          style={{
            width: '100%', borderRadius: 16, padding: '14px 16px',
            fontFamily: Y2K.display, fontWeight: 700, fontSize: 16,
            color: Y2K.dark, background: '#fff',
            border: `3px solid ${guess ? subjectColor.hex : '#E5E7EB'}`,
            boxShadow: `0 3px 0 ${Y2K.dark}`,
            outline: 'none', resize: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF' }}>
            • hidden till reveal. closer guess = more points.
          </span>
          <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF' }}>{guess.length}/120</span>
        </div>
      </div>

      {/* ── Submit button ── */}
      <button
        type="button"
        disabled={!guess.trim()}
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '18px', borderRadius: 99,
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 20,
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
