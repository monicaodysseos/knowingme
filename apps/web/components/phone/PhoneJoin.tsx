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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 16);
    if (!trimmed) return;
    onJoin(trimmed);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-10 bg-bg safe-top safe-bottom">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <h1 className="font-black text-5xl">
          <span style={{ color: '#8B5CF6' }}>Ksero</span>
          <span style={{ color: '#0DD3C5' }}>Se</span>
        </h1>
        <p className="text-gray-400 font-semibold text-lg mt-1">Joining room</p>
        <div
          className="font-black text-4xl tracking-widest mt-1"
          style={{ color: '#F59E0B', letterSpacing: '0.15em' }}
        >
          {roomCode}
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2">
          <span className="font-bold text-gray-300 text-lg">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="Enter name…"
            autoFocus
            autoComplete="off"
            maxLength={16}
            className="w-full rounded-2xl px-5 py-4 text-xl font-bold text-white placeholder-gray-600 outline-none border-2 transition-all"
            style={{
              background: '#13132a',
              borderColor: name ? '#8B5CF6' : '#1e1e3a',
              minHeight: 56,
            }}
          />
          <span className="text-right text-gray-500 text-sm">{name.length}/16</span>
        </label>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 font-semibold text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={!name.trim()}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl font-black text-xl text-white disabled:opacity-30 transition-all"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #0DD3C5)',
            minHeight: 56,
          }}
        >
          Join Game 🎮
        </motion.button>
      </motion.form>
    </div>
  );
}
