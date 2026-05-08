# syntax=docker/dockerfile:1.6
# =============================================================================
# apps/api — Express + TypeScript (build to dist/), small Node alpine runtime.
# =============================================================================

# ---- Stage 1: deps -----------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# ---- Stage 2: build ----------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/. .
RUN npm run build \
 && npm prune --omit=dev

# ---- Stage 3: runtime --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    API_PORT=4000

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 cdnapi

COPY --from=builder --chown=cdnapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cdnapi:nodejs /app/dist         ./dist
COPY --from=builder --chown=cdnapi:nodejs /app/package.json ./package.json

USER cdnapi
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1

CMD ["node", "dist/server.js"]
