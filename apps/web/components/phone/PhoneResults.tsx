'use client';

import { motion } from 'framer-motion';
import type { ScoreEntry, AwardResult } from '@ksero-se/types';

interface Props {
  scores: ScoreEntry[];
  awards?: AwardResult[];
  onPlayAgain?: () => void;
  playerId?: string;
}

const RANK_ICONS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
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
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="font-bold text-white" style={{ fontSize: 30 }}>Game Over!</h2>
        {myScore && (
          <p className="text-white/80 font-semibold text-lg mt-1">
            You finished{' '}
            <span className="text-white font-bold">#{myRank}</span>
            {' '}with{' '}
            <span className="text-yellow-200 font-bold">{myScore.score.toLocaleString()} pts</span>
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
              borderLeft: `5px solid ${entry.color.hex}`,
              boxShadow: entry.playerId === playerId ? '0 4px 12px #F9731633' : undefined,
              border: entry.playerId === playerId
                ? `2px solid #F97316`
                : `2px solid ${entry.color.hex}33`,
            }}
          >
            <span
              className="font-bold text-xl w-8 text-center"
              style={{ color: RANK_COLORS[rank] ?? '#9ca3af' }}
            >
              {RANK_ICONS[rank] ?? `${rank + 1}`}
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0"
              style={{ background: entry.color.hex }}
            >
              {entry.playerName.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 font-bold text-base text-gray-900 truncate">
              {entry.playerName}
            </span>
            <span className="font-bold text-lg text-gray-900 tabular-nums">
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Awards */}
      {awards && awards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-gray-500 text-base">Special Awards</h3>
          {awards.map((award) => (
            <div
              key={award.type}
              className="rounded-2xl px-4 py-3 bg-white shadow-sm border border-orange-100"
            >
              <p className="font-bold text-gray-900 text-base">
                {award.emoji} {award.title}
              </p>
              <p className="text-gray-600 font-semibold text-sm mt-0.5">
                {award.winners.join(', ')} — {award.stat}
              </p>
            </div>
          ))}
        </div>
      )}

      {onPlayAgain && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="w-full py-5 rounded-2xl font-bold text-xl text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #F97316, #FF6B6B)',
            minHeight: 60,
            fontSize: 20,
          }}
        >
          🔄 Play Again
        </motion.button>
      )}
    </div>
  );
}
