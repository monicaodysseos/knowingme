'use client';

import { useState, useEffect } from 'react';
import PhoneCountdown from './PhoneCountdown';
import { Y2K } from '../../lib/y2k';

interface Props {
  assignmentId: string;
  questionText: string;
  slotIndex: number;
  totalSlots: number;
  canSkip: boolean;
  timerEnd: number;
  onSubmit: (assignmentId: string, answer: string, skipped?: boolean) => void;
}

function Sticker({ color, r = 14, style = {}, children }: { color: string; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
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

export default function PhoneAnswer({
  assignmentId,
  questionText,
  slotIndex,
  totalSlots,
  canSkip,
  timerEnd,
  onSubmit,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
  }, [assignmentId]);

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    onSubmit(assignmentId, answer.trim());
  };

  const handleSkip = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(assignmentId, '', true);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#19B06B',
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
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark }}>answer locked in!</p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>waiting for others…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress row */}
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>
          question {slotIndex + 1} of {totalSlots}
        </span>
        <div className="flex gap-2">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div key={i} style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: `2px solid ${Y2K.dark}`,
              background:
                i < slotIndex ? Y2K.hotPink
                : i === slotIndex ? Y2K.yellow
                : '#e5e7eb',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      <PhoneCountdown timerEnd={timerEnd} totalSeconds={45} />

      {/* Question sticker */}
      <Sticker color="#fff" r={16} style={{ padding: '16px 18px' }}>
        <p style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 20, color: Y2K.dark, lineHeight: 1.3, letterSpacing: '-0.3px' }}>
          {questionText}
        </p>
      </Sticker>

      {/* Answer textarea */}
      <div className="flex flex-col gap-1">
        <textarea
          key={assignmentId}
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, 120))}
          placeholder="ur answer…"
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
            border: `3px solid ${answer ? Y2K.hotPink : '#E5E7EB'}`,
            boxShadow: `0 3px 0 ${Y2K.dark}`,
            outline: 'none',
            resize: 'none',
          }}
        />
        <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{answer.length}/120</span>
      </div>

      {/* Submit */}
      <button
        type="button"
        disabled={!answer.trim()}
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: 99,
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 20,
          color: '#fff',
          background: answer.trim() ? Y2K.hotPink : '#d1d5db',
          border: `3px solid ${Y2K.dark}`,
          boxShadow: answer.trim() ? `0 5px 0 ${Y2K.dark}` : 'none',
          cursor: answer.trim() ? 'pointer' : 'not-allowed',
          opacity: answer.trim() ? 1 : 0.4,
          WebkitTextStroke: answer.trim() ? `1px ${Y2K.dark}` : 'none',
          textShadow: answer.trim() ? `2px 2px 0 ${Y2K.dark}` : 'none',
          letterSpacing: '0.05em',
        }}
      >
        submit answer ✦
      </button>

      {canSkip && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 99,
            fontFamily: Y2K.body,
            fontWeight: 700,
            fontSize: 14,
            color: '#9CA3AF',
            background: '#fff',
            border: `2px solid #e5e7eb`,
            cursor: 'pointer',
          }}
        >
          skip this one (1 skip allowed)
        </button>
      )}
    </div>
  );
}
