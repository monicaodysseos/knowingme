'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import ParticleBurst from './ParticleBurst';
import { Y2K } from '../../lib/y2k';
import { useGameSounds } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
}

type RevealStage = 'guesses' | 'drumroll' | 'answer' | 'marking';

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

function Chunky({ children, size = 16, color = '#fff', shadow = Y2K.dark }: { children: React.ReactNode; size?: number; color?: string; shadow?: string }) {
  return (
    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: size, textTransform: 'uppercase' as const, color, textShadow: `2px 2px 0 ${shadow}`, WebkitTextStroke: `1px ${shadow}` }}>
      {children}
    </div>
  );
}

export default function TVRevealPhase({ state }: Props) {
  const { currentTurn } = state;
  const [stage, setStage] = useState<RevealStage>('guesses');
  const [visibleCount, setVisibleCount] = useState(0);
  const { playBlink, playDrumroll, playReveal } = useGameSounds();

  // Reset everything when the question changes
  useEffect(() => {
    setStage('guesses');
    setVisibleCount(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn?.questionText ?? '']);

  // Reveal guesses one by one, 800 ms apart, blink sound each time
  useEffect(() => {
    if (stage !== 'guesses') return;
    const total = currentTurn?.guessesRevealed.length ?? 0;
    if (visibleCount >= total) return;
    const t = setTimeout(() => {
      setVisibleCount((v) => v + 1);
      playBlink();
    }, visibleCount === 0 ? 500 : 800);
    return () => clearTimeout(t);
  }, [visibleCount, currentTurn?.guessesRevealed.length, stage, playBlink]);

  // Once all guesses are visible, wait 2 s then drumroll → answer
  useEffect(() => {
    if (stage !== 'guesses') return;
    const total = currentTurn?.guessesRevealed.length ?? 0;
    if (visibleCount < total || total === 0) return;

    const t1 = setTimeout(() => {
      setStage('drumroll');
      const stopDrum = playDrumroll(1800);
      const t2 = setTimeout(() => {
        stopDrum();
        setStage('answer');
        playReveal();
        const t3 = setTimeout(() => setStage('marking'), 2500);
        return () => clearTimeout(t3);
      }, 1800);
      return () => clearTimeout(t2);
    }, 2000);

    return () => clearTimeout(t1);
  }, [visibleCount, currentTurn?.guessesRevealed.length, stage, playDrumroll, playReveal]);

  if (!currentTurn) return null;

  const { subjectPlayer, questionText, questionIndex, totalForSubject, guessesRevealed, answer } = currentTurn;
  const visibleGuesses = guessesRevealed.slice(0, visibleCount);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-10 py-8 relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      {/* Subject header */}
      <div className="flex items-center gap-4">
        <Y2KAvatar avatar={subjectPlayer.avatar} size={52} />
        <div>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(24px, 3vw, 42px)', color: subjectPlayer.color.hex, WebkitTextStroke: `1.5px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, letterSpacing: '-0.5px', lineHeight: 1 }}>
            {subjectPlayer.name}&apos;s Round
          </div>
          {totalForSubject > 1 && (
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(11px, 1.1vw, 16px)', color: 'rgba(255,255,255,0.55)' }}>
              Question {questionIndex + 1} of {totalForSubject}
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <Sticker color="#fff" r={20} style={{ width: '100%', maxWidth: 'min(700px, 80vw)', padding: 'clamp(12px, 1.5vh, 22px) clamp(16px, 2vw, 32px)', textAlign: 'center' }}>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(18px, 2.2vw, 30px)', color: Y2K.dark, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {questionText}
        </p>
      </Sticker>

      {/* Guesses list — revealed one by one */}
      <div style={{ width: '100%', maxWidth: 'min(700px, 80vw)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Chunky size={12} color={Y2K.cyan} shadow={Y2K.dark}>what everyone guessed</Chunky>
        <AnimatePresence>
          {visibleGuesses.map((g) => (
            <motion.div
              key={g.id}
              initial={{ x: 60, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              style={{
                background: g.isCorrect === true ? '#fff' : 'rgba(255,255,255,0.6)',
                border: `2.5px solid ${g.isCorrect === true ? '#19B06B' : g.isCorrect === false ? '#FF1E8E' : Y2K.dark}`,
                borderRadius: 14,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: g.isCorrect === true ? '0 3px 0 #19B06B' : `0 3px 0 rgba(11,4,41,0.25)`,
                opacity: g.isCorrect === false ? 0.75 : 1,
              }}
            >
              <Y2KAvatar avatar={g.guesserAvatar} size={28} />
              <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 13, color: g.guesserColor.hex, minWidth: 60, WebkitTextStroke: `0.3px ${Y2K.dark}` }}>
                {g.guesserName}
              </span>
              <span style={{ flex: 1, fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: Y2K.dark, textAlign: 'right', textDecoration: g.isCorrect === false ? 'line-through' : 'none', textDecorationColor: 'rgba(11,4,41,0.4)' }}>
                &ldquo;{g.text}&rdquo;
              </span>
              {g.isCorrect === true && (
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: '#19B06B' }}>✔</span>
              )}
              {g.isCorrect === false && (
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: '#FF1E8E' }}>✘</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cinematic overlay */}
      <AnimatePresence>
        {stage === 'drumroll' && (
          <motion.div
            key="drumroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: 'rgba(11,4,41,0.92)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1, 1.06, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              className="text-center"
            >
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.3em', WebkitTextStroke: `1px ${Y2K.dark}` }}>
                {subjectPlayer.name} actually said…
              </div>
              <div className="flex gap-3 justify-center mt-5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.6, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: 16, height: 16, borderRadius: '50%', background: subjectPlayer.color.hex, border: `2px solid ${Y2K.dark}` }}
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
            className={stage === 'answer' ? 'absolute inset-0 z-30 flex items-center justify-center' : 'w-full'}
            style={stage === 'answer' ? { background: 'rgba(11,4,41,0.92)', backdropFilter: 'blur(4px)' } : { maxWidth: 'min(700px, 80vw)' }}
          >
            <div style={{ width: '100%', maxWidth: 'min(700px, 80vw)' }}>
              <div style={{
                background: subjectPlayer.color.hex,
                borderRadius: 'clamp(20px, 2.5vw, 36px)',
                border: 'none',
                boxShadow: `0 8px 0 rgba(11,4,41,0.5), 0 2px 24px rgba(11,4,41,0.3)`,
                padding: 'clamp(20px, 3vh, 40px) clamp(24px, 3vw, 48px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '36px 36px 50% 50%', pointerEvents: 'none' }} />
                {stage === 'answer' && <ParticleBurst trigger />}
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(12px, 1.3vw, 18px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 'clamp(8px, 1vh, 16px)' }}>
                  {subjectPlayer.name} actually said…
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(36px, 5vw, 72px)', color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1.05 }}>
                  &ldquo;{answer}&rdquo;
                </div>
                {stage === 'marking' && (
                  <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(11px, 1.1vw, 16px)', color: 'rgba(255,255,255,0.8)', marginTop: 'clamp(8px, 1vh, 16px)' }}>
                    {subjectPlayer.name} is marking the answers on their phone…
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
