'use client';

import { useState, useEffect } from 'react';
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
        <div className="text-5xl">✅</div>
        <p className="font-bold text-gray-800 text-xl">Answer locked in!</p>
        <p className="text-gray-500">Waiting for others…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress + timer row */}
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

      <PhoneCountdown timerEnd={timerEnd} totalSeconds={45} />

      {/* Question card */}
      <div
        className="bg-white rounded-2xl shadow-lg p-5"
        style={{ borderLeft: '5px solid #F97316' }}
      >
        <p className="text-2xl font-bold text-gray-900 leading-snug">{questionText}</p>
      </div>

      {/* Answer input */}
      <textarea
        key={assignmentId}
        value={answer}
        onChange={(e) => setAnswer(e.target.value.slice(0, 120))}
        placeholder="Your answer…"
        rows={3}
        autoFocus
        className="w-full rounded-2xl px-4 py-4 font-semibold text-gray-900 placeholder-gray-300 outline-none border-2 resize-none bg-white shadow-sm"
        style={{ borderColor: answer ? '#F97316' : '#FFD23F', fontSize: 16 }}
      />

      <button
        type="button"
        disabled={!answer.trim()}
        onClick={handleSubmit}
        className="w-full py-5 rounded-2xl font-bold text-xl text-white shadow-lg disabled:opacity-30"
        style={{
          background: answer.trim()
            ? 'linear-gradient(135deg, #F97316, #FFD23F)'
            : '#d1d5db',
          fontSize: 20,
        }}
      >
        Submit Answer
      </button>

      {canSkip && (
        <button
          type="button"
          onClick={handleSkip}
          className="w-full py-3 rounded-2xl font-bold text-base text-gray-500 bg-white border border-gray-200 shadow-sm"
        >
          Skip this one (1 skip allowed)
        </button>
      )}
    </div>
  );
}
