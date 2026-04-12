'use client';

import { motion } from 'framer-motion';
import type { ScoreEntry, AwardResult } from '@ksero-se/types';

interface Props {
  scores: ScoreEntry[];
  awards?: AwardResult[];
  onPlayAgain?: () => void;
  playerId?: string;
}

export default function PhoneResults({ scores, awards, onPlayAgain, playerId }: Props) {
  const myScore = scores.find((s) => s.playerId === playerId);
  const myRank = scores.findIndex((s) => s.playerId === playerId) + 1;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="font-black text-3xl">Game Over!</h2>
        {myScore && (
          <p className="text-gray-400 font-bold text-lg mt-1">
            You finished{' '}
            <span style={{ color: myScore.color.hex }}>
              #{myRank}
            </span>{' '}
            with{' '}
            <span className="text-white font-black">{myScore.score.toLocaleString()} pts</span>
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
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: entry.playerId === playerId ? `${entry.color.hex}22` : '#13132a',
              border: `1px solid ${entry.playerId === playerId ? entry.color.hex + '66' : '#1e1e3a'}`,
            }}
          >
            <span
              className="font-black text-xl w-7 text-center"
              style={{
                color: rank === 0 ? '#F59E0B' : rank === 1 ? '#9CA3AF' : rank === 2 ? '#CD7F32' : '#4B5563',
              }}
            >
              {rank + 1}
            </span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base"
              style={{ background: entry.color.hex }}
            >
              {entry.playerName.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 font-bold text-base truncate" style={{ color: entry.color.hex }}>
              {entry.playerName}
            </span>
            <span className="font-black text-lg text-white tabular-nums">
              {entry.score.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Awards */}
      {awards && awards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-gray-400 text-base">Special Awards</h3>
          {awards.map((award) => (
            <div
              key={award.type}
              className="rounded-2xl px-4 py-3"
              style={{ background: '#13132a', border: '1px solid #1e1e3a' }}
            >
              <p className="font-black text-base">
                {award.emoji} {award.title}
              </p>
              <p className="text-white font-bold text-sm mt-0.5">
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
          className="w-full py-5 rounded-2xl font-black text-xl text-white"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #0DD3C5)',
            minHeight: 56,
          }}
        >
          🔄 Play Again
        </motion.button>
      )}
    </div>
  );
}
