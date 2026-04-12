'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXAMPLE_PROMPTS } from '@ksero-se/types';

interface Props {
  onSubmit: (questions: [string, string]) => void;
}

export default function PhoneQuestionSubmit({ onSubmit }: Props) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [shuffledExamples] = useState(() =>
    [...EXAMPLE_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 12),
  );
  const [activeField, setActiveField] = useState<1 | 2 | null>(null);

  const canSubmit = q1.trim().length > 0 && q2.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit([q1.trim(), q2.trim()]);
  };

  const fillExample = (text: string) => {
    if (activeField === 1) setQ1(text.slice(0, 80));
    else if (activeField === 2) setQ2(text.slice(0, 80));
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="text-4xl mb-1">📝</div>
        <h2 className="font-black text-3xl">Your Questions</h2>
        <p className="text-gray-400 text-base mt-1">
          Submit 2 personal prompts for others to answer
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Q1 */}
        <QuestionField
          label="Question 1"
          value={q1}
          onChange={setQ1}
          onFocus={() => setActiveField(1)}
          isFocused={activeField === 1}
        />

        {/* Q2 */}
        <QuestionField
          label="Question 2"
          value={q2}
          onChange={setQ2}
          onFocus={() => setActiveField(2)}
          isFocused={activeField === 2}
        />

        {/* Example prompts */}
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-bold">
            {activeField ? `Tap to fill Question ${activeField}:` : 'Tap a field above, then pick an example:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {shuffledExamples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => fillExample(ex)}
                className="text-left text-sm px-3 py-2 rounded-xl font-semibold transition-all"
                style={{
                  background: '#13132a',
                  border: '1px solid #1e1e3a',
                  color: '#9ca3af',
                  minHeight: 40,
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-black text-xl text-white disabled:opacity-30"
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, #8B5CF6, #0DD3C5)'
              : '#1e1e3a',
            minHeight: 56,
          }}
        >
          Submit Questions ✅
        </motion.button>
      </form>
    </div>
  );
}

function QuestionField({
  label,
  value,
  onChange,
  onFocus,
  isFocused,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  isFocused: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-bold text-base" style={{ color: isFocused ? '#8B5CF6' : '#9ca3af' }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        onFocus={onFocus}
        placeholder="e.g. What is your biggest fear?"
        rows={2}
        className="w-full rounded-2xl px-4 py-3 font-semibold text-white placeholder-gray-600 outline-none border-2 resize-none transition-all"
        style={{
          background: '#13132a',
          borderColor: isFocused ? '#8B5CF6' : '#1e1e3a',
          fontSize: 16,
        }}
      />
      <span className="text-right text-gray-600 text-xs">{value.length}/80</span>
    </label>
  );
}
