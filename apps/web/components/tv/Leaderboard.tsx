'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreEntry } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  scores: ScoreEntry[];
  highlight?: boolean;
}

export default function Leaderboard({ scores, highlight = false }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <AnimatePresence mode="popLayout">
        {scores.map((entry, rank) => (
          <motion.div
            key={entry.playerId}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex items-center gap-4 rounded-2xl px-5 py-3"
            style={{
              background:
                rank === 0 && highlight
                  ? `${entry.color.hex}22`
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${rank === 0 && highlight ? entry.color.hex + '66' : '#1e1e3a'}`,
            }}
          >
            {/* Rank */}
            <span
              className="font-black w-8 text-center"
              style={{
                fontSize: 28,
                color: rank === 0 ? '#F59E0B' : rank === 1 ? '#9CA3AF' : rank === 2 ? '#CD7F32' : '#4B5563',
              }}
            >
              {rank + 1}
            </span>

            <PlayerAvatar name={entry.playerName} color={entry.color} size="sm" />

            <span className="flex-1 font-bold text-xl truncate" style={{ color: entry.color.hex }}>
              {entry.playerName}
            </span>

            <div className="flex items-center gap-3">
              {entry.delta > 0 && (
                <motion.span
                  key={entry.delta + entry.playerId}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -30, opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  className="font-black text-lg"
                  style={{ color: entry.color.hex }}
                >
                  +{entry.delta}
                </motion.span>
              )}
              <span className="font-black text-2xl text-white tabular-nums">
                {entry.score.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
