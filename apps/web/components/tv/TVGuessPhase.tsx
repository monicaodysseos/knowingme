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
      className="min-h-screen relative overflow-hidden"
      style={{ background: Y2K.bg, fontFamily: Y2K.body }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none' }} />

      <Sparkle size={28} color={Y2K.cyan} x={40} y={80} rotate={10} />
      <Sparkle size={20} color={Y2K.yellow} x={880} y={120} />
      <Heart size={28} color={Y2K.pink} x={60} y={450} rotate={-20} />

      {/* Side-by-side layout */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', padding: '30px 44px', gap: 28, zIndex: 1, alignItems: 'center' }}>

        {/* LEFT: subject + question */}
        <motion.div
          key={subjectPlayer.id}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Subject header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 96, height: 96, display: 'grid', placeItems: 'center', transform: 'rotate(-4deg)' }}>
              <Y2KAvatar avatar={subjectPlayer.avatar} size={92} />
            </div>
            <div>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: Y2K.cyan, WebkitTextStroke: `0.5px ${Y2K.dark}`, textShadow: `1px 1px 0 ${Y2K.dark}` }}>
                now answering ★
              </div>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 52, color: subjectPlayer.color.hex, WebkitTextStroke: `2.5px ${Y2K.dark}`, letterSpacing: -1, textShadow: `4px 4px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                {subjectPlayer.name}
              </div>
              {totalForSubject > 1 && (
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555', marginTop: 4 }}>
                  question {questionIndex + 1} of {totalForSubject}
                </div>
              )}
            </div>
          </div>

          {/* Question sticker */}
          <Sticker color="#fff" r={22} rotate={-1} style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 10, color: Y2K.deepPink, letterSpacing: 3, marginBottom: 4, textTransform: 'uppercase' }}>THE QUESTION</div>
            <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 'clamp(18px, 2vw, 28px)', color: Y2K.dark, lineHeight: 1.2, letterSpacing: -0.5 }}>
              {questionText}
            </div>
          </Sticker>

          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555' }}>
            ✦ everyone else guesses what <b style={{ color: Y2K.deepPink }}>{subjectPlayer.name}</b> will say →
          </div>
        </motion.div>

        {/* RIGHT: guess count + timer + guesser grid */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.08 }}
          style={{ flex: 0.95, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* Count sticker + timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Sticker color={subjectPlayer.color.hex} r={18} style={{ padding: '10px 16px' }}>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 40, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, lineHeight: 1 }}>
                {guessCount}<span style={{ opacity: 0.7, fontSize: 28 }}>/{guessers.length}</span>
              </div>
              <div style={{ fontFamily: Y2K.body, fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>GUESSES IN</div>
            </Sticker>

            {timerEnd > 0 && (
              <CountdownRing timerEnd={timerEnd} totalSeconds={60} size={110} beep={playBeep} />
            )}
          </div>

          {/* Guesser grid */}
          <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, color: '#3a1555', letterSpacing: 2, textTransform: 'uppercase' }}>
            everyone else ✎ typing
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {guessers.map((p) => (
              <div key={p.id} style={{
                background: '#fff', border: `2.5px solid ${Y2K.dark}`, borderRadius: 12,
                padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 3px 0 rgba(11,4,41,0.35)`,
              }}>
                <Y2KAvatar avatar={p.avatar} size={26} />
                <div style={{ flex: 1, fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: p.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>{p.name}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', fontFamily: Y2K.body, fontSize: 12, fontWeight: 700, color: '#3a1555', textAlign: 'center' }}>
            ✧ type your guess on your phone ✧
          </div>
        </motion.div>
      </div>
    </div>
  );
}
