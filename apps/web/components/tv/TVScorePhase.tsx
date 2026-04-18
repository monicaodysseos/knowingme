'use client';

import { motion } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Leaderboard from './Leaderboard';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
}

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

function ChromeTitle({ text, size = 56, tilt = -2 }: { text: string; size?: number; tilt?: number }) {
  return (
    <div style={{
      fontFamily: Y2K.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: '-1.5px',
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

export default function TVScorePhase({ state }: Props) {
  const { scores, currentTurn, isRoundEnd, isLastRound } = state;

  if (isLastRound) {
    return <div className="min-h-screen" style={{ background: Y2K.dark }} />;
  }

  const correctCount = currentTurn?.guessesRevealed.filter((g) => g.isCorrect).length ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-12"
      style={{ background: Y2K.dark }}
    >
      {/* Turn summary */}
      {currentTurn && (
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Sticker color="#fff" r={18} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Y2KAvatar avatar={currentTurn.subjectPlayer.avatar} size={40} />
            <div>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: currentTurn.subjectPlayer.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
                {currentTurn.subjectPlayer.name}&apos;s turn — done!
              </div>
              <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>
                {correctCount} correct guess{correctCount !== 1 ? 'es' : ''} this round
              </div>
            </div>
          </Sticker>
        </motion.div>
      )}

      {/* Leaderboard at round end */}
      {isRoundEnd && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-5 w-full"
        >
          <ChromeTitle text="leaderboard ✦" size={52} tilt={-1.5} />
          <Leaderboard scores={scores} highlight />
        </motion.div>
      )}

      {!isRoundEnd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)' }}
        >
          next question coming up…
        </motion.div>
      )}
    </div>
  );
}
