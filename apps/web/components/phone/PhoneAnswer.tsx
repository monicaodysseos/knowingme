'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PhoneCountdown from './PhoneCountdown';

interface Props {
  assignmentId: string;
  questionText: string;
  slotIndex: number;
  totalSlots: number;
  canSkip: boolean;
  timerEnd: number;
  onSubmit: (assignmentId: string, answer: string, skipped?: boolean) => void;
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

  // Reset state whenever the question changes
  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
  }, [assignmentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    onSubmit(assignmentId, answer.trim());
  };

  const handleSkip = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(assignmentId, '', true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 font-bold text-base">
          Question {slotIndex + 1} of {totalSlots}
        </span>
        {/* Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: 8,
                height: 8,
                background: i < slotIndex ? '#8B5CF6' : i === slotIndex ? '#0DD3C5' : '#1e1e3a',
              }}
            />
          ))}
        </div>
      </div>

      {/* Timer */}
      <PhoneCountdown timerEnd={timerEnd} totalSeconds={45} />

      {/* Question */}
      <motion.div
        key={questionText}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' }}
        className="rounded-2xl p-5"
        style={{ background: '#13132a', border: '1px solid #1e1e3a' }}
      >
        <p className="text-2xl font-bold text-white leading-snug">{questionText}</p>
      </motion.div>

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, 120))}
          placeholder="Your answer…"
          rows={3}
          disabled={submitted}
          autoFocus
          className="w-full rounded-2xl px-4 py-4 font-semibold text-white placeholder-gray-600 outline-none border-2 resize-none transition-all disabled:opacity-50"
          style={{
            background: '#13132a',
            borderColor: answer ? '#0DD3C5' : '#1e1e3a',
            fontSize: 16,
          }}
        />

        <motion.button
          type="submit"
          disabled={!answer.trim() || submitted}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-black text-xl text-white disabled:opacity-30"
          style={{
            background: answer.trim()
              ? 'linear-gradient(135deg, #0DD3C5, #38BDF8)'
              : '#1e1e3a',
            minHeight: 56,
          }}
        >
          {submitted ? '✅ Submitted!' : 'Submit Answer'}
        </motion.button>

        {canSkip && !submitted && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-3 rounded-2xl font-bold text-base text-gray-400 transition-all"
            style={{ background: '#13132a', border: '1px solid #1e1e3a', minHeight: 48 }}
          >
            Skip this one (1 skip allowed)
          </button>
        )}
      </form>
    </div>
  );
}
