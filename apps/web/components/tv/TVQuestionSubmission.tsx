'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import CountdownRing from './CountdownRing';
import { Y2K } from '../../lib/y2k';
import { playQuestionsMusic, stopQuestionsMusic, useGameSounds } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
}

function Sticker({ color, rotate = 0, r = 18, style = {}, children }: { color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color, borderRadius: r, transform: `rotate(${rotate}deg)`,
      border: `3px solid ${Y2K.dark}`,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.7), 0 6px 0 rgba(11,4,41,0.45), 0 12px 20px rgba(12,6,40,0.15)`,
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 4, left: 12, right: 12, height: '35%', background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)', borderRadius: `${r - 4}px ${r - 4}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function Sparkle({ size = 24, color = Y2K.cyan, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
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

function BlobDeco({ size = 48, color = Y2K.yellow, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M30 4 C 45 4, 56 14, 56 28 C 56 42, 48 56, 32 56 C 18 56, 4 48, 4 32 C 4 18, 15 4, 30 4 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" />
    </svg>
  );
}

const HOW_IT_WORKS = [
  { n: 1, t: 'write 2 qs' },
  { n: 2, t: 'shuffle' },
  { n: 3, t: 'answer 5' },
  { n: 4, t: 'everyone guesses' },
];

export default function TVQuestionSubmission({ state }: Props) {
  const { players, submissionProgress, timerEnd } = state;
  const { playBeep } = useGameSounds();

  useEffect(() => {
    playQuestionsMusic();
    return stopQuestionsMusic;
  }, []);

  const total = submissionProgress?.total ?? players.length;
  const submitted = submissionProgress?.submitted ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: Y2K.bg, fontFamily: Y2K.body, padding: '36px 56px' }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none' }} />

      <Sparkle size={26} color={Y2K.cyan} x={60} y={60} />
      <Heart size={24} color={Y2K.pink} x={860} y={40} rotate={15} />
      <Sparkle size={20} color={Y2K.yellow} x={880} y={450} />
      <BlobDeco size={48} color={Y2K.yellow} x={40} y={440} rotate={-8} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', zIndex: 1, width: '100%' }}>
        {/* Step indicator */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: Y2K.cyan, WebkitTextStroke: `0.5px ${Y2K.dark}`, textShadow: `1px 1px 0 ${Y2K.dark}` }}>
            STEP 1 OF 3
          </div>
        </motion.div>

        {/* Chrome title */}
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 82, letterSpacing: '-0.03em', lineHeight: 0.9,
            color: 'transparent',
            background: 'linear-gradient(180deg, #ffffff 0%, #d8e4f5 40%, #8aa2bf 55%, #eaf1fb 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextStroke: '3px #0b0429',
            filter: `drop-shadow(4px 4px 0 ${Y2K.hotPink}) drop-shadow(8px 8px 0 #0b0429)`,
            transform: 'rotate(-3deg)', display: 'inline-block', textTransform: 'uppercase',
          }}>
            write 2 qs
          </div>
        </motion.div>

        {/* Body */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 17, color: '#3a1555', maxWidth: 620, lineHeight: 1.35 }}
        >
          any juicy question you want someone else to answer. ★ we&apos;ll shuffle them and hand each player{' '}
          <b style={{ color: Y2K.deepPink }}>5 random questions</b> to answer next.
        </motion.p>

        {/* Avatar progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}
        >
          {players.slice(0, total).map((p, i) => {
            const done = i < submitted;
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transform: done ? 'none' : 'rotate(-2deg)' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: done ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `3px solid ${Y2K.dark}`,
                  display: 'grid', placeItems: 'center',
                  boxShadow: done ? `0 5px 0 ${Y2K.dark}` : '0 3px 0 rgba(11,4,41,0.4)',
                  opacity: done ? 1 : 0.55,
                }}>
                  <Y2KAvatar avatar={p.avatar} size={48} />
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 10, color: done ? Y2K.deepPink : '#3a1555', letterSpacing: 1 }}>
                  {done ? '✔ DONE' : '...'}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Progress count + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 16, color: Y2K.dark, letterSpacing: 2 }}>
            {submitted}/{total} submitted
          </div>
          {timerEnd > 0 && (
            <CountdownRing timerEnd={timerEnd} totalSeconds={180} size={100} beep={playBeep} />
          )}
        </div>

        {/* How it works strip */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555' }}>how it works ⇢</div>
          {HOW_IT_WORKS.map((s, i) => (
            <div key={i} style={{
              background: i === 0 ? Y2K.hotPink : '#fff',
              border: `2.5px solid ${Y2K.dark}`, borderRadius: 999,
              padding: '6px 14px',
              fontFamily: Y2K.display, fontWeight: 800, fontSize: 12,
              color: i === 0 ? '#fff' : Y2K.dark, letterSpacing: 0.5,
              boxShadow: `0 3px 0 ${Y2K.dark}`,
            }}>
              <span style={{ opacity: 0.7, marginRight: 4 }}>{s.n}.</span>{s.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
