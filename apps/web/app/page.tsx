'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Y2KAvatar from '../components/tv/Y2KAvatar';

const DARK = '#0b0429';
const CHROME = 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 20%, #e0e0e0 50%, #ffffff 75%, #eeeeee 100%)';
const DISPLAY = "'Rubik', 'Nunito', sans-serif";
const BODY = "'Space Grotesk', 'Nunito', sans-serif";

function Sparkle({ size = 24, color = '#FFE24A', x = 0, y = 0, rotate = 0, className = '' }: { size?: number; color?: string; x?: number; y?: number; rotate?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" fill={color} stroke={DARK} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function FlowerMascot({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(3px 3px 0 ${DARK})`, flexShrink: 0 }}>
      <defs>
        <radialGradient id="flower-chrome" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#d8e4f5" />
          <stop offset="0.7" stopColor="#8aa2bf" />
          <stop offset="1" stopColor="#eaf1fb" />
        </radialGradient>
      </defs>
      <g stroke={DARK} strokeWidth="3" strokeLinejoin="round">
        <circle cx="50" cy="22" r="18" fill="url(#flower-chrome)" />
        <circle cx="78" cy="42" r="18" fill="url(#flower-chrome)" />
        <circle cx="68" cy="76" r="18" fill="url(#flower-chrome)" />
        <circle cx="32" cy="76" r="18" fill="url(#flower-chrome)" />
        <circle cx="22" cy="42" r="18" fill="url(#flower-chrome)" />
      </g>
      <circle cx="50" cy="50" r="16" fill={DARK} stroke={DARK} strokeWidth="3" />
      <circle cx="50" cy="50" r="10" fill="#FF1E8E" />
    </svg>
  );
}

// Desktop-only side peekers
const PEEKERS: { id: string; x: number; y: number; rot: number }[] = [
  { id: 'ghost',    x: 28,  y: 90,  rot: -8 },
  { id: 'frog',     x: 20,  y: 230, rot: 6  },
  { id: 'alien',    x: 32,  y: 375, rot: -4 },
  { id: 'tamago',   x: 900, y: 90,  rot: 7  },
  { id: 'mushroom', x: 916, y: 230, rot: -5 },
];

// Mobile avatar row
const MOBILE_AVATARS = ['ghost', 'frog', 'alien', 'bunny', 'tamago'];

