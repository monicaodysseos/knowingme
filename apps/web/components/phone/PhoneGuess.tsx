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
        className="text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-2"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${subjectColor.hex}ee, ${subjectColor.hex}88)`,
            boxShadow: `0 0 24px ${subjectColor.hex}44`,
          }}
        >
          {subjectName.charAt(0).toUpperCase()}
        </div>
        <p className="text-gray-400 font-bold text-base">How did</p>
        <p className="font-black text-3xl" style={{ color: subjectColor.hex }}>
          {subjectName}
        </p>
        <p className="text-gray-400 font-bold text-base">answer this?</p>
      </motion.div>

      {/* Timer */}
      <PhoneCountdown timerEnd={timerEnd} totalSeconds={60} />

      {/* Question */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `${subjectColor.hex}18`,
          border: `1px solid ${subjectColor.hex}44`,
        }}
      >
        <p className="text-xl font-bold text-white leading-snug">{questionText}</p>
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
          className="w-full rounded-2xl px-4 py-4 font-semibold text-white placeholder-gray-600 outline-none border-2 resize-none disabled:opacity-50"
          style={{
            background: '#13132a',
            borderColor: guess ? subjectColor.hex : '#1e1e3a',
            fontSize: 16,
          }}
        />

        <motion.button
          type="submit"
          disabled={!guess.trim() || submitted}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-black text-xl text-white disabled:opacity-30"
          style={{
            background: submitted ? '#1e1e3a' : `linear-gradient(135deg, ${subjectColor.hex}, ${subjectColor.hex}aa)`,
            minHeight: 56,
          }}
        >
          {submitted ? '✅ Guess Locked In!' : '🤔 Submit Guess'}
        </motion.button>
      </form>
    </div>
  );
}
