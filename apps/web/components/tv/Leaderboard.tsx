'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreEntry, PlayerCharacter } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Props {
  scores: ScoreEntry[];
  players?: { id: string; avatar: PlayerCharacter }[];
  highlight?: boolean;
}

const RANK_BG: Record<number, string> = {
  0: '#FFD23F', 1: '#B0BEC5', 2: '#CD7F32',
};

export default function Leaderboard({ scores, players = [], highlight = false }: Props) {
  const avatarMap = Object.fromEntries(players.map((p) => [p.id, p.avatar]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.4vh, 20px)', width: '100%', maxWidth: 'min(1100px, 82vw)' }}>
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
                gap: 'clamp(10px, 1.2vw, 20px)',
                background: '#fff',
                borderRadius: 'clamp(14px, 1.5vw, 22px)',
                padding: 'clamp(10px, 1.2vh, 18px) clamp(14px, 1.5vw, 24px)',
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
                width: 'clamp(32px, 3vw, 48px)',
                height: 'clamp(32px, 3vw, 48px)',
                borderRadius: '50%',
                background: rankBg,
                border: `2px solid ${Y2K.dark}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 'clamp(14px, 1.4vw, 20px)',
                color: rank < 3 ? Y2K.dark : '#6B7280',
                flexShrink: 0,
              }}>
                {rank + 1}
              </div>

              <Y2KAvatar avatar={avatarMap[entry.playerId]} size={44} style={{ flexShrink: 0, width: 'clamp(32px, 3.2vw, 52px)', height: 'clamp(32px, 3.2vw, 52px)' }} />

              <span style={{ flex: 1, fontFamily: Y2K.display, fontWeight: 800, fontSize: 'clamp(18px, 2vw, 28px)', color: entry.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.playerName}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1vw, 16px)' }}>
                {entry.delta > 0 && (
                  <motion.span
                    key={entry.delta + entry.playerId}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -30, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(14px, 1.6vw, 22px)', color: Y2K.hotPink, WebkitTextStroke: `0.5px ${Y2K.dark}` }}
                  >
                    +{entry.delta}
                  </motion.span>
                )}
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(20px, 2.2vw, 32px)', color: Y2K.dark }}>
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
