'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';
import ParticleBurst from './ParticleBurst';

interface Props {
  state: TVState;
}

type RevealStage = 'guesses' | 'drumroll' | 'answer' | 'marking';

export default function TVRevealPhase({ state }: Props) {
  const { currentTurn } = state;
  const [stage, setStage] = useState<RevealStage>('guesses');
  const answerRef = useRef<string | undefined>(undefined);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the answer arrives for the first time, trigger the cinematic sequence
  useEffect(() => {
    const newAnswer = currentTurn?.answer;
    if (newAnswer && !answerRef.current) {
      answerRef.current = newAnswer;
      setStage('drumroll');
      stageTimerRef.current = setTimeout(() => {
        setStage('answer');
        stageTimerRef.current = setTimeout(() => {
          setStage('marking');
        }, 2500);
      }, 1800);
    }
    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, [currentTurn?.answer]);

  // Reset when turn changes (key off questionText which is unique per turn)
  useEffect(() => {
    answerRef.current = undefined;
    setStage('guesses');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn?.questionText ?? '']);

  if (!currentTurn) return null;

  const { subjectPlayer, questionText, questionIndex, totalForSubject, guessesRevealed, answer } = currentTurn;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-10 py-8 relative overflow-hidden"
      style={{ background: '#0d0818' }}
    >
      {/* Subject header */}
      <div className="flex items-center gap-4">
        <PlayerAvatar name={subjectPlayer.name} color={subjectPlayer.color} avatar={subjectPlayer.avatar} size="md" />
        <div>
          <h2 className="font-black" style={{ fontSize: 38, color: subjectPlayer.color.hex, letterSpacing: '-1px' }}>
            {subjectPlayer.name}&apos;s Round
          </h2>
          {totalForSubject > 1 && (
            <p className="font-bold text-gray-400 text-base">
              Question {questionIndex + 1} of {totalForSubject}
            </p>
          )}
        </div>
      </div>

      {/* Question */}
      <div
        className="w-full max-w-2xl rounded-2xl px-8 py-5 text-center"
        style={{
          background: '#ffffff10',
          border: `3px solid ${subjectPlayer.color.hex}55`,
        }}
      >
        <p className="font-black text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          {questionText}
        </p>
      </div>

      {/* Guesses list */}
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        <p className="font-bold text-sm uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
          What everyone guessed
        </p>
        <AnimatePresence>
          {guessesRevealed.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{
                background:
                  g.isCorrect === true ? '#052e1688'
                  : g.isCorrect === false ? '#2a040488'
                  : '#ffffff12',
                border: `2px solid ${
                  g.isCorrect === true ? '#16a34a'
                  : g.isCorrect === false ? '#dc2626'
                  : '#ffffff18'
                }`,
              }}
            >
              <PlayerAvatar name={g.guesserName} color={g.guesserColor} avatar={g.guesserAvatar} size="sm" />
              <span className="font-bold text-base" style={{ color: g.guesserColor.hex }}>
                {g.guesserName}
              </span>
              <span className="flex-1 font-bold text-lg text-white text-right">
                &ldquo;{g.text}&rdquo;
              </span>
              {g.isCorrect === true && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: '#16a34a' }}>
                  ✓
                </div>
              )}
              {g.isCorrect === false && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: '#dc2626' }}>
                  ✕
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Cinematic overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'drumroll' && (
          <motion.div
            key="drumroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: '#0d0818ee', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1, 1.06, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="text-center"
            >
              <p className="font-black text-white uppercase tracking-[0.3em]" style={{ fontSize: 22 }}>
                {subjectPlayer.name} actually said…
              </p>
              <div className="flex gap-3 justify-center mt-5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.6, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    className="w-4 h-4 rounded-full"
                    style={{ background: subjectPlayer.color.hex }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(stage === 'answer' || stage === 'marking') && answer && (
          <motion.div
            key="answer-reveal"
            initial={stage === 'answer' ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={stage === 'answer' ? { scale: 0.9, opacity: 0 } : undefined}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className={`${stage === 'answer' ? 'absolute inset-0 z-30 flex items-center justify-center' : 'w-full max-w-2xl'}`}
            style={stage === 'answer' ? { background: '#0d0818ee', backdropFilter: 'blur(4px)' } : undefined}
          >
            <div
              className="relative rounded-[2rem] px-10 py-8 text-center w-full max-w-2xl"
              style={{
                background: '#ffffff',
                border: `5px solid ${subjectPlayer.color.hex}`,
                boxShadow: `0 20px 60px ${subjectPlayer.color.hex}44`,
              }}
            >
              {stage === 'answer' && <ParticleBurst trigger />}
              <p className="font-bold text-gray-500 text-xl mb-2">
                {subjectPlayer.name} actually said…
              </p>
              <p
                className="font-black"
                style={{ fontSize: 52, color: subjectPlayer.color.hex, letterSpacing: '-1px', lineHeight: 1.1 }}
              >
                &ldquo;{answer}&rdquo;
              </p>
              {stage === 'marking' && (
                <p className="text-gray-400 mt-4 font-bold text-base">
                  {subjectPlayer.name} is marking guesses on their phone
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
