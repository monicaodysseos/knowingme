'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import CountdownRing from './CountdownRing';

interface Props {
  state: TVState;
}

export default function TVQuestionSubmission({ state }: Props) {
  const { players, submissionProgress, timerEnd } = state;
  const total = submissionProgress?.total ?? players.length;
  const submitted = submissionProgress?.submitted ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-bg px-12">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-3">📝</div>
        <h2 className="font-black text-6xl">Submit Your Questions</h2>
        <p className="text-2xl text-gray-400 mt-2">
          Everyone is entering 2 personal prompts on their phone
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="text-3xl font-black">
          <span style={{ color: '#0DD3C5' }}>{submitted}</span>
          <span className="text-gray-500"> / {total} submitted</span>
        </div>
        {/* Progress bar */}
        <div className="w-96 h-4 bg-surface rounded-full overflow-hidden border border-border">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #8B5CF6, #0DD3C5)' }}
            animate={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </div>
      </motion.div>

      {/* Player grid */}
      <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: 'spring' }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <PlayerAvatar name={p.name} color={p.color} size="lg" showName />
              {p.hasSubmittedQuestions && (
                <span className="absolute -top-1 -right-1 text-2xl">✅</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Timer */}
      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={120} size={100} />
      )}
    </div>
  );
}
