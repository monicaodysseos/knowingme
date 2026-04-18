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

export default function TVRevealPhase({ state }: Props) {
  const { currentTurn } = state;
  const [stage, setStage] = useState<RevealStage>('guesses');
  const [visibleCount, setVisibleCount] = useState(0);
  const { playBlink, playDrumroll, playReveal } = useGameSounds();

  useEffect(() => {
    setStage('guesses');
    setVisibleCount(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn?.questionText ?? '']);

  // Reveal guesses one by one, 800ms apart
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

  // 2s after last guess → drumroll → answer
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
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: Y2K.dark, padding: '4vh 6vw' }}
    >
      {/* Subject header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2vw', marginBottom: '3vh', width: '100%', maxWidth: '88vw' }}>
        <Y2KAvatar avatar={subjectPlayer.avatar} size={64} />
        <div>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(28px, 3.2vw, 52px)', color: subjectPlayer.color.hex, WebkitTextStroke: `1.5px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, letterSpacing: '-0.5px', lineHeight: 1 }}>
            {subjectPlayer.name}&apos;s Round
          </div>
          {totalForSubject > 1 && (
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(13px, 1.3vw, 20px)', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              Question {questionIndex + 1} of {totalForSubject}
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <Sticker color="#fff" r={20} style={{ width: '100%', maxWidth: '88vw', padding: 'clamp(14px, 2vh, 28px) clamp(20px, 2.5vw, 40px)', textAlign: 'center', marginBottom: '3vh' }}>
        <p style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(20px, 2.4vw, 36px)', color: Y2K.dark, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {questionText}
        </p>
      </Sticker>

      {/* Guesses list */}
      <div style={{ width: '100%', maxWidth: '88vw', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 0.8vh, 12px)' }}>
        <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(11px, 1.1vw, 16px)', textTransform: 'uppercase' as const, color: Y2K.cyan, textShadow: `1px 1px 0 ${Y2K.dark}`, WebkitTextStroke: `0.5px ${Y2K.dark}`, marginBottom: 4 }}>
          what everyone guessed
        </div>
        <AnimatePresence>
          {visibleGuesses.map((g) => (
            <motion.div
              key={g.id}
              initial={{ x: 60, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              style={{
                background: g.isCorrect === true ? '#fff' : 'rgba(255,255,255,0.65)',
                border: `2.5px solid ${g.isCorrect === true ? '#19B06B' : g.isCorrect === false ? '#FF1E8E' : Y2K.dark}`,
                borderRadius: 'clamp(10px, 1.2vw, 18px)',
                padding: 'clamp(8px, 1vh, 14px) clamp(12px, 1.3vw, 20px)',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 1.2vw, 18px)',
                boxShadow: g.isCorrect === true ? '0 3px 0 #19B06B' : `0 3px 0 rgba(11,4,41,0.25)`,
                opacity: g.isCorrect === false ? 0.75 : 1,
              }}
            >
              <Y2KAvatar avatar={g.guesserAvatar} size={36} />
              <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 'clamp(14px, 1.5vw, 22px)', color: g.guesserColor.hex, minWidth: '8vw', WebkitTextStroke: `0.3px ${Y2K.dark}` }}>
                {g.guesserName}
              </span>
              <span style={{ flex: 1, fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(14px, 1.5vw, 22px)', color: Y2K.dark, textAlign: 'right', textDecoration: g.isCorrect === false ? 'line-through' : 'none', textDecorationColor: 'rgba(11,4,41,0.4)' }}>
                &ldquo;{g.text}&rdquo;
              </span>
              {g.isCorrect === true && (
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(18px, 2vw, 28px)', color: '#19B06B' }}>✔</span>
              )}
              {g.isCorrect === false && (
                <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(18px, 2vw, 28px)', color: '#FF1E8E' }}>✘</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {stage === 'drumroll' && (
          <motion.div
            key="drumroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(11,4,41,0.92)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1, 1.06, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(32px, 3.8vw, 64px)', color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.15em', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}` }}>
                {subjectPlayer.name} actually said…
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', justifyContent: 'center', marginTop: '3vh' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.6, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: 'clamp(14px, 1.5vw, 24px)', height: 'clamp(14px, 1.5vw, 24px)', borderRadius: '50%', background: subjectPlayer.color.hex, border: `2px solid ${Y2K.dark}` }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(stage === 'answer' || stage === 'marking') && answer && (
          <motion.div
            key="answer-reveal"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,4,41,0.92)', backdropFilter: 'blur(4px)', padding: '4vh 6vw' }}
          >
            <div style={{ width: '100%', maxWidth: '80vw' }}>
              <div style={{
                background: subjectPlayer.color.hex,
                borderRadius: 'clamp(24px, 3vw, 48px)',
                border: 'none',
                boxShadow: `0 10px 0 rgba(11,4,41,0.5), 0 4px 32px rgba(11,4,41,0.3)`,
                padding: 'clamp(24px, 4vh, 56px) clamp(32px, 5vw, 80px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '48px 48px 50% 50%', pointerEvents: 'none' }} />
                <ParticleBurst trigger={stage === 'answer'} />
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(14px, 1.5vw, 22px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 'clamp(10px, 1.5vh, 20px)' }}>
                  {subjectPlayer.name} actually said…
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 'clamp(48px, 6.5vw, 100px)', color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1.05 }}>
                  &ldquo;{answer}&rdquo;
                </div>
                {stage === 'marking' && (
                  <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 'clamp(13px, 1.3vw, 20px)', color: 'rgba(255,255,255,0.8)', marginTop: 'clamp(10px, 1.5vh, 20px)' }}>
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
