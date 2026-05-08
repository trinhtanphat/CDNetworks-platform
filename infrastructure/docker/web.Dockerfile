# syntax=docker/dockerfile:1.6
# =============================================================================
# apps/web — Next.js 14 standalone build with embedded /document docs.
# Final image runs `node server.js`. Docs (Docusaurus) are pre-built and
# served as static files from /document path of the landing site.
# =============================================================================

# ---- Stage 0: docs (Docusaurus) ---------------------------------------------
FROM node:20-alpine AS docs-builder
WORKDIR /docs
RUN apk add --no-cache libc6-compat git
COPY docs/package.json docs/pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@9 --no-audit --no-fund \
    && pnpm install --no-frozen-lockfile --ignore-workspace
COPY docs/. .
RUN pnpm run build

# ---- Stage 1: deps ----------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# ---- Stage 2: build (Next.js) -----------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/. .
# Inject docs vào public/document để Next.js phục vụ static
COPY --from=docs-builder /docs/build ./public/document
RUN npm run build

# ---- Stage 3: runtime -------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
