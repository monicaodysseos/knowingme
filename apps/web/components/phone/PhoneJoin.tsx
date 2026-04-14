'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_CHARACTERS, type PlayerCharacter } from '@ksero-se/types';
import CharacterShape from '../tv/CharacterShape';

interface Props {
  roomCode: string;
  onJoin: (name: string, avatar: PlayerCharacter) => void;
  error?: string | null;
}

const CHAR_LABELS: Record<PlayerCharacter, string> = {
  blob: 'Blob', star: 'Star', diamond: 'Diamond', cloud: 'Cloud',
  hex: 'Hex', drop: 'Drop', shield: 'Shield', crown: 'Crown',
};

export default function PhoneJoin({ roomCode, onJoin, error }: Props) {
  const [step, setStep] = useState<'avatar' | 'name'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<PlayerCharacter | null>(null);
  const [name, setName] = useState('');

  const canAdvance = selectedAvatar !== null;
  const canJoin = name.trim().length > 0 && selectedAvatar !== null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF8F0' }}>
      {/* Top accent bar */}
      <div
        className="w-full flex-shrink-0"
        style={{ height: 8, background: 'linear-gradient(90deg, #F97316, #FF6B6B, #F59E0B, #8B5CF6)' }}
      />

      <div className="flex-1 flex flex-col px-5 pt-6 pb-8 gap-5">
        {/* Room badge + heading */}
        <div className="text-center">
          <div
            className="inline-block px-4 py-1.5 rounded-full font-black text-white text-sm tracking-widest mb-3"
            style={{ background: '#F97316' }}
          >
            ROOM {roomCode}
          </div>
          <h1 className="font-black text-gray-900" style={{ fontSize: 26, letterSpacing: '-0.5px' }}>
            {step === 'avatar' ? 'Pick your character' : 'What\'s your name?'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {step === 'avatar' ? 'Choose who you\'ll be this round' : 'Up to 16 characters'}
          </p>
        </div>

        {/* Step progress dots */}
        <div className="flex justify-center gap-2">
          {(['avatar', 'name'] as const).map((s) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? 24 : 10,
                height: 10,
                background: s === step || (step === 'name' && s === 'avatar') ? '#F97316' : '#E5E7EB',
              }}
            />
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
                      className="flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 transition-all duration-150"
                      style={{
                        background: isSelected ? '#FFF0E0' : '#ffffff',
                        border: `3px solid ${isSelected ? '#F97316' : '#E5E7EB'}`,
                        boxShadow: isSelected ? '0 4px 14px #F9731633' : '0 1px 4px #0001',
                        transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                      }}
                    >
                      <CharacterShape shape={char} color={isSelected ? '#F97316' : '#9CA3AF'} size={48} />
                      <span
                        className="font-bold text-xs"
                        style={{ color: isSelected ? '#F97316' : '#9CA3AF' }}
                      >
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
                className="w-full py-4 rounded-full font-black text-white text-lg disabled:opacity-30 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
              >
                Continue
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
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: '#FFF0E0', border: '3px solid #F97316' }}
                  >
                    <CharacterShape shape={selectedAvatar} color="#F97316" size={72} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('avatar')}
                    className="text-sm font-bold underline"
                    style={{ color: '#9CA3AF' }}
                  >
                    Change character
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  placeholder="Your name"
                  autoFocus
                  autoComplete="off"
                  maxLength={16}
                  className="w-full rounded-2xl px-5 py-4 font-bold text-gray-900 placeholder-gray-300 outline-none bg-white"
                  style={{
                    fontSize: 20,
                    border: '3px solid #F97316',
                    boxShadow: '0 2px 12px #F9731622',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canJoin) onJoin(name.trim(), selectedAvatar!); }}
                />
                <span className="text-right text-gray-400 text-xs">{name.length}/16</span>
              </div>

              {error && (
                <div
                  className="rounded-2xl px-4 py-3 font-bold text-sm text-center"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '2px solid #FCA5A5' }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!canJoin}
                onClick={() => canJoin && onJoin(name.trim(), selectedAvatar!)}
                className="w-full py-5 rounded-full font-black text-white text-xl disabled:opacity-30 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
              >
                Join Game
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
