# Deployment — CDNetworks Platform

Stack production trên VPS `103.9.157.6` (vnso.vn).

## Public URLs

| URL | Mô tả | Container | Local port |
|-----|-------|-----------|------------|
| https://cdnetworks.vnso.vn | Landing (Next.js) | `cdnetworks-web` | 13601 |
| https://cdnetworks.vnso.vn/document/ | Docs embedded (Docusaurus static) | `cdnetworks-web` | 13601 |
| https://console-cdnetworks.vnso.vn | Console SPA + `/api/*` | `cdnetworks-console` + `cdnetworks-api` | 13602 + 13603 |
| https://trinhtanphat.github.io/CDNetworks-platform/ | Docs static GitHub Pages | GitHub Pages workflow | — |

Admin login hiện lấy từ `.env`: `ADMIN_EMAIL=admin@vnso.vn`, `ADMIN_PASSWORD=Admin@@3224@@`.

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

# Public qua VPS nginx (nếu DNS chưa propagate, dùng --resolve tới VPS IP)
curl -skI https://cdnetworks.vnso.vn/ \
  --resolve cdnetworks.vnso.vn:443:103.9.157.6
curl -skI https://cdnetworks.vnso.vn/document/ \
  --resolve cdnetworks.vnso.vn:443:103.9.157.6
curl -skI https://console-cdnetworks.vnso.vn/ \
  --resolve console-cdnetworks.vnso.vn:443:103.9.157.6
curl -sk https://console-cdnetworks.vnso.vn/api/v1/auth/login \
  --resolve console-cdnetworks.vnso.vn:443:103.9.157.6 \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@vnso.vn","password":"Admin@@3224@@"}'

# GitHub Pages static docs
curl -sI https://trinhtanphat.github.io/CDNetworks-platform/ | head -1
curl -sI https://trinhtanphat.github.io/CDNetworks-platform/assets/css/styles.aab52d52.css | head -1

# Console route coverage
curl -skI https://console-cdnetworks.vnso.vn/dns/zones \
  --resolve console-cdnetworks.vnso.vn:443:103.9.157.6
curl -skI https://console-cdnetworks.vnso.vn/settings/branding \
  --resolve console-cdnetworks.vnso.vn:443:103.9.157.6
```

## DNS cần cấu hình (Cloudflare)

| Record | Type | Value | Proxy |
|--------|------|-------|-------|
| `cdnetworks` | A | `103.9.157.6` | ☁️ Proxied |
| `console-cdnetworks` | A | `103.9.157.6` | ☁️ Proxied |
| `docs-cdnetworks` | — | bỏ, docs đã gộp vào `/document/` | — |

Nếu `curl https://console-cdnetworks.vnso.vn/` không trả gì nhưng `curl --resolve console-cdnetworks.vnso.vn:443:103.9.157.6 ...` trả 200, nguyên nhân là thiếu DNS record `console-cdnetworks -> 103.9.157.6` trong Cloudflare, không phải lỗi container.

## GitHub Pages cho docs

Workflow `.github/workflows/docs-pages.yml` tự động build Docusaurus và publish bằng GitHub Pages workflow artifact khi có push vào `main` ảnh hưởng `docs/**`.

Thiết lập hiện tại:

1. Repo Settings → Pages → Source = `GitHub Actions`.
2. Public URL: `https://trinhtanphat.github.io/CDNetworks-platform/`.
3. Local static output nằm ở `docs/build/` sau khi chạy build; thư mục này không cần commit vì workflow tự build artifact.
4. Docusaurus dùng `DOCS_TARGET=github-pages` để build `baseUrl=/CDNetworks-platform/`; VPS Docker build mặc định `baseUrl=/document/`.

## Cập nhật code → redeploy

```bash
cd /root/CDNetworks-platform
git pull
docker compose -f docker-compose.deploy.yml build
docker compose -f docker-compose.deploy.yml --env-file .env up -d
```

Các thay đổi console/web/api cần rebuild container tương ứng. Sau khi đổi nginx host config:

```bash
docker exec xiaozhi-esp32-server-web nginx -t \
  && docker exec xiaozhi-esp32-server-web nginx -s reload
```

Branding production dùng asset chính thức từ `brand/`; nếu đổi file nguồn, copy lại vào `apps/web/public`, `apps/console/public`, `docs/static/img`, rồi rebuild web/console/docs.

## Troubleshooting

- **502/504 từ vhost**: kiểm tra container có Up không (`docker ps | grep cdnetworks`) và bind đúng `172.17.0.1:1360x` (không phải `127.0.0.1`).
- **GitHub Pages load HTML nhưng CSS/JS 404**: kiểm tra `docs/docusaurus.config.ts`, Pages phải build với `DOCS_TARGET=github-pages` để asset path là `/CDNetworks-platform/assets/...`, không phải `/document/assets/...`.
- **Public console không vào được**: kiểm tra `getent ahosts console-cdnetworks.vnso.vn`; nếu rỗng, thêm Cloudflare A record `console-cdnetworks -> 103.9.157.6`.
- **CORS lỗi từ console**: `/api/*` đi cùng origin với SPA nên không cần CORS; nếu test cross-origin, kiểm tra `CORS_ORIGINS` env trong `cdn-api`.
- **JWT invalid**: confirm `JWT_SECRET` trong `.env` không đổi giữa các lần restart (token cũ sẽ invalid nếu secret thay đổi).
