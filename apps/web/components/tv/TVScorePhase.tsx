'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Leaderboard from './Leaderboard';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  state: TVState;
}

export default function TVScorePhase({ state }: Props) {
  const { scores, currentTurn } = state;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-bg px-12">

      {/* Round summary */}
      {currentTurn && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl px-8 py-4 flex flex-col items-center gap-2"
          style={{ borderBottom: `4px solid ${currentTurn.subjectPlayer.color.hex}` }}
        >
          <div className="flex items-center gap-3">
            <PlayerAvatar
              name={currentTurn.subjectPlayer.name}
              color={currentTurn.subjectPlayer.color}
              size="sm"
            />
            <span className="font-bold text-gray-900 text-2xl">
              {currentTurn.subjectPlayer.name}&apos;s turn — done!
            </span>
          </div>
          <p className="font-semibold text-gray-500 text-lg">
            {currentTurn.guessesRevealed.filter((g) => g.isCorrect).length} correct guess
            {currentTurn.guessesRevealed.filter((g) => g.isCorrect).length !== 1 ? 'es' : ''} this round
          </p>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center gap-4 w-full"
      >
        <h2 className="font-bold text-white" style={{ fontSize: 42 }}>🏆 Leaderboard</h2>
        <Leaderboard scores={scores} highlight />
      </motion.div>
    </div>
  );
}
