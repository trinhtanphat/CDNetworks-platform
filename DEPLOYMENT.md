# Deployment — CDNetworks Platform

Stack production trên VPS `103.9.157.6` (vnso.vn).

## Public URLs

| URL | Mô tả | Container | Local port |
|-----|-------|-----------|------------|
| https://cdnetworks.vnso.vn | Landing (Next.js) | `cdnetworks-web` | 13601 |
| https://console-cdnetworks.vnso.vn | Console SPA + `/api/*` | `cdnetworks-console` + `cdnetworks-api` | 13602 + 13603 |
| https://docs-cdnetworks.vnso.vn | Docs (Docusaurus → GitHub Pages) | (gh-pages branch) | — |

Demo login (in-memory, **đổi trong production thực tế**): `admin@demo.com` / `demo1234`.

## Kiến trúc network

```
Cloudflare (proxy)
   │  443
   ▼
VPS xiaozhi-esp32-server-web (nginx 1.28.3, /root/dockercompose/nginx.conf)
   │  proxy_pass http://host.docker.internal:13601-13603
   ▼
docker bridge 172.17.0.1 → cdnetworks-{web,console,api}
```

Containers bind vào `172.17.0.1:1360x` (chỉ host bridge thấy được, KHÔNG public ra `0.0.0.0`). Reverse proxy xiaozhi ↔ bridge qua `host-gateway`.

## Build & Run

```bash
cd /root/CDNetworks-platform

# Lần đầu: tạo JWT_SECRET
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build images
docker compose -f docker-compose.deploy.yml build

# Up stack
docker compose -f docker-compose.deploy.yml --env-file .env up -d

# Status
docker compose -f docker-compose.deploy.yml ps
```

## Reload nginx (sau khi sửa `/root/dockercompose/nginx.conf`)

```bash
docker exec xiaozhi-esp32-server-web nginx -t \
  && docker exec xiaozhi-esp32-server-web nginx -s reload
```

## Smoke tests

```bash
# Local
curl -sI http://172.17.0.1:13601/ | head -1                # web
curl -sI http://172.17.0.1:13602/healthz | head -1         # console nginx
curl -s  http://172.17.0.1:13603/health                    # api

# Public (nếu DNS chưa propagate, dùng --resolve)
curl -skI https://cdnetworks.vnso.vn/ \
  --resolve cdnetworks.vnso.vn:443:127.0.0.1
curl -sk https://console-cdnetworks.vnso.vn/api/v1/auth/login \
  --resolve console-cdnetworks.vnso.vn:443:127.0.0.1 \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"demo1234"}'
```

## DNS cần cấu hình (Cloudflare)

| Record | Type | Value | Proxy |
|--------|------|-------|-------|
| `cdnetworks` | A | `103.9.157.6` | ☁️ Proxied |
| `console-cdnetworks` | A | `103.9.157.6` | ☁️ Proxied |
| `docs-cdnetworks` | CNAME | `trinhtanphat.github.io` | DNS only (GH Pages) |

> Tạm thời `docs-cdnetworks` đang được nginx redirect 302 sang `https://trinhtanphat.github.io/CDNetworks-platform`. Sau khi DNS CNAME trỏ sang GitHub Pages và GH Pages publish gh-pages branch, có thể bỏ block redirect trong nginx.

## GitHub Pages cho docs

Workflow `.github/workflows/docs-pages.yml` tự động build & publish khi có push vào `main` ảnh hưởng `docs/**`.

Sau lần push đầu:

1. Repo Settings → Pages → Source = `Deploy from a branch` → branch `gh-pages` /(root).
2. Custom domain = `docs-cdnetworks.vnso.vn` (file `docs/static/CNAME` đã có sẵn → tự apply).
3. Bật **Enforce HTTPS** sau khi GH cấp cert.

## Cập nhật code → redeploy

```bash
cd /root/CDNetworks-platform
git pull
docker compose -f docker-compose.deploy.yml build
docker compose -f docker-compose.deploy.yml --env-file .env up -d
```

## Troubleshooting

- **502/504 từ vhost**: kiểm tra container có Up không (`docker ps | grep cdnetworks`) và bind đúng `172.17.0.1:1360x` (không phải `127.0.0.1`).
- **CORS lỗi từ console**: `/api/*` đi cùng origin với SPA nên không cần CORS; nếu test cross-origin, kiểm tra `CORS_ORIGINS` env trong `cdn-api`.
- **JWT invalid**: confirm `JWT_SECRET` trong `.env` không đổi giữa các lần restart (token cũ sẽ invalid nếu secret thay đổi).
