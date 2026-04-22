'use client';

import { motion } from 'framer-motion';
import type { ScoreEntry, AwardResult } from '@ksero-se/types';
import { Y2K } from '../../lib/y2k';

interface Props {
  scores: ScoreEntry[];
  awards?: AwardResult[];
  onPlayAgain?: () => void;
  playerId?: string;
}

const RANK_COLORS: Record<number, string> = {
  0: '#FFD23F', 1: '#C0C0C0', 2: '#CD7F32',
};

function Sticker({ color, r = 14, rotate = 0, style = {}, children }: { color: string; r?: number; rotate?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color, borderRadius: r, transform: `rotate(${rotate}deg)`,
      border: `2.5px solid ${Y2K.dark}`, boxShadow: `0 4px 0 rgba(11,4,41,0.45)`,
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,255,255,0.15)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

const AWARD_GLYPHS: Record<string, string> = {
  'emotionally-intelligent': '✦',
  'narcissist': '♛',
  'best-duo': '♡',
};
const AWARD_COLORS: Record<string, string> = {
  'emotionally-intelligent': '#8B5CF6',
  'narcissist': '#F59E0B',
  'best-duo': '#EC4899',
};

export default function PhoneResults({ scores, awards, onPlayAgain, playerId }: Props) {
  const myRank = scores.findIndex((s) => s.playerId === playerId) + 1;
  const myScore = scores.find((s) => s.playerId === playerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>

      {/* ── Logo ── */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ textAlign: 'center', paddingTop: 4 }}
      >
        <div style={{
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: 38, letterSpacing: '-0.04em',
          background: 'linear-gradient(180deg, #ffffff 0%, #d8e4f5 40%, #8aa2bf 55%, #eaf1fb 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          WebkitTextStroke: '2px rgba(11,4,41,0.55)',
          filter: `drop-shadow(3px 3px 0 ${Y2K.hotPink}) drop-shadow(5px 5px 0 #0b0429)`,
          transform: 'rotate(-1.5deg)', display: 'inline-block',
          textTransform: 'lowercase',
        }}>
          ksero<span style={{ WebkitTextFillColor: Y2K.dark, background: 'none', margin: '0 0.08em', fontSize: '0.72em', position: 'relative', top: '-0.06em' }}>·</span>se
        </div>
        {myScore && (
          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555', marginTop: 4, opacity: 0.8 }}>
            you finished{' '}
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, color: Y2K.hotPink }}>#{myRank}</span>
            {' '}with{' '}
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, color: Y2K.dark }}>{myScore.score.toLocaleString()} pts</span>
          </div>
        )}
      </motion.div>

      {/* ── Leaderboard ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 11, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          final standings ✦
        </div>
        {scores.map((entry, rank) => (
          <motion.div
            key={entry.playerId}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: rank * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 14,
              background: entry.playerId === playerId
                ? `linear-gradient(90deg, ${entry.color.hex}22 0%, #fff 60%)`
                : '#fff',
              border: `2.5px solid ${entry.playerId === playerId ? entry.color.hex : Y2K.dark}`,
              boxShadow: `0 3px 0 ${entry.playerId === playerId ? entry.color.hex + '66' : 'rgba(11,4,41,0.2)'}`,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: RANK_COLORS[rank] ?? '#E5E7EB',
              border: `2px solid ${Y2K.dark}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 13,
              color: rank < 3 ? Y2K.dark : '#fff', flexShrink: 0,
            }}>{rank + 1}</div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: entry.color.hex, border: `2px solid ${Y2K.dark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Y2K.display, fontWeight: 900, fontSize: 13, color: '#fff', flexShrink: 0 }}>
              {entry.playerName.charAt(0).toUpperCase()}
            </div>
            <span style={{ flex: 1, fontFamily: Y2K.display, fontWeight: 800, fontSize: 15, color: entry.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.playerName}
            </span>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 17, color: Y2K.dark }}>
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Awards ── */}
      {awards && awards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 11, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            ur awards ✿
          </div>
          {awards.map((award) => (
            <Sticker key={award.type} color={AWARD_COLORS[award.type] ?? '#8B5CF6'} r={14} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}` }}>
                {AWARD_GLYPHS[award.type] ?? '✦'}
              </div>
              <div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 14, color: '#fff', WebkitTextStroke: `0.5px ${Y2K.dark}` }}>{award.title}</div>
                <div style={{ fontFamily: Y2K.body, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                  {award.winners.join(' + ')} — {award.stat}
                </div>
              </div>
            </Sticker>
          ))}
        </div>
      )}

      {/* ── Sticky play again button ── */}
      {onPlayAgain && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 24px', background: `linear-gradient(180deg, transparent 0%, ${Y2K.cream} 30%)`, zIndex: 10 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={onPlayAgain}
            style={{
              width: '100%', padding: '18px',
              borderRadius: 99,
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 20,
              color: '#fff', background: Y2K.hotPink,
              border: `3px solid ${Y2K.dark}`,
              boxShadow: `0 5px 0 ${Y2K.dark}`,
              cursor: 'pointer',
              WebkitTextStroke: `1px ${Y2K.dark}`,
              textShadow: `2px 2px 0 ${Y2K.dark}`,
              letterSpacing: '0.05em',
            }}
          >
            play again ↻
          </motion.button>
        </div>
      )}
    </div>
  );
}
