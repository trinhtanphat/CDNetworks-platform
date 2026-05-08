# AI_CONTEXT — CDNetworks Platform

> Đọc file này TRƯỚC KHI sửa code. Cập nhật khi có thay đổi kiến trúc.

## Stack & Port

| Module | Path | Tech | Dev port |
|--------|------|------|----------|
| Landing/Marketing | `apps/web` | Next.js 14 (App Router) + Tailwind | 3001 |
| Console/Portal | `apps/console` | React 18 + Vite + Ant Design 5 | 5174 |
| API | `apps/api` | Express + TypeScript | 4000 |
| Docs | `docs` | Docusaurus 3 | 3002 |

## Lệnh chuẩn

```bash
# Khởi tạo cây thư mục (idempotent)
bash setup.sh

# Cài deps toàn workspace
pnpm install

# Dev tất cả (parallel)
pnpm -r --parallel dev

# Test
pnpm --filter ./tests/unit test
pnpm --filter ./tests/e2e cy:open

# Build validation hay dùng
pnpm --filter @cdn/api build
pnpm --filter @cdn/console exec tsc -p tsconfig.json --noEmit
pnpm --filter @cdn/console build
pnpm --filter @cdn/web build
pnpm --filter @cdn/sdk build
docker run --rm -e DOCS_TARGET=github-pages -v "$PWD/docs:/docs" -w /docs node:20-alpine \
  sh -c "npm install -g pnpm@9 >/dev/null 2>&1 && pnpm install --no-frozen-lockfile --ignore-workspace >/dev/null && pnpm run build"
```

## Domain map — PRODUCTION (đã live)

- https://cdnetworks.vnso.vn          → `cdnetworks-web` (Next.js)         | host:13601
- https://cdnetworks.vnso.vn/document/ → Docusaurus static embedded in `apps/web/public/document` | host:13601
- https://console-cdnetworks.vnso.vn  → `cdnetworks-console` (Vite SPA)    | host:13602
  - `/api/*`                          → `cdnetworks-api` (Express)         | host:13603
- https://trinhtanphat.github.io/CDNetworks-platform/ → GitHub Pages workflow artifact | `docs/build`

Reverse proxy: container `xiaozhi-esp32-server-web` (nginx 1.28.3) trên VPS, vhost ở
`/root/dockercompose/nginx.conf`. SSL wildcard `*.vnso.vn` (hết hạn 2026-10-22).
Containers bind `172.17.0.1:1360x` (host bridge), KHÔNG public ra `0.0.0.0`.

Stack được khai báo ở `docker-compose.deploy.yml`. `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` đọc từ `.env` (không commit).
Admin hiện tại: `admin@vnso.vn / Admin@@3224@@` (in-memory user store — chỉ cho prototype).

Chi tiết deploy/runbook: xem [DEPLOYMENT.md](./DEPLOYMENT.md).
GH Pages cho docs: workflow `.github/workflows/docs-pages.yml` tự động publish khi push `docs/**`. Workflow set `DOCS_TARGET=github-pages` để asset path là `/CDNetworks-platform/...`; Docker VPS build mặc định dùng `/document/...`.

## Quyết định kiến trúc hiện tại

- **Infra "light"** trên VPS: chỉ chạy 3 container web/console/api (Node + Nginx). KHÔNG
  Postgres / Redis / Kafka / ClickHouse / OpenResty trên VPS này — auth & data đang
  in-memory cho prototype.
- Roadmap 3-tier (Control / Data / Analytics với Postgres+Redis+CH+Kafka+OpenResty+Lua)
  đã có blueprint trong `docker-compose.full.yml` và `infrastructure/` (Helm, ArgoCD,
  Terraform Anycast/GeoDNS, Vault, Linkerd mTLS, Litmus Chaos, backup, Prometheus/Alertmanager) — triển khai khi chuyển sang K8s/cluster nhiều node.

## Console feature map

- `/dashboard` và `/cdn/dashboard`: dashboard KPI + traffic chart + status donut.
- `/reports/*`, `/edge-configurations/*`, `/traffic/*`, `/ssl/*`, `/tools/*`, `/shield/*`, `/flood/*`, `/media/*`, `/edge/*`, `/dns/*`: generic `FeaturePage` để không còn 404 từ sidebar.
- `/access-logs`: query log theo hostname/date/timezone, download qua API same-origin.
- `/settings/branding`: admin chỉnh logo/favicon/social logo, tên portal, màu primary/accent.
- Official assets đang nằm trong `apps/web/public`, `apps/console/public`, `docs/static/img`; source gốc trong `brand/`.

## Auth flow

JWT (RS256) + refresh httpOnly cookie. SSO SAML/OIDC ở `/api/v1/auth/sso/*`.
API key M2M qua header `X-Api-Key` (lưu hash + preview).

## Gotcha

- Worker (log ETL / billing / report builder) phải tách process — KHÔNG chạy chung API process.
- Sau khi rebuild API trong Docker, **luôn `docker compose restart nginx`** để nginx upstream cache không giữ IP cũ.
- Khi public URL lỗi nhưng `curl --resolve <host>:443:103.9.157.6 ...` trả 200, lỗi nằm ở DNS/Cloudflare record. `console-cdnetworks.vnso.vn` cần A record trỏ `103.9.157.6`.
- Không dùng `--resolve ...:127.0.0.1` để kết luận public OK; chỉ dùng để test nội bộ từ VPS. Public phải test bằng DNS thật hoặc `--resolve ...:103.9.157.6`.
- HTTPS bắt buộc qua `X-Forwarded-Proto`; smoke test trực tiếp `http://localhost` sẽ 301.
- Khi seed/heal data, dùng DELETE orphan, KHÔNG UPDATE — tránh vi phạm UNIQUE constraint.
- Access-log query mặc định giới hạn 31 ngày, vượt sẽ throw ngay từ client (`buildDateRangeQuery`).
- Docusaurus cần Node >=20; terminal VPS hiện có thể là Node 18 nên validate docs bằng Docker Node 20 hoặc GitHub Actions.
