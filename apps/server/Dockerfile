FROM node:20-alpine AS base
WORKDIR /app

# ── Install dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# ── Build ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/types ./packages/types
COPY apps/server ./apps/server
RUN npm run build --workspace=@ksero-se/types
RUN npm run build --workspace=@ksero-se/server

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Root node_modules (workspace-hoisted deps + @ksero-se/types symlink)
COPY --from=deps /app/node_modules ./node_modules

# The symlink @ksero-se/types → ../../packages/types needs its target present
COPY --from=builder /app/packages/types ./packages/types

# Compiled server output
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
