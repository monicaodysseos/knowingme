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

  const { subjectPlayer, questionText, guessesRevealed, answer, revealIndex } = currentTurn;
  const showAnswer = answer !== undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-bg px-12 py-8">
      {/* Subject */}
      <div className="flex items-center gap-4">
        <PlayerAvatar name={subjectPlayer.name} color={subjectPlayer.color} size="md" />
        <h2 className="font-black text-4xl" style={{ color: subjectPlayer.color.hex }}>
          {subjectPlayer.name}&apos;s Round
        </h2>
      </div>

      {/* Question */}
      <div
        className="w-full max-w-2xl rounded-2xl px-8 py-5 text-center"
        style={{
          background: `${subjectPlayer.color.hex}15`,
          border: `1px solid ${subjectPlayer.color.hex}44`,
        }}
      >
        <p className="font-bold text-3xl text-white">{questionText}</p>
      </div>

      {/* Guesses */}
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        <h3 className="text-gray-400 font-bold text-xl">What everyone guessed:</h3>
        <AnimatePresence>
          {guessesRevealed.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{
                background:
                  g.isCorrect === true
                    ? '#16a34a22'
                    : g.isCorrect === false
                    ? '#dc262622'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  g.isCorrect === true
                    ? '#16a34a77'
                    : g.isCorrect === false
                    ? '#dc262677'
                    : '#1e1e3a'
                }`,
              }}
            >
              <PlayerAvatar name={g.guesserName} color={g.guesserColor} size="sm" />
              <span className="font-bold text-xl" style={{ color: g.guesserColor.hex }}>
                {g.guesserName}
              </span>
              <span className="flex-1 font-semibold text-xl text-white text-right">
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
            className="relative w-full max-w-2xl rounded-3xl px-10 py-7 text-center"
            style={{
              background: `linear-gradient(135deg, ${subjectPlayer.color.hex}33, ${subjectPlayer.color.hex}11)`,
              border: `3px solid ${subjectPlayer.color.hex}`,
              boxShadow: `0 0 80px ${subjectPlayer.color.hex}55`,
            }}
          >
            <ParticleBurst trigger={showAnswer} />
            <p className="text-gray-300 font-bold text-2xl mb-2">
              {subjectPlayer.name} actually said…
            </p>
            <p
              className="font-black text-5xl glow-correct"
              style={{ color: subjectPlayer.color.hex }}
            >
              &ldquo;{answer}&rdquo;
            </p>
            <p className="text-gray-400 mt-4 text-xl">
              {subjectPlayer.name} is marking guesses on their phone 👆
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
