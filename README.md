# CDNetworks Platform

> Nền tảng hợp nhất Web Performance · Cloud Security · Edge Computing.
> Monorepo theo chuẩn SaaS hiện đại: Next.js + Vite/AntD + Express + Docusaurus + Nginx + GitHub Actions.

## Cấu trúc

| Path | Tech | Port dev |
|------|------|----------|
| `apps/web`      | Next.js 14 (App Router) + Tailwind | 3001 |
| `apps/console`  | React 18 + Vite + Ant Design 5     | 5174 |
| `apps/api`      | Express + TypeScript + JWT/zod     | 4000 |
| `docs`          | Docusaurus 3                       | 3002 |
| `tests/unit`    | Jest + ts-jest                     | —    |
| `tests/e2e`     | Cypress                            | —    |

## Khởi động nhanh

```bash
# 1. Tạo cây thư mục (idempotent — đã chạy nếu file này tồn tại)
bash setup.sh

# 2. Cài deps
pnpm install

# 3. Chạy tất cả app song song
pnpm dev

# 4. Test
pnpm test:unit
pnpm test:e2e   # cần web + api + console đang chạy
```

## Tài liệu

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — bản vẽ kiến trúc đầy đủ.
- [`AI_CONTEXT.md`](./AI_CONTEXT.md)     — port, lệnh, gotcha cho agent.
- [`docs/`](./docs/)                      — nội dung Docusaurus (intro, tutorials, API ref).

## Console hiện có

- Dashboard CDN có KPI, traffic line chart theo region và status-code donut 2xx/3xx/4xx/5xx.
- Sidebar đã có route coverage cho CDN Reports, Edge Configurations, SSL, Tools, Application Shield, Flood Shield, Media, Edge Computing, Cloud DNS và Admin.
- Admin Branding tại `/settings/branding` cho phép đổi logo, social logo, favicon, tên portal và màu thương hiệu theo localStorage config.
- Access Logs dùng `/api/v1/accesslogs`, download route same-origin `/api/v1/accesslogs/:id/download`, hỗ trợ Bearer JWT hoặc signed URL 5 phút.
- Logo/favicons production lấy từ `brand/favicon-32x32.png`, `brand/logo.png`, `brand/logo-social-2024.png`.

## Tài khoản demo

- Email: `admin@vnso.vn`
- Password: `Admin@@3224@@`

(Token JWT trả về có TTL 15 phút; credential production prototype đọc từ `.env`.)
