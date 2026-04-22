'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState, AwardResult } from '@ksero-se/types';
import ParticleBurst from './ParticleBurst';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';
import { useGameSounds, playFinalMusic, stopFinalMusic } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
  onPlayAgain: () => void;
}

// ── Phase types ───────────────────────────────────────────────────────────────

type TopPhase = 'leaderboard' | 'transition' | 'awards';
type LbSubPhase = 'countdown' | 'drumroll' | 'champion' | 'hold';
type AwardPhase = 'title' | 'drumroll' | 'winner' | 'done';

// ── Award config ──────────────────────────────────────────────────────────────

const AWARD_ORDER: AwardResult['type'][] = [
  'emotionally-intelligent',
  'narcissist',
  'best-duo',
];

const AWARD_COLORS: Record<AwardResult['type'], string> = {
  'emotionally-intelligent': '#8B5CF6',
  'narcissist': '#F59E0B',
  'best-duo': '#EC4899',
};

const AWARD_GLYPHS: Record<AwardResult['type'], string> = {
  'emotionally-intelligent': '✦',
  'narcissist': '♛',
  'best-duo': '♡',
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Sticker({ color, rotate = 0, r = 18, style = {}, children }: {
  color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: color, borderRadius: r, transform: `rotate(${rotate}deg)`,
      border: `3px solid ${Y2K.dark}`,
      boxShadow: `0 6px 0 rgba(11,4,41,0.5), 0 2px 12px rgba(11,4,41,0.2)`,
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function ChromeTitle({ text, size = 72, tilt = -3 }: { text: string; size?: number; tilt?: number }) {
  return (
    <div style={{
      fontFamily: Y2K.display, fontWeight: 900, fontSize: size,
      letterSpacing: '-2px', lineHeight: 1, transform: `rotate(${tilt}deg)`,
      WebkitTextStroke: '2px rgba(11,4,41,0.5)', textShadow: '3px 3px 0 rgba(11,4,41,0.4)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      display: 'inline-block',
    }}>
      {text}
    </div>
  );
}

function Chunky({ children, size = 16, color = '#fff', shadow = Y2K.dark }: {
  children: React.ReactNode; size?: number; color?: string; shadow?: string;
}) {
  return (
    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: size, textTransform: 'uppercase' as const, color, textShadow: `2px 2px 0 ${shadow}`, WebkitTextStroke: `1px ${shadow}` }}>
      {children}
    </div>
  );
}

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: {
  size?: number; color?: string; x?: number; y?: number; rotate?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = '#FF4FB4', x = 0, y = 0, rotate = 0 }: {
  size?: number; color?: string; x?: number; y?: number; rotate?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 21 C12 21 3 14 3 8 C3 5.2 5.2 3 8 3 C9.7 3 11.2 3.9 12 5.1 C12.8 3.9 14.3 3 16 3 C18.8 3 21 5.2 21 8 C21 14 12 21 12 21Z" fill={color} stroke={Y2K.dark} strokeWidth="1.5" />
    </svg>
  );
}

// ── Rank badge ────────────────────────────────────────────────────────────────

const MEDAL_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#FFD700', text: Y2K.dark },
  2: { bg: '#C0C0C0', text: Y2K.dark },
  3: { bg: '#CD7F32', text: '#fff' },
};

function RankBadge({ rank, size = 36 }: { rank: number; size?: number }) {
  const medal = MEDAL_COLORS[rank];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: medal?.bg ?? Y2K.dark,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `0 3px 0 rgba(11,4,41,0.4)`,
      display: 'grid', placeItems: 'center',
      fontFamily: Y2K.display, fontWeight: 900,
      fontSize: rank >= 10 ? size * 0.36 : size * 0.44,
      color: medal?.text ?? '#fff',
    }}>
      {rank}
    </div>
  );
}

// ── Leaderboard player card ───────────────────────────────────────────────────

interface PlayerCardProps {
  rank: number;
  playerName: string;
  score: number;
  colorHex: string;
  avatar: string;
  compact?: boolean;
}

