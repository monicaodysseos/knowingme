'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVState } from '@ksero-se/types';
import PlayerAvatar from './PlayerAvatar';

interface Props {
  state: TVState;
  onStart: () => void;
}

export default function TVLobby({ state, onStart }: Props) {
  const { roomCode, players } = state;
  const canStart = players.length >= 3;

  // Use actual origin so QR always points to the live site, not localhost
  const [siteUrl, setSiteUrl] = useState(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  );
  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  const joinUrl = `${siteUrl}/play?room=${roomCode}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-12 py-10 bg-bg">

      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <h1 className="font-bold leading-none" style={{ fontSize: 96 }}>
          <span style={{ color: '#F97316' }}>Ksero</span>
          <span style={{ color: '#FFD23F' }}>Se</span>
        </h1>
        <p className="text-2xl font-semibold mt-1" style={{ color: '#a78bfa' }}>
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
          {/* White chunky QR card */}
          <div className="bg-white rounded-[2rem] p-5 shadow-2xl" style={{ border: '4px solid #F97316' }}>
            <QRCodeSVG
              value={joinUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#0d0818"
              level="M"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-semibold text-lg">Scan to join · or type</p>
            <p className="font-semibold text-lg" style={{ color: '#a78bfa' }}>
              knowingme.vercel.app/play
            </p>
          </div>
          {/* Big room code badge */}
          <div
            className="rounded-[1.5rem] px-8 py-4 text-center shadow-xl"
            style={{ background: '#F97316' }}
          >
            <p className="text-white font-semibold text-base mb-0.5 tracking-widest uppercase">Room Code</p>
            <div className="font-bold text-white tracking-[0.2em]" style={{ fontSize: 72 }}>
              {roomCode}
            </div>
          </div>
        </motion.div>

        {/* Player list */}
        <div className="flex flex-col gap-4 min-w-[320px]">
          <h2 className="font-bold text-3xl text-white">
            Players <span style={{ color: '#FFD23F' }}>({players.length}/8)</span>
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
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-md"
                  style={{ borderLeft: `5px solid ${p.color.hex}` }}
                >
                  <PlayerAvatar name={p.name} color={p.color} avatar={p.avatar} size="sm" />
                  <span className="font-bold text-xl text-gray-900">
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span className="ml-auto text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      HOST
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length < 3 && (
              <p className="text-gray-500 font-semibold text-base pl-1">
                Need {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} to start…
              </p>
            )}
          </div>

          {/* Start button */}
          <motion.div className="mt-4" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-5 rounded-2xl font-bold text-2xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              style={{
                background: canStart
                  ? 'linear-gradient(135deg, #F97316, #FF6B6B)'
                  : '#2a1850',
                boxShadow: canStart ? '0 8px 32px #F9731655' : 'none',
                fontSize: 26,
              }}
            >
              {canStart ? 'Start Game' : 'Waiting for players…'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
