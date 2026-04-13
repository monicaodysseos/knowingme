'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || submitted) return;
    setSubmitted(true);
    onSubmit(guess.trim());
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Subject header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-4"
        style={{ borderLeft: `6px solid ${subjectColor.hex}` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl text-white flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${subjectColor.hex}ee, ${subjectColor.hex}88)`,
          }}
        >
          {subjectName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-gray-500 font-semibold text-sm">How did</p>
          <p className="font-bold text-xl" style={{ color: subjectColor.hex }}>{subjectName}</p>
          <p className="text-gray-500 font-semibold text-sm">answer this?</p>
        </div>
      </motion.div>

      {/* Timer */}
      <PhoneCountdown timerEnd={timerEnd} totalSeconds={60} />

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <p className="text-xl font-bold text-gray-900 leading-snug">{questionText}</p>
      </div>

      {/* Guess input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value.slice(0, 120))}
          placeholder={`What did ${subjectName} say?`}
          rows={3}
          disabled={submitted}
          autoFocus
          className="w-full rounded-2xl px-4 py-4 font-semibold text-gray-900 placeholder-gray-300 outline-none border-2 resize-none disabled:opacity-50 bg-white shadow-sm"
          style={{
            borderColor: guess ? subjectColor.hex : '#FFD23F',
            fontSize: 16,
          }}
        />

        <motion.button
          type="submit"
          disabled={!guess.trim() || submitted}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-bold text-xl text-white disabled:opacity-30 shadow-lg"
          style={{
            background: submitted
              ? '#d1d5db'
              : `linear-gradient(135deg, ${subjectColor.hex}, ${subjectColor.hex}cc)`,
            minHeight: 60,
            fontSize: 20,
          }}
        >
          {submitted ? '✅ Guess Locked In!' : '🤔 Submit Guess'}
        </motion.button>
      </form>
    </div>
  );
}
