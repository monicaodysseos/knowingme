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
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  const mark = (guessId: string, correct: boolean) => {
    if (marked[guessId] !== undefined) return; // can't change
    setMarked((prev) => ({ ...prev, [guessId]: correct }));
    onMark(guessId, correct);
    try { navigator.vibrate?.(correct ? [20, 30, 20] : 30); } catch {}
  };

  const allMarked = guesses.length > 0 && guesses.every((g) => marked[g.id] !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="text-4xl mb-1">🎯</div>
        <h2 className="font-black text-2xl text-white">Judge the Guesses</h2>
        <p className="text-gray-400 text-sm mt-1">
          Did they get your answer right?
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {guesses.map((g, i) => {
            const decision = marked[g.id];
            return (
              <motion.div
                key={g.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background:
                    decision === true
                      ? '#16a34a22'
                      : decision === false
                      ? '#dc262622'
                      : '#13132a',
                  border: `1px solid ${
                    decision === true ? '#16a34a77' : decision === false ? '#dc262677' : '#1e1e3a'
                  }`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                    style={{ background: g.guesserColor.hex }}
                  >
                    {g.guesserName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-base" style={{ color: g.guesserColor.hex }}>
                    {g.guesserName}
                  </span>
                  {decision !== undefined && (
                    <span className="ml-auto text-xl">{decision ? '🎯' : '❌'}</span>
                  )}
                </div>
                <p className="font-semibold text-lg text-white">&ldquo;{g.text}&rdquo;</p>

                {decision === undefined && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => mark(g.id, true)}
                      className="flex-1 py-3 rounded-xl font-black text-base text-white"
                      style={{ background: '#16a34a', minHeight: 48 }}
                    >
                      Got it 🎯
                    </button>
                    <button
                      onClick={() => mark(g.id, false)}
                      className="flex-1 py-3 rounded-xl font-black text-base text-white"
                      style={{ background: '#dc2626', minHeight: 48 }}
                    >
                      Nope ❌
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {allMarked && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-400 font-bold text-base pt-2"
        >
          All judged! Waiting for reveal… 📺
        </motion.p>
      )}
    </div>
  );
}
