'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, getSocket } from '../socket';
import type { TVState, PhoneState, JoinPayload, JoinAck } from '@ksero-se/types';

// ── TV hook ────────────────────────────────────────────────────────────────

export function useTVSocket(roomCode: string, onRoomExpired?: () => void) {
  const [state, setState] = useState<TVState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setConnected(true);
      const payload: JoinPayload = { roomCode, name: '', role: 'tv' };
      socket.emit('join', payload, (ack: JoinAck) => {
        if (!ack.ok) {
          // Room gone (server restarted) — let parent create a new one.
          onRoomExpired?.();
        }
      });
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
  }, [roomCode, onRoomExpired]);

  const hostStart = useCallback(() => {
    getSocket().emit('host:start', (res?: { ok: boolean; error?: string }) => {
      if (res && !res.ok) console.warn('[hostStart] server rejected:', res.error);
    });
  }, []);
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

  // ── Refs that must NOT trigger re-renders when they change ────────────────
  // Storing the token in a ref (not state) is critical: a state change here
  // would recreate the `doJoin` callback → re-run the effect → spurious
  // second join with whatever name happens to be in closure at that moment.
  const tokenRef = useRef<string | null>(sessionToken ?? null);
  const joinedRef = useRef(false);

  // One-way sync: accept an externally-provided session token (from localStorage,
  // loaded after mount) into the ref without triggering a re-render loop.
  useEffect(() => {
    if (sessionToken && !tokenRef.current) {
      tokenRef.current = sessionToken;
    }
  }, [sessionToken]);

  // doJoin only changes when roomCode or name change — NOT when the token
  // changes, because the token is read from the ref at call time.
  const doJoin = useCallback((socket: ReturnType<typeof connectSocket>) => {
    if (joinedRef.current) return;
    // Don't attempt a join with an empty name — wait for the user to type one.
    if (!name.trim()) return;
    joinedRef.current = true;

    const payload: JoinPayload = {
      roomCode,
      name,
      sessionToken: tokenRef.current ?? undefined,
      role: 'player',
    };

    socket.emit('join', payload, (ack: JoinAck) => {
      if (!ack.ok) {
        setJoinError(ack.error ?? 'Failed to join');
        joinedRef.current = false; // allow retry
        return;
      }

      setJoinError(null);
      setPlayerId(ack.playerId ?? null);

      if (ack.sessionToken) {
        // Store in ref only — no setState, so no cascade re-render/re-join.
        tokenRef.current = ack.sessionToken;
        try {
          sessionStorage.setItem('ksero-session', ack.sessionToken);
          sessionStorage.setItem('ksero-room', roomCode);
        } catch {}
      }
    });
  }, [roomCode, name]); // token intentionally NOT in deps — read via ref

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setConnected(true);
      doJoin(socket);
    };

    const handleDisconnect = () => {
      setConnected(false);
      joinedRef.current = false; // must be reset so reconnect can re-join
    };

    const handleUpdate = (data: PhoneState) => setPhoneState(data);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('phone:update', handleUpdate);

    // If socket is already connected when this effect runs (name changed),
    // call doJoin immediately — but joinedRef guards against a double-call
    // within the same connection so this is safe.
    if (socket.connected) {
      setConnected(true);
      doJoin(socket);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('phone:update', handleUpdate);
    };
  }, [doJoin]); // re-runs only when roomCode or name change

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
    submitQuestions,
    submitAnswer,
    submitGuess,
    markGuess,
    playAgain,
  };
}
