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

# Root node_modules (workspace-hoisted deps)
COPY --from=deps /app/node_modules ./node_modules

# Replace the workspace symlink for @ksero-se/types with the real compiled JS.
# Docker COPY across stages does not reliably preserve/resolve workspace symlinks,
# so we remove whatever is there (symlink or empty dir) and drop in the built files
# directly — Node will resolve them just like any regular installed package.
RUN rm -rf node_modules/@ksero-se/types && mkdir -p node_modules/@ksero-se/types
COPY --from=builder /app/packages/types/package.json ./node_modules/@ksero-se/types/package.json
COPY --from=builder /app/packages/types/dist ./node_modules/@ksero-se/types/dist

# Compiled server output
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
