'use client';

import { useState } from 'react';
import type { PlayerColor } from '@ksero-se/types';
import PhoneCountdown from './PhoneCountdown';

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
        <div className="text-5xl">🤔</div>
        <p className="font-bold text-gray-800 text-xl">Guess locked in!</p>
        <p className="text-gray-500">Waiting for the reveal…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Subject header */}
      <div
        className="bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-4"
        style={{ borderLeft: `6px solid ${subjectColor.hex}` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl text-white flex-shrink-0"
          style={{ background: subjectColor.hex }}
        >
          {subjectName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-gray-500 font-semibold text-sm">How did</p>
          <p className="font-bold text-xl" style={{ color: subjectColor.hex }}>{subjectName}</p>
          <p className="text-gray-500 font-semibold text-sm">answer this?</p>
        </div>
      </div>

      <PhoneCountdown timerEnd={timerEnd} totalSeconds={60} />

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <p className="text-xl font-bold text-gray-900 leading-snug">{questionText}</p>
      </div>

      {/* Guess input */}
      <textarea
        value={guess}
        onChange={(e) => setGuess(e.target.value.slice(0, 120))}
        placeholder={`What did ${subjectName} say?`}
        rows={3}
        autoFocus
        className="w-full rounded-2xl px-4 py-4 font-semibold text-gray-900 placeholder-gray-300 outline-none border-2 resize-none bg-white shadow-sm"
        style={{ borderColor: guess ? subjectColor.hex : '#FFD23F', fontSize: 16 }}
      />

      <button
        type="button"
        disabled={!guess.trim()}
        onClick={handleSubmit}
        className="w-full py-5 rounded-2xl font-bold text-xl text-white shadow-lg disabled:opacity-30"
        style={{
          background: guess.trim()
            ? `linear-gradient(135deg, ${subjectColor.hex}, ${subjectColor.hex}cc)`
            : '#d1d5db',
          fontSize: 20,
        }}
      >
        🤔 Submit Guess
      </button>
    </div>
  );
}
