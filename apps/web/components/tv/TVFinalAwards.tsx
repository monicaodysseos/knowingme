'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState, AwardResult } from '@ksero-se/types';
import ParticleBurst from './ParticleBurst';

interface Props {
  state: TVState;
  onPlayAgain: () => void;
}

// Fixed presentation order: Emotionally Intelligent → Narcissist → Best Duo
const AWARD_ORDER: AwardResult['type'][] = [
  'emotionally-intelligent',
  'narcissist',
  'best-duo',
];

type AwardPhase = 'title' | 'drumroll' | 'winner' | 'done';

const AWARD_ICONS: Record<AwardResult['type'], JSX.Element> = {
  'emotionally-intelligent': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#8B5CF6" opacity={0.2} />
      <path d="M20 28 Q22 18 32 18 Q42 18 44 28 Q46 38 32 46 Q18 38 20 28Z" fill="#8B5CF6" />
      <circle cx="27" cy="28" r="2.5" fill="white" />
      <circle cx="37" cy="28" r="2.5" fill="white" />
      <path d="M26 36 Q32 41 38 36" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  'narcissist': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#F59E0B" opacity={0.2} />
      <path d="M32 10 L35 22 L48 22 L37 30 L41 42 L32 34 L23 42 L27 30 L16 22 L29 22Z" fill="#F59E0B" />
    </svg>
  ),
  'best-duo': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#EC4899" opacity={0.2} />
      <path d="M22 20 Q18 14 12 18 Q6 22 12 32 Q18 42 22 44 L32 52 L42 44 Q46 42 52 32 Q58 22 52 18 Q46 14 42 20 Q38 14 32 22 Q26 14 22 20Z" fill="#EC4899" />
    </svg>
  ),
};

export default function TVFinalAwards({ state, onPlayAgain }: Props) {
  const { awards = [] } = state;

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
      const t = setTimeout(() => setPhase('winner'), 1800);
      return () => clearTimeout(t);
    }
    if (phase === 'winner') {
      const t = setTimeout(advance, 3500);
      return () => clearTimeout(t);
    }
  }, [phase, advance]);

  const current = orderedAwards[awardIndex];

  const ACCENT_COLORS: Record<AwardResult['type'], string> = {
    'emotionally-intelligent': '#8B5CF6',
    'narcissist': '#F59E0B',
    'best-duo': '#EC4899',
  };

  const accent = current ? ACCENT_COLORS[current.type] : '#F97316';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0d0818' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 'done' ? (
          /* ── All awards shown — Play Again ──────────────────────────── */
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 z-10"
          >
            <h1 className="font-black text-white text-center" style={{ fontSize: 64, letterSpacing: '-2px' }}>
              That&apos;s a wrap!
            </h1>
            {showPlayAgain && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="px-14 py-5 rounded-full font-black text-2xl text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
              >
                Play Again
              </motion.button>
            )}
          </motion.div>
        ) : current ? (
          <motion.div
            key={`award-${awardIndex}-${phase}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 z-10 text-center px-12 max-w-3xl"
          >
            {/* Phase: TITLE */}
            {phase === 'title' && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="flex flex-col items-center gap-4"
              >
                <div style={{ transform: 'scale(1.5)' }}>{AWARD_ICONS[current.type]}</div>
                <h2
                  className="font-black text-white"
                  style={{ fontSize: 68, letterSpacing: '-2px', lineHeight: 1 }}
                >
                  {current.title}
                </h2>
                <p className="font-bold uppercase tracking-widest" style={{ color: accent, fontSize: 18 }}>
                  {current.description}
                </p>
              </motion.div>
            )}

            {/* Phase: DRUMROLL */}
            {phase === 'drumroll' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-8"
              >
                <h2
                  className="font-black text-white"
                  style={{ fontSize: 56, letterSpacing: '-2px', lineHeight: 1 }}
                >
                  {current.title}
                </h2>
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
                      className="w-5 h-5 rounded-full"
                      style={{ background: accent }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase: WINNER */}
            {phase === 'winner' && (
              <motion.div
                className="flex flex-col items-center gap-6 relative"
              >
                <ParticleBurst trigger />
                <h2
                  className="font-black text-white"
                  style={{ fontSize: 48, letterSpacing: '-2px', lineHeight: 1 }}
                >
                  {current.title}
                </h2>
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {current.winners.map((w) => (
                    <span
                      key={w}
                      className="font-black"
                      style={{ fontSize: 72, color: accent, letterSpacing: '-3px', lineHeight: 1 }}
                    >
                      {w}
                    </span>
                  ))}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="font-bold"
                  style={{ color: '#6b7280', fontSize: 20 }}
                >
                  {current.stat}
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
