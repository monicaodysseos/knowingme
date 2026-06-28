'use client';

import type { TVState } from '@ksero-se/types';
import Leaderboard from './Leaderboard';
import ContinueBar from './ContinueBar';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
  onContinue?: () => void;
}

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none', zIndex: 0 }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

// Running scoreboard between rounds — reveals last place first, building up to
// the leader, then holds (host can advance with the continue bar).
export default function TVScorePhase({ state, onContinue }: Props) {
  const { scores, players, currentTurn, isLastRound } = state;
  const justFinished = currentTurn?.subjectPlayer;
  const justEntry = justFinished ? scores.find((s) => s.playerId === justFinished.id) : null;
  const delta = justEntry?.delta ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{ background: Y2K.bg, fontFamily: Y2K.body, padding: '5vh 6vw 13vh' }}
    >
      <Sparkle size={30} color={Y2K.cyan} x={40} y={50} rotate={12} />

      <div style={{
        fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(34px, 4.6vw, 68px)',
        color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.hotPink}`,
        letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: '0.6vh',
      }}>
        scoreboard
      </div>

      <div style={{ height: '3vh', display: 'flex', alignItems: 'center', marginBottom: '1.5vh' }}>
        {justFinished && delta > 0 && (
          <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 'clamp(15px, 1.7vw, 24px)', color: justFinished.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
            {justFinished.name} +{delta} this round ✦
          </span>
        )}
      </div>

      <Leaderboard scores={scores} players={players} highlight revealFromBottom />

      <div style={{ position: 'absolute', bottom: '4vh', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
        <ContinueBar timerEnd={state.timerEnd} onContinue={onContinue} label={isLastRound ? 'see the winner ▶' : 'next question ▶'} />
      </div>
    </div>
  );
}
