'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_CHARACTERS, type PlayerCharacter } from '@ksero-se/types';
import Y2KAvatar from '../tv/Y2KAvatar';
import { Y2K } from '../../lib/y2k';

interface Props {
  roomCode: string;
  onJoin: (name: string, avatar: PlayerCharacter) => void;
  error?: string | null;
}

const CHAR_LABELS: Record<PlayerCharacter, string> = {
  star: 'ghost', blob: 'alien', diamond: 'frog', cloud: 'bunny',
  hex: 'shroom', drop: 'robot', shield: 'melt', crown: 'tamago',
};

export default function PhoneJoin({ roomCode, onJoin, error }: Props) {
  const [step, setStep] = useState<'avatar' | 'name'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<PlayerCharacter | null>(null);
  const [name, setName] = useState('');

  const canAdvance = selectedAvatar !== null;
  const canJoin = name.trim().length > 0 && selectedAvatar !== null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: Y2K.cream }}>
      {/* Y2K top bar */}
      <div style={{ height: 10, background: `linear-gradient(90deg, ${Y2K.hotPink}, ${Y2K.pink}, ${Y2K.cyan}, ${Y2K.yellow})`, flexShrink: 0 }} />

      <div className="flex-1 flex flex-col px-5 pt-6 pb-8 gap-5">
        {/* Room badge */}
        <div className="text-center">
          <div
            className="inline-block px-4 py-1.5 rounded-full font-black text-white text-sm mb-3"
            style={{
              background: Y2K.hotPink,
              fontFamily: Y2K.display,
              border: `2px solid ${Y2K.dark}`,
              boxShadow: `0 3px 0 ${Y2K.dark}`,
              letterSpacing: '0.1em',
            }}
          >
            ROOM {roomCode}
          </div>
          <h1 style={{ fontFamily: Y2K.display, fontWeight: 900, fontSize: 22, color: Y2K.dark, letterSpacing: '-0.5px' }}>
            {step === 'avatar' ? 'pick ur character' : "what's ur name?"}
          </h1>
          <p style={{ fontFamily: Y2K.body, fontSize: 13, color: '#3a1555', marginTop: 4 }}>
            {step === 'avatar' ? 'choose who u\'ll be this round' : 'up to 16 chars'}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2">
          {(['avatar', 'name'] as const).map((s) => (
            <div key={s} style={{
              width: s === step ? 24 : 10,
              height: 10,
              borderRadius: 99,
              background: s === step || (step === 'name' && s === 'avatar') ? Y2K.hotPink : '#E5E7EB',
              border: `2px solid ${Y2K.dark}`,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'avatar' ? (
            <motion.div
              key="avatar-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {/* 4×2 character grid */}
              <div className="grid grid-cols-4 gap-3">
                {PLAYER_CHARACTERS.map((char) => {
                  const isSelected = selectedAvatar === char;
                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setSelectedAvatar(char)}
                      style={{
                        background: isSelected ? Y2K.yellow : '#fff',
                        border: `3px solid ${isSelected ? Y2K.dark : '#E5E7EB'}`,
                        borderRadius: 16,
                        padding: '10px 4px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: isSelected ? `0 4px 0 ${Y2K.dark}` : '0 2px 0 rgba(0,0,0,0.15)',
                        transform: isSelected ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
                        transition: 'all 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      <Y2KAvatar avatar={char} size={44} />
                      <span style={{
                        fontFamily: Y2K.display,
                        fontWeight: 800,
                        fontSize: 9,
                        color: isSelected ? Y2K.dark : '#9CA3AF',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        {CHAR_LABELS[char]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep('name')}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 99,
                  fontFamily: Y2K.display,
                  fontWeight: 900,
                  fontSize: 18,
                  color: '#fff',
                  background: canAdvance ? Y2K.hotPink : '#d1d5db',
                  border: `3px solid ${Y2K.dark}`,
                  boxShadow: canAdvance ? `0 5px 0 ${Y2K.dark}` : 'none',
                  cursor: canAdvance ? 'pointer' : 'not-allowed',
                  opacity: canAdvance ? 1 : 0.4,
                  WebkitTextStroke: canAdvance ? `1px ${Y2K.dark}` : 'none',
                  textShadow: canAdvance ? `2px 2px 0 ${Y2K.dark}` : 'none',
                  letterSpacing: '0.05em',
                }}
              >
                next →
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {/* Selected character preview */}
              {selectedAvatar && (
                <div className="flex flex-col items-center gap-3">
                  <div style={{
                    background: Y2K.yellow,
                    border: `3px solid ${Y2K.dark}`,
                    borderRadius: 20,
                    padding: 16,
                    boxShadow: `0 5px 0 ${Y2K.dark}`,
                  }}>
                    <Y2KAvatar avatar={selectedAvatar} size={72} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('avatar')}
                    style={{ fontFamily: Y2K.body, fontWeight: 700, fontSize: 13, color: '#9CA3AF', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    change character
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  placeholder="ur name"
                  autoFocus
                  autoComplete="off"
                  maxLength={16}
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    padding: '16px 20px',
                    fontFamily: Y2K.display,
                    fontWeight: 800,
                    fontSize: 20,
                    color: Y2K.dark,
                    background: '#fff',
                    border: `3px solid ${Y2K.hotPink}`,
                    boxShadow: `0 4px 0 ${Y2K.dark}`,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canJoin) onJoin(name.trim(), selectedAvatar!); }}
                />
                <span style={{ fontFamily: Y2K.body, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{name.length}/16</span>
              </div>

              {error && (
                <div style={{
                  borderRadius: 14,
                  padding: '12px 16px',
                  fontFamily: Y2K.body,
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: `2px solid #FCA5A5`,
                }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!canJoin}
                onClick={() => canJoin && onJoin(name.trim(), selectedAvatar!)}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: 99,
                  fontFamily: Y2K.display,
                  fontWeight: 900,
                  fontSize: 20,
                  color: '#fff',
                  background: canJoin ? Y2K.hotPink : '#d1d5db',
                  border: `3px solid ${Y2K.dark}`,
                  boxShadow: canJoin ? `0 5px 0 ${Y2K.dark}` : 'none',
                  cursor: canJoin ? 'pointer' : 'not-allowed',
                  opacity: canJoin ? 1 : 0.4,
                  WebkitTextStroke: canJoin ? `1px ${Y2K.dark}` : 'none',
                  textShadow: canJoin ? `2px 2px 0 ${Y2K.dark}` : 'none',
                  letterSpacing: '0.05em',
                }}
              >
                let me in ✦
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
