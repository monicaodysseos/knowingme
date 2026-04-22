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

function Heart({ size = 24, color = '#fff', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 35 C 8 25, 3 18, 3 12 C 3 6, 8 3, 12 3 C 16 3, 19 6, 20 9 C 21 6, 24 3, 28 3 C 32 3, 37 6, 37 12 C 37 18, 32 25, 20 35 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function BlobDeco({ size = 60, color = Y2K.cyan, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M30 4 C 45 4, 56 14, 56 28 C 56 42, 48 56, 32 56 C 18 56, 4 48, 4 32 C 4 18, 15 4, 30 4 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" />
      <ellipse cx="22" cy="18" rx="8" ry="5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

export default function TVIntroWrite({ state }: Props) {
  const { players, settings } = state;
  const qw = settings.questionsToWrite;
  const qa = settings.questionsToAnswer;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFE24A 0%, #FF4FB4 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: Y2K.body,
      }}
    >
      {/* Halftone dot pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #0b0429 1.5px, transparent 2px)',
        backgroundSize: '18px 18px',
        pointerEvents: 'none',
      }} />
      {/* Diagonal chrome strip */}
      <div style={{
        position: 'absolute', top: -60, left: -60, right: -60, height: 120,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))',
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }} />

      {/* Deco */}
      <Sparkle size={38} color="#fff" x={60} y={70} rotate={12} />
      <Sparkle size={24} color={Y2K.cyan} x={880} y={80} />
      <Heart size={32} color="#fff" x={900} y={460} rotate={20} />
      <BlobDeco size={70} color={Y2K.cyan} x={40} y={440} rotate={-8} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', gap: 22, zIndex: 1 }}>
        {/* Round stamp */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: Y2K.dark, color: '#fff', border: '4px solid #0b0429', padding: '8px 20px', borderRadius: 12, boxShadow: '0 6px 0 #0b0429', transform: 'rotate(-2deg)', alignSelf: 'flex-start' }}
        >
          <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 12, letterSpacing: 4, opacity: 0.7 }}>ROUND</span>
          <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, letterSpacing: -1, WebkitTextStroke: '1px #fff' }}>1</span>
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
          Write<br />questions.
        </motion.h1>

        {/* Info bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            background: Y2K.dark, color: '#fff',
            fontFamily: Y2K.display, fontWeight: 800, fontSize: 18, letterSpacing: 0.5,
            padding: '10px 18px', borderRadius: 12, border: '3px solid #0b0429',
            boxShadow: '0 4px 0 #fff, 0 4px 0 4px #0b0429',
            display: 'inline-flex', gap: 14, alignItems: 'center', alignSelf: 'flex-start',
          }}
        >
          <span><b style={{ color: Y2K.yellow }}>{qw} question{qw !== 1 ? 's' : ''}</b></span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span><b style={{ color: Y2K.yellow }}>3 minutes</b></span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>weirder = better</span>
        </motion.div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 20, color: Y2K.dark, maxWidth: 700, lineHeight: 1.3 }}
        >
          write {qw} question{qw !== 1 ? 's' : ''} you want <u>someone else</u> to answer. we&apos;ll shuffle &amp; deal them out so each player gets {qa} random {qa !== 1 ? 'ones' : 'one'} ✦
        </motion.div>

        {/* Bottom row: avatar lineup + call to action */}
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

          {/* CTA pill */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              background: Y2K.dark, color: '#fff', padding: '14px 22px',
              borderRadius: 999, border: '3px solid #fff',
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, letterSpacing: 1,
              boxShadow: '0 5px 0 #fff, 0 5px 0 3px #0b0429',
              transform: 'rotate(-1deg)',
            }}
          >
            grab ur phone ✦ starting soon
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
