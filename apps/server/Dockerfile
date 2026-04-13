FROM node:20-alpine AS base
WORKDIR /app

# ── Install dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# ── Build ───────────────────────────────────────────────────────────────────
# esbuild bundles @ksero-se/types source inline (--alias), so there is no
# runtime dependency on the workspace symlink or any compiled types package.
FROM deps AS builder
COPY packages/types ./packages/types
COPY apps/server ./apps/server
RUN npm run build --workspace=@ksero-se/server

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# node_modules for express, socket.io, xstate, etc. (all kept external by esbuild)
COPY --from=deps /app/node_modules ./node_modules

# Single bundled file — @ksero-se/types is inlined, no workspace symlink needed
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:${PORT:-3001}/health || exit 1
CMD ["node", "dist/index.js"]
