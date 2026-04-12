'use client';

import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  state: TVState;
  onStart: () => void;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function TVLobby({ state, onStart }: Props) {
  const { roomCode, players } = state;
  const canStart = players.length >= 3;
  const joinUrl = `${SERVER_URL}/play?room=${roomCode}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-12 py-10 bg-bg">
      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <h1 className="font-black text-8xl tracking-tight leading-none">
          <span style={{ color: '#8B5CF6' }}>Ksero</span>
          <span style={{ color: '#0DD3C5' }}>Se</span>
        </h1>
        <p className="text-2xl text-gray-400 font-semibold mt-2">
          How well do you know each other?
        </p>
      </motion.div>

      <div className="flex items-start gap-16">
        {/* QR + Room code */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#0d0d1a"
              level="M"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-semibold text-lg">Scan to join · or go to</p>
            <p className="text-white font-bold text-xl">/play?room=</p>
            <div
              className="font-black text-7xl tracking-widest mt-1"
              style={{ color: '#F59E0B', letterSpacing: '0.15em' }}
            >
              {roomCode}
            </div>
          </div>
        </motion.div>

        {/* Player list */}
        <div className="flex flex-col gap-4 min-w-[300px]">
          <h2 className="font-black text-3xl text-gray-300">
            Players ({players.length}/8)
          </h2>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: `${p.color.hex}18`,
                    border: `1px solid ${p.color.hex}44`,
                  }}
                >
                  <PlayerAvatar name={p.name} color={p.color} size="sm" />
                  <span className="font-bold text-xl" style={{ color: p.color.hex }}>
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span className="ml-auto text-sm font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                      HOST
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Start button */}
          <motion.div className="mt-4" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-5 rounded-2xl font-black text-2xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canStart
                  ? 'linear-gradient(135deg, #8B5CF6, #0DD3C5)'
                  : '#333',
                boxShadow: canStart ? '0 0 40px #8B5CF655' : 'none',
                color: '#fff',
              }}
            >
              {canStart ? '▶ Start Game' : `Need ${3 - players.length} more player${3 - players.length !== 1 ? 's' : ''}`}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
