import type { NextFunction, Request, Response } from 'express';
import type { Socket } from 'socket.io';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://kserose.com',
  'https://www.kserose.com',
];

/** Comma separated ALLOWED_ORIGINS, or the single ALLOWED_ORIGIN already used in production. */
export function allowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN;
  if (!raw) return DEFAULT_ORIGINS;
  const list = raw.split(',').map((part) => part.trim()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ORIGINS;
}

export function requestOrigin(headers: { origin?: string | string[] | undefined }): string {
  return headerString(headers.origin);
}

/**
 * A browser always sends Origin on a cross site request. A missing Origin is a
 * non browser client (curl, a platform probe). Those stay allowed. A present
 * Origin must be on the list.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function rejectUnlistedOrigin(req: Request, res: Response, next: NextFunction): void {
  if (!STATE_CHANGING.has(req.method)) {
    next();
    return;
  }
  const origin = requestOrigin(req.headers);
  if (isAllowedOrigin(origin)) {
    next();
    return;
  }
  res.status(403).json({ error: 'Origin not allowed' });
}

/**
 * Prefer the platform client IP header. Express `req.ip` is used only after
 * `trust proxy` is set to a single hop, so a caller cannot invent the address
 * by stuffing X-Forwarded-For.
 */
export function clientIp(req: Request): string {
  const fly = headerString(req.headers['fly-client-ip']);
  if (fly) return fly;
  return req.ip || 'unknown';
}

export function socketIp(socket: Socket): string {
  const fly = headerString(socket.handshake.headers['fly-client-ip']);
  if (fly) return fly;
  return socket.handshake.address || 'unknown';
}

function headerString(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return '';
}
