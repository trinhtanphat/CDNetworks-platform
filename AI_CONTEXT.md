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
```

## Domain map — PRODUCTION (đã live)

- https://cdnetworks.vnso.vn          → `cdnetworks-web` (Next.js)         | host:13601
- https://console-cdnetworks.vnso.vn  → `cdnetworks-console` (Vite SPA)    | host:13602
  - `/api/*`                          → `cdnetworks-api` (Express)         | host:13603
- https://docs-cdnetworks.vnso.vn     → GitHub Pages (gh-pages branch)     | (CDN của GH)

Reverse proxy: container `xiaozhi-esp32-server-web` (nginx 1.28.3) trên VPS, vhost ở
`/root/dockercompose/nginx.conf`. SSL wildcard `*.vnso.vn` (hết hạn 2026-10-22).
Containers bind `172.17.0.1:1360x` (host bridge), KHÔNG public ra `0.0.0.0`.

Stack được khai báo ở `docker-compose.deploy.yml`. JWT_SECRET đọc từ `.env` (không commit).
Demo login: `admin@demo.com / demo1234` (in-memory user store — chỉ cho prototype).

Chi tiết deploy/runbook: xem [DEPLOYMENT.md](./DEPLOYMENT.md).
GH Pages cho docs: workflow `.github/workflows/docs-pages.yml` tự động publish khi push `docs/**`.

## Quyết định kiến trúc hiện tại

- **Infra "light"** trên VPS: chỉ chạy 3 container web/console/api (Node + Nginx). KHÔNG
  Postgres / Redis / Kafka / ClickHouse / OpenResty trên VPS này — auth & data đang
  in-memory cho prototype.
- Roadmap 3-tier (Control / Data / Analytics với Postgres+Redis+CH+Kafka+OpenResty+Lua)
  đã được tổng hợp trong [docs/ARCHITECTURE_REVIEW.md](./docs/ARCHITECTURE_REVIEW.md) —
  triển khai khi chuyển sang môi trường K8s/cluster nhiều node.

## Auth flow

JWT (RS256) + refresh httpOnly cookie. SSO SAML/OIDC ở `/api/v1/auth/sso/*`.
API key M2M qua header `X-Api-Key` (lưu hash + preview).

## Gotcha

- Worker (log ETL / billing / report builder) phải tách process — KHÔNG chạy chung API process.
- Sau khi rebuild API trong Docker, **luôn `docker compose restart nginx`** để nginx upstream cache không giữ IP cũ.
- HTTPS bắt buộc qua `X-Forwarded-Proto`; smoke test trực tiếp `http://localhost` sẽ 301.
- Khi seed/heal data, dùng DELETE orphan, KHÔNG UPDATE — tránh vi phạm UNIQUE constraint.
- Access-log query mặc định giới hạn 31 ngày, vượt sẽ throw ngay từ client (`buildDateRangeQuery`).
