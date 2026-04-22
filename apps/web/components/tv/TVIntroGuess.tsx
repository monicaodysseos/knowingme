'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
}

function Sparkle({ size = 24, color = '#fff', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill={color} stroke={Y2K.dark} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = Y2K.yellow, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 35 C 8 25, 3 18, 3 12 C 3 6, 8 3, 12 3 C 16 3, 19 6, 20 9 C 21 6, 24 3, 28 3 C 32 3, 37 6, 37 12 C 37 18, 32 25, 20 35 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

const SCORE_ROWS = [
  { pts: '+200', label: 'you guess right', color: Y2K.yellow },
  { pts: '+100', label: 'someone guesses you', color: Y2K.cyan },
  { pts: '0',    label: 'nobody guesses you', color: '#fff' },
];

export default function TVIntroGuess({ state }: Props) {
  const { players } = state;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FF1E8E 0%, #6B0F85 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: Y2K.body,
      }}
    >
      {/* Halftone */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #0b0429 1.5px, transparent 2px)',
        backgroundSize: '18px 18px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -60, left: -60, right: -60, height: 120,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))',
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }} />

      <Sparkle size={40} color={Y2K.yellow} x={50} y={60} rotate={15} />
      <Sparkle size={26} color={Y2K.cyan} x={860} y={70} />
      <Sparkle size={22} color="#fff" x={120} y={450} />
      <Heart size={32} color={Y2K.yellow} x={880} y={450} rotate={15} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 64px', gap: 20, zIndex: 1 }}>
        {/* Round stamp + badge */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: Y2K.yellow, color: Y2K.dark, border: '4px solid #0b0429', padding: '8px 20px', borderRadius: 12, boxShadow: '0 6px 0 #0b0429', transform: 'rotate(-2deg)' }}>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 12, letterSpacing: 4, opacity: 0.7 }}>ROUND</span>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, letterSpacing: -1 }}>3</span>
          </div>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 12, letterSpacing: 4,
            background: '#fff', color: Y2K.dark, padding: '6px 12px',
            border: '3px solid #0b0429', borderRadius: 6, boxShadow: '0 3px 0 #0b0429',
          }}>THE REAL SHOW ✦</div>
        </motion.div>

        {/* Big heading */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
          style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(80px, 12vw, 140px)',
            letterSpacing: '-0.04em', color: '#fff',
            WebkitTextStroke: '4px #0b0429',
            textShadow: '8px 8px 0 #0b0429',
            margin: 0, lineHeight: 0.85, textTransform: 'uppercase',
          }}
        >
          Time to<br />Guess.
        </motion.h1>

        {/* Points table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}
        >
          {SCORE_ROWS.map((row, i) => (
            <div key={i} style={{
              background: Y2K.dark, border: '3px solid #fff', borderRadius: 12,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 0 rgba(255,255,255,0.3)',
            }}>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: row.color, WebkitTextStroke: '1px #0b0429' }}>{row.pts}</div>
              <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{row.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: '#fff', maxWidth: 720, lineHeight: 1.3, textShadow: '2px 2px 0 rgba(11,4,41,0.5)' }}
        >
          one by one, each player gets spotlit. guess what they said ✦ closer = more points ✦ bonus for whoever&apos;s <b style={{ color: Y2K.yellow }}>most knowable</b>
        </motion.div>

        {/* Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* Avatar lineup */}
          <div style={{ display: 'flex' }}>
            {players.slice(0, 8).map((p, i) => (
              <div key={p.id} style={{
                marginLeft: i === 0 ? 0 : -12,
                width: 54, height: 54, borderRadius: '50%',
                background: '#fff', border: '3px solid #0b0429',
                display: 'grid', placeItems: 'center',
                boxShadow: '0 4px 0 #0b0429',
                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 4}deg)`,
                position: 'relative', zIndex: 8 - i,
              }}>
                <Y2KAvatar avatar={p.avatar} size={42} />
              </div>
            ))}
          </div>

          {/* LET'S GOOO */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, color: '#fff', WebkitTextStroke: '3px #0b0429', textShadow: '4px 4px 0 #0b0429', transform: 'rotate(-3deg)' }}>LET&apos;S</div>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, color: Y2K.yellow, WebkitTextStroke: '3px #0b0429', textShadow: '4px 4px 0 #0b0429', transform: 'rotate(2deg)' }}>GOOO ➤</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
