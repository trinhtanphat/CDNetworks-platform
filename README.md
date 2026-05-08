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

## Tài khoản demo

- Email: `admin@demo.com`
- Password: `demo1234`

(Token JWT trả về có TTL 15 phút; refresh chưa cài trong mock.)
