'use client';

import type { TVState } from '@ksero-se/types';
import Y2KAvatar from '../tv/Y2KAvatar';
import CountdownRing from '../tv/CountdownRing';
import { Y2K } from '../../lib/y2k';

const TOTAL_SECONDS: Record<string, number> = {
  QUESTION_SUBMISSION: 180,
  ANSWER_PHASE: 300,
  GUESS_PHASE: 60,
};

/**
 * No-TV "watch" view for the phases where this player isn't actively inputting:
 * shows the shared status (progress / the question + live guess count) + timer.
 */
export default function PhoneBroadcastStatus({ state }: { state: TVState }) {
  const phase = state.phase;
  const turn = state.currentTurn;

  let title = 'stand by…';
  let sub = '';
  let titleColor: string = Y2K.dark;
  if (phase === 'QUESTION_SUBMISSION') {
    title = 'writing questions ✍️';
    const sp = state.submissionProgress;
    sub = sp ? `${sp.submitted}/${sp.total} done` : 'everyone is writing on their phones';
  } else if (phase === 'ANSWER_PHASE') {
    title = 'answer time ✿';
    sub = 'everyone is answering their secret questions';
  } else if (phase === 'GUESS_PHASE' && turn) {
    title = `what did ${turn.subjectPlayer.name} say?`;
    titleColor = turn.subjectPlayer.color.hex;
    sub = `${turn.guessCount} guess${turn.guessCount === 1 ? '' : 'es'} in so far`;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: titleColor, WebkitTextStroke: titleColor === Y2K.dark ? '0' : `0.5px ${Y2K.dark}`, lineHeight: 1.15 }}>
        {title}
      </div>

      {phase === 'GUESS_PHASE' && turn && (
        <div style={{ background: Y2K.dark, color: '#fff', borderRadius: 16, padding: '14px 16px', fontFamily: Y2K.display, fontWeight: 800, fontSize: 16, lineHeight: 1.3, maxWidth: 340 }}>
          {turn.questionText}
        </div>
      )}

      <CountdownRing timerEnd={state.timerEnd} totalSeconds={Math.max(1, Math.round(state.timerTotalMs / 1000)) || (TOTAL_SECONDS[phase] ?? 60)} size={96} />

      {sub && <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#6B7280' }}>{sub}</div>}

      <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 340 }}>
        {state.players.map((p) => {
          const done = phase === 'QUESTION_SUBMISSION' ? !!p.hasSubmittedQuestions : false;
          return (
            <div key={p.id} style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2.5px solid ${Y2K.dark}`, display: 'grid', placeItems: 'center', opacity: p.isConnected ? 1 : 0.35, position: 'relative' }}>
              <Y2KAvatar avatar={p.avatar} size={30} />
              {done && (
                <span style={{ position: 'absolute', bottom: -4, right: -4, background: '#19B06B', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'grid', placeItems: 'center', border: `1.5px solid ${Y2K.dark}` }}>✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