const MARQUEE_ITEMS = [
  '… exposing yr group chat',
  '★ no awkward icebreakers',
  '✿ best 4 dinner parties',
  '✦ the truth comes out',
  '★ host on tv · play on phone',
  '✿ no app · just kserose.com',
];

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    router.push(`/play?room=${trimmed.slice(0, 4)}`);
  };

  const letters = code.padEnd(4, '').split('').slice(0, 4);

  return (
    <div className="landing-page" style={{ background: '#170A3B', fontFamily: BODY, minHeight: '100dvh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Background glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 50% 100%, rgba(255,30,142,0.20) 0%, transparent 55%),
          radial-gradient(ellipse at 15% 0%, rgba(0,213,255,0.15) 0%, transparent 50%),
          linear-gradient(180deg, #170A3B 0%, #0E0628 100%)
        `,
      }} />
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
      }} />

      {/* Decorative sparkles — desktop only */}
      <Sparkle size={28} color="#00D5FF" x={210} y={120} rotate={10} className="desktop-deco" />
      <Sparkle size={20} color="#FFE24A" x={750} y={70} rotate={-8} className="desktop-deco" />
      <Sparkle size={18} color="#fff" x={250} y={400} rotate={0} className="desktop-deco" />

      {/* Desktop side peekers */}
      {PEEKERS.map((p) => (
        <div key={p.id} className="desktop-deco" style={{
          position: 'absolute', left: p.x, top: p.y,
          width: 72, height: 72,
          background: '#fff', border: `3px solid ${DARK}`, borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          boxShadow: `0 6px 0 ${DARK}`,
          transform: `rotate(${p.rot}deg)`,
          zIndex: 2,
        }}>
          <Y2KAvatar avatar={p.id} size={58} />
        </div>
      ))}

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 3,
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'clamp(32px, 6vh, 56px) clamp(16px, 5vw, 48px) 0',
      }}>

        {/* Wordmark + flower */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140 }}
          style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 18px)', position: 'relative' }}
        >
          <h1 style={{
            fontFamily: DISPLAY, fontWeight: 900,
            fontSize: 'clamp(52px, 12vw, 132px)',
            letterSpacing: '-0.04em', margin: 0, lineHeight: 0.9,
            background: CHROME, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            WebkitTextStroke: 'clamp(1.5px, 0.3vw, 3px) rgba(11,4,41,0.6)',
            filter: `drop-shadow(4px 4px 0 ${DARK})`,
            transform: 'rotate(-2deg)',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
          }}>
            ksero<span style={{ WebkitTextFillColor: DARK, background: 'none', margin: '0 0.1em', fontSize: '0.72em', position: 'relative', top: '-0.06em' }}>·</span>se
          </h1>
          <FlowerMascot size={Math.max(48, 92)} />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            marginTop: 'clamp(10px, 2vh, 20px)',
            fontFamily: DISPLAY, fontWeight: 800,
            fontSize: 'clamp(13px, 3.5vw, 22px)',
            color: '#00D5FF', textShadow: `2px 2px 0 ${DARK}`,
            textAlign: 'center', maxWidth: '80vw',
          }}
        >
          the party game where you <i style={{ color: '#FFE24A' }}>think</i> you know your friends …
        </motion.div>

        {/* Mobile avatar row */}
        <div className="mobile-only" style={{ display: 'flex', marginTop: 16 }}>
          {MOBILE_AVATARS.map((id, i) => (
            <div key={id} style={{
              marginLeft: i === 0 ? 0 : -10,
              width: 42, height: 42,
              background: '#fff', border: `2.5px solid ${DARK}`, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              boxShadow: `0 3px 0 ${DARK}`,
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 5}deg)`,
              zIndex: MOBILE_AVATARS.length - i,
            }}>
              <Y2KAvatar avatar={id} size={32} />
            </div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 140, delay: 0.15 }}
          style={{
            marginTop: 'clamp(20px, 4vh, 40px)',
            display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vh, 16px)',
            width: 'min(460px, 92vw)',
          }}
        >
          {/* NEW GAME */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/tv')}
            style={{
              background: '#FF1E8E', borderRadius: 999,
              border: `3px solid ${DARK}`,
              padding: 'clamp(14px, 2.5vh, 20px) 28px',
              boxShadow: `0 6px 0 ${DARK}, 0 10px 24px rgba(255,30,142,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              cursor: 'pointer', position: 'relative', width: '100%',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.18)', borderRadius: '999px 999px 50% 50%', pointerEvents: 'none' }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(20px, 5vw, 32px)', color: '#fff', WebkitTextStroke: `1px ${DARK}`, letterSpacing: -0.5 }}>
              new game
            </span>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>✦</span>
            <div style={{
              position: 'absolute', top: -10, right: 24,
              background: '#FFE24A', color: DARK,
              fontFamily: DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1.5,
              padding: '3px 10px', borderRadius: 999,
              border: `2px solid ${DARK}`, boxShadow: `0 3px 0 ${DARK}`,
              transform: 'rotate(8deg)',
            }}>HOST ···</div>
          </motion.button>

          {/* JOIN WITH CODE */}
          <div
            style={{
              background: '#fff', borderRadius: 999,
              border: `3px solid ${DARK}`,
              padding: 'clamp(10px, 1.5vh, 14px) 10px clamp(10px, 1.5vh, 14px) clamp(16px, 4vw, 28px)',
              boxShadow: `0 6px 0 ${DARK}`,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'text',
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(16px, 4vw, 24px)', color: DARK, letterSpacing: -0.5, whiteSpace: 'nowrap', flexShrink: 0 }}>
              join with code
            </span>
            {/* Letter boxes */}
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', gap: 4,
              background: error ? 'rgba(255,30,142,0.08)' : 'rgba(11,4,41,0.06)',
              borderRadius: 999, padding: '5px 6px',
              border: `2px dashed ${error ? '#FF1E8E' : DARK}`,
              justifyContent: 'center', minWidth: 0,
            }}>
              {letters.map((ch, i) => (
                <div key={i} style={{
                  width: 'clamp(24px, 6vw, 32px)', height: 'clamp(24px, 6vw, 32px)', borderRadius: 7,
                  background: '#fff',
                  border: `2px solid ${ch ? DARK : 'rgba(11,4,41,0.3)'}`,
                  display: 'grid', placeItems: 'center',
                  fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(13px, 3.5vw, 18px)', color: DARK,
                  boxShadow: ch ? `0 2px 0 ${DARK}` : 'none',
                }}>{ch}</div>
              ))}
            </div>
            {/* Arrow */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={(e) => { e.stopPropagation(); handleJoin(); }}
              style={{
                background: '#00D5FF', border: `2.5px solid ${DARK}`, borderRadius: 999,
                width: 'clamp(36px, 8vw, 44px)', height: 'clamp(36px, 8vw, 44px)',
                display: 'grid', placeItems: 'center',
                boxShadow: `0 3px 0 ${DARK}`,
                fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(16px, 4vw, 22px)', color: DARK,
                cursor: 'pointer', flexShrink: 0,
              }}
            >↵</motion.button>
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              setError(false);
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4));
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={4}
            inputMode="text"
            autoCapitalize="characters"
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            aria-label="Room code"
          />
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: 'clamp(16px, 3vh, 36px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)',
            padding: 'clamp(7px, 1.2vh, 10px) clamp(12px, 3vw, 20px)',
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            borderRadius: 999, backdropFilter: 'blur(8px)',
            flexWrap: 'nowrap',
          }}
        >
          {[
            { k: '3', l: 'phases' },
            { k: '3+', l: 'players' },
            { k: '~10', l: 'min' },
            { k: '✦', l: 'shade' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(13px, 3.5vw, 18px)', color: '#FFE24A', WebkitTextStroke: `0.5px ${DARK}`, whiteSpace: 'nowrap' }}>{s.k}</span>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 'clamp(9px, 2vw, 11px)', color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>{s.l}</span>
              {i < 3 && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'clamp(2px, 1vw, 6px)' }}>·</span>}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Marquee */}
      <div style={{
        marginTop: 'clamp(20px, 4vh, 32px)',
        width: '100%', height: 36, overflow: 'hidden',
        background: DARK,
        borderTop: '2.5px solid rgba(255,255,255,0.2)',
        borderBottom: '2.5px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 48, paddingLeft: 32,
          animation: 'marquee 28s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
            <span key={i} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: 1 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ height: 'clamp(16px, 3vh, 32px)', background: '#0E0628', flexShrink: 0 }} />

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* Hide desktop-only elements on mobile */
        @media (max-width: 640px) {
          .desktop-deco { display: none !important; }
          .mobile-only { display: flex !important; }
        }

        /* Show desktop elements, hide mobile row on desktop */
        @media (min-width: 641px) {
          .desktop-deco { display: block !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