function PlayerCard({ rank, playerName, score, colorHex, avatar, compact = false }: PlayerCardProps) {
  const h = compact ? 58 : 68;
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `2.5px solid ${Y2K.dark}`,
      boxShadow: `0 4px 0 rgba(11,4,41,0.4)`,
      padding: compact ? '0 12px' : '0 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      height: h, overflow: 'hidden',
      borderLeft: `5px solid ${colorHex}`,
    }}>
      <RankBadge rank={rank} size={compact ? 30 : 36} />
      <div style={{ width: compact ? 32 : 38, height: compact ? 32 : 38, flexShrink: 0 }}>
        <Y2KAvatar avatar={avatar as never} size={compact ? 32 : 38} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: compact ? 15 : 18,
          color: colorHex, textTransform: 'uppercase' as const,
          WebkitTextStroke: `0.5px ${Y2K.dark}`,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        }}>
          {playerName}
        </div>
      </div>
      <div style={{
        fontFamily: Y2K.display, fontWeight: 900,
        fontSize: compact ? 20 : 24,
        color: Y2K.dark, letterSpacing: '-0.5px', flexShrink: 0,
      }}>
        {score.toLocaleString()}
      </div>
    </div>
  );
}

// ── Placeholder card (hidden player) ─────────────────────────────────────────

function PlaceholderCard({ rank, compact = false }: { rank: number; compact?: boolean }) {
  const h = compact ? 58 : 68;
  return (
    <div style={{
      background: 'rgba(11,4,41,0.12)', borderRadius: 14,
      border: `2.5px dashed rgba(11,4,41,0.25)`,
      padding: compact ? '0 12px' : '0 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      height: h,
    }}>
      <div style={{
        width: compact ? 30 : 36, height: compact ? 30 : 36,
        borderRadius: '50%', background: 'rgba(11,4,41,0.15)',
        display: 'grid', placeItems: 'center',
        fontFamily: Y2K.display, fontWeight: 900,
        fontSize: compact ? 13 : 15, color: 'rgba(11,4,41,0.4)',
        flexShrink: 0,
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, height: compact ? 14 : 16, borderRadius: 99, background: 'rgba(11,4,41,0.1)' }} />
      <div style={{ width: compact ? 50 : 60, height: compact ? 14 : 16, borderRadius: 99, background: 'rgba(11,4,41,0.1)', flexShrink: 0 }} />
    </div>
  );
}

// ── Champion card (first place reveal) ───────────────────────────────────────

interface ChampionCardProps {
  playerName: string;
  score: number;
  colorHex: string;
  avatar: string;
}

