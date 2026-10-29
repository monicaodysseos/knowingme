import { createServer } from 'http';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import type { FakesView, PhoneState, PlayerCharacter, TVState } from '@ksero-se/types';
import { PLAYER_CHARACTERS } from '@ksero-se/types';
import { createFakesRoom, resetFakesRooms, resetSeenHow } from '../fakesRooms';
import { registerSocketHandlers } from '../socketHandlers';
import { resetRateLimits } from '../rateLimit';
import { sanitizeFakesSettings } from '../settings';
import { rulesMode } from '../rules';

const CHARACTER_NAMES = ['ghost', 'alien', 'frog', 'bunny', 'shroom', 'robot', 'melt', 'tamago'];

describe('fakes games over sockets', () => {
  let port = 0;
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;

  beforeAll(async () => {
    process.env.KSEROSE_RULES = 'fakes';
    process.env.KSEROSE_FAKES_TIMER_SCALE = '0.02';
    const app = express();
    app.use(express.json());
    httpServer = createServer(app);
    io = new Server(httpServer, { transports: ['websocket'] });
    io.on('connection', (socket) => registerSocketHandlers(io, socket));
    app.post('/api/rooms', (req, res) => {
      if (rulesMode() !== 'fakes') {
        res.status(400).json({ error: 'switch off' });
        return;
      }
      const created = createFakesRoom(io, sanitizeFakesSettings(req.body?.settings));
      if (!created) {
        res.status(503).json({ error: 'full' });
        return;
      }
      res.json(created);
    });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    port = (httpServer.address() as { port: number }).port;
  });

  afterAll(async () => {
    resetFakesRooms();
    resetSeenHow();
    delete process.env.KSEROSE_RULES;
    delete process.env.KSEROSE_FAKES_TIMER_SCALE;
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  for (const players of [2, 3, 4, 8]) {
    for (const longGame of [false, true]) {
      it(`plays ${players} players, ${longGame ? 'long' : 'short'}`, async () => {
        resetRateLimits();
        const created = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { maxPlayers: Math.max(players, 8), questionsToWrite: 1, longGame } }),
        }).then((response) => response.json() as Promise<{ roomCode: string; hostSecret: string }>);
        expect(created.roomCode).toMatch(/^[A-Z0-9]{4}$/);

        const clients: ClientSocket[] = [];
        const connect = () => new Promise<ClientSocket>((resolve, reject) => {
          const client = ioClient(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });
          clients.push(client);
          client.on('connect', () => resolve(client));
          client.on('connect_error', reject);
        });

        const phases: string[] = [];
        const revealLines: string[] = [];
        const views = new Map<ClientSocket, FakesView>();
        const savedPrompts = new Map<ClientSocket, NonNullable<FakesView['prompts']>>();
        let howMs = 0;
        const track = (client: ClientSocket) => {
          client.on('phone:update', (state: PhoneState) => {
            const view = state.fakes;
            if (!view) return;
            views.set(client, view);
            if (view.prompts && view.prompts.length > 0) savedPrompts.set(client, view.prompts);
            phases.push(view.phase);
            if (view.phase === 'HOW_IT_WORKS' && !howMs) howMs = view.timerTotalMs;
            if (view.reveal) revealLines.push(...view.reveal.lines);
          });
        };

        const tv = await connect();
        const tvView = { current: null as FakesView | null };
        tv.on('tv:update', (state: TVState) => { tvView.current = state.fakes ?? null; });
        const tvAck = await emit<{ ok: boolean }>(tv, 'join', {
          roomCode: created.roomCode, name: '', role: 'tv', hostSecret: created.hostSecret,
        });
        expect(tvAck.ok).toBe(true);

        const phones: ClientSocket[] = [];
        for (let i = 0; i < players; i++) {
          const phone = await connect();
          track(phone);
          phones.push(phone);
          const ack = await emit<{ ok: boolean; error?: string }>(phone, 'join', {
            roomCode: created.roomCode,
            name: `P${i}`,
            role: 'player',
            avatar: PLAYER_CHARACTERS[i] as PlayerCharacter,
          });
          expect(ack.ok).toBe(true);
        }

        expect((await emit<{ ok: boolean }>(phones[0], 'host:start', {})).ok).toBe(true);
        await waitUntil(() => phases.includes('WRITE'), 'write');
        expect(howMs).toBe(longGame ? 25_000 : 20_000);
        expect(phases).toContain('HOW_IT_WORKS');

        for (const phone of phones) {
          const ack = await emit<{ ok: boolean; error?: string }>(phone, 'submit:questions', [`what is something only P knows ${phone.id}`]);
          expect(ack.ok).toBe(true);
        }
        await waitUntil(() => phases.includes('ANSWER'), 'answer');

        await Promise.all(phones.map(async (phone, index) => {
          await waitUntil(
            () => (savedPrompts.get(phone)?.length ?? 0) > 0,
            () => `p${index} phase ${views.get(phone)?.phase ?? 'none'}`,
          );
          const prompts = savedPrompts.get(phone) ?? [];
          const ack = await emit<{ ok: boolean; error?: string }>(phone, 'submit:answer', {
            answers: prompts.map((prompt) => ({ assignmentId: prompt.id, text: `real ${phone.id}` })),
          });
          expect(ack.ok).toBe(true);
        }));

        let guard = 0;
        while (!phases.includes('AWARDS') && guard < 400) {
          guard += 1;
          const view = views.get(phones[0]);
          if (!view) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            continue;
          }
          if (view.phase === 'FAKE') {
            for (const phone of phones) {
              const mine = views.get(phone);
              if (!mine || mine.phase !== 'FAKE' || mine.isSubject || mine.submitted) continue;
              await emit(phone, 'submit:fake', { text: `sounds like them ${phone.id}` });
            }
          } else if (view.phase === 'VOTE') {
            for (const phone of phones) {
              const mine = views.get(phone);
              if (!mine || mine.phase !== 'VOTE' || mine.submitted) continue;
              const choice = (mine.options ?? []).find((option) => !option.disabled);
              if (mine.isSubject) await emit(phone, 'submit:literally', { optionId: choice?.id ?? null });
              else if (choice) await emit(phone, 'submit:vote', { optionId: choice.id });
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 15));
        }

        expect(phases).toContain('FAKE');
        expect(phases).toContain('VOTE');
        expect(phases).toContain('REVEAL');
        expect(phases).toContain('CROWN');
        expect(phases).toContain('AWARDS');
        expect(tvView.current?.phase).toBe('AWARDS');
        expect((tvView.current?.turnTotal ?? 0)).toBeGreaterThan(0);
        const decoyHit = revealLines.some((line) => (
          line.startsWith('fake by ') && CHARACTER_NAMES.some((name) => line === `fake by ${name}`)
        ));
        if (players <= 3) expect(decoyHit).toBe(true);
        else expect(decoyHit).toBe(false);

        for (const client of clients) client.close();
      }, 40_000);
    }
  }
});

function emit<T>(socket: ClientSocket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ack for ${event}`)), 4_000);
    socket.emit(event, payload, (res: T) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

async function waitUntil(pred: () => boolean, label: string | (() => string)): Promise<void> {
  const start = Date.now();
  while (!pred()) {
    if (Date.now() - start > 4_000) {
      const detail = typeof label === 'function' ? label() : label;
      throw new Error(`timed out waiting for ${detail}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
