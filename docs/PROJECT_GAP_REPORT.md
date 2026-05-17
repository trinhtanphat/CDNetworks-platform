# CDNetworks-platform — Project Gap Report

> Báo cáo rà soát toàn dự án tại commit `84e2aab` (2026-05-11). Phân loại theo mức ưu tiên P0 → P3.
> Mỗi mục có **Hiện trạng**, **Đề xuất**, và **Vị trí thực hiện**.

## Tổng quan trạng thái

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Web (Next.js marketing) | ✅ Production | https://cdnetworks.vnso.vn |
| Console (React/Vite + AntD) | ✅ Production | https://console-cdnetworks.vnso.vn |
| API (Express + TS) | ✅ Production | https://api-cdnetworks.vnso.vn — mock data, chưa có DB thật |
| Docs (Docusaurus) | ✅ Production + GH Pages | `/document/` và GH Pages mirror |
| SDK (TS) | ✅ Build | Chưa publish npm |
| CI/CD | 🟡 Một phần | GH Pages workflow OK; chưa có test/build pipeline cho api/console/web |
| Database | ❌ Chưa có | API dùng JSON mock |
| Auth thật | 🟡 JWT HS256 demo | Chưa có OIDC/SAML, chưa có refresh-token rotation |
| Observability | 🟡 Scaffolding | Có file Prometheus/Grafana nhưng chưa deploy |
| Backup/DR | ❌ Chưa cấu hình | Có thư mục `infrastructure/backup` mới khung |
| Secret management | ❌ `.env` thô | Roadmap Vault |
| Tests | 🟡 Khung | `tests/unit`, `tests/e2e` có nhưng coverage thấp |

---

## P0 — Phải làm trước khi xem là production-ready

### P0.1 — Persistent storage cho API
- **Hiện trạng**: `apps/api/src/mock/*.json` được serve trực tiếp; restart container mất state ghi vào memory.
- **Đề xuất**: Thêm Postgres (đã có `infrastructure/sql/init-postgres.sql`), wire Prisma hoặc Drizzle vào `apps/api`. Schema: `users`, `domains`, `dns_zones`, `dns_records`, `ssl_certs`, `access_logs_meta`. ClickHouse cho access logs.
- **Vị trí**: `apps/api/src/db/`, `apps/api/prisma/schema.prisma`, `docker-compose.full.yml` đã có service `postgres`/`clickhouse` nhưng chưa link.

### P0.2 — Secret rotation & `.env` hygiene
- **Hiện trạng**: `JWT_SECRET`, `ADMIN_PASSWORD` lưu plaintext trong `.env` của repo (`.env.example` an toàn nhưng `.env` thực có trên VPS).
- **Đề xuất**: 
  - Đổi `JWT_SECRET` định kỳ (script `scripts/rotate-jwt.sh`).
  - Hash `ADMIN_PASSWORD` bằng argon2 trước khi compare (hiện so sánh plaintext).
  - Thêm `.env` vào `.gitignore` (kiểm tra lại) và move secret production sang docker secret hoặc Vault.
- **Vị trí**: `apps/api/src/auth/`, `scripts/`.

### P0.3 — Rate limiting + brute-force lockout cho `/auth/login`
- **Hiện trạng**: Không thấy middleware rate-limit trên login endpoint.
- **Đề xuất**: `express-rate-limit` + Redis store; 5 lần sai / 15 phút → lock IP/account.
- **Vị trí**: `apps/api/src/middleware/rate-limit.ts`, route `apps/api/src/routes/auth.routes.ts`.

### P0.4 — Backup tự động
- **Hiện trạng**: Khung folder `infrastructure/backup/` chưa có cron thực.
- **Đề xuất**: Cron daily 02:00 ICT dump Postgres + sao chép `apps/api/data/` lên S3-compatible (MinIO trên VPS hoặc Backblaze B2). Giữ 14 daily / 8 weekly / 6 monthly.
- **Vị trí**: `infrastructure/backup/cron.sh`, `infrastructure/backup/restic.env.example`.

---

## P1 — Quan trọng, làm trong sprint tiếp theo

### P1.1 — CI pipeline đầy đủ
- **Hiện trạng**: Chỉ có workflow build GH Pages.
- **Đề xuất**: GH Actions matrix: lint (eslint), typecheck (tsc), unit test (vitest), build (api/console/web/docs/sdk), docker build smoke. Branch protection require check.
- **Vị trí**: `.github/workflows/ci.yml`.

