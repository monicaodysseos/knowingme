'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Leaderboard from './Leaderboard';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  state: TVState;
}

export default function TVScorePhase({ state }: Props) {
  const { scores, currentTurn, isRoundEnd, isLastRound } = state;

  // isLastRound: blank flash — about to go to FINAL_AWARDS
  if (isLastRound) {
    return <div className="min-h-screen" style={{ background: '#0d0818' }} />;
  }

  const correctCount = currentTurn?.guessesRevealed.filter((g) => g.isCorrect).length ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-12"
      style={{ background: '#0d0818' }}
    >
      {/* Turn summary */}
      {currentTurn && (
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl px-8 py-5 flex flex-col items-center gap-2 text-center"
          style={{
            background: '#ffffff0f',
            border: `3px solid ${currentTurn.subjectPlayer.color.hex}55`,
          }}
        >
          <div className="flex items-center gap-3">
            <PlayerAvatar
              name={currentTurn.subjectPlayer.name}
              color={currentTurn.subjectPlayer.color}
              avatar={currentTurn.subjectPlayer.avatar}
              size="sm"
            />
            <span className="font-black text-white text-2xl" style={{ letterSpacing: '-0.5px' }}>
              {currentTurn.subjectPlayer.name}&apos;s turn — done!
            </span>
          </div>
          <p className="font-bold text-gray-400 text-lg">
            {correctCount} correct guess{correctCount !== 1 ? 'es' : ''} this round
          </p>
        </motion.div>
      )}

      {/* Leaderboard — only shown at round end (last question for this subject) */}
      {isRoundEnd && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <h2
            className="font-black text-white uppercase tracking-widest"
            style={{ fontSize: 36, letterSpacing: '0.15em' }}
          >
            Leaderboard
          </h2>
          <Leaderboard scores={scores} highlight />
        </motion.div>
      )}

      {/* Mid-round: just a brief "next question" indicator */}
      {!isRoundEnd && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-bold text-gray-500 text-lg"
        >
          Next question coming up…
        </motion.p>
      )}
    </div>
  );
}
