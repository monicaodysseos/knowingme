'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import CountdownRing from './CountdownRing';
import { Y2K } from '../../lib/y2k';
import { useGameSounds } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
}

function Sparkle({ size = 24, color = Y2K.yellow, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill={color} stroke={Y2K.dark} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = Y2K.pink, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 35 C 8 25, 3 18, 3 12 C 3 6, 8 3, 12 3 C 16 3, 19 6, 20 9 C 21 6, 24 3, 28 3 C 32 3, 37 6, 37 12 C 37 18, 32 25, 20 35 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function TVGuessPhase({ state }: Props) {
  const { currentTurn, players, timerEnd } = state;
  const { playTick, stopTick, playBeep } = useGameSounds();

  useEffect(() => {
    playTick();
    return stopTick;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn?.questionText]);

  if (!currentTurn) return null;

  const { subjectPlayer, questionText, questionIndex, totalForSubject, guessCount } = currentTurn;
  const guessers = players.filter((p) => p.id !== subjectPlayer.id && p.isConnected);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: Y2K.bg, fontFamily: Y2K.body }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none' }} />

      <Sparkle size={26} color={Y2K.cyan} x={48} y={70} rotate={10} />
      <Sparkle size={18} color={Y2K.yellow} x={900} y={110} />
      <Heart size={26} color={Y2K.pink} x={56} y={460} rotate={-20} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 56px 24px', gap: 20 }}>

        {/* ── Heading: avatar + "how did NAME answer?" ── */}
        <motion.div
          key={subjectPlayer.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{ display: 'flex', alignItems: 'center', gap: 20 }}
        >
          {/* Avatar bubble */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: '#fff', border: `4px solid ${Y2K.dark}`,
            boxShadow: `0 6px 0 ${Y2K.dark}`,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            transform: 'rotate(-4deg)',
          }}>
            <Y2KAvatar avatar={subjectPlayer.avatar} size={82} />
          </div>

          {/* Heading text */}
          <div>
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 16, color: '#3a1555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2, opacity: 0.7 }}>
              how did
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: Y2K.display, fontWeight: 900,
                fontSize: 'clamp(48px, 6vw, 80px)',
                color: subjectPlayer.color.hex,
                WebkitTextStroke: `3px ${Y2K.dark}`,
                textShadow: `5px 5px 0 ${Y2K.dark}`,
                letterSpacing: '-0.03em', lineHeight: 1,
                textTransform: 'uppercase',
              }}>
                {subjectPlayer.name}
              </span>
              <span style={{
                fontFamily: Y2K.display, fontWeight: 900,
                fontSize: 'clamp(32px, 4vw, 54px)',
                color: Y2K.dark, letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                answer?
              </span>
            </div>
            {totalForSubject > 1 && (
              <div style={{
                marginTop: 6,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: Y2K.dark, color: '#fff',
                fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, letterSpacing: 2,
                padding: '4px 12px', borderRadius: 999,
              }}>
                Q {questionIndex + 1} / {totalForSubject}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Question card ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.08 }}
          style={{
            background: Y2K.dark,
            borderRadius: 24, border: `4px solid ${Y2K.dark}`,
            boxShadow: `0 8px 0 rgba(11,4,41,0.4), 0 16px 32px rgba(12,6,40,0.2)`,
            padding: '28px 32px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Gloss */}
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)', borderRadius: '0 0 50% 50%', pointerEvents: 'none' }} />
          <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, letterSpacing: 3, color: subjectPlayer.color.hex, textTransform: 'uppercase', marginBottom: 10 }}>
            ✦ THE QUESTION ✦
          </div>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 900,
            fontSize: 'clamp(24px, 3.2vw, 48px)',
            color: '#fff', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            {questionText}
          </div>
        </motion.div>

        {/* ── Bottom bar ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.14 }}
          style={{
            marginTop: 'auto',
            background: '#fff', borderRadius: 20,
            border: `3px solid ${Y2K.dark}`,
            boxShadow: `0 5px 0 rgba(11,4,41,0.35)`,
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 18,
          }}
        >
          {/* Guess count badge */}
          <div style={{
            background: subjectPlayer.color.hex, borderRadius: 14,
            border: `3px solid ${Y2K.dark}`,
            boxShadow: `0 3px 0 rgba(11,4,41,0.4)`,
            padding: '6px 14px', flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: '#fff', WebkitTextStroke: `1.5px ${Y2K.dark}`, lineHeight: 1 }}>
              {guessCount}<span style={{ opacity: 0.75, fontSize: 20 }}>/{guessers.length}</span>
            </span>
            <span style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>guessed</span>
          </div>

          {/* Timer */}
          {timerEnd > 0 && (
            <CountdownRing timerEnd={timerEnd} totalSeconds={60} size={72} beep={playBeep} />
          )}

          {/* Player avatar row */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {guessers.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(11,4,41,0.06)', borderRadius: 99,
                padding: '4px 10px 4px 4px',
                border: `2px solid ${Y2K.dark}`,
              }}>
                <Y2KAvatar avatar={p.avatar} size={24} />
                <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: p.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>{p.name}</span>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: Y2K.body, fontSize: 12, fontWeight: 700, color: '#3a1555', whiteSpace: 'nowrap', flexShrink: 0, opacity: 0.7 }}>
            ✧ type on ur phone
          </div>
        </motion.div>
      </div>
    </div>
  );
}
