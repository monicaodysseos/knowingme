'use client';

import { useState } from 'react';
import type { PlayerColor, PlayerCharacter } from '@ksero-se/types';

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
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-xl"
          style={{ background: '#8B5CF6' }}
        >
          ✓
        </div>
        <p className="font-black text-gray-800 text-xl">Votes submitted!</p>
        <p className="text-gray-500 font-bold">Watch the TV for the results…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Answer reveal banner */}
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{
          background: subjectColor.hex + '18',
          border: `3px solid ${subjectColor.hex}`,
        }}
      >
        <p className="font-bold text-gray-500 text-sm uppercase tracking-widest mb-1">
          {subjectName} actually said…
        </p>
        <p
          className="font-black"
          style={{ fontSize: 22, color: subjectColor.hex, letterSpacing: '-0.5px', lineHeight: 1.2 }}
        >
          &ldquo;{answer}&rdquo;
        </p>
      </div>

      {/* Question context */}
      <p className="text-gray-500 font-semibold text-sm text-center px-2">{questionText}</p>

      {/* Instructions */}
      <p className="font-bold text-gray-700 text-sm text-center">
        Did each person guess correctly?
      </p>

      {/* Guess cards */}
      <div className="flex flex-col gap-3">
        {guesses.map((g) => {
          const decision = decisions[g.id];
          return (
            <div
              key={g.id}
              className="rounded-2xl px-4 py-3 bg-white shadow-sm"
              style={{
                border: `2px solid ${
                  decision === true ? '#16a34a'
                  : decision === false ? '#dc2626'
                  : g.guesserColor.hex + '44'
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                  style={{ background: g.guesserColor.hex }}
                >
                  {g.guesserName.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-sm" style={{ color: g.guesserColor.hex }}>
                  {g.guesserName}
                </span>
              </div>
              <p className="font-bold text-gray-900 text-base mb-3">&ldquo;{g.text}&rdquo;</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(g.id, true)}
                  className="flex-1 py-2 rounded-xl font-black text-sm transition-all"
                  style={{
                    background: decision === true ? '#16a34a' : '#f0fdf4',
                    color: decision === true ? '#ffffff' : '#16a34a',
                    border: `2px solid ${decision === true ? '#16a34a' : '#bbf7d0'}`,
                  }}
                >
                  Correct
                </button>
                <button
                  type="button"
                  onClick={() => decide(g.id, false)}
                  className="flex-1 py-2 rounded-xl font-black text-sm transition-all"
                  style={{
                    background: decision === false ? '#dc2626' : '#fef2f2',
                    color: decision === false ? '#ffffff' : '#dc2626',
                    border: `2px solid ${decision === false ? '#dc2626' : '#fecaca'}`,
                  }}
                >
                  Wrong
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
        className="w-full py-5 rounded-full font-black text-xl text-white shadow-lg disabled:opacity-30"
        style={{
          background: allDecided
            ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
            : '#d1d5db',
          fontSize: 20,
        }}
      >
        Submit Votes
      </button>
    </div>
  );
}
