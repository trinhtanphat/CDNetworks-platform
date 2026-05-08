# syntax=docker/dockerfile:1.6
# =============================================================================
# docs — Docusaurus build → nginx static.
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app
COPY docs/package.json docs/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY docs/. .
RUN npm run build

FROM nginx:1.27-alpine AS runner
RUN rm /etc/nginx/conf.d/default.conf
COPY infrastructure/docker/console.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
