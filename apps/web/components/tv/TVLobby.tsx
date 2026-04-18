'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import Y2KAvatar from './Y2KAvatar';
import { Y2K } from '../../lib/y2k';
import { playLobbyMusic, stopLobbyMusic } from '../../lib/hooks/useGameSounds';

interface Props {
  state: TVState;
  onStart: () => void;
}

function Sparkle({ size = 24, color = Y2K.cyan, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill={color} stroke={Y2K.dark} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = Y2K.pink, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M20 35 C 8 25, 3 18, 3 12 C 3 6, 8 3, 12 3 C 16 3, 19 6, 20 9 C 21 6, 24 3, 28 3 C 32 3, 37 6, 37 12 C 37 18, 32 25, 20 35 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function BlobDeco({ size = 60, color = Y2K.yellow, x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M30 4 C 45 4, 56 14, 56 28 C 56 42, 48 56, 32 56 C 18 56, 4 48, 4 32 C 4 18, 15 4, 30 4 Z" fill={color} stroke={Y2K.dark} strokeWidth="2.5" />
      <ellipse cx="22" cy="18" rx="8" ry="5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

function Sticker({ color, rotate = 0, r = 20, style = {}, children }: { color: string; rotate?: number; r?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `3px solid ${Y2K.dark}`,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.7), 0 6px 0 rgba(11,4,41,0.45), 0 12px 20px rgba(12,6,40,0.15)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 4, left: 12, right: 12, height: '35%', background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)', borderRadius: `${r - 4}px ${r - 4}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

export default function TVLobby({ state, onStart }: Props) {
  const { roomCode, players } = state;
  const canStart = players.length >= 3;
  const MAX_PLAYERS = 8;

  const [siteUrl, setSiteUrl] = useState(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  );
  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  useEffect(() => {
    playLobbyMusic();
    return stopLobbyMusic;
  }, []);

  const joinUrl = `${siteUrl}/play?room=${roomCode}`;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: Y2K.bg, fontFamily: Y2K.body }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Deco */}
      <Sparkle size={36} color={Y2K.cyan} x={30} y={40} rotate={12} />
      <Sparkle size={22} color={Y2K.yellow} x={900} y={80} rotate={-20} />
      <Heart size={32} color={Y2K.pink} x={80} y={460} rotate={-15} />
      <BlobDeco size={70} color={Y2K.yellow} x={830} y={420} rotate={10} />
      <Sparkle size={24} color={Y2K.pink} x={480} y={30} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', padding: '36px 48px', gap: 32, zIndex: 1 }}>

        {/* ── LEFT COLUMN: logo + QR + room code ── */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160 }}
          style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {/* Logo */}
          <div>
            <div style={{
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 96,
              letterSpacing: '-0.03em', lineHeight: 0.9,
              color: 'transparent',
              background: 'linear-gradient(180deg, #ffffff 0%, #d8e4f5 40%, #8aa2bf 55%, #eaf1fb 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextStroke: '3px #0b0429',
              filter: `drop-shadow(4px 4px 0 ${Y2K.hotPink}) drop-shadow(8px 8px 0 #0b0429)`,
              transform: 'rotate(-4deg)',
              display: 'inline-block',
              textTransform: 'uppercase',
            }}>
              KseroSe
            </div>
            {/* Tagline badge */}
            <div style={{
              display: 'inline-block', marginTop: 10, marginLeft: 6,
              fontFamily: Y2K.body, fontWeight: 700, fontSize: 15,
              background: Y2K.dark, color: '#fff', padding: '6px 14px',
              borderRadius: 999, transform: 'rotate(-2deg)',
              boxShadow: `3px 3px 0 ${Y2K.cyan}`,
            }}>
              ★ how well do you know each other?
            </div>
          </div>

          {/* QR + room code side by side */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <Sticker color="#fff" r={22} rotate={-2} style={{ padding: 14 }}>
              <QRCodeSVG value={joinUrl} size={156} bgColor="#ffffff" fgColor={Y2K.dark} level="M" />
            </Sticker>

            <Sticker color={Y2K.hotPink} r={18} rotate={4} style={{ padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: Y2K.display, fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 2, opacity: 0.9 }}>Room</div>
              <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 52, color: '#fff', letterSpacing: 6, lineHeight: 1, WebkitTextStroke: '2px #0b0429', textShadow: '3px 3px 0 #0b0429' }}>
                {roomCode}
              </div>
            </Sticker>
          </div>

          <div style={{ fontFamily: Y2K.body, fontWeight: 600, fontSize: 14, color: '#3a1555' }}>
            scan or visit <b style={{ color: Y2K.deepPink }}>kserose.com</b>
          </div>
        </motion.div>

        {/* ── RIGHT COLUMN: squad + player grid + start ── */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, delay: 0.08 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: '#fff', textTransform: 'uppercase', WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `3px 3px 0 ${Y2K.cyan}`, letterSpacing: '0.02em' }}>
              squad
            </div>
            <Sticker color={Y2K.dark} r={999} style={{ padding: '6px 14px', border: `3px solid ${Y2K.dark}` }}>
              <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 18, color: '#fff' }}>
                {players.length}<span style={{ color: Y2K.pink }}>/{MAX_PLAYERS}</span>
              </span>
            </Sticker>
          </div>

          {/* Player grid — 2 columns, with empty slots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24, delay: i * 0.04 }}
                >
                  <Sticker color="#fff" r={16} rotate={i % 2 ? 1.5 : -1.5} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center' }}>
                      <Y2KAvatar avatar={p.avatar} size={40} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 16, color: p.color.hex, textTransform: 'uppercase', letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
                        {p.name}
                      </div>
                      {p.isHost && (
                        <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, color: Y2K.deepPink, letterSpacing: 1 }}>★ HOST</div>
                      )}
                    </div>
                  </Sticker>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, MAX_PLAYERS - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                padding: '8px 12px', borderRadius: 16,
                border: `2.5px dashed rgba(11,4,41,0.3)`,
                display: 'flex', alignItems: 'center', gap: 10, opacity: 0.55,
                minHeight: 58,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, border: `2.5px dashed rgba(11,4,41,0.35)` }} />
                <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 12, color: '#3a1555', textTransform: 'uppercase', letterSpacing: 1 }}>open slot</div>
              </div>
            ))}
          </div>

          {/* Need more players hint */}
          {!canStart && (
            <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#3a1555', paddingLeft: 2 }}>
              need {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} to start…
            </p>
          )}

          {/* Start button */}
          <div style={{ marginTop: 'auto' }}>
            <motion.div whileHover={canStart ? { scale: 1.03 } : {}} whileTap={canStart ? { scale: 0.97 } : {}}>
              <Sticker
                color={canStart ? Y2K.hotPink : 'rgba(11,4,41,0.3)'}
                r={20}
                rotate={-1}
                style={{
                  padding: '16px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  opacity: canStart ? 1 : 0.5,
                }}
              >
                <button
                  onClick={() => { stopLobbyMusic(); onStart(); }}
                  disabled={!canStart}
                  style={{
                    fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: '#fff',
                    background: 'none', border: 'none', cursor: 'inherit',
                    WebkitTextStroke: `1px ${Y2K.dark}`, textShadow: `2px 2px 0 ${Y2K.dark}`,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                >
                  {canStart ? 'start the show ▶︎' : 'need 3+ players…'}
                </button>
              </Sticker>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
