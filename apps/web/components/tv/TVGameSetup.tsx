'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameSettings } from '@ksero-se/types';
import { DEFAULT_SETTINGS } from '@ksero-se/types';
import { Y2K } from '../../lib/y2k';

interface Props {
  onConfirm: (settings: GameSettings) => void;
}

function Sticker({ color, r = 20, rotate = 0, style = {}, children }: { color: string; r?: number; rotate?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: color,
      borderRadius: r,
      transform: `rotate(${rotate}deg)`,
      border: `3px solid ${Y2K.dark}`,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.7), 0 6px 0 rgba(11,4,41,0.45)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 4, left: 12, right: 12, height: '35%', background: 'linear-gradient(180deg,rgba(255,255,255,0.8) 0%,rgba(255,255,255,0) 100%)', borderRadius: `${r}px ${r}px 50% 50%`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

interface StepperProps {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accentColor: string;
}

function Stepper({ label, sublabel, value, min, max, onChange, accentColor }: StepperProps) {
  return (
    <Sticker color="#fff" r={22} style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Label */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 20, color: Y2K.dark, letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
            {label}
          </div>
          <div style={{ fontFamily: Y2K.body, fontWeight: 600, fontSize: 13, color: '#3a1555', marginTop: 3, opacity: 0.75 }}>
            {sublabel}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: value <= min ? '#e5e7eb' : Y2K.dark,
              border: `2.5px solid ${Y2K.dark}`,
              boxShadow: value <= min ? 'none' : `0 3px 0 rgba(11,4,41,0.5)`,
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 22,
              color: value <= min ? '#9ca3af' : '#fff',
              cursor: value <= min ? 'not-allowed' : 'pointer',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              lineHeight: 1,
            }}
          >−</motion.button>

          <div style={{
            minWidth: 48, textAlign: 'center',
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 36,
            color: accentColor,
            WebkitTextStroke: `1.5px ${Y2K.dark}`,
            textShadow: `2px 2px 0 ${Y2K.dark}`,
            letterSpacing: '-1px',
          }}>
            {value}
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: value >= max ? '#e5e7eb' : accentColor,
              border: `2.5px solid ${Y2K.dark}`,
              boxShadow: value >= max ? 'none' : `0 3px 0 rgba(11,4,41,0.5)`,
              fontFamily: Y2K.display, fontWeight: 900, fontSize: 22,
              color: value >= max ? '#9ca3af' : '#fff',
              cursor: value >= max ? 'not-allowed' : 'pointer',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              lineHeight: 1,
            }}
          >+</motion.button>
        </div>
      </div>
    </Sticker>
  );
}

export default function TVGameSetup({ onConfirm }: Props) {
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  // Rough estimate: ~90 s per question turn (guess + reveal + score)
  const estimatedMins = Math.round(
    (settings.questionsToAnswer * settings.maxPlayers * 90) / 60,
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: Y2K.bg, fontFamily: Y2K.body }}
    >
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(12,6,40,0.12) 100%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150 }}
        style={{
          position: 'relative', zIndex: 1,
          width: 'min(560px, 92vw)',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{
            fontFamily: Y2K.display, fontWeight: 900, fontSize: 56,
            letterSpacing: '-0.03em', lineHeight: 0.9,
            color: 'transparent',
            background: 'linear-gradient(180deg, #ffffff 0%, #d8e4f5 40%, #8aa2bf 55%, #eaf1fb 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextStroke: '2.5px #0b0429',
            filter: `drop-shadow(3px 3px 0 ${Y2K.hotPink}) drop-shadow(6px 6px 0 #0b0429)`,
            transform: 'rotate(-2deg)',
            display: 'inline-block',
            textTransform: 'uppercase',
          }}>
            game setup
          </div>
          <p style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 14, color: '#3a1555', marginTop: 10, opacity: 0.8 }}>
            configure your game before creating the room
          </p>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Stepper
            label="max players"
            sublabel="maximum players who can join"
            value={settings.maxPlayers}
            min={3}
            max={12}
            onChange={(v) => update('maxPlayers', v)}
            accentColor={Y2K.hotPink}
          />
          <Stepper
            label="questions to write"
            sublabel="questions each player submits"
            value={settings.questionsToWrite}
            min={1}
            max={5}
            onChange={(v) => update('questionsToWrite', v)}
            accentColor={Y2K.cyan}
          />
          <Stepper
            label="questions to answer"
            sublabel="questions each player answers"
            value={settings.questionsToAnswer}
            min={2}
            max={10}
            onChange={(v) => update('questionsToAnswer', v)}
            accentColor={Y2K.yellow}
          />
        </div>

        {/* Estimated time badge */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Sticker color={Y2K.dark} r={999} rotate={-1} style={{ padding: '7px 18px' }}>
            <span style={{ fontFamily: Y2K.display, fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: 0.5 }}>
              ≈ {estimatedMins} min game · {settings.questionsToAnswer * settings.maxPlayers} total turns
            </span>
          </Sticker>
        </div>

        {/* Create button */}
        <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}>
          <Sticker
            color={Y2K.hotPink}
            r={20}
            rotate={-0.5}
            style={{
              padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <button
              onClick={() => onConfirm(settings)}
              style={{
                fontFamily: Y2K.display, fontWeight: 900, fontSize: 28, color: '#fff',
                background: 'none', border: 'none', cursor: 'pointer',
                WebkitTextStroke: `1px ${Y2K.dark}`,
                textShadow: `2px 2px 0 ${Y2K.dark}`,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}
            >
              create game ▶︎
            </button>
          </Sticker>
        </motion.div>
      </motion.div>
    </div>
  );
}
