'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import CountdownRing from './CountdownRing';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
}

function Sticker({ color, rotate = 0, r = 14, style = {}, children }: { color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `0 4px 0 rgba(11,4,41,0.45)`,
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
      WebkitTextStroke: '3px #0b0429',
      textShadow: '4px 4px 0 #0b0429',
      background: 'linear-gradient(180deg, #fff 0%, #e8e8e8 30%, #b0b0b0 60%, #f0f0f0 80%, #d0d0d0 100%)',
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

export default function TVAnswerPhase({ state }: Props) {
  const { players, timerEnd } = state;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-12 relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      <Sparkle size={28} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={20} color={Y2K.cyan} x={900} y={80} />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <ChromeTitle text="answer time ✿" size={64} tilt={-2} />
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: Y2K.cyan, marginTop: 8 }}>
          everyone is answering their secret questions on their phones
        </p>
      </motion.div>

      {timerEnd > 0 && (
        <CountdownRing timerEnd={timerEnd} totalSeconds={45} size={130} strokeWidth={10} />
      )}

      {/* Players */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
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

      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 16, color: Y2K.pink, letterSpacing: '0.1em', textTransform: 'uppercase', WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
        thinking deeply…
      </div>
    </div>
  );
}
