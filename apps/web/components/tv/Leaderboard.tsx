'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreEntry } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  scores: ScoreEntry[];
  highlight?: boolean;
}

const RANK_STYLES: Record<number, { icon: string; color: string }> = {
  0: { icon: '🥇', color: '#F59E0B' },
  1: { icon: '🥈', color: '#9CA3AF' },
  2: { icon: '🥉', color: '#CD7F32' },
};

export default function Leaderboard({ scores, highlight = false }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <AnimatePresence mode="popLayout">
        {scores.map((entry, rank) => {
          const rs = RANK_STYLES[rank];
          return (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex items-center gap-4 bg-white rounded-2xl shadow-lg px-5 py-3"
              style={{
                borderLeft: `5px solid ${entry.color.hex}`,
                transform: rank === 0 && highlight ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {/* Rank */}
              <span className="w-10 text-center font-bold" style={{ fontSize: rs ? 28 : 22, color: rs?.color ?? '#6B7280' }}>
                {rs ? rs.icon : `${rank + 1}`}
              </span>

              <PlayerAvatar name={entry.playerName} color={entry.color} size="sm" />

              <span className="flex-1 font-bold text-xl text-gray-900 truncate">
                {entry.playerName}
              </span>

              <div className="flex items-center gap-3">
                {entry.delta > 0 && (
                  <motion.span
                    key={entry.delta + entry.playerId}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -30, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="font-bold text-lg"
                    style={{ color: '#F97316' }}
                  >
                    +{entry.delta}
                  </motion.span>
                )}
                <span className="font-bold text-2xl text-gray-900 tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
