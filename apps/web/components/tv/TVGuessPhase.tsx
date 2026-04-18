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

function Chunky({ children, size = 18, color = '#fff', shadow = Y2K.dark }: { children: React.ReactNode; size?: number; color?: string; shadow?: string }) {
  return (
    <div style={{
      fontFamily: Y2K.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      color,
      textShadow: `2px 2px 0 ${shadow}`,
      WebkitTextStroke: `1px ${shadow}`,
    }}>
      {children}
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

export default function TVGuessPhase({ state }: Props) {
  const { currentTurn, players, timerEnd } = state;
  const { playTick, stopTick } = useGameSounds();

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
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-12 relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      <Sparkle size={28} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={20} color={Y2K.cyan} x={900} y={80} />

      {/* Subject player */}
      <motion.div
        key={subjectPlayer.id}
        initial={{ scale: 0.8, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="flex flex-col items-center gap-3"
      >
        <Y2KAvatar avatar={subjectPlayer.avatar} size={90} />
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 48, color: subjectPlayer.color.hex, WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1 }}>
          {subjectPlayer.name}
        </div>
        <Chunky size={14} color={Y2K.cyan} shadow={Y2K.dark}>answered this question…</Chunky>
        {totalForSubject > 1 && (
          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Question {questionIndex + 1} of {totalForSubject}
          </div>
        )}
      </motion.div>

      {/* Question sticker */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring' }}
        style={{ width: '100%', maxWidth: 640 }}
      >
        <Sticker color="#fff" r={22} rotate={-1} style={{ padding: '24px 28px', textAlign: 'center' }}>
          <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 30, color: Y2K.dark, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {questionText}
          </p>
        </Sticker>
      </motion.div>

      {/* Guess count + timer */}
      <div className="flex items-center gap-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Sticker color={subjectPlayer.color.hex} r={16} style={{ padding: '12px 20px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 52, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, lineHeight: 1 }}>
              {guessCount}
            </div>
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em' }}>GUESSES IN</div>
          </Sticker>
        </motion.div>

        {timerEnd > 0 && (
          <CountdownRing timerEnd={timerEnd} totalSeconds={60} size={110} />
        )}
      </div>

      {/* Guesser grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {guessers.map((p) => (
          <div key={p.id} style={{
            background: '#fff',
            borderRadius: 12,
            border: `2.5px solid ${Y2K.dark}`,
            boxShadow: `0 3px 0 rgba(11,4,41,0.35)`,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Y2KAvatar avatar={p.avatar} size={28} />
            <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: p.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      <Chunky size={14} color={Y2K.pink} shadow={Y2K.dark}>type your guess on your phone</Chunky>
    </div>
  );
}
