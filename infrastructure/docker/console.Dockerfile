# syntax=docker/dockerfile:1.6
# =============================================================================
# apps/console — Vite SPA built to static files, served by nginx:alpine.
# =============================================================================

# ---- Stage 1: build ----------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/console/package.json apps/console/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY apps/console/. .
ARG VITE_API_BASE=/
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ---- Stage 2: runtime --------------------------------------------------------
FROM nginx:1.27-alpine AS runner
RUN rm /etc/nginx/conf.d/default.conf
COPY infrastructure/docker/console.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
