'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import CountdownRing from './CountdownRing';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
}

function Sticker({ color, rotate = 0, r = 18, style = {}, children }: { color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `3px solid ${Y2K.dark}`,
      boxShadow: `0 6px 0 rgba(11,4,41,0.5), 0 2px 12px rgba(11,4,41,0.2)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function ChromeTitle({ text, size = 64, tilt = -2 }: { text: string; size?: number; tilt?: number }) {
  return (
    <div style={{
      fontFamily: Y2K.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: '-2px',
      lineHeight: 1,
      transform: `rotate(${tilt}deg)`,
      WebkitTextStroke: '2px rgba(11,4,41,0.5)',
      textShadow: '3px 3px 0 rgba(11,4,41,0.4)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    }}>
      {text}
    </div>
  );
}

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function TVQuestionSubmission({ state }: Props) {
  const { players, submissionProgress, timerEnd } = state;
  const total = submissionProgress?.total ?? players.length;
  const submitted = submissionProgress?.submitted ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-12 relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      <Sparkle size={28} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={20} color={Y2K.cyan} x={880} y={70} />
      <Sparkle size={18} color={Y2K.pink} x={820} y={460} rotate={-8} />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <ChromeTitle text="write 2 qs ✿" size={64} tilt={-2} />
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: Y2K.cyan, marginTop: 8 }}>
          everyone is entering 2 personal prompts on their phone
        </p>
      </motion.div>

      {/* Progress sticker */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Sticker color="#fff" r={22} style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 380 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, color: Y2K.dark }}>
            <span style={{ color: Y2K.hotPink }}>{submitted}</span>
            <span style={{ color: '#9CA3AF' }}> / {total} submitted</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 18, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', border: `2px solid ${Y2K.dark}` }}>
            <motion.div
              style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${Y2K.hotPink}, ${Y2K.yellow})` }}
              animate={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>
        </Sticker>
      </motion.div>

      {/* Player grid */}
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: 'spring' }}
            style={{ position: 'relative' }}
          >
            <Sticker
              color={p.hasSubmittedQuestions ? '#19B06B' : '#fff'}
              r={14}
              style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}
            >
              <Y2KAvatar avatar={p.avatar} size={44} />
              <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: p.hasSubmittedQuestions ? '#fff' : p.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}`, letterSpacing: '0.05em' }}>
                {p.name}
              </span>
              {p.hasSubmittedQuestions && (
                <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: Y2K.yellow, border: `2px solid ${Y2K.dark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Y2K.display, fontWeight: 900, fontSize: 11, color: Y2K.dark }}>
                  ✓
                </div>
              )}
            </Sticker>
          </motion.div>
        ))}
      </div>

      {/* Timer */}
      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={120} size={100} />
      )}
    </div>
  );
}
