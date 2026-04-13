FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# Inherits node_modules + package.json from deps (now Alpine-based)
FROM deps AS builder
COPY packages/types ./packages/types
COPY apps/server ./apps/server
RUN npm run build --workspace=@ksero-se/server

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/index.js"]
