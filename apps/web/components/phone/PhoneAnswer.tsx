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
      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-500 text-base">
          Question {slotIndex + 1} of {totalSlots}
        </span>
        <div className="flex gap-2">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: 10,
                height: 10,
                background:
                  i < slotIndex ? '#F97316'
                  : i === slotIndex ? '#FFD23F'
                  : '#e5e7eb',
              }}
            />
          ))}
        </div>
      </div>

      {/* Timer */}
      <PhoneCountdown timerEnd={timerEnd} totalSeconds={45} />

      {/* Question card */}
      <motion.div
        key={questionText}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' }}
        className="bg-white rounded-2xl shadow-lg p-5"
        style={{ borderLeft: '5px solid #F97316' }}
      >
        <p className="text-2xl font-bold text-gray-900 leading-snug">{questionText}</p>
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
          className="w-full rounded-2xl px-4 py-4 font-semibold text-gray-900 placeholder-gray-300 outline-none border-2 resize-none transition-all disabled:opacity-50 bg-white shadow-sm"
          style={{
            borderColor: answer ? '#F97316' : '#FFD23F',
            fontSize: 16,
          }}
        />

        <motion.button
          type="submit"
          disabled={!answer.trim() || submitted}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-bold text-xl text-white disabled:opacity-30 shadow-lg"
          style={{
            background: answer.trim() && !submitted
              ? 'linear-gradient(135deg, #F97316, #FFD23F)'
              : '#d1d5db',
            minHeight: 60,
            fontSize: 20,
          }}
        >
          {submitted ? '✅ Submitted!' : 'Submit Answer'}
        </motion.button>

        {canSkip && !submitted && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-3 rounded-2xl font-bold text-base text-gray-500 bg-white border border-gray-200 shadow-sm transition-all"
            style={{ minHeight: 48 }}
          >
            Skip this one (1 skip allowed)
          </button>
        )}
      </form>
    </div>
  );
}
