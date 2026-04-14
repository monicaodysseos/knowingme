'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerColor } from '@ksero-se/types';

interface GuessItem {
  id: string;
  guesserName: string;
  guesserColor: PlayerColor;
  text: string;
}

interface Props {
  guesses: GuessItem[];
  onMark: (guessId: string, isCorrect: boolean) => void;
}

export default function PhoneMarkGuesses({ guesses, onMark }: Props) {
  // decisions are buffered locally — nothing goes to server until Continue
  const [decisions, setDecisions] = useState<Record<string, boolean | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const decide = (guessId: string, correct: boolean) => {
    if (submitted) return;
    // Toggle — clicking the same button again clears the decision
    setDecisions((prev) => ({
      ...prev,
      [guessId]: prev[guessId] === correct ? undefined : correct,
    }));
    try { navigator.vibrate?.(20); } catch {}
  };

  const allDecided = guesses.length > 0 && guesses.every((g) => decisions[g.id] !== undefined);

  const handleContinue = () => {
    if (!allDecided || submitted) return;
    setSubmitted(true);
    // Send all marks to server
    for (const g of guesses) {
      const decision = decisions[g.id];
      if (decision !== undefined) onMark(g.id, decision);
    }
    try { navigator.vibrate?.([20, 30, 20]); } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h2 className="font-black text-gray-900" style={{ fontSize: 26, letterSpacing: '-0.5px' }}>
          Judge the Guesses
        </h2>
        <p className="text-gray-500 text-sm mt-1">Did they get your answer right? Tap to decide, then confirm.</p>
      </motion.div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {guesses.map((g, i) => {
            const decision = decisions[g.id];
            const isCorrect = decision === true;
            const isWrong = decision === false;

            return (
              <motion.div
                key={g.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
                style={{
                  background: isCorrect ? '#F0FDF4' : isWrong ? '#FEF2F2' : '#ffffff',
                  border: `2px solid ${isCorrect ? '#16A34A' : isWrong ? '#DC2626' : '#E5E7EB'}`,
                  opacity: submitted ? 0.7 : 1,
                }}
              >
                {/* Guesser identity */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ background: g.guesserColor.hex }}
                  >
                    {g.guesserName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-base" style={{ color: g.guesserColor.hex }}>
                    {g.guesserName}
                  </span>
                  {decision !== undefined && (
                    <span
                      className="ml-auto font-black text-sm px-2 py-0.5 rounded-full text-white"
                      style={{ background: isCorrect ? '#16A34A' : '#DC2626' }}
                    >
                      {isCorrect ? 'Correct' : 'Wrong'}
                    </span>
                  )}
                </div>

                <p className="font-bold text-lg text-gray-900">&ldquo;{g.text}&rdquo;</p>

                {/* Vote buttons — always visible until submitted */}
                {!submitted && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(g.id, true)}
                      className="flex-1 py-3 rounded-xl font-bold text-base transition-all"
                      style={{
                        background: isCorrect ? '#16A34A' : '#F0FDF4',
                        color: isCorrect ? '#ffffff' : '#16A34A',
                        border: `2px solid ${isCorrect ? '#16A34A' : '#BBF7D0'}`,
                        minHeight: 52,
                      }}
                    >
                      Correct
                    </button>
                    <button
                      onClick={() => decide(g.id, false)}
                      className="flex-1 py-3 rounded-xl font-bold text-base transition-all"
                      style={{
                        background: isWrong ? '#DC2626' : '#FEF2F2',
                        color: isWrong ? '#ffffff' : '#DC2626',
                        border: `2px solid ${isWrong ? '#DC2626' : '#FECACA'}`,
                        minHeight: 52,
                      }}
                    >
                      Wrong
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {allDecided && !submitted && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            type="button"
            onClick={handleContinue}
            className="w-full py-5 rounded-full font-black text-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
          >
            Confirm
          </motion.button>
        )}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white rounded-2xl shadow px-4 py-4"
            style={{ border: '2px solid #E5E7EB' }}
          >
            <p className="font-black text-gray-700 text-base">Sent! Watch the TV for results.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
