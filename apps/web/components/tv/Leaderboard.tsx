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

const RANK_BG: Record<number, string> = { 1: '#FFE24A', 2: '#E0E5EE', 3: '#E89B5C' };

export default function Leaderboard({ scores, players = [], highlight = false }: Props) {
  const avatarMap = Object.fromEntries(players.map((p) => [p.id, p.avatar]));

  // Compute previous ranks from deltas
  const withPrev = scores.map((e) => ({ ...e, prevScore: e.score - e.delta }));
  const sortedByPrev = [...withPrev].sort((a, b) => b.prevScore - a.prevScore);
  const prevRankMap = Object.fromEntries(sortedByPrev.map((e, i) => [e.playerId, i + 1]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 'min(1100px, 82vw)' }}>
      <AnimatePresence mode="popLayout">
        {scores.map((entry, i) => {
          const rank = i + 1;
          const prevRank = prevRankMap[entry.playerId] ?? rank;
          const movedUp = prevRank > rank;
          const movedDown = prevRank < rank;
          const isTop = rank === 1 && highlight;
          const rankBg = RANK_BG[rank] ?? Y2K.dark;
          const rankColor = rank <= 3 ? Y2K.dark : '#fff';

          return (
            <motion.div
              key={entry.playerId}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26, delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 'clamp(7px, 1vh, 12px) clamp(12px, 1.2vw, 18px)',
                background: isTop
                  ? `linear-gradient(90deg, ${entry.color.hex} 0%, color-mix(in srgb, ${entry.color.hex} 70%, #fff 30%) 100%)`
                  : '#fff',
                border: `3px solid ${Y2K.dark}`,
                borderRadius: 16,
                boxShadow: isTop
                  ? `0 5px 0 ${Y2K.dark}, 0 0 0 4px ${entry.color.hex}66`
                  : `0 3px 0 ${Y2K.dark}`,
                transform: isTop ? 'scale(1.02)' : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {isTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '16px 16px 50% 50%', pointerEvents: 'none' }} />}

              {/* Rank badge */}
              <div style={{
                width: 'clamp(32px, 2.8vw, 44px)', height: 'clamp(32px, 2.8vw, 44px)', borderRadius: '50%',
                background: rankBg, color: rankColor,
                border: `2.5px solid ${Y2K.dark}`, boxShadow: `0 2px 0 ${Y2K.dark}`,
                display: 'grid', placeItems: 'center',
                fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(14px, 1.4vw, 20px)', flexShrink: 0,
              }}>{rank}</div>

              {/* Avatar */}
              <div style={{
                width: 'clamp(34px, 3vw, 46px)', height: 'clamp(34px, 3vw, 46px)',
                background: '#fff', border: `2.5px solid ${Y2K.dark}`, borderRadius: '50%',
                display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `0 2px 0 ${Y2K.dark}`,
              }}>
                <Y2KAvatar avatar={avatarMap[entry.playerId]} size={32} />
              </div>

              {/* Name + delta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(15px, 1.7vw, 22px)',
                  color: isTop ? '#fff' : Y2K.dark,
                  WebkitTextStroke: isTop ? `1px ${Y2K.dark}` : '0',
                  textShadow: isTop ? `2px 2px 0 ${Y2K.dark}` : 'none',
                  lineHeight: 1, letterSpacing: -0.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>{entry.playerName}</div>
                {entry.delta > 0 && (
                  <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, color: isTop ? 'rgba(255,255,255,0.9)' : '#19B06B', marginTop: 2 }}>
                    +{entry.delta} this turn
                  </div>
                )}
              </div>

              {/* Rank movement */}
              {(movedUp || movedDown) && (
                <div style={{
                  padding: '3px 7px', borderRadius: 999,
                  background: movedUp ? '#19B06B' : Y2K.hotPink,
                  border: `2px solid ${Y2K.dark}`,
                  fontFamily: Y2K.display, fontWeight: 900, fontSize: 11, color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 3,
                  boxShadow: `0 2px 0 ${Y2K.dark}`, flexShrink: 0,
                }}>
                  {movedUp ? '▲' : '▼'} {Math.abs(prevRank - rank)}
                </div>
              )}

              {/* Score */}
              <div style={{
                fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(18px, 2vw, 28px)',
                color: isTop ? '#fff' : Y2K.dark,
                WebkitTextStroke: isTop ? `1px ${Y2K.dark}` : '0',
                textShadow: isTop ? `2px 2px 0 ${Y2K.dark}` : 'none',
                minWidth: 'clamp(60px, 6vw, 90px)', textAlign: 'right' as const,
                letterSpacing: -1, flexShrink: 0,
              }}>{entry.score.toLocaleString()}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
