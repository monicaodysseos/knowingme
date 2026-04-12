FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
RUN npm install --workspaces --include-workspace-root

COPY packages/types ./packages/types
COPY apps/server ./apps/server

WORKDIR /app/apps/server
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 3001
CMD ["node", "dist/index.js"]
