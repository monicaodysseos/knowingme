import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createRoom, getRoom, restoreRoom, setRoomHooks, sweepRooms } from './roomManager';
import { registerSocketHandlers, armRestoredTimers } from './socketHandlers';
import { forgetPersistedRoom, loadRoom, persistRoom, restoreAllRooms, schedulePersist } from './persistence';
import { allowedOrigins, clientIp, isAllowedOrigin } from './origins';
import { rateLimit, pruneRateLimits } from './rateLimit';
import { RATE, sanitizeMode, sanitizeSettings } from './settings';
import { isRoomCode } from './codes';

// Handler failures are caught per room. This listener stops Node from exiting
// the process, which would end every live game. A repeating fatal error is
// still logged and should be treated as a reason to restart the machine.
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception (process kept alive):', err.stack ?? err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[WARN] Unhandled rejection (server continues):', reason);
});

setRoomHooks({
  onChanged: (code) => schedulePersist(code),
  onDeleted: (code) => forgetPersistedRoom(code),
});

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error('Origin not allowed'), false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 64 * 1024,
  // Polling and websocket only. WebTransport stays off.
  transports: ['polling', 'websocket'],
});

// One proxy hop (Fly or Railway). Do not set this to `true`.
app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(null, false);
  },
  credentials: true,
}));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/rooms', async (req, res) => {
  if (!rateLimit(`create:${clientIp(req)}`, RATE.create.limit, RATE.create.windowMs)) {
    res.status(429).json({ error: 'Too many rooms. Wait a moment and try again.' });
    return;
  }
  const mode = sanitizeMode(req.body?.mode);
  const settings = sanitizeSettings(req.body?.settings);
  const created = createRoom(io, mode, settings);
  if (!created) {
    res.status(503).json({ error: 'The server is full. Try again in a few minutes.' });
    return;
  }
  try {
    await persistRoom(created.roomCode);
  } catch (err) {
    console.error('[rooms] persist failed:', err instanceof Error ? err.message : err);
  }
  res.json({ roomCode: created.roomCode, hostSecret: created.hostSecret });
});

app.get('/api/rooms/:code', async (req, res) => {
  if (!rateLimit(`lookup:${clientIp(req)}`, RATE.lookup.limit, RATE.lookup.windowMs)) {
    res.status(429).json({ error: 'Too many lookups. Wait a moment and try again.' });
    return;
  }
  const code = String(req.params.code ?? '').toUpperCase();
  if (!isRoomCode(code)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  let entry = getRoom(code);
  if (!entry) {
    const saved = await loadRoom(code);
    if (saved && restoreRoom(io, saved)) {
      entry = getRoom(code);
      if (entry) armRestoredTimers(io, code);
    }
  }
  if (!entry) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main(): Promise<void> {
  try {
    const restored = await restoreAllRooms(io);
    for (const code of restored) armRestoredTimers(io, code);
    if (restored.length) console.log(`[KseroSe server] restored ${restored.length} room(s)`);
  } catch (err) {
    console.error('[KseroSe server] restore failed:', err instanceof Error ? err.message : err);
  }

  setInterval(() => {
    try {
      const removed = sweepRooms();
      if (removed.length) console.log(`[KseroSe server] swept ${removed.length} idle room(s)`);
      pruneRateLimits();
    } catch (err) {
      console.error('[KseroSe server] sweep failed:', err instanceof Error ? err.message : err);
    }
  }, 30_000).unref();

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[KseroSe server] listening on port ${PORT}`);
    console.log(`[KseroSe server] origins: ${allowedOrigins().join(', ')}`);
  });
}

void main();
