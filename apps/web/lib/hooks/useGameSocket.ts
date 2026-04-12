'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, getSocket } from '../socket';
import type { TVState, PhoneState, JoinPayload, JoinAck } from '@ksero-se/types';

// ── TV hook ────────────────────────────────────────────────────────────────

export function useTVSocket(roomCode: string) {
  const [state, setState] = useState<TVState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setConnected(true);
      const payload: JoinPayload = { roomCode, name: '', role: 'tv' };
      socket.emit('join', payload, (_ack: JoinAck) => {});
    };

    const handleDisconnect = () => setConnected(false);
    const handleUpdate = (data: TVState) => setState(data);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('tv:update', handleUpdate);

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('tv:update', handleUpdate);
    };
  }, [roomCode]);

  const hostStart = useCallback(() => getSocket().emit('host:start'), []);
  const playAgain = useCallback(() => getSocket().emit('play:again'), []);

  return { state, connected, hostStart, playAgain };
}

// ── Phone hook ─────────────────────────────────────────────────────────────

interface UsePhoneSocketOptions {
  roomCode: string;
  name: string;
  sessionToken?: string;
}

export function usePhoneSocket({ roomCode, name, sessionToken }: UsePhoneSocketOptions) {
  const [state, setPhoneState] = useState<PhoneState | null>(null);
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [issuedToken, setIssuedToken] = useState<string | null>(sessionToken ?? null);

  const joinedRef = useRef(false);

  const join = useCallback(() => {
    const socket = connectSocket();
    if (joinedRef.current) return;
    joinedRef.current = true;

    const payload: JoinPayload = {
      roomCode,
      name,
      sessionToken: issuedToken ?? undefined,
      role: 'player',
    };

    socket.emit('join', payload, (ack: JoinAck) => {
      if (!ack.ok) {
        setJoinError(ack.error ?? 'Failed to join');
        joinedRef.current = false;
        return;
      }
      setPlayerId(ack.playerId ?? null);
      if (ack.sessionToken) {
        setIssuedToken(ack.sessionToken);
        try {
          localStorage.setItem('ksero-session', ack.sessionToken);
          localStorage.setItem('ksero-room', roomCode);
        } catch {}
      }
    });
  }, [roomCode, name, issuedToken]);

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setConnected(true);
      join();
    };
    const handleDisconnect = () => setConnected(false);
    const handleUpdate = (data: PhoneState) => setPhoneState(data);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('phone:update', handleUpdate);

    if (socket.connected) { handleConnect(); }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('phone:update', handleUpdate);
    };
  }, [join]);

  const submitQuestions = useCallback((questions: string[]) => {
    getSocket().emit('submit:questions', questions);
  }, []);

  const submitAnswer = useCallback((assignmentId: string, answer: string, skipped = false) => {
    getSocket().emit('submit:answer', { assignmentId, answer, skipped });
    try { navigator.vibrate?.(30); } catch {}
  }, []);

  const submitGuess = useCallback((text: string) => {
    getSocket().emit('submit:guess', text);
    try { navigator.vibrate?.(30); } catch {}
  }, []);

  const markGuess = useCallback((guessId: string, isCorrect: boolean) => {
    getSocket().emit('mark:guess', { guessId, isCorrect });
  }, []);

  const playAgain = useCallback(() => {
    getSocket().emit('play:again');
  }, []);

  return {
    state,
    connected,
    joinError,
    playerId,
    sessionToken: issuedToken,
    submitQuestions,
    submitAnswer,
    submitGuess,
    markGuess,
    playAgain,
  };
}
