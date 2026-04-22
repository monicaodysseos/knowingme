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

function BlobDeco({ size = 60, color = Y2K.pink, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M30 4 C 45 4, 56 14, 56 28 C 56 42, 48 56, 32 56 C 18 56, 4 48, 4 32 C 4 18, 15 4, 30 4 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" />
      <ellipse cx="22" cy="18" rx="8" ry="5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

export default function TVIntroAnswer({ state }: Props) {
  const qa = state.settings.questionsToAnswer;
  // Compact envelope sizing for large counts
  const envW = qa > 6 ? 58 : 82;
  const envH = qa > 6 ? 40 : 56;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #00D5FF 0%, #9D5CFF 100%)',
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

      <Sparkle size={34} color={Y2K.yellow} x={50} y={60} rotate={10} />
      <Sparkle size={22} color="#fff" x={870} y={90} />
      <Heart size={30} color={Y2K.hotPink} x={40} y={450} rotate={-15} />
      <BlobDeco size={60} color={Y2K.pink} x={860} y={440} rotate={12} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 64px', gap: 18, zIndex: 1 }}>
        {/* Round stamp + shuffle badge */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: Y2K.hotPink, color: '#fff', border: '4px solid #0b0429', padding: '8px 20px', borderRadius: 12, boxShadow: '0 6px 0 #0b0429', transform: 'rotate(-2deg)' }}>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 12, letterSpacing: 4, opacity: 0.7 }}>ROUND</span>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, letterSpacing: -1, WebkitTextStroke: '1px #fff' }}>2</span>
          </div>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 800, fontSize: 14, letterSpacing: 2,
            background: Y2K.yellow, color: Y2K.dark, padding: '6px 14px',
            border: '3px solid #0b0429', borderRadius: 999, boxShadow: '0 4px 0 #0b0429',
            transform: 'rotate(2deg)',
          }}>SHUFFLING… ✦</div>
        </motion.div>

        {/* Big heading */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
          style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(72px, 10.5vw, 128px)',
            letterSpacing: '-0.04em', color: '#fff',
            WebkitTextStroke: '4px #0b0429',
            textShadow: '8px 8px 0 #0b0429',
            margin: 0, lineHeight: 0.85, textTransform: 'uppercase',
          }}
        >
          Answer<br />{qa} question{qa !== 1 ? 's' : ''}.
        </motion.h1>

        {/* Envelope cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}
        >
          {Array.from({ length: qa }, (_, i) => (
            <div key={i} style={{
              width: envW, height: envH, position: 'relative',
              background: '#fff', border: '3px solid #0b0429', borderRadius: 8,
              boxShadow: '0 5px 0 #0b0429',
              transform: `rotate(${(i % 2 === 0 ? -3 : 3)}deg) translateY(${i === Math.floor(qa / 2) ? -4 : 0}px)`,
            }}>
              <div style={{
                position: 'absolute', inset: 3, border: '2px solid #0b0429', borderRadius: 4,
                background: 'linear-gradient(135deg, #FFE24A 0%, #FF4FB4 100%)',
                display: 'grid', placeItems: 'center',
                fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark,
              }}>?</div>
              <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: Y2K.hotPink, border: '2.5px solid #0b0429', display: 'grid', placeItems: 'center', fontFamily: Y2K.display, fontWeight: 900, fontSize: 10, color: '#fff' }}>{i + 1}</div>
            </div>
          ))}
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, color: '#fff', WebkitTextStroke: '2px #0b0429', marginLeft: 8, textShadow: '3px 3px 0 #0b0429' }}>→ YOU</div>
        </motion.div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: '#fff', maxWidth: 680, lineHeight: 1.3, textShadow: '2px 2px 0 rgba(11,4,41,0.5)' }}
        >
          you&apos;re about to get <b style={{ color: Y2K.yellow }}>{qa} random question{qa !== 1 ? 's' : ''}</b> from the group. answer honestly — everyone else will try to guess what you said ✦
        </motion.div>

        {/* Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            background: Y2K.dark, color: '#fff', padding: '10px 18px',
            borderRadius: 12, border: '3px solid #fff',
            fontFamily: Y2K.display, fontWeight: 800, fontSize: 16, letterSpacing: 1,
            boxShadow: '0 5px 0 rgba(11,4,41,0.3)',
          }}>
            ✧ {qa} question{qa !== 1 ? 's' : ''} ✧ be honest
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.yellow,
              WebkitTextStroke: '2px #0b0429', textShadow: '3px 3px 0 #0b0429',
              transform: 'rotate(-2deg)',
            }}
          >
            GO ➤
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
