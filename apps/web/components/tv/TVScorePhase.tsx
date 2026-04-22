'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Props {
  state: TVState;
}

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none', zIndex: 0 }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = '#FF4FB4', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none', zIndex: 0 }}>
      <path d="M12 21 C12 21 3 14 3 8 C3 5.2 5.2 3 8 3 C9.7 3 11.2 3.9 12 5.1 C12.8 3.9 14.3 3 16 3 C18.8 3 21 5.2 21 8 C21 14 12 21 12 21Z" fill={color} stroke={Y2K.dark} strokeWidth="1.5" />
    </svg>
  );
}

const RANK_BG: Record<number, string> = { 1: '#FFE24A', 2: '#E0E5EE', 3: '#E89B5C' };

export default function TVScorePhase({ state }: Props) {
  const { scores, players, currentTurn, isLastRound, isRoundEnd } = state;

  // Last round → blank (FINAL_AWARDS follows immediately)
  if (isLastRound) {
    return <div className="min-h-screen" style={{ background: Y2K.bg }} />;
  }

  const avatarMap = Object.fromEntries(players.map((p) => [p.id, p.avatar]));
  const justFinished = currentTurn?.subjectPlayer;
  const justFinishedEntry = justFinished ? scores.find((s) => s.playerId === justFinished.id) : null;
  const correctCount = currentTurn?.guessesRevealed.filter((g) => g.isCorrect).length ?? 0;
  const totalGuesses = currentTurn?.guessesRevealed.length ?? 0;

  // ── Between individual questions (same subject, more Qs to go) ──────────
  // Show a quick recap card only — no full leaderboard
  if (!isRoundEnd) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: Y2K.bg, fontFamily: Y2K.body }}
      >
        <Sparkle size={28} color={Y2K.cyan} x={60} y={60} rotate={10} />
        <Sparkle size={20} color={Y2K.yellow} x={890} y={80} />
        <Heart size={24} color={Y2K.pink} x={880} y={460} rotate={18} />

        {justFinished && justFinishedEntry && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220 }}
            style={{
              background: justFinished.color.hex,
              border: `4px solid ${Y2K.dark}`,
              borderRadius: 28, padding: '32px 40px',
              boxShadow: `0 8px 0 ${Y2K.dark}`,
              display: 'flex', flexDirection: 'column', gap: 16,
              maxWidth: 420, width: '100%',
              position: 'relative', overflow: 'hidden', zIndex: 1,
            }}
          >
            {/* Halftone */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 2px)', backgroundSize: '12px 12px' }} />
            {/* Gloss */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,255,255,0.18)', borderRadius: '28px 28px 50% 50%', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div style={{ width: 72, height: 72, background: '#fff', border: `3px solid ${Y2K.dark}`, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: `0 4px 0 ${Y2K.dark}`, flexShrink: 0 }}>
                <Y2KAvatar avatar={justFinished.avatar} size={58} />
              </div>
              <div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                  {justFinished.name}
                </div>
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textTransform: 'uppercase' as const, marginTop: 4 }}>
                  Q {(currentTurn?.questionIndex ?? 0) + 1} of {currentTurn?.totalForSubject ?? 1} done ✿
                </div>
              </div>
            </div>

            {justFinishedEntry.delta > 0 && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                  +{justFinishedEntry.delta}
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: 2 }}>PTS ✿</div>
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', border: `2px solid ${Y2K.dark}` }}>
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 9, color: justFinished.color.hex, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>correct guesses</div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark, lineHeight: 1 }}>
                  {correctCount}<span style={{ fontSize: 13, color: '#3a1555', fontWeight: 700 }}>/{totalGuesses}</span>
                </div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', border: `2px solid ${Y2K.dark}` }}>
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 9, color: justFinished.color.hex, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>total score</div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: Y2K.dark, lineHeight: 1 }}>
                  {justFinishedEntry.score.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{
              position: 'relative',
              background: Y2K.dark, color: '#fff',
              borderRadius: 12, padding: '10px 16px', textAlign: 'center' as const,
              fontFamily: Y2K.display, fontWeight: 800, fontSize: 14, letterSpacing: 1,
            }}>
              next question coming up…
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ── End of a subject's full turn → show full leaderboard ────────────────
  const withPrev = scores.map((e) => ({ ...e, prevScore: e.score - e.delta }));
  const sortedByPrev = [...withPrev].sort((a, b) => b.prevScore - a.prevScore);
  const prevRankMap = Object.fromEntries(sortedByPrev.map((e, i) => [e.playerId, i + 1]));

  const justFinishedCurrentRank = justFinished ? scores.findIndex((s) => s.playerId === justFinished.id) + 1 : 0;
  const justFinishedPrevRank = justFinished ? (prevRankMap[justFinished.id] ?? justFinishedCurrentRank) : justFinishedCurrentRank;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: Y2K.bg }}
    >
      <Sparkle size={32} color={Y2K.yellow} x={50} y={60} rotate={12} />
      <Sparkle size={22} color={Y2K.cyan} x={910} y={80} rotate={-10} />
      <Sparkle size={18} color="#fff" x={70} y={460} />
      <Heart size={26} color={Y2K.pink} x={890} y={460} rotate={18} />

      <div style={{
        position: 'absolute', inset: 0, padding: '28px 40px',
        display: 'flex', flexDirection: 'column', gap: 14, zIndex: 1,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            {justFinished && (
              <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: Y2K.deepPink, letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 4 }}>
                after {justFinished.name}&apos;s turn
              </div>
            )}
            <div style={{
              fontFamily: Y2K.display, fontWeight: 900,
              fontSize: 'clamp(40px, 5vw, 66px)',
              letterSpacing: '-2px', lineHeight: 1,
              transform: 'rotate(-2deg)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              WebkitTextStroke: '2px rgba(11,4,41,0.5)',
              textShadow: '3px 3px 0 rgba(11,4,41,0.4)',
              filter: `drop-shadow(4px 4px 0 ${Y2K.hotPink}) drop-shadow(6px 6px 0 #0b0429)`,
              display: 'inline-block',
            }}>
              leaderboard ✦
            </div>
          </div>
        </div>

        {/* 2-column body */}
        <div style={{ display: 'flex', gap: 18, flex: 1, alignItems: 'stretch', minHeight: 0 }}>

          {/* LEFT: last-turn recap */}
          {justFinished && justFinishedEntry && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 14, color: Y2K.cyan, textTransform: 'uppercase' as const, letterSpacing: 2, WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
                last turn ✿
              </div>

              <div style={{
                background: justFinished.color.hex, color: '#fff',
                border: `3.5px solid ${Y2K.dark}`, borderRadius: 22,
                padding: '18px 16px',
                boxShadow: `0 6px 0 ${Y2K.dark}`,
                display: 'flex', flexDirection: 'column', gap: 12,
                position: 'relative', overflow: 'hidden', flex: 1,
              }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 2px)', backgroundSize: '12px 12px' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'rgba(255,255,255,0.18)', borderRadius: '22px 22px 50% 50%', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                  <div style={{ width: 64, height: 64, background: '#fff', border: `3px solid ${Y2K.dark}`, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: `0 4px 0 ${Y2K.dark}`, flexShrink: 0 }}>
                    <Y2KAvatar avatar={justFinished.avatar} size={52} />
                  </div>
                  <div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 24, color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                      {justFinished.name}
                    </div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, color: '#fff', letterSpacing: 1.5, opacity: 0.85, marginTop: 4 }}>
                      JUST WRAPPED ✿
                    </div>
                  </div>
                </div>

                {justFinishedEntry.delta > 0 && (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 56, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                      +{justFinishedEntry.delta}
                    </div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: 2 }}>POINTS ✿</div>
                  </div>
                )}

                <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '6px 10px', border: `2px solid ${Y2K.dark}` }}>
                    <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 9, color: justFinished.color.hex, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>correct</div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: Y2K.dark, lineHeight: 1 }}>
                      {correctCount}<span style={{ fontSize: 12, color: '#3a1555', fontWeight: 700 }}>/{totalGuesses}</span>
                    </div>
                  </div>
                  {justFinishedPrevRank !== justFinishedCurrentRank && (
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '6px 10px', border: `2px solid ${Y2K.dark}` }}>
                      <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 9, color: justFinished.color.hex, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>rank</div>
                      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: Y2K.dark, lineHeight: 1 }}>
                        {justFinishedPrevRank} → <span style={{ color: justFinished.color.hex }}>{justFinishedCurrentRank}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: '10px 14px', background: '#fff',
                border: `2.5px solid ${Y2K.dark}`, borderRadius: 12, boxShadow: `0 3px 0 ${Y2K.dark}`,
                fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555', textAlign: 'center' as const,
              }}>
                next player up…
              </div>
            </motion.div>
          )}

          {/* RIGHT: Full standings */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <AnimatePresence mode="popLayout">
              {scores.map((entry, i) => {
                const rank = i + 1;
                const prevRank = prevRankMap[entry.playerId] ?? rank;
                const movedUp = prevRank > rank;
                const movedDown = prevRank < rank;
                const isTop = rank === 1;
                const rankBg = RANK_BG[rank] ?? Y2K.dark;
                const rankColor = rank <= 3 ? Y2K.dark : '#fff';

                return (
                  <motion.div
                    key={entry.playerId}
                    layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26, delay: i * 0.04 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px',
                      background: isTop
                        ? `linear-gradient(90deg, ${entry.color.hex} 0%, color-mix(in srgb, ${entry.color.hex} 70%, #fff 30%) 100%)`
                        : '#fff',
                      border: `3px solid ${Y2K.dark}`,
                      borderRadius: 16,
                      boxShadow: isTop
                        ? `0 5px 0 ${Y2K.dark}, 0 0 0 4px ${entry.color.hex}66`
                        : `0 3px 0 ${Y2K.dark}`,
                      transform: isTop ? 'scale(1.02)' : 'none',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {isTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '16px 16px 50% 50%', pointerEvents: 'none' }} />}

                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: rankBg, color: rankColor,
                      border: `2.5px solid ${Y2K.dark}`, boxShadow: `0 2px 0 ${Y2K.dark}`,
                      display: 'grid', placeItems: 'center',
                      fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, flexShrink: 0,
                    }}>{rank}</div>

                    <div style={{ width: 42, height: 42, background: '#fff', border: `2.5px solid ${Y2K.dark}`, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `0 2px 0 ${Y2K.dark}` }}>
                      <Y2KAvatar avatar={avatarMap[entry.playerId]} size={34} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: Y2K.display, fontWeight: 900,
                        fontSize: 'clamp(16px, 1.8vw, 22px)',
                        color: isTop ? '#fff' : Y2K.dark,
                        WebkitTextStroke: isTop ? `1px ${Y2K.dark}` : '0',
                        textShadow: isTop ? `2px 2px 0 ${Y2K.dark}` : 'none',
                        lineHeight: 1, letterSpacing: -0.5,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      }}>{entry.playerName}</div>
                      {entry.delta > 0 && (
                        <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 11, color: isTop ? 'rgba(255,255,255,0.9)' : '#19B06B', marginTop: 2, letterSpacing: 0.5 }}>
                          +{entry.delta} this round
                        </div>
                      )}
                    </div>

                    {(movedUp || movedDown) && (
                      <div style={{
                        padding: '4px 8px', borderRadius: 999,
                        background: movedUp ? '#19B06B' : Y2K.hotPink,
                        border: `2px solid ${Y2K.dark}`,
                        fontFamily: Y2K.display, fontWeight: 900, fontSize: 11, color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 3,
                        boxShadow: `0 2px 0 ${Y2K.dark}`, flexShrink: 0,
                      }}>
                        {movedUp ? '▲' : '▼'} {Math.abs(prevRank - rank)}
                      </div>
                    )}

                    <div style={{
                      fontFamily: Y2K.display, fontWeight: 900,
                      fontSize: 'clamp(20px, 2.2vw, 30px)',
                      color: isTop ? '#fff' : Y2K.dark,
                      WebkitTextStroke: isTop ? `1px ${Y2K.dark}` : '0',
                      textShadow: isTop ? `2px 2px 0 ${Y2K.dark}` : 'none',
                      minWidth: 80, textAlign: 'right' as const, letterSpacing: -1, flexShrink: 0,
                    }}>{entry.score.toLocaleString()}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
