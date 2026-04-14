'use client';

import { motion } from 'framer-motion';
import type { ScoreEntry, AwardResult } from '@ksero-se/types';

interface Props {
  scores: ScoreEntry[];
  awards?: AwardResult[];
  onPlayAgain?: () => void;
  playerId?: string;
}

const RANK_COLORS: Record<number, string> = {
  0: '#F59E0B', 1: '#9CA3AF', 2: '#CD7F32',
};

export default function PhoneResults({ scores, awards, onPlayAgain, playerId }: Props) {
  const myScore = scores.find((s) => s.playerId === playerId);
  const myRank = scores.findIndex((s) => s.playerId === playerId) + 1;

  return (
    <div className="flex flex-col gap-5 pb-4">

      {/* Hero banner */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl text-center py-6 px-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
      >
        <h2 className="font-black text-white" style={{ fontSize: 30, letterSpacing: '-0.5px' }}>
          Game Over!
        </h2>
        {myScore && (
          <p className="text-white/80 font-bold text-lg mt-1">
            You finished{' '}
            <span className="text-white font-black">#{myRank}</span>
            {' '}with{' '}
            <span className="font-black" style={{ color: '#FFD23F' }}>{myScore.score.toLocaleString()} pts</span>
          </p>
        )}
      </motion.div>

      {/* Scores */}
      <div className="flex flex-col gap-2">
        {scores.map((entry, rank) => (
          <motion.div
            key={entry.playerId}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: rank * 0.05 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-sm"
            style={{
              border: entry.playerId === playerId
                ? '2px solid #F97316'
                : `2px solid ${entry.color.hex}33`,
            }}
          >
            {/* Rank badge */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{
                background: RANK_COLORS[rank] ?? '#E5E7EB',
                color: '#ffffff',
              }}
            >
              {rank + 1}
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
              style={{ background: entry.color.hex }}
            >
              {entry.playerName.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 font-bold text-base text-gray-900 truncate">
              {entry.playerName}
            </span>
            <span className="font-black text-lg text-gray-900 tabular-nums">
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Awards */}
      {awards && awards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-black text-gray-500 text-sm uppercase tracking-widest">Special Awards</h3>
          {awards.map((award) => (
            <div
              key={award.type}
              className="rounded-2xl px-4 py-3 bg-white shadow-sm"
              style={{ border: '2px solid #FDE68A' }}
            >
              <p className="font-black text-gray-900 text-base">{award.title}</p>
              <p className="text-gray-600 font-bold text-sm mt-0.5">
                {award.winners.join(' + ')} — {award.stat}
              </p>
            </div>
          ))}
        </div>
      )}

      {onPlayAgain && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="w-full py-5 rounded-full font-black text-xl text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #F97316, #FF6B6B)',
            minHeight: 60,
            fontSize: 20,
          }}
        >
          Play Again
        </motion.button>
      )}
    </div>
  );
}
