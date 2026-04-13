import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createRoom } from './roomManager';
import { registerSocketHandlers } from './socketHandlers';

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.stack ?? err.message);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  // Log but do NOT exit — an unhandled rejection (e.g. Redis hiccup) should
  // not take down the whole server and kill every in-progress game.
  console.error('[WARN] Unhandled rejection (server continues):', reason);
});

const app = express();
const httpServer = createServer(app);

const ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';

const io = new Server(httpServer, {
  cors: {
    origin: ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Fly.io sticky-session header
  addTrailingSlash: false,
});

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Room creation ───────────────────────────────────────────────────────────

app.post('/api/rooms', (req, res) => {
  const mode = req.body?.mode ?? 'social';
  const roomCode = createRoom(io, mode);
  res.json({ roomCode });
});

app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  // Just check it exists
  const { getRoom } = require('./roomManager');
  const entry = getRoom(code.toUpperCase());
  if (!entry) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true, phase: entry.actor.getSnapshot().value });
});

// ── Socket.IO ───────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// ── Fly.io sticky sessions via fly-replay ───────────────────────────────────
// The lb forwards requests; sticky session is handled at infra level.
// We just need to bind to 0.0.0.0.

const PORT = parseInt(process.env.PORT ?? '3001', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[KseroSe server] listening on port ${PORT}`);
});
