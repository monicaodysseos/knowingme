'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from '../tv/Y2KAvatar';
import ParticleBurst from '../tv/ParticleBurst';
import { Y2K } from '../../lib/y2k';

/**
 * No-TV reveal: the dramatic answer reveal + guess list, on every phone.
 * Drives a short local stage timer for the drumroll/answer moment, then shows
 * the guesses. Guesser identity + correct/✘ appear once the subject has voted
 * (broadcast sets `isCorrect`), mirroring the TV reveal.
 */
export default function PhoneReveal({ state }: { state: TVState }) {
  const turn = state.currentTurn;
  const [stage, setStage] = useState<'drumroll' | 'answer' | 'list'>('drumroll');

  useEffect(() => {
    setStage('drumroll');
    const t1 = setTimeout(() => setStage('answer'), 1800);
    const t2 = setTimeout(() => setStage('list'), 1800 + 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [turn?.questionText ?? '']);

  if (!turn) return null;
  const subject = turn.subjectPlayer;
  const guesses = turn.guessesRevealed ?? [];

  return (
    <div className="flex-1 flex flex-col gap-4 px-1 py-2">
      {/* Subject + question */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: `3px solid ${Y2K.dark}`, display: 'grid', placeItems: 'center', boxShadow: `0 4px 0 ${Y2K.dark}` }}>
          <Y2KAvatar avatar={subject.avatar} size={44} />
        </div>
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: subject.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
          what did {subject.name} say?
        </div>
        <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: Y2K.dark }}>{turn.questionText}</div>
      </div>

      {/* Drumroll → answer */}
      <AnimatePresence mode="wait">
        {stage === 'drumroll' && (
          <motion.div key="dr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-5">
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 16, color: Y2K.dark }}>{subject.name} actually said…</div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} style={{ width: 12, height: 12, borderRadius: '50%', background: Y2K.hotPink, border: `2px solid ${Y2K.dark}`, display: 'block' }} />
              ))}
            </div>
          </motion.div>
        )}
        {stage !== 'drumroll' && turn.answer && (
          <motion.div key="ans" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{ position: 'relative', background: subject.color.hex, border: `3px solid ${Y2K.dark}`, borderRadius: 20, padding: 16, textAlign: 'center', boxShadow: `0 6px 0 ${Y2K.dark}`, overflow: 'visible' }}>
            <ParticleBurst trigger={stage === 'answer'} />
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>the answer</div>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: '#fff', WebkitTextStroke: `0.5px ${Y2K.dark}`, textShadow: `1px 1px 0 ${Y2K.dark}`, lineHeight: 1.2 }}>
              &ldquo;{turn.answer}&rdquo;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guesses */}
      {stage === 'list' && (
        <div className="flex flex-col gap-2">
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 12, color: Y2K.deepPink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>the guesses</div>
          {guesses.length === 0 && (
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>nobody guessed this one 😬</div>
          )}
          {guesses.map((g, i) => {
            const marked = g.isCorrect !== undefined;
            return (
              <motion.div key={g.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#fff', borderRadius: 14,
                  border: `2.5px solid ${g.isCorrect === true ? '#19B06B' : g.isCorrect === false ? Y2K.hotPink : Y2K.dark}`,
                  boxShadow: `0 3px 0 ${g.isCorrect === true ? '#19B06B' : 'rgba(11,4,41,0.2)'}`,
                  padding: '10px 12px', opacity: g.isCorrect === false ? 0.8 : 1,
                }}>
                {marked ? (
                  <>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', border: `2px solid ${Y2K.dark}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Y2KAvatar avatar={g.guesserAvatar} size={24} />
                    </div>
                    <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: g.guesserColor.hex, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>{g.guesserName}</span>
                  </>
                ) : (
                  <span style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>guess #{i + 1}</span>
                )}
                <span style={{ flex: 1, textAlign: 'right', fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: Y2K.dark, textDecoration: g.isCorrect === false ? 'line-through' : 'none' }}>
                  &ldquo;{g.text}&rdquo;
                </span>
                {g.isCorrect === true && <span style={{ color: '#19B06B', fontWeight: 900, fontSize: 18 }}>✔</span>}
                {g.isCorrect === false && <span style={{ color: Y2K.hotPink, fontWeight: 900, fontSize: 18 }}>✘</span>}
              </motion.div>
            );
          })}
          {guesses.length > 0 && guesses.every((g) => g.isCorrect === undefined) && (
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
              {subject.name} is marking the guesses…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
