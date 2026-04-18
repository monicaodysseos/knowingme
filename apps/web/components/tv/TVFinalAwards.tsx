'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState, AwardResult } from '@ksero-se/types';
import ParticleBurst from './ParticleBurst';
import { Y2K } from '../../lib/y2k';
import { useGameSounds } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
  onPlayAgain: () => void;
}

const AWARD_ORDER: AwardResult['type'][] = [
  'emotionally-intelligent',
  'narcissist',
  'best-duo',
];

type AwardPhase = 'title' | 'drumroll' | 'winner' | 'done';

const AWARD_COLORS: Record<AwardResult['type'], string> = {
  'emotionally-intelligent': '#8B5CF6',
  'narcissist': '#F59E0B',
  'best-duo': '#EC4899',
};

const AWARD_GLYPHS: Record<AwardResult['type'], string> = {
  'emotionally-intelligent': '✦',
  'narcissist': '♛',
  'best-duo': '♡',
};

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

function ChromeTitle({ text, size = 72, tilt = -3 }: { text: string; size?: number; tilt?: number }) {
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

function Chunky({ children, size = 16, color = '#fff', shadow = Y2K.dark }: { children: React.ReactNode; size?: number; color?: string; shadow?: string }) {
  return (
    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: size, textTransform: 'uppercase' as const, color, textShadow: `2px 2px 0 ${shadow}`, WebkitTextStroke: `1px ${shadow}` }}>
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

function Heart({ size = 24, color = '#FF4FB4', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 21 C12 21 3 14 3 8 C3 5.2 5.2 3 8 3 C9.7 3 11.2 3.9 12 5.1 C12.8 3.9 14.3 3 16 3 C18.8 3 21 5.2 21 8 C21 14 12 21 12 21Z" fill={color} stroke={Y2K.dark} strokeWidth="1.5" />
    </svg>
  );
}

export default function TVFinalAwards({ state, onPlayAgain }: Props) {
  const { awards = [] } = state;
  const { playDrumroll, playAwardFanfare, playGameOver } = useGameSounds();

  const orderedAwards = AWARD_ORDER
    .map((type) => awards.find((a) => a.type === type))
    .filter((a): a is AwardResult => Boolean(a));

  const [awardIndex, setAwardIndex] = useState(0);
  const [phase, setPhase] = useState<AwardPhase>('title');
  const [showPlayAgain, setShowPlayAgain] = useState(false);

  const advance = useCallback(() => {
    const next = awardIndex + 1;
    if (next < orderedAwards.length) {
      setAwardIndex(next);
      setPhase('title');
    } else {
      setPhase('done');
      setTimeout(() => setShowPlayAgain(true), 800);
    }
  }, [awardIndex, orderedAwards.length]);

  useEffect(() => {
    if (phase === 'title') {
      const t = setTimeout(() => setPhase('drumroll'), 1200);
      return () => clearTimeout(t);
    }
    if (phase === 'drumroll') {
      const stop = playDrumroll(1800);
      const t = setTimeout(() => { stop(); setPhase('winner'); }, 1800);
      return () => { clearTimeout(t); stop(); };
    }
    if (phase === 'winner') {
      playAwardFanfare();
      const t = setTimeout(advance, 3500);
      return () => clearTimeout(t);
    }
    if (phase === 'done') {
      playGameOver();
    }
  }, [phase, advance, playDrumroll, playAwardFanfare, playGameOver]);

  const current = orderedAwards[awardIndex];
  const accent = current ? AWARD_COLORS[current.type] : Y2K.hotPink;

  if (phase === 'done') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-12 py-8 relative overflow-hidden"
        style={{ background: Y2K.dark }}
      >
        <Sparkle size={32} color={Y2K.yellow} x={40} y={50} rotate={15} />
        <Sparkle size={20} color={Y2K.cyan} x={140} y={120} />
        <Sparkle size={26} color={Y2K.pink} x={880} y={60} rotate={-10} />
        <Heart size={28} color={Y2K.pink} x={60} y={460} rotate={-15} />
        <Heart size={24} color={Y2K.cyan} x={900} y={470} rotate={22} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 z-10 w-full max-w-2xl"
        >
          <ChromeTitle text="the awards ✿" size={64} tilt={-2} />

          {/* Award cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%' }}>
            {orderedAwards.map((award, i) => (
              <motion.div
                key={award.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Sticker
                  color={AWARD_COLORS[award.type]}
                  r={20}
                  rotate={i === 0 ? -2 : i === 2 ? 2 : 0}
                  style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 48, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, lineHeight: 1, textShadow: `3px 3px 0 ${Y2K.dark}` }}>
                    {AWARD_GLYPHS[award.type]}
                  </div>
                  <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 10, color: '#fff', letterSpacing: 2, opacity: 0.9 }}>
                    {award.description.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                    {award.title}
                  </div>
                  <div style={{ marginTop: 'auto', padding: '8px 10px', background: 'rgba(255,255,255,0.92)', borderRadius: 10, border: `2px solid ${Y2K.dark}` }}>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: Y2K.dark, letterSpacing: '-0.5px' }}>
                      {award.winners.join(' + ')}
                    </div>
                    <div style={{ fontFamily: Y2K.body, fontSize: 11, color: '#3a1555', fontWeight: 600, marginTop: 2 }}>
                      {award.stat}
                    </div>
                  </div>
                </Sticker>
              </motion.div>
            ))}
          </div>

          {showPlayAgain && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sticker color={Y2K.hotPink} r={99} style={{ padding: '14px 48px' }}>
                <button
                  onClick={onPlayAgain}
                  style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, letterSpacing: '0.05em' }}
                >
                  play again ↻
                </button>
              </Sticker>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      <Sparkle size={32} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={24} color={Y2K.cyan} x={880} y={80} />
      <Heart size={28} color={Y2K.pink} x={900} y={470} rotate={20} />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`award-${awardIndex}-${phase}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 z-10 text-center px-12 max-w-3xl"
          >
            {phase === 'title' && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="flex flex-col items-center gap-6"
              >
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 120, color: accent, WebkitTextStroke: `4px ${Y2K.dark}`, textShadow: `6px 6px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                  {AWARD_GLYPHS[current.type]}
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: `3px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, letterSpacing: '-2px', lineHeight: 1 }}>
                  {current.title}
                </div>
                <Chunky size={16} color={accent} shadow={Y2K.dark}>{current.description}</Chunky>
              </motion.div>
            )}

            {phase === 'drumroll' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-8"
              >
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 52, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1 }}>
                  {current.title}
                </div>
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
                      style={{ width: 20, height: 20, borderRadius: '50%', background: accent, border: `2.5px solid ${Y2K.dark}` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'winner' && (
              <motion.div className="flex flex-col items-center gap-6 relative">
                <ParticleBurst trigger />
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 44, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1 }}>
                  {current.title}
                </div>
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {current.winners.map((w) => (
                    <span
                      key={w}
                      style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 72, color: accent, WebkitTextStroke: `3px ${Y2K.dark}`, textShadow: `5px 5px 0 ${Y2K.dark}`, letterSpacing: '-2px', lineHeight: 1 }}
                    >
                      {w}
                    </span>
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.55)' }}
                >
                  {current.stat}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
