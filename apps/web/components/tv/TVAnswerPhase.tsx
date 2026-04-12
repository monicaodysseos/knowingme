'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import CountdownRing from './CountdownRing';

interface Props {
  state: TVState;
}

export default function TVAnswerPhase({ state }: Props) {
  const { players, timerEnd, submissionProgress } = state;
  const slot = (submissionProgress?.submitted ?? 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-bg px-12">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-3">🤔</div>
        <h2 className="font-black text-6xl">Answer Time!</h2>
        <p className="text-2xl text-gray-400 mt-2">
          Everyone is answering their secret questions on their phones
        </p>
      </motion.div>

      {/* Timer ring */}
      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={45} size={140} strokeWidth={10} />
      )}

      {/* Players */}
      <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, type: 'spring' }}
          >
            <PlayerAvatar
              name={p.name}
              color={p.color}
              size="lg"
              showName
              isConnected={p.isConnected}
            />
          </motion.div>
        ))}
      </div>

      <p className="text-gray-500 text-xl font-semibold">
        Thinking deeply… 💭
      </p>
    </div>
  );
}
