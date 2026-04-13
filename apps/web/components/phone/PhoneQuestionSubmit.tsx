'use client';

import { useState } from 'react';
import { EXAMPLE_PROMPTS } from '@ksero-se/types';

interface Props {
  onSubmit: (questions: [string, string]) => void;
}

export default function PhoneQuestionSubmit({ onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const value = step === 1 ? q1 : q2;
  const setValue = step === 1 ? setQ1 : setQ2;
  const canAdvance = value.trim().length > 0 && !submitted;

  const surpriseMe = () => {
    const used = new Set([q1.trim(), q2.trim()]);
    const pool = EXAMPLE_PROMPTS.filter((p) => !used.has(p));
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? EXAMPLE_PROMPTS[0];
    setValue(pick.slice(0, 80));
  };

  const handleAction = () => {
    if (!canAdvance) return;
    if (step === 1) {
      setStep(2);
    } else {
      console.log('[PhoneQuestionSubmit] submitting', q1, q2);
      setSubmitted(true);
      onSubmit([q1.trim(), q2.trim()]);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-5xl">⏳</div>
        <p className="font-bold text-gray-800 text-xl">Questions submitted!</p>
        <p className="text-gray-500">Waiting for everyone else…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 justify-center px-1">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">📝</div>
        <h2 className="font-bold text-gray-900" style={{ fontSize: 26 }}>
          Question {step} of 2
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {step === 1
            ? 'Write a personal prompt for others to answer about you'
            : 'One more — make it a good one!'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="rounded-full transition-all duration-300"
            style={{
              width: n === step ? 24 : 10,
              height: 10,
              background: n <= step ? '#F97316' : '#FFD23F',
              opacity: n <= step ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      {/* Text area */}
      <div className="flex flex-col gap-1">
        <textarea
          key={step}  /* remount textarea when step changes so autoFocus works */
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 80))}
          placeholder="e.g. What is your biggest irrational fear?"
          rows={3}
          autoFocus
          className="w-full rounded-2xl px-4 py-4 font-semibold text-gray-900 placeholder-gray-300 outline-none border-2 resize-none bg-white shadow-sm"
          style={{ borderColor: '#F97316', fontSize: 16 }}
        />
        <span className="text-right text-gray-400 text-xs">{value.length}/80</span>
      </div>

      {/* Surprise me */}
      <button
        type="button"
        onClick={surpriseMe}
        className="w-full py-4 rounded-2xl font-bold text-base border-2 bg-white"
        style={{ borderColor: '#FFD23F', color: '#F97316' }}
      >
        🎲 Surprise me
      </button>

      {/* Next / Submit */}
      <button
        type="button"
        disabled={!canAdvance}
        onClick={handleAction}
        className="w-full py-5 rounded-2xl font-bold text-xl text-white shadow-lg disabled:opacity-30"
        style={{
          background: canAdvance
            ? 'linear-gradient(135deg, #F97316, #FF6B6B)'
            : '#d1d5db',
          fontSize: 20,
        }}
      >
        {step === 1 ? 'Next →' : 'Submit ✅'}
      </button>
    </div>
  );
}
