'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Y2K } from '../lib/y2k';

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0 }: { size?: number; color?: string; x?: number | string; y?: number | string; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={Y2K.dark} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('enter the 4-letter room code ✦');
      inputRef.current?.focus();
      return;
    }
    router.push(`/play?room=${trimmed.slice(0, 4)}`);
  };

  const openJoin = () => {
    setMode('join');
    setCode('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: Y2K.dark }}
    >
      {/* Decorative sparkles */}
      <Sparkle size={32} color={Y2K.yellow} x={60} y={60} rotate={15} />
      <Sparkle size={22} color={Y2K.cyan} x="calc(100vw - 100px)" y={80} rotate={-10} />
      <Sparkle size={18} color={Y2K.pink} x={40} y="calc(100vh - 100px)" rotate={30} />
      <Sparkle size={26} color={Y2K.yellow} x="calc(100vw - 80px)" y="calc(100vh - 120px)" rotate={-20} />

      {/* Logo / Title */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="text-center mb-14"
      >
        <div style={{
          fontFamily: Y2K.display,
          fontWeight: 900,
          fontSize: 'clamp(52px, 10vw, 110px)',
          letterSpacing: '-3px',
          lineHeight: 1,
          transform: 'rotate(-2deg)',
          WebkitTextStroke: '2px rgba(11,4,41,0.5)',
          textShadow: '4px 4px 0 rgba(11,4,41,0.4)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-block',
        }}>
          ksero · se ✿
        </div>
        <p style={{
          fontFamily: Y2K.body,
          fontWeight: 700,
          fontSize: 'clamp(14px, 2vw, 20px)',
          color: Y2K.cyan,
          marginTop: 12,
          letterSpacing: '0.04em',
        }}>
          the party game where you think you know your friends
        </p>
      </motion.div>

      {/* Buttons */}
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="flex flex-col items-center gap-5"
            style={{ width: 'min(360px, 90vw)' }}
          >
            {/* New Game */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/tv')}
              style={{
                width: '100%',
                padding: '20px 0',
                borderRadius: 20,
                background: Y2K.hotPink,
                border: `3px solid ${Y2K.dark}`,
                boxShadow: `0 6px 0 rgba(11,4,41,0.55)`,
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 'clamp(20px, 3vw, 28px)',
                color: '#fff',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                WebkitTextStroke: `0.5px ${Y2K.dark}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '18px 18px 50% 50%', pointerEvents: 'none' }} />
              new game ✦
            </motion.button>

            {/* Join Game */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={openJoin}
              style={{
                width: '100%',
                padding: '20px 0',
                borderRadius: 20,
                background: '#fff',
                border: `3px solid ${Y2K.dark}`,
                boxShadow: `0 6px 0 rgba(11,4,41,0.55)`,
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 'clamp(20px, 3vw, 28px)',
                color: Y2K.dark,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.25)', borderRadius: '18px 18px 50% 50%', pointerEvents: 'none' }} />
              join game ✦
            </motion.button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="flex flex-col items-center gap-4"
            style={{ width: 'min(360px, 90vw)' }}
          >
            <div style={{
              fontFamily: Y2K.display,
              fontWeight: 900,
              fontSize: 20,
              color: Y2K.cyan,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              enter room code
            </div>

            {/* Code input */}
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="A1B2"
              maxLength={4}
              style={{
                width: '100%',
                padding: '18px 20px',
                borderRadius: 16,
                background: '#fff',
                border: `3px solid ${error ? '#ef4444' : Y2K.dark}`,
                boxShadow: `0 5px 0 rgba(11,4,41,0.45)`,
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 36,
                color: Y2K.dark,
                textAlign: 'center',
                letterSpacing: '0.25em',
                outline: 'none',
                textTransform: 'uppercase',
              }}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#ef4444', textAlign: 'center' }}
              >
                {error}
              </motion.p>
            )}

            {/* Join button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              style={{
                width: '100%',
                padding: '18px 0',
                borderRadius: 20,
                background: Y2K.hotPink,
                border: `3px solid ${Y2K.dark}`,
                boxShadow: `0 6px 0 rgba(11,4,41,0.55)`,
                fontFamily: Y2K.display,
                fontWeight: 900,
                fontSize: 24,
                color: '#fff',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                WebkitTextStroke: `0.5px ${Y2K.dark}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '18px 18px 50% 50%', pointerEvents: 'none' }} />
              let me in ✦
            </motion.button>

            {/* Back */}
            <button
              onClick={() => setMode('idle')}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: Y2K.body,
                fontWeight: 700,
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              ← back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