function ChampionCard({ playerName, score, colorHex, avatar }: ChampionCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      style={{ position: 'relative' }}
    >
      <ParticleBurst trigger />
      <div style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #FFF176 40%, #FFD700 100%)',
        borderRadius: 20,
        border: `4px solid ${Y2K.dark}`,
        boxShadow: `0 8px 0 rgba(11,4,41,0.5), 0 0 40px rgba(255,215,0,0.4)`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderLeft: `8px solid ${colorHex}`,
      }}>
        {/* Crown emoji */}
        <div style={{ fontSize: 32, flexShrink: 0 }}>👑</div>
        <RankBadge rank={1} size={44} />
        <div style={{ width: 48, height: 48, flexShrink: 0 }}>
          <Y2KAvatar avatar={avatar as never} size={48} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: Y2K.dark, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' as const }}>
            1st place
          </div>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 28,
            color: colorHex,
            WebkitTextStroke: `1px ${Y2K.dark}`,
            textShadow: `2px 2px 0 ${Y2K.dark}`,
            textTransform: 'uppercase' as const,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {playerName}
          </div>
        </div>
        <div style={{
          fontFamily: Y2K.display, fontWeight: 900,
          fontSize: 36, color: Y2K.dark, letterSpacing: '-1px', flexShrink: 0,
          textShadow: `2px 2px 0 rgba(11,4,41,0.3)`,
        }}>
          {score.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TVFinalAwards({ state, onPlayAgain }: Props) {
  const { awards = [], scores, players } = state;
  const { playDrumroll, playAwardFanfare, playGameOver, playBlink, playApplause } = useGameSounds();

  // Avatar + color lookup by playerId
  const playerMeta = useMemo(() =>
    Object.fromEntries(players.map((p) => [p.id, { avatar: p.avatar, color: p.color.hex }])),
    [players],
  );

  const totalPlayers = scores.length;
  const compact = totalPlayers > 6;

  // ── Top-level phase ──────────────────────────────────────────────────────
  const [topPhase, setTopPhase] = useState<TopPhase>('leaderboard');

  // ── Leaderboard sub-state ────────────────────────────────────────────────
  // revealedCount: 0 → totalPlayers-1 (non-champion reveals, from last place up)
  const [revealedCount, setRevealedCount] = useState(0);
  const [lbSub, setLbSub] = useState<LbSubPhase>('countdown');

  // ── Awards sub-state ─────────────────────────────────────────────────────
  const orderedAwards = useMemo(() =>
    AWARD_ORDER
      .map((type) => awards.find((a) => a.type === type))
      .filter((a): a is AwardResult => Boolean(a)),
    [awards],
  );
  const [awardIndex, setAwardIndex] = useState(0);
  const [awardPhase, setAwardPhase] = useState<AwardPhase>('title');
  const [showPlayAgain, setShowPlayAgain] = useState(false);

  // ── Leaderboard sequencing ───────────────────────────────────────────────
  useEffect(() => {
    if (topPhase !== 'leaderboard') return;

    if (lbSub === 'countdown') {
      // Wait a beat on very first reveal
      const delay = revealedCount === 0 ? 1200 : 1300;
      const t = setTimeout(() => {
        if (revealedCount < totalPlayers - 1) {
          playBlink();
          setRevealedCount((c) => c + 1);
        } else {
          // All non-champion revealed → drum up to champion
          setLbSub('drumroll');
        }
      }, delay);
      return () => clearTimeout(t);
    }

    if (lbSub === 'drumroll') {
      const stop = playDrumroll(2400);
      const t = setTimeout(() => {
        stop();
        setLbSub('champion');
      }, 2400);
      return () => { clearTimeout(t); stop(); };
    }

    if (lbSub === 'champion') {
      playAwardFanfare();
      const stopApplause = playApplause(3800);
      const t = setTimeout(() => {
        stopApplause();
        setLbSub('hold');
      }, 3800);
      return () => { clearTimeout(t); stopApplause(); };
    }

    if (lbSub === 'hold') {
      const t = setTimeout(() => setTopPhase('transition'), 2800);
      return () => clearTimeout(t);
    }
  }, [topPhase, lbSub, revealedCount, totalPlayers, playBlink, playDrumroll, playAwardFanfare, playApplause]);

  // ── Transition phase ─────────────────────────────────────────────────────
  useEffect(() => {
    if (topPhase !== 'transition') return;
    const t = setTimeout(() => {
      setTopPhase('awards');
    }, 2800);
    return () => clearTimeout(t);
  }, [topPhase]);

  // ── Awards sequencing (same as before) ──────────────────────────────────
  const advanceAward = useCallback(() => {
    const next = awardIndex + 1;
    if (next < orderedAwards.length) {
      setAwardIndex(next);
      setAwardPhase('title');
    } else {
      setAwardPhase('done');
      setTimeout(() => setShowPlayAgain(true), 800);
    }
  }, [awardIndex, orderedAwards.length]);

  useEffect(() => {
    if (topPhase !== 'awards') return;
    if (awardPhase === 'done') {
      playFinalMusic();
      return stopFinalMusic;
    }
  }, [topPhase, awardPhase]);

  useEffect(() => {
    if (topPhase !== 'awards') return;
    if (awardPhase === 'title') {
      const t = setTimeout(() => setAwardPhase('drumroll'), 1200);
      return () => clearTimeout(t);
    }
    if (awardPhase === 'drumroll') {
      const stop = playDrumroll(1800);
      const t = setTimeout(() => { stop(); setAwardPhase('winner'); }, 1800);
      return () => { clearTimeout(t); stop(); };
    }
    if (awardPhase === 'winner') {
      playAwardFanfare();
      const t = setTimeout(advanceAward, 3500);
      return () => clearTimeout(t);
    }
    if (awardPhase === 'done') {
      playGameOver();
    }
  }, [topPhase, awardPhase, advanceAward, playDrumroll, playAwardFanfare, playGameOver]);

  // ── Check whether champion is shown ─────────────────────────────────────
  const championVisible = lbSub === 'champion' || lbSub === 'hold';

  // ── RENDER: Leaderboard phase ────────────────────────────────────────────
  if (topPhase === 'leaderboard') {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col"
        style={{ background: Y2K.bg, fontFamily: Y2K.body }}
      >
        <Sparkle size={28} color={Y2K.cyan} x={40} y={40} rotate={12} />
        <Sparkle size={20} color={Y2K.yellow} x={880} y={70} rotate={-15} />
        <Heart size={26} color={Y2K.pink} x={70} y={480} rotate={-10} />
        <Heart size={22} color={Y2K.cyan} x={900} y={460} rotate={18} />

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 80px', gap: 20, position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <ChromeTitle text="Final Standings" size={64} tilt={-1.5} />
          </div>

          {/* Leaderboard list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8, justifyContent: 'center' }}>
            {scores.map((entry, i) => {
              const rank = i + 1;
              const meta = playerMeta[entry.playerId];
              const isChampion = i === 0;

              // How many non-champion reveals are needed for this player to appear?
              // Player at index i (i>0) needs revealedCount >= (totalPlayers - i)
              const isRevealed = isChampion
                ? championVisible
                : revealedCount >= (totalPlayers - i);

              if (isChampion) {
                return (
                  <AnimatePresence key="champion">
                    {isRevealed ? (
                      <ChampionCard
                        playerName={entry.playerName}
                        score={entry.score}
                        colorHex={meta?.color ?? entry.color.hex}
                        avatar={meta?.avatar ?? 'blob'}
                      />
                    ) : (
                      // Show special "drumroll" placeholder when lbSub === 'drumroll'
                      lbSub === 'drumroll' ? (
                        <motion.div
                          key="drumroll-placeholder"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.55, repeat: Infinity }}
                          style={{
                            background: 'rgba(11,4,41,0.18)', borderRadius: 20,
                            border: `3px dashed rgba(11,4,41,0.35)`,
                            height: compact ? 70 : 82,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                          }}
                        >
                          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: compact ? 16 : 20, color: 'rgba(11,4,41,0.4)', letterSpacing: 2, textTransform: 'uppercase' as const }}>
                            And in 1st place…
                          </div>
                          {[0, 1, 2, 3].map((j) => (
                            <motion.div
                              key={j}
                              animate={{ scale: [1, 1.7, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: j * 0.11 }}
                              style={{ width: 14, height: 14, borderRadius: '50%', background: Y2K.hotPink, border: `2px solid ${Y2K.dark}` }}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <PlaceholderCard key="champion-hidden" rank={1} compact={compact} />
                      )
                    )}
                  </AnimatePresence>
                );
              }

              return (
                <AnimatePresence key={entry.playerId}>
                  {isRevealed ? (
                    <motion.div
                      initial={{ opacity: 0, x: 80, scale: 0.92 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    >
                      <PlayerCard
                        rank={rank}
                        playerName={entry.playerName}
                        score={entry.score}
                        colorHex={meta?.color ?? entry.color.hex}
                        avatar={meta?.avatar ?? 'blob'}
                        compact={compact}
                      />
                    </motion.div>
                  ) : (
                    <PlaceholderCard rank={rank} compact={compact} />
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: Transition phase ─────────────────────────────────────────────
  if (topPhase === 'transition') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: Y2K.bg }}
      >
        <Sparkle size={32} color={Y2K.yellow} x={60} y={80} rotate={10} />
        <Sparkle size={22} color={Y2K.cyan} x={860} y={60} rotate={-12} />
        <Heart size={28} color={Y2K.pink} x={880} y={460} rotate={20} />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140 }}
          className="flex flex-col items-center gap-6 text-center px-12"
        >
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: Y2K.dark, letterSpacing: '-0.5px', opacity: 0.7, textTransform: 'uppercase' as const }}>
            but wait…
          </div>
          <ChromeTitle text="We also have some awards" size={56} tilt={-1} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 10 }}
          >
            {['✦', '♡', '♛'].map((g, i) => (
              <motion.span
                key={i}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 36, color: [Y2K.cyan, Y2K.pink, Y2K.yellow][i], WebkitTextStroke: `1.5px ${Y2K.dark}` }}
              >
                {g}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── RENDER: Awards phase ─────────────────────────────────────────────────
  const currentAward = orderedAwards[awardIndex];
  const accent = currentAward ? AWARD_COLORS[currentAward.type] : Y2K.hotPink;

  if (awardPhase === 'done') {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: Y2K.bg, fontFamily: Y2K.body }}
      >
        <Sparkle size={28} color={Y2K.yellow} x={40} y={40} rotate={15} />
        <Sparkle size={20} color={Y2K.cyan} x={900} y={60} rotate={-10} />
        <Heart size={26} color={Y2K.pink} x={60} y={470} rotate={-15} />
        <Heart size={22} color={Y2K.cyan} x={910} y={460} rotate={22} />

        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', gap: 24, padding: '28px 36px',
        }}>

          {/* ── LEFT: Leaderboard ── */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160 }}
            style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {/* Section title */}
            <div style={{ marginBottom: 4 }}>
              <ChromeTitle text="Final Standings" size={32} tilt={-1} />
            </div>

            {/* Rank list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
              {scores.map((entry, i) => {
                const rank = i + 1;
                const meta = playerMeta[entry.playerId];
                const isTop = rank === 1;
                const medal = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }[rank];
                return (
                  <motion.div
                    key={entry.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 220 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: isTop ? '8px 12px' : '6px 10px',
                      background: isTop
                        ? `linear-gradient(90deg, ${entry.color.hex} 0%, color-mix(in srgb, ${entry.color.hex} 60%, #fff 40%) 100%)`
                        : '#fff',
                      border: `2.5px solid ${Y2K.dark}`,
                      borderRadius: 14,
                      boxShadow: isTop ? `0 5px 0 ${Y2K.dark}, 0 0 0 3px ${entry.color.hex}55` : `0 3px 0 ${Y2K.dark}`,
                      transform: isTop ? 'scale(1.02)' : 'none',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {isTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '14px 14px 50% 50%', pointerEvents: 'none' }} />}
                    {/* Rank badge */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: medal ?? Y2K.dark,
                      border: `2px solid ${Y2K.dark}`, boxShadow: `0 2px 0 rgba(11,4,41,0.4)`,
                      display: 'grid', placeItems: 'center',
                      fontFamily: Y2K.display, fontWeight: 900, fontSize: 14,
                      color: rank <= 2 ? Y2K.dark : '#fff',
                    }}>{rank}</div>
                    {/* Avatar */}
                    <div style={{ width: 32, height: 32, background: '#fff', border: `2px solid ${Y2K.dark}`, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `0 2px 0 ${Y2K.dark}` }}>
                      <Y2KAvatar avatar={(meta?.avatar ?? 'blob') as never} size={26} />
                    </div>
                    {/* Name */}
                    <div style={{
                      flex: 1, minWidth: 0,
                      fontFamily: Y2K.display, fontWeight: 900, fontSize: 15,
                      color: isTop ? '#fff' : entry.color.hex,
                      WebkitTextStroke: isTop ? `0.5px ${Y2K.dark}` : '0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      textTransform: 'uppercase' as const,
                    }}>{entry.playerName}</div>
                    {/* Score */}
                    <div style={{
                      fontFamily: Y2K.display, fontWeight: 900, fontSize: 18,
                      color: isTop ? '#fff' : Y2K.dark,
                      WebkitTextStroke: isTop ? `0.5px ${Y2K.dark}` : '0',
                      letterSpacing: '-0.5px', flexShrink: 0,
                    }}>{entry.score.toLocaleString()}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── RIGHT: Awards + play again ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140, delay: 0.1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}
          >
            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <ChromeTitle text="ksero · se ✿" size={54} tilt={-2} />
              <div style={{ marginTop: 4 }}>
                <ChromeTitle text="the awards" size={36} tilt={0} />
              </div>
            </div>

            {/* Award cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
              {orderedAwards.map((award, i) => (
                <motion.div
                  key={award.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Sticker
                    color={AWARD_COLORS[award.type]}
                    r={18}
                    rotate={i === 0 ? -2 : i === 2 ? 2 : 0}
                    style={{ padding: '14px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}
                  >
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 38, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, lineHeight: 1, textShadow: `3px 3px 0 ${Y2K.dark}` }}>
                      {AWARD_GLYPHS[award.type]}
                    </div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 9, color: '#fff', letterSpacing: 2, opacity: 0.9 }}>
                      {award.description.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 16, color: '#fff', WebkitTextStroke: `1px ${Y2K.dark}`, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                      {award.title}
                    </div>
                    <div style={{ marginTop: 'auto', padding: '7px 9px', background: 'rgba(255,255,255,0.92)', borderRadius: 9, border: `2px solid ${Y2K.dark}` }}>
                      <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 15, color: Y2K.dark, letterSpacing: '-0.5px' }}>
                        {award.winners.join(' + ')}
                      </div>
                      <div style={{ fontFamily: Y2K.body, fontSize: 10, color: '#3a1555', fontWeight: 600, marginTop: 2 }}>
                        {award.stat}
                      </div>
                    </div>
                  </Sticker>
                </motion.div>
              ))}
            </div>

            {/* Play again */}
            {showPlayAgain && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sticker color={Y2K.hotPink} r={99} style={{ padding: '13px 44px' }}>
                  <button
                    onClick={onPlayAgain}
                    style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`, letterSpacing: '0.05em' }}
                  >
                    play again ↻
                  </button>
                </Sticker>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Award reveal screens (title → drumroll → winner)
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: Y2K.bg }}
    >
      <Sparkle size={32} color={Y2K.yellow} x={50} y={50} rotate={15} />
      <Sparkle size={24} color={Y2K.cyan} x={880} y={80} />
      <Heart size={28} color={Y2K.pink} x={900} y={470} rotate={20} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accent}18 0%, transparent 70%)`, transition: 'background 1s ease' }}
      />

      <AnimatePresence mode="wait">
        {currentAward && (
          <motion.div
            key={`award-${awardIndex}-${awardPhase}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 z-10 text-center px-12 max-w-3xl"
          >
            {awardPhase === 'title' && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="flex flex-col items-center gap-6"
              >
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 120, color: accent, WebkitTextStroke: `4px ${Y2K.dark}`, textShadow: `6px 6px 0 ${Y2K.dark}`, lineHeight: 1 }}>
                  {AWARD_GLYPHS[currentAward.type]}
                </div>
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: `3px ${Y2K.dark}`, textShadow: `4px 4px 0 ${Y2K.dark}`, letterSpacing: '-2px', lineHeight: 1 }}>
                  {currentAward.title}
                </div>
                <Chunky size={16} color={accent} shadow={Y2K.dark}>{currentAward.description}</Chunky>
              </motion.div>
            )}

            {awardPhase === 'drumroll' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-8"
              >
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 52, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1 }}>
                  {currentAward.title}
                </div>
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
                      style={{ width: 20, height: 20, borderRadius: '50%', background: accent, border: `2.5px solid ${Y2K.dark}` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {awardPhase === 'winner' && (
              <motion.div className="flex flex-col items-center gap-6 relative">
                <ParticleBurst trigger />
                <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 44, color: '#fff', WebkitTextStroke: `2px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.dark}`, letterSpacing: '-1px', lineHeight: 1 }}>
                  {currentAward.title}
                </div>
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {currentAward.winners.map((w) => (
                    <span
                      key={w}
                      style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 72, color: accent, WebkitTextStroke: `3px ${Y2K.dark}`, textShadow: `5px 5px 0 ${Y2K.dark}`, letterSpacing: '-2px', lineHeight: 1 }}
                    >
                      {w}
                    </span>
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 18, color: 'rgba(11,4,41,0.55)' }}
                >
                  {currentAward.stat}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
