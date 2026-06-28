'use client';

import type { TVState } from '@ksero-se/types';
import Leaderboard from '../tv/Leaderboard';
import { Y2K } from '../../lib/y2k';

/** No-TV scoreboard between turns — reuses the TV Leaderboard (portrait-friendly). */
export default function PhoneScoreboard({ state }: { state: TVState }) {
  const subtitle = state.isLastRound
    ? 'final question done!'
    : state.isRoundEnd
      ? 'round complete'
      : 'next question coming up…';

  return (
    <div className="flex-1 flex flex-col gap-4 px-1 py-3">
      <div className="text-center">
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark }}>scoreboard 🏆</div>
        <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#6B7280', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div className="flex justify-center">
        <Leaderboard scores={state.scores} players={state.players} highlight />
      </div>
    </div>
  );
}
