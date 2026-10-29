'use client';

import { useEffect, useRef, useState } from 'react';

const PHASE_LABEL: Record<string, string> = {
  LOBBY: 'Lobby',
  QUESTION_SUBMISSION: 'Writing questions',
  ANSWER_PHASE: 'Answering',
  GUESS_PHASE: 'Guessing',
  REVEAL_PHASE: 'Revealing answers',
  SCORE_PHASE: 'Scores',
  FINAL_AWARDS: 'Final awards',
  GAME_OVER: 'Game over',
  HOW_IT_WORKS: 'how kserose works',
  WRITE: 'write',
  ANSWER: 'answer',
  DOUBLE: 'final pass',
  FAKE: 'fake',
  VOTE: 'vote',
  REVEAL: 'reveal',
  SCOREBOARD: 'scores',
  CROWN: 'crown',
  AWARDS: 'awards',
};

/** Screen reader updates when the phase changes, and at a few timer marks. */
export default function PhaseAnnouncer({ phase, timerEnd }: { phase?: string | null; timerEnd?: number }) {
  const [message, setMessage] = useState('');
  const marks = useRef(new Set<number>());
  const lastPhase = useRef<string | null>(null);

  useEffect(() => {
    if (!phase || lastPhase.current === phase) return;
    lastPhase.current = phase;
    marks.current.clear();
    setMessage(PHASE_LABEL[phase] ?? 'Game update');
  }, [phase]);

  useEffect(() => {
    if (!phase || !timerEnd) return;
    const iv = setInterval(() => {
      const left = Math.ceil((timerEnd - Date.now()) / 1000);
      for (const mark of [30, 10, 5]) {
        if (left === mark && !marks.current.has(mark)) {
          marks.current.add(mark);
          const label = PHASE_LABEL[phase] ?? 'Timer';
          setMessage(`${label}. ${mark} seconds left`);
        }
      }
    }, 400);
    return () => clearInterval(iv);
  }, [phase, timerEnd]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
