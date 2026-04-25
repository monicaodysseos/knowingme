'use client';

import { useState } from 'react';
import { EXAMPLE_PROMPTS } from '@ksero-se/types';
import { Y2K } from '../../lib/y2k';

interface Props {
  count: number;
  onSubmit: (questions: string[], onAck?: (ok: boolean, error?: string) => void) => void;
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

export default function PhoneQuestionSubmit({ count, onSubmit }: Props) {
  const [step, setStep] = useState(1); // 1-based, up to count
  const [questions, setQuestions] = useState<string[]>(() => Array(count).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const currentValue = questions[step - 1] ?? '';
  const setCurrentValue = (v: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[step - 1] = v;
      return next;
    });
  };

  const canAdvance = currentValue.trim().length > 0 && !submitted;
  const isLast = step === count;

  const surpriseMe = () => {
    const used = new Set(questions.map((q) => q.trim()));
    const pool = EXAMPLE_PROMPTS.filter((p) => !used.has(p));
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? EXAMPLE_PROMPTS[0];
    setCurrentValue(pick.slice(0, 80));
  };

  const handleAction = () => {
    if (!canAdvance) return;
    if (!isLast) {
      setStep((s) => s + 1);
    } else {
      setSubmitted(true);
      onSubmit(questions.map((q) => q.trim()), (ok, error) => {
        setServerOk(ok);
        setServerError(error ?? null);
      });
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setServerOk(null);
    setServerError(null);
  };

  if (submitted) {
    if (serverOk === false) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#DC2626', border: `3px solid ${Y2K.dark}`,
            boxShadow: `0 4px 0 ${Y2K.dark}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: '#fff',
          }}>!</div>
          <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: '#DC2626' }}>server didn&apos;t receive it</p>
          <p style={{ fontFamily: Y2K.body, fontSize: 13, color: '#3a1555' }}>{serverError}</p>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: '14px 28px', borderRadius: 99,
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 16, color: '#fff',
              background: Y2K.hotPink, border: `3px solid ${Y2K.dark}`,
              boxShadow: `0 4px 0 ${Y2K.dark}`, cursor: 'pointer',
              WebkitTextStroke: `1px ${Y2K.dark}`, letterSpacing: '0.05em',
            }}
          >
            try again ↻
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: serverOk === true ? '#19B06B' : Y2K.hotPink,
          border: `3px solid ${Y2K.dark}`, boxShadow: `0 4px 0 ${Y2K.dark}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: '#fff',
          WebkitTextStroke: `1px ${Y2K.dark}`,
        }}>
          {serverOk === true ? '✓' : '…'}
        </div>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark }}>
          {serverOk === true ? 'questions confirmed!' : 'submitting…'}
        </p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>waiting for everyone else…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-5 justify-center px-1">
      {/* Top banner */}
      <div style={{
        background: Y2K.yellow,
        borderRadius: 14,
        border: `2.5px solid ${Y2K.dark}`,
        boxShadow: `0 3px 0 rgba(11,4,41,0.35)`,
        padding: '10px 16px',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: Y2K.dark, lineHeight: 1.4, letterSpacing: '-0.2px' }}>
          Write your own questions — someone else will answer them for themselves
        </p>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark, letterSpacing: '-0.5px' }}>
          question {step} of {count}
        </h2>
        <p style={{ fontFamily: Y2K.body, fontSize: 13, color: '#3a1555', marginTop: 4 }}>
          {step === count
            ? 'last one — make it a good one!'
            : step === 1
              ? 'write a personal prompt for others to answer about u'
              : 'keep them coming!'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            width: i + 1 === step ? 24 : 10,
            height: 10,
            borderRadius: 99,
            background: i + 1 <= step ? Y2K.hotPink : '#E5E7EB',
            border: `2px solid ${Y2K.dark}`,
            opacity: i + 1 <= step ? 1 : 0.5,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Previous questions locked-in preview */}
      {step > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {questions.slice(0, step - 1).map((q, i) => (
            q.trim() && (
              <Sticker key={i} color={i % 2 === 0 ? Y2K.cyan : Y2K.yellow} r={14} rotate={i % 2 === 0 ? -1 : 1} style={{ padding: '8px 14px' }}>
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: Y2K.dark, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2, opacity: 0.7 }}>Q{i + 1} locked in ✔</div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: Y2K.dark, lineHeight: 1.3 }}>{q}</div>
              </Sticker>
            )
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="flex flex-col gap-1">
        <textarea
          key={step}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value.slice(0, 80))}
          placeholder="e.g. What is your biggest irrational fear?"
          rows={3}
          autoFocus
          style={{
            width: '100%', borderRadius: 16, padding: '14px 16px',
            fontFamily: Y2K.display, fontWeight: 700, fontSize: 16, color: Y2K.dark,
            background: '#fff', border: `3px solid ${Y2K.hotPink}`,
            boxShadow: `0 3px 0 ${Y2K.dark}`, outline: 'none', resize: 'none',
          }}
        />
        <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{currentValue.length}/80</span>
      </div>

      {/* Surprise me */}
      <button
        type="button"
        onClick={surpriseMe}
        style={{
          width: '100%', padding: '14px', borderRadius: 99,
          fontFamily: Y2K.display, fontWeight: 800, fontSize: 15, color: Y2K.dark,
          background: Y2K.yellow, border: `2.5px solid ${Y2K.dark}`,
          boxShadow: `0 4px 0 ${Y2K.dark}`, cursor: 'pointer', letterSpacing: '0.05em',
        }}
      >
        surprise me ✦
      </button>

      {/* Next / Submit */}
      <button
        type="button"
        disabled={!canAdvance}
        onClick={handleAction}
        style={{
          width: '100%', padding: '18px', borderRadius: 99,
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: '#fff',
          background: canAdvance ? Y2K.hotPink : '#d1d5db',
          border: `3px solid ${Y2K.dark}`,
          boxShadow: canAdvance ? `0 5px 0 ${Y2K.dark}` : 'none',
          cursor: canAdvance ? 'pointer' : 'not-allowed',
          opacity: canAdvance ? 1 : 0.4,
          WebkitTextStroke: canAdvance ? `1px ${Y2K.dark}` : 'none',
          textShadow: canAdvance ? `2px 2px 0 ${Y2K.dark}` : 'none',
          letterSpacing: '0.05em',
        }}
      >
        {isLast ? 'send it ✦' : `next → q${step + 1}`}
      </button>
    </div>
  );
}
