'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import ParticleBurst from './ParticleBurst';

interface Props {
  state: TVState;
}

export default function TVRevealPhase({ state }: Props) {
  const { currentTurn } = state;
  if (!currentTurn) return null;

  const { subjectPlayer, questionText, guessesRevealed, answer } = currentTurn;
  const showAnswer = answer !== undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg px-12 py-8">

      {/* Subject */}
      <div className="flex items-center gap-4">
        <PlayerAvatar name={subjectPlayer.name} color={subjectPlayer.color} size="md" />
        <h2 className="font-bold" style={{ fontSize: 40, color: subjectPlayer.color.hex }}>
          {subjectPlayer.name}&apos;s Round
        </h2>
      </div>

      {/* Question */}
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl px-8 py-5 text-center"
        style={{ borderLeft: `6px solid ${subjectPlayer.color.hex}` }}
      >
        <p className="font-bold text-gray-900" style={{ fontSize: 30 }}>{questionText}</p>
      </div>

      {/* Guesses */}
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        <h3 className="font-bold text-lg" style={{ color: '#a78bfa' }}>What everyone guessed:</h3>
        <AnimatePresence>
          {guessesRevealed.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 shadow-md"
              style={{
                background:
                  g.isCorrect === true ? '#f0fdf4'
                  : g.isCorrect === false ? '#fef2f2'
                  : '#ffffff',
                border: `2px solid ${
                  g.isCorrect === true ? '#16a34a'
                  : g.isCorrect === false ? '#dc2626'
                  : '#e5e7eb'
                }`,
              }}
            >
              <PlayerAvatar name={g.guesserName} color={g.guesserColor} size="sm" />
              <span className="font-bold text-base" style={{ color: g.guesserColor.hex }}>
                {g.guesserName}
              </span>
              <span className="flex-1 font-semibold text-lg text-gray-800 text-right">
                &ldquo;{g.text}&rdquo;
              </span>
              {g.isCorrect === true && <span className="text-2xl">🎯</span>}
              {g.isCorrect === false && <span className="text-2xl">❌</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Correct answer reveal */}
      <AnimatePresence>
        {showAnswer && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl px-10 py-7 text-center"
            style={{ border: `5px solid #F97316` }}
          >
            <ParticleBurst trigger={showAnswer} />
            <p className="font-semibold text-gray-500 text-xl mb-2">
              {subjectPlayer.name} actually said…
            </p>
            <p className="font-bold glow-correct" style={{ fontSize: 48, color: '#F97316' }}>
              &ldquo;{answer}&rdquo;
            </p>
            <p className="text-gray-400 mt-3 font-semibold text-lg">
              {subjectPlayer.name} is marking guesses on their phone 👆
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
