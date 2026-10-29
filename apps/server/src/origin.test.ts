import express from 'express';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { describe, expect, it } from 'vitest';
import { isAllowedOrigin, rejectUnlistedOrigin } from './origins';

function listen(app: express.Express): Promise<{ port: number; close: () => Promise<void> }> {
  const server = createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        port,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

describe('origin checks', () => {
  it('treats a missing origin as a non browser client and rejects an unlisted one', () => {
    expect(isAllowedOrigin(undefined)).toBe(true);
    expect(isAllowedOrigin('')).toBe(true);
    expect(isAllowedOrigin('https://kserose.com')).toBe(true);
    expect(isAllowedOrigin('https://evil.example')).toBe(false);
  });

  it('returns 403 for a state changing request from an unlisted origin and still creates a room otherwise', async () => {
    const app = express();
    app.use(express.json());
    app.use(rejectUnlistedOrigin);
    let created = 0;
    app.post('/api/rooms', (_req, res) => {
      created += 1;
      res.json({ roomCode: 'ABCD' });
    });
    app.get('/api/rooms/ABCD', (_req, res) => res.json({ ok: true }));
    const { port, close } = await listen(app);

    const evil = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: '{}',
    });
    expect(evil.status).toBe(403);
    expect(created).toBe(0);

    const browser = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://kserose.com' },
      body: '{}',
    });
    expect(browser.status).toBe(200);
    expect(created).toBe(1);

    const curl = await fetch(`http://127.0.0.1:${port}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(curl.status).toBe(200);
    expect(created).toBe(2);

    const lookup = await fetch(`http://127.0.0.1:${port}/api/rooms/ABCD`, {
      headers: { Origin: 'https://evil.example' },
    });
    expect(lookup.status).toBe(200);

    await close();
  });

  it('refuses a Socket.IO handshake from an unlisted origin', async () => {
    const httpServer = createServer();
    const io = new Server(httpServer, {
      allowRequest: (req, callback) => {
        const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
        if (isAllowedOrigin(origin)) callback(null, true);
        else callback('Origin not allowed', false);
      },
    });
    io.on('connection', (socket) => socket.emit('ready'));
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (httpServer.address() as AddressInfo).port;
    const url = `http://127.0.0.1:${port}`;

    const denied = ioClient(url, {
      transports: ['polling'],
      extraHeaders: { Origin: 'https://evil.example' },
    });
    const denial = await new Promise<string>((resolve) => {
      denied.on('connect', () => resolve('connected'));
      denied.on('connect_error', (err) => resolve(err.message));
    });
    expect(denial).not.toBe('connected');
    denied.close();

    const allowed = ioClient(url, { transports: ['polling'] });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no origin client did not connect')), 4000);
      allowed.on('connect', () => { clearTimeout(timer); resolve(); });
    });
    allowed.close();
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });
});
