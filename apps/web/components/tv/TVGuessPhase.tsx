'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import CountdownRing from './CountdownRing';

interface Props {
  state: TVState;
}

export default function TVGuessPhase({ state }: Props) {
  const { currentTurn, players, timerEnd } = state;
  if (!currentTurn) return null;

  const { subjectPlayer, questionText, guessCount } = currentTurn;
  const guessers = players.filter((p) => p.id !== subjectPlayer.id && p.isConnected);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-bg px-12">

      {/* Subject player */}
      <motion.div
        key={subjectPlayer.id}
        initial={{ scale: 0.8, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-center"
      >
        <PlayerAvatar name={subjectPlayer.name} color={subjectPlayer.color} size="xl" />
        <h2 className="font-bold mt-4" style={{ fontSize: 52, color: subjectPlayer.color.hex }}>
          {subjectPlayer.name}
        </h2>
        <p className="text-xl font-semibold mt-1" style={{ color: '#a78bfa' }}>answered this question…</p>
      </motion.div>

      {/* Question — white chunky card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring' }}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl px-10 py-8 text-center"
        style={{ borderLeft: `8px solid ${subjectPlayer.color.hex}` }}
      >
        <div className="text-4xl mb-3">❓</div>
        <p className="font-bold text-gray-900 leading-snug" style={{ fontSize: 36 }}>{questionText}</p>
      </motion.div>

      {/* Guess count + timer */}
      <div className="flex items-center gap-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl px-8 py-4 text-center"
          style={{ borderBottom: `4px solid ${subjectPlayer.color.hex}` }}
        >
          <div className="font-bold" style={{ fontSize: 56, color: subjectPlayer.color.hex }}>
            {guessCount}
          </div>
          <div className="font-semibold text-gray-500 text-lg">guesses in</div>
        </motion.div>

        {timerEnd > 0 && (
          <CountdownRing timerEnd={timerEnd} totalSeconds={60} size={120} />
        )}
      </div>

      {/* Guesser avatars */}
      <div className="flex flex-wrap justify-center gap-4">
        {guessers.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow px-3 py-2 flex items-center gap-2"
            style={{ borderLeft: `3px solid ${p.color.hex}` }}
          >
            <PlayerAvatar name={p.name} color={p.color} size="sm" />
            <span className="font-bold text-gray-900 text-sm">{p.name}</span>
          </div>
        ))}
      </div>

      <p className="font-semibold text-xl" style={{ color: '#a78bfa' }}>
        Type your guess on your phone! 📱
      </p>
    </div>
  );
}
