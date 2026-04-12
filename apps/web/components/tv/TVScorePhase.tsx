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
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-bg px-12">
      {/* Round summary */}
      {currentTurn && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <PlayerAvatar
              name={currentTurn.subjectPlayer.name}
              color={currentTurn.subjectPlayer.color}
              size="md"
            />
            <span
              className="font-black text-4xl"
              style={{ color: currentTurn.subjectPlayer.color.hex }}
            >
              {currentTurn.subjectPlayer.name}&apos;s turn — done!
            </span>
          </div>
          <p className="text-gray-400 text-xl">
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
        <h2 className="font-black text-4xl text-white">🏆 Leaderboard</h2>
        <Leaderboard scores={scores} highlight />
      </motion.div>
    </div>
  );
}
