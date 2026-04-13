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
        <h2 className="font-bold text-white" style={{ fontSize: 64 }}>Submit Your Questions</h2>
        <p className="text-2xl font-semibold mt-2" style={{ color: '#a78bfa' }}>
          Everyone is entering 2 personal prompts on their phone
        </p>
      </motion.div>

      {/* Progress card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-2xl px-12 py-6 flex flex-col items-center gap-4"
        style={{ minWidth: 400 }}
      >
        <div className="text-3xl font-bold text-gray-900">
          <span style={{ color: '#F97316' }}>{submitted}</span>
          <span className="text-gray-400"> / {total} submitted</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F97316, #FFD23F)' }}
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
            className="flex flex-col items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-md relative"
            style={{ minWidth: 90, borderBottom: `4px solid ${p.color.hex}` }}
          >
            <PlayerAvatar name={p.name} color={p.color} size="md" />
            {p.hasSubmittedQuestions && (
              <span className="absolute -top-2 -right-2 text-xl bg-white rounded-full shadow">✅</span>
            )}
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
