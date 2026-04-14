'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import CountdownRing from './CountdownRing';

interface Props {
  state: TVState;
}

export default function TVAnswerPhase({ state }: Props) {
  const { players, timerEnd } = state;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-bg px-12">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h2 className="font-black text-white" style={{ fontSize: 64, letterSpacing: '-2px' }}>Answer Time</h2>
        <p className="text-2xl font-bold mt-2" style={{ color: '#a78bfa' }}>
          Everyone is answering their secret questions on their phones
        </p>
      </motion.div>

      {/* Timer ring */}
      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={45} size={140} strokeWidth={10} />
      )}

      {/* Players as white cards */}
      <div className="flex flex-wrap justify-center gap-5 max-w-4xl">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, type: 'spring' }}
            className="bg-white rounded-2xl px-5 py-4 shadow-lg flex flex-col items-center gap-2"
            style={{
              opacity: p.isConnected ? 1 : 0.4,
              borderBottom: `4px solid ${p.color.hex}`,
            }}
          >
            <PlayerAvatar name={p.name} color={p.color} avatar={p.avatar} size="md" isConnected={p.isConnected} />
            <span className="font-bold text-gray-900 text-base truncate max-w-[80px]">{p.name}</span>
          </motion.div>
        ))}
      </div>

      <p className="font-bold text-xl uppercase tracking-widest" style={{ color: '#a78bfa' }}>
        Thinking deeply…
      </p>
    </div>
  );
}
