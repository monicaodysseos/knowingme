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

// Decorative SVGs
function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ size = 24, color = '#FF4FB4', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number; y?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 21 C12 21 3 14 3 8 C3 5.2 5.2 3 8 3 C9.7 3 11.2 3.9 12 5.1 C12.8 3.9 14.3 3 16 3 C18.8 3 21 5.2 21 8 C21 14 12 21 12 21Z" fill={color} stroke={Y2K.dark} strokeWidth="1.5" />
    </svg>
  );
}

// Sticker card primitive
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

// Chrome gradient title
function ChromeTitle({ text, size = 72, tilt = -3 }: { text: string; size?: number; tilt?: number }) {
  return (
    <div style={{
      fontFamily: Y2K.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: '-2px',
      lineHeight: 1,
      transform: `rotate(${tilt}deg)`,
      WebkitTextStroke: '2px rgba(11,4,41,0.5)',
      textShadow: '3px 3px 0 rgba(11,4,41,0.4)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    }}>
      {text}
    </div>
  );
}

export default function TVLobby({ state, onStart }: Props) {
  const { roomCode, players } = state;
  const canStart = players.length >= 3;

  const [siteUrl, setSiteUrl] = useState(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  );
  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  const joinUrl = `${siteUrl}/play?room=${roomCode}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-12 py-8 relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      {/* Decorative elements */}
      <Sparkle size={36} color={Y2K.yellow} x={40} y={40} rotate={15} />
      <Sparkle size={24} color={Y2K.cyan} x={900} y={70} />
      <Heart size={32} color={Y2K.pink} x={60} y={460} rotate={-15} />
      <Heart size={24} color={Y2K.cyan} x={880} y={480} rotate={20} />
      <Sparkle size={20} color={Y2K.pink} x={820} y={140} rotate={8} />

      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-8"
      >
        <ChromeTitle text="ksero · se ✿" size={84} tilt={-2} />
        <p className="font-bold mt-2" style={{
          fontFamily: Y2K.body,
          fontSize: 18,
          color: Y2K.cyan,
          letterSpacing: '0.05em',
        }}>
          how well do you know each other?
        </p>
      </motion.div>

      <div className="flex items-start gap-12 z-10">
        {/* QR + Room code stickers */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
          className="flex flex-col items-center gap-4"
        >
          {/* QR sticker */}
          <Sticker color="#fff" r={20} rotate={-1.5} style={{ padding: 16 }}>
            <QRCodeSVG
              value={joinUrl}
              size={180}
              bgColor="#ffffff"
              fgColor={Y2K.dark}
              level="M"
            />
            <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: '#3a1555', textAlign: 'center', marginTop: 8, letterSpacing: '0.05em' }}>
              scan to join
            </p>
          </Sticker>

          {/* URL hint */}
          <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            kserose.com/play
          </div>

          {/* Room code sticker */}
          <Sticker color={Y2K.hotPink} r={20} rotate={2} style={{ padding: '14px 28px', textAlign: 'center' }}>
            <div style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '0.2em', opacity: 0.85 }}>ROOM CODE</div>
            <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: '2px #0b0429', textShadow: '3px 3px 0 #0b0429', letterSpacing: '0.1em', lineHeight: 1 }}>
              {roomCode}
            </div>
          </Sticker>
        </motion.div>

        {/* Player list */}
        <div className="flex flex-col gap-4 min-w-[320px]">
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.cyan, letterSpacing: '0.05em', WebkitTextStroke: `0.5px ${Y2K.dark}` }}>
            PLAYERS ({players.length}/8)
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <Sticker color="#fff" r={14} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Y2KAvatar avatar={p.avatar} size={36} />
                    <span style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 18, color: p.color.hex, WebkitTextStroke: `0.5px ${Y2K.dark}`, flex: 1 }}>
                      {p.name}
                    </span>
                    {p.isHost && (
                      <span style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 10, background: Y2K.yellow, color: Y2K.dark, padding: '2px 8px', borderRadius: 99, border: `2px solid ${Y2K.dark}`, letterSpacing: '0.1em' }}>
                        HOST
                      </span>
                    )}
                  </Sticker>
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length < 3 && (
              <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.5)', paddingLeft: 4 }}>
                need {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} to start…
              </p>
            )}
          </div>

          {/* Start button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-2">
            <Sticker
              color={canStart ? Y2K.hotPink : '#2a1850'}
              r={99}
              style={{
                padding: '16px 32px',
                textAlign: 'center',
                cursor: canStart ? 'pointer' : 'not-allowed',
                opacity: canStart ? 1 : 0.4,
              }}
            >
              <button
                onClick={onStart}
                disabled={!canStart}
                style={{
                  fontFamily: Y2K.display,
                  fontWeight: 900,
                  fontSize: 22,
                  color: '#fff',
                  background: 'none',
                  border: 'none',
                  cursor: 'inherit',
                  WebkitTextStroke: `1px ${Y2K.dark}`,
                  textShadow: `2px 2px 0 ${Y2K.dark}`,
                  letterSpacing: '0.05em',
                  width: '100%',
                }}
              >
                {canStart ? 'start game ✦' : 'waiting for players…'}
              </button>
            </Sticker>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
