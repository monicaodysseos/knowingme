'use client';

import { useState } from 'react';
import type { PlayerColor, PlayerCharacter } from '@ksero-se/types';
import Y2KAvatar from '../tv/Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Guess {
  id: string;
  guesserName: string;
  guesserColor: PlayerColor;
  guesserAvatar: PlayerCharacter;
  text: string;
}

interface Props {
  questionText: string;
  subjectName: string;
  subjectColor: PlayerColor;
  answer: string;
  guesses: Guess[];
  onVote: (votes: Array<{ guessId: string; isCorrect: boolean }>) => void;
}

function Sticker({ color, r = 14, rotate = 0, style = {}, children }: { color: string; r?: number; rotate?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `0 4px 0 rgba(11,4,41,0.45)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,255,255,0.15)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

export default function PhoneVoteGuesses({
  questionText,
  subjectName,
  subjectColor,
  answer,
  guesses,
  onVote,
}: Props) {
  const [decisions, setDecisions] = useState<Record<string, boolean | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const decide = (guessId: string, isCorrect: boolean) => {
    if (submitted) return;
    setDecisions((prev) => ({
      ...prev,
      [guessId]: prev[guessId] === isCorrect ? undefined : isCorrect,
    }));
  };

  const allDecided = guesses.every((g) => decisions[g.id] !== undefined);

  const handleSubmit = () => {
    if (!allDecided || submitted) return;
    setSubmitted(true);
    const votes = guesses.map((g) => ({ guessId: g.id, isCorrect: decisions[g.id]! }));
    onVote(votes);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: Y2K.hotPink,
          border: `3px solid ${Y2K.dark}`,
          boxShadow: `0 4px 0 ${Y2K.dark}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 24,
          color: '#fff',
          WebkitTextStroke: `1px ${Y2K.dark}`,
        }}>
          ✓
        </div>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark }}>votes submitted!</p>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555' }}>watch the tv for the results…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Answer reveal sticker */}
      <Sticker color={subjectColor.hex} r={16} style={{ padding: '14px 16px', textAlign: 'center' }}>
        <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {subjectName} actually said…
        </p>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: '#fff', WebkitTextStroke: `0.5px ${Y2K.dark}`, textShadow: `1px 1px 0 ${Y2K.dark}`, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          &ldquo;{answer}&rdquo;
        </p>
      </Sticker>

      {/* Question context */}
      <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#3a1555', textAlign: 'center' }}>{questionText}</p>

      {/* Instructions */}
      <p style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 14, color: Y2K.dark, textAlign: 'center', letterSpacing: '-0.2px' }}>
        did each person guess correctly?
      </p>

      {/* Guess cards */}
      <div className="flex flex-col gap-3">
        {guesses.map((g) => {
          const decision = decisions[g.id];
          return (
            <div
              key={g.id}
              style={{
                borderRadius: 16,
                padding: '12px 14px',
                background: '#fff',
                border: `2.5px solid ${
                  decision === true ? '#19B06B'
                  : decision === false ? Y2K.hotPink
                  : Y2K.dark
                }`,
                boxShadow: `0 3px 0 ${
                  decision === true ? '#19B06B'
                  : decision === false ? Y2K.hotPink
                  : 'rgba(11,4,41,0.2)'
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Y2KAvatar avatar={g.guesserAvatar} size={28} />
                <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 14, color: g.guesserColor.hex, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>
                  {g.guesserName}
                </span>
              </div>
              <p style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 15, color: Y2K.dark, marginBottom: 10, lineHeight: 1.3 }}>
                &ldquo;{g.text}&rdquo;
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(g.id, true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 99,
                    fontFamily: Y2K.display,
                    fontWeight: 900,
                    fontSize: 13,
                    color: decision === true ? '#fff' : '#19B06B',
                    background: decision === true ? '#19B06B' : '#f0fdf4',
                    border: `2px solid ${decision === true ? '#19B06B' : '#bbf7d0'}`,
                    boxShadow: decision === true ? `0 3px 0 ${Y2K.dark}` : 'none',
                    cursor: 'pointer',
                    WebkitTextStroke: decision === true ? `0.5px ${Y2K.dark}` : 'none',
                    letterSpacing: '0.05em',
                  }}
                >
                  correct ✔
                </button>
                <button
                  type="button"
                  onClick={() => decide(g.id, false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 99,
                    fontFamily: Y2K.display,
                    fontWeight: 900,
                    fontSize: 13,
                    color: decision === false ? '#fff' : Y2K.hotPink,
                    background: decision === false ? Y2K.hotPink : '#fff0f6',
                    border: `2px solid ${decision === false ? Y2K.hotPink : '#fecdd3'}`,
                    boxShadow: decision === false ? `0 3px 0 ${Y2K.dark}` : 'none',
                    cursor: 'pointer',
                    WebkitTextStroke: decision === false ? `0.5px ${Y2K.dark}` : 'none',
                    letterSpacing: '0.05em',
                  }}
                >
                  wrong ✘
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <button
        type="button"
        disabled={!allDecided}
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: 99,
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 20,
          color: '#fff',
          background: allDecided ? Y2K.hotPink : '#d1d5db',
          border: `3px solid ${Y2K.dark}`,
          boxShadow: allDecided ? `0 5px 0 ${Y2K.dark}` : 'none',
          cursor: allDecided ? 'pointer' : 'not-allowed',
          opacity: allDecided ? 1 : 0.4,
          WebkitTextStroke: allDecided ? `1px ${Y2K.dark}` : 'none',
          textShadow: allDecided ? `2px 2px 0 ${Y2K.dark}` : 'none',
          letterSpacing: '0.05em',
        }}
      >
        submit votes ✦
      </button>
    </div>
  );
}
