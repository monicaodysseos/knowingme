'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState, AwardResult } from '@ksero-se/types';
import Leaderboard from './Leaderboard';

interface Props {
  state: TVState;
  onPlayAgain: () => void;
}

export default function TVFinalAwards({ state, onPlayAgain }: Props) {
  const { awards = [], scores } = state;
  const [revealedCount, setRevealedCount] = useState(0);
  const [showScores, setShowScores] = useState(false);

  const ordered = [...awards].reverse();

  useEffect(() => {
    if (revealedCount < ordered.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 3500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShowScores(true), 1000);
      return () => clearTimeout(t);
    }
  }, [revealedCount, ordered.length]);

  const visibleAwards = ordered.slice(0, revealedCount);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-bg px-12 py-10">
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-bold text-white text-center"
        style={{ fontSize: 64 }}
      >
        🎉 Special Awards
      </motion.h1>

      {/* Awards reveal */}
      <div className="flex flex-col gap-5 w-full max-w-2xl">
        <AnimatePresence>
          {visibleAwards.map((award, i) => (
            <AwardCard key={award.type} award={award} rank={ordered.length - i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Final scoreboard */}
      <AnimatePresence>
        {showScores && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <h2 className="font-bold text-white" style={{ fontSize: 42 }}>Final Scores</h2>
            <Leaderboard scores={scores} highlight />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlayAgain}
              className="px-12 py-5 rounded-2xl font-bold text-2xl mt-4 text-white shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #F97316, #FF6B6B)',
                boxShadow: '0 8px 32px #F9731655',
              }}
            >
              🔄 Play Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AwardCard({ award, rank }: { award: AwardResult; rank: number }) {
  const RANK_COLOURS: Record<number, string> = {
    3: '#CD7F32',
    2: '#9CA3AF',
    1: '#F59E0B',
  };
  const colour = RANK_COLOURS[rank] ?? '#F97316';

  return (
    <motion.div
      initial={{ scale: 0.5, rotate: -6, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="bg-white rounded-3xl shadow-2xl px-8 py-6 text-center"
      style={{ borderLeft: `8px solid ${colour}` }}
    >
      <div className="text-5xl mb-2">{award.emoji}</div>
      <h3 className="font-bold text-2xl text-gray-900">{award.title}</h3>
      <p className="text-gray-500 text-lg font-semibold mt-1">{award.description}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {award.winners.map((w) => (
          <span
            key={w}
            className="font-bold text-2xl"
            style={{ color: colour }}
          >
            {w}
          </span>
        ))}
      </div>
      <p className="mt-2 text-gray-400 font-semibold text-base">{award.stat}</p>
    </motion.div>
  );
}
