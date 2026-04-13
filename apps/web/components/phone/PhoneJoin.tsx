'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  roomCode: string;
  onJoin: (name: string) => void;
  error?: string | null;
}

export default function PhoneJoin({ roomCode, onJoin, error }: Props) {
  const [name, setName] = useState('');

  const handleJoin = () => {
    const trimmed = name.trim().slice(0, 16);
    if (!trimmed) return;
    onJoin(trimmed);
  };

  return (
    <div
      className="min-h-screen flex flex-col safe-top safe-bottom"
      style={{ background: '#FFF5E0' }}
    >
      {/* Orange header band */}
      <div
        className="px-6 pt-12 pb-10 flex flex-col items-center"
        style={{ background: 'linear-gradient(135deg, #F97316, #FF6B6B)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="font-bold leading-none" style={{ fontSize: 56, color: '#fff' }}>
            Ksero<span style={{ color: '#FFD23F' }}>Se</span>
          </h1>
          <p className="text-white/80 font-semibold text-lg mt-1">Joining room</p>
          <div
            className="font-bold tracking-[0.2em] mt-1"
            style={{ fontSize: 52, color: '#FFD23F' }}
          >
            {roomCode}
          </div>
        </motion.div>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-5 -mt-6 bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-bold text-gray-700 text-lg">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Enter your name…"
              autoFocus
              autoComplete="off"
              maxLength={16}
              className="w-full rounded-2xl px-5 py-4 text-xl font-bold text-gray-900 placeholder-gray-300 outline-none border-2 transition-all"
              style={{
                background: '#FFF5E0',
                borderColor: name ? '#F97316' : '#FFD23F',
              }}
            />
            <span className="text-right text-gray-400 text-sm">{name.length}/16</span>
          </label>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 font-semibold text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="button"
            disabled={!name.trim()}
            onClick={handleJoin}
            className="w-full py-5 rounded-2xl font-bold text-xl disabled:opacity-40 transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #F97316, #FF6B6B)',
              color: '#fff',
              minHeight: 60,
              fontSize: 22,
            }}
          >
            Join Game 🎮
          </button>
        </div>
      </motion.div>
    </div>
  );
}
