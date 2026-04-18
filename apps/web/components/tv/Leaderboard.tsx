'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreEntry } from '@ksero-se/types';
import { Y2K } from '../../lib/y2k';

interface Props {
  scores: ScoreEntry[];
  highlight?: boolean;
}

const RANK_BG: Record<number, string> = {
  0: '#FFD23F', 1: '#B0BEC5', 2: '#CD7F32',
};

export default function Leaderboard({ scores, highlight = false }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-lg">
      <AnimatePresence mode="popLayout">
        {scores.map((entry, rank) => {
          const rankBg = RANK_BG[rank] ?? '#E5E7EB';
          return (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#fff',
                borderRadius: 16,
                padding: '10px 16px',
                border: `3px solid ${Y2K.dark}`,
                boxShadow: rank === 0 && highlight
                  ? `0 6px 0 ${Y2K.dark}, 0 0 0 3px ${Y2K.yellow}`
                  : `0 4px 0 rgba(11,4,41,0.3)`,
                transform: rank === 0 && highlight ? 'scale(1.03)' : 'scale(1)',
                borderLeft: `6px solid ${entry.color.hex}`,
              }}
            >
              {/* Rank badge */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: rankBg,
                border: `2px solid ${Y2K.dark}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 15,
                color: rank < 3 ? Y2K.dark : '#6B7280',
                flexShrink: 0,
              }}>
                {rank + 1}
              </div>

              <div style={{ width: 36, height: 36, borderRadius: '50%', background: entry.color.hex, border: `2px solid ${Y2K.dark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Y2K.display, fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0, WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
                {entry.playerName.charAt(0).toUpperCase()}
              </div>

              <span style={{ flex: 1, fontFamily: Y2K.display, fontWeight: 800, fontSize: 20, color: entry.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.playerName}
              </span>

              <div className="flex items-center gap-3">
                {entry.delta > 0 && (
                  <motion.span
                    key={entry.delta + entry.playerId}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -30, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 17, color: Y2K.hotPink, WebkitTextStroke: `0.5px ${Y2K.dark}` }}
                  >
                    +{entry.delta}
                  </motion.span>
                )}
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: Y2K.dark }}>
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
