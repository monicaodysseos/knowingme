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
      {/* Subject player header */}
      <motion.div
        key={subjectPlayer.id}
        initial={{ scale: 0.8, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-center"
      >
        <PlayerAvatar name={subjectPlayer.name} color={subjectPlayer.color} size="xl" />
        <h2
          className="font-black text-5xl mt-4"
          style={{ color: subjectPlayer.color.hex }}
        >
          {subjectPlayer.name}
        </h2>
        <p className="text-gray-400 text-xl font-semibold mt-1">answered this question…</p>
      </motion.div>

      {/* Question card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring' }}
        className="w-full max-w-2xl rounded-3xl p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${subjectPlayer.color.hex}22, ${subjectPlayer.color.hex}11)`,
          border: `2px solid ${subjectPlayer.color.hex}55`,
          boxShadow: `0 0 60px ${subjectPlayer.color.hex}22`,
        }}
      >
        <div className="text-4xl mb-3">❓</div>
        <p className="font-bold text-4xl leading-snug text-white">{questionText}</p>
      </motion.div>

      {/* Guess count + timer row */}
      <div className="flex items-center gap-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="font-black text-6xl" style={{ color: subjectPlayer.color.hex }}>
            {guessCount}
          </div>
          <div className="text-gray-400 text-xl font-semibold">guesses in</div>
        </motion.div>

        {timerEnd > 0 && (
          <CountdownRing timerEnd={timerEnd} totalSeconds={60} size={120} />
        )}
      </div>

      {/* Guesser avatars */}
      <div className="flex flex-wrap justify-center gap-5">
        {guessers.map((p) => (
          <PlayerAvatar key={p.id} name={p.name} color={p.color} size="md" showName />
        ))}
      </div>

      <p className="text-gray-500 text-xl font-bold">
        Type your guess on your phone! 📱
      </p>
    </div>
  );
}
