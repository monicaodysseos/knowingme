'use client';

import { motion } from 'framer-motion';
import { Y2K } from '../../lib/y2k';

interface Props {
  round: 1 | 2 | 3;
}

const ROUND_CONFIG = {
  1: {
    bg: 'linear-gradient(160deg, #FFE24A 0%, #FF4FB4 100%)',
    accent: Y2K.dark,
    label: 'Write Questions',
  },
  2: {
    bg: 'linear-gradient(160deg, #00D5FF 0%, #9D5CFF 100%)',
    accent: '#fff',
    label: 'Answer Time',
  },
  3: {
    bg: 'linear-gradient(160deg, #FF1E8E 0%, #6B0F85 100%)',
    accent: Y2K.yellow,
    label: 'Guess Phase',
  },
};

export default function TVRoundAnnouncement({ round }: Props) {
  const cfg = ROUND_CONFIG[round];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: cfg.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: Y2K.body,
        gap: 12,
      }}
    >
      {/* Halftone */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: 'radial-gradient(circle, #0b0429 1.5px, transparent 2px)',
        backgroundSize: '20px 20px', pointerEvents: 'none',
      }} />
      {/* Diagonal gloss strip */}
      <div style={{
        position: 'absolute', top: -60, left: -60, right: -60, height: 140,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))',
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }} />

      {/* "ROUND" label */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 180 }}
        style={{
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: 22, letterSpacing: 10,
          color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`,
          textTransform: 'uppercase', opacity: 0.85,
        }}
      >
        ROUND
      </motion.div>

      {/* Big number */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 160, damping: 14 }}
        style={{
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: 'clamp(160px, 22vw, 280px)',
          lineHeight: 0.9, letterSpacing: '-0.06em',
          color: '#fff',
          WebkitTextStroke: `6px ${Y2K.dark}`,
          textShadow: `10px 10px 0 ${Y2K.dark}`,
          filter: `drop-shadow(0 0 40px rgba(255,255,255,0.3))`,
        }}
      >
        {round}
      </motion.div>

      {/* Phase name badge */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28, type: 'spring', stiffness: 180 }}
        style={{
          background: Y2K.dark, color: '#fff',
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: 18, letterSpacing: 3,
          padding: '10px 28px', borderRadius: 999,
          border: `3px solid rgba(255,255,255,0.5)`,
          boxShadow: `0 6px 0 rgba(11,4,41,0.4)`,
          textTransform: 'uppercase',
        }}
      >
        {cfg.label}
      </motion.div>
    </motion.div>
  );
}
