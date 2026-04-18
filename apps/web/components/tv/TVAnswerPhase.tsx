'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import CountdownRing from './CountdownRing';
import { Y2K } from '../../lib/y2k';
import { playAnswerPhaseMusic, stopAnswerPhaseMusic, useGameSounds } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
}

function Sticker({ color, rotate = 0, r = 14, style = {}, children }: { color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color, borderRadius: r, transform: `rotate(${rotate}deg)`,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.7), 0 5px 0 rgba(11,4,41,0.4)`,
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
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

export default function TVAnswerPhase({ state }: Props) {
  const { players, timerEnd } = state;
  const { playBeep } = useGameSounds();

  useEffect(() => {
    playAnswerPhaseMusic();
    return stopAnswerPhaseMusic;
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-12 relative overflow-hidden"
      style={{ background: Y2K.bg, fontFamily: Y2K.body }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none' }} />

      <Sparkle size={28} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={20} color={Y2K.cyan} x={900} y={80} />

      {/* Title */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center" style={{ zIndex: 1 }}>
        <div style={{
          fontFamily: Y2K.display, fontWeight: 900, fontSize: 64,
          letterSpacing: '-2px', lineHeight: 1, transform: 'rotate(-2deg)',
          color: 'transparent',
          background: 'linear-gradient(180deg, #ffffff 0%, #d8e4f5 40%, #8aa2bf 55%, #eaf1fb 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextStroke: '2px #0b0429',
          filter: `drop-shadow(3px 3px 0 ${Y2K.hotPink}) drop-shadow(6px 6px 0 #0b0429)`,
          display: 'inline-block', textTransform: 'uppercase',
        }}>
          ANSWER TIME ✿
        </div>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: '#3a1555', marginTop: 8 }}>
          everyone is answering their secret questions on their phones
        </p>
      </motion.div>

      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={300} size={130} strokeWidth={10} beep={playBeep} />
      )}

      {/* Players */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl" style={{ zIndex: 1 }}>
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, type: 'spring' }}
            style={{ opacity: p.isConnected ? 1 : 0.4 }}
          >
            <Sticker color="#fff" r={14} style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <Y2KAvatar avatar={p.avatar} size={44} />
              <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: p.color.hex, WebkitTextStroke: `0.3px ${Y2K.dark}`, letterSpacing: '0.05em' }}>
                {p.name}
              </span>
            </Sticker>
          </motion.div>
        ))}
      </div>

      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 16, color: Y2K.deepPink, letterSpacing: '0.1em', textTransform: 'uppercase', WebkitTextStroke: `0.5px ${Y2K.dark}`, zIndex: 1 }}>
        thinking deeply…
      </div>
    </div>
  );
}