### P1.2 — Observability stack thật
- **Hiện trạng**: `infrastructure/observability/` có file YAML nhưng chưa chạy.
- **Đề xuất**: Bring up `prometheus`, `grafana`, `loki`, `promtail`, `alertmanager` qua `docker-compose.full.yml`; expose `/metrics` (prom-client) trên `apps/api` & `apps/console`. Dashboards: API latency p50/p95/p99, error rate, container CPU/MEM, nginx 5xx.
- **Vị trí**: `apps/api/src/metrics.ts`, `infrastructure/observability/dashboards/*.json`.

### P1.3 — Refresh token + OIDC ready
- **Hiện trạng**: JWT 1 lớp, hết hạn phải login lại.
- **Đề xuất**: Access token 15m + refresh token 7d (rotation, jti blacklist trong Redis). Sẵn `passport-openidconnect` để gắn Azure AD / Keycloak sau.

### P1.4 — E2E test smoke
- **Đề xuất**: Playwright suite: login → dashboard → tạo DNS record → tải access log. Chạy trên CI sau khi `docker compose up`.
- **Vị trí**: `tests/e2e/`.

### P1.5 — Audit log nội bộ
- **Hiện trạng**: `/audit-logs` route đã có FE; chưa có ghi thật ở BE.
- **Đề xuất**: Middleware ghi mọi mutating request (method, path, user, ip, ua, ts) vào bảng `audit_logs`.

### P1.6 — CSP & security headers chặt hơn
- **Hiện trạng**: `connect-src` đã đúng nhưng `script-src` còn `unsafe-inline`.
- **Đề xuất**: Tách nonce cho inline script Next.js, bật `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## P2 — Cải thiện chất lượng

| # | Hạng mục | Đề xuất |
|---|---|---|
| P2.1 | i18n console | Hiện chỉ docs có vi/en; console hardcode EN. Thêm `react-i18next` + tách `apps/console/src/locales/{en,vi}.json`. |
| P2.2 | Error boundary + retry | Wrap routes bằng AntD `<ErrorBoundary>`; axios interceptor retry 3 lần với exponential backoff cho 5xx. |
| P2.3 | Storybook design tokens | Trang `/design-system` trong console show palette/typography/components. |
| P2.4 | Bundle analyzer | `pnpm --filter console build -- --report`; mục tiêu < 600KB gzip. |
| P2.5 | Image optimization web | Next.js `<Image>` thay `<img>` ở marketing pages. |
| P2.6 | DNSSEC plan | Tài liệu `docs/architecture/network.md` đã liệt kê; cần script auto sign zone. |
| P2.7 | API versioning | Thống nhất prefix `/api/v1`, mở rộng `/api/v2` sau (Express Router scoped). |
| P2.8 | OpenAPI spec | Generate qua `zod-to-openapi`; serve `/openapi.json` + Swagger UI tại `/api/docs`. |

---

## P3 — Roadmap dài hạn

- **K8s migration**: Helm chart đã có khung; mục tiêu Q3/2026 migrate sang cluster 3-node (control plane HA).
- **Multi-region**: Bổ sung node tại Singapore/Tokyo để chạy edge POP thật; GeoDNS qua Cloudflare Load Balancer.
- **WAF tự xây**: Hiện rely vào Cloudflare; có thể thêm OpenResty + Lua rule set (đã có `infrastructure/openresty/`).
- **SDK đa ngôn ngữ**: Python, Go, Java; sinh tự động từ OpenAPI.
- **Marketplace plugin**: Cho phép khách viết WAF rule / edge function (V8 isolate).

---

## Phụ lục A — Disk/Resource hiện tại trên VPS

| Tài nguyên | Hiện tại | Ngưỡng cảnh báo | Hành động |
|---|---|---|---|
| `/` | 83% (61G free / 353G) | 85% | Dọn `docker system prune -af --volumes` và rotate log nginx |
| RAM | Theo dõi qua `docker stats` | 80% | Tăng swap hoặc upgrade VPS |
| Bandwidth | Chưa đo | — | Bật Cloudflare Analytics |

## Phụ lục B — Domain & DNS

| Hostname | Trỏ về | TLS | Mục đích |
|---|---|---|---|
| cdnetworks.vnso.vn | VPS 103.9.157.6 qua Cloudflare | *.vnso.vn (2026-10-22) | Marketing web |
| console-cdnetworks.vnso.vn | Cloudflare → VPS | wildcard | Console |
| api-cdnetworks.vnso.vn | Cloudflare → VPS | wildcard | REST API |
| docs-cdnetworks.vnso.vn | Cloudflare → VPS | wildcard | Docs (mirror /document/) |
| trinhtanphat.github.io/CDNetworks-platform/ | GH Pages | GitHub managed | Docs public mirror |

---

_Last updated: 2026-05-11. Sửa file này khi đóng các P0/P1._
