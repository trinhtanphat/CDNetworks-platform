# CDNetworks Platform — Kiến trúc & Chuẩn dự án

> Tài liệu này là "bản vẽ" tham chiếu cho toàn bộ monorepo `/root/CDNetworks-platform`.
> Mục tiêu: tái dựng trải nghiệm tương tự `console.cdnetworks.com` — một nền tảng SaaS thống nhất cho CDN, bảo mật và edge computing.

---

## PHẦN 1 — Nguyên tắc kiến trúc Cloud/AI Platform

### 1.1 Cấu trúc Monorepo (chuẩn 5 lớp)

```
cdnetworks-platform/
├── apps/                 # Web (marketing) + Console (portal) + API + Worker
├── packages/             # Code dùng chung: ui, sdk, eslint-config, tsconfig
├── docs/                 # Docusaurus 3 (multi-lang vi/en)
├── infrastructure/       # nginx, docker, k8s, terraform
├── tests/                # unit (Jest), e2e (Cypress), perf (k6)
├── scripts/              # Tooling: seed, build-all, smoke
└── .github/workflows/    # CI/CD pipelines
```

Nguyên tắc:
- **Một root**, nhiều ứng dụng — chia theo **mục đích** (web, console, api, worker), không chia theo công nghệ.
- **`docs/` ngang hàng với code**, deploy subdomain riêng (`docs.cdnetworks-platform.local`).
- **Infra-as-code** trong `infrastructure/` (nginx vhost, Dockerfile multi-stage, k8s manifest).
- **`AI_CONTEXT.md`** ở root để mọi agent (và developer mới) đọc trước khi sửa code.

### 1.2 Tech stack đề xuất

| Lớp | Lựa chọn | Lý do |
|------|---------|-------|
| Landing + Marketing site | **Next.js 14 (App Router)** hoặc Nuxt 3 | SSR/SSG, SEO tốt, i18n native, image optimization |
| Console / Portal | **React 18 + Vite + Ant Design 5** | Khớp với source `isomorphicSidebar/isoDashboardMenu` user đã cung cấp; AntD cho data table, form, layout dày đặc |
| Backend API | **Node.js 20 + Express/NestJS + TypeScript** | NestJS cho cấu trúc module hoá; Express khi cần tốc độ scaffold |
| Worker (billing/log ETL) | Node.js + BullMQ (Redis) | Tách process khỏi API — usage tracker chạy chung API sẽ thiếu chính xác khi API restart |
| Database | PostgreSQL 16 + Redis 7 | Postgres làm system-of-record; Redis cho cache + queue + session |
| Docs | **Docusaurus 3** | MDX, versioning, search, i18n native |
| Reverse proxy | Nginx + Cloudflare | Vhost split theo subdomain; HSTS qua `X-Forwarded-Proto` |
| Container | Docker Compose (dev/prod) | Mỗi app có Dockerfile riêng, `docker-compose.yml` orchestrate |
| CI/CD | GitHub Actions | Lint → test → build image → deploy |
| Test | Jest + Vitest + Cypress + Playwright | Jest unit (logic), Vitest (Vite app), Cypress (e2e UI), Playwright (cross-browser smoke) |

### 1.3 Data flow & Authentication

```
                           ┌─────────────────────────────────┐
 Browser ── Cloudflare ──▶ │ Nginx (host)  443/80            │
                           │  ├─ www.cdn-platform.local      │──▶ apps/web (Next.js :3001)
                           │  ├─ console.cdn-platform.local  │──▶ apps/console (Vite :5174)
                           │  ├─ api.cdn-platform.local      │──▶ apps/api (Express :4000)
                           │  └─ docs.cdn-platform.local     │──▶ docs (Docusaurus :3002)
                           └─────────────────────────────────┘
                                            │
                       ┌────────────────────┼────────────────────┐
                       ▼                    ▼                    ▼
                 PostgreSQL            Redis (cache+queue)   ClickHouse / S3
                 (users, configs)                            (access logs raw)
                       ▲                    ▲
                       │                    │
                  Worker (Node)  ◀──── BullMQ jobs
                  - log ETL
                  - report builder
                  - billing
```

**Cơ chế xác thực (SSO-ready)**:
1. User đăng nhập tại `console.cdn-platform.local/login` → `POST api/v1/auth/login` trả `accessToken (JWT 15p)` + `refreshToken (httpOnly cookie 7d)`.
2. JWT mang `sub`, `email`, `role`, `tenantId`, `permissions[]` — verify bằng RS256 (rotate key qua JWKS endpoint `/.well-known/jwks.json`).
3. SSO doanh nghiệp: `GET /api/v1/auth/sso/:idpId/start` → redirect SAML2/OIDC → callback `/api/v1/auth/sso/callback` → cấp JWT cùng schema → redirect về `console.*?token=...`.
4. API key cho machine-to-machine: lưu `api_key_hash` + `api_key_preview` (không lưu plaintext), header `X-Api-Key`.
5. Mọi request qua nginx **bắt buộc HTTPS** (check `X-Forwarded-Proto`); rate-limit theo `tenantId + ip`.

---

## PHẦN 2 — Cấu trúc thư mục `/root/CDNetworks-platform`

```
CDNetworks-platform/
├── AI_CONTEXT.md
├── ARCHITECTURE.md                 # file này
├── README.md
├── package.json                    # workspaces: apps/*, packages/*
├── pnpm-workspace.yaml
├── docker-compose.yml
├── .env.example
├── setup.sh                        # script khởi tạo cây thư mục
│
├── apps/
│   ├── web/                        # Next.js 14 — landing, free-trial, pricing
│   │   ├── app/
│   │   │   ├── (marketing)/page.tsx              # Trang chủ
│   │   │   ├── (marketing)/free-trial/page.tsx
│   │   │   ├── (marketing)/products/[slug]/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Header.tsx                         # Mega menu + i18n + Login/Trial
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── ServiceGrid.tsx                    # Web Performance / Cloud Security / Edge
│   │   │   └── FreeTrialForm.tsx
│   │   ├── lib/i18n.ts
│   │   ├── public/
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── console/                    # React 18 + Vite + Ant Design 5 — Portal nội bộ
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx
│   │   │   ├── containers/
│   │   │   │   ├── App/MainLayout.tsx             # ant-layout, isomorphicSidebar
│   │   │   │   ├── Sidebar/Sidebar.tsx            # isoDashboardMenu
│   │   │   │   ├── Topbar/Topbar.tsx
│   │   │   │   ├── Dashboard/Dashboard.tsx
│   │   │   │   ├── Reports/Reports.tsx
│   │   │   │   ├── EdgeConfig/EdgeConfig.tsx
│   │   │   │   └── AccessLogs/AccessLogs.tsx      # Hostname + Date Range + Timezone + Table
│   │   │   ├── components/
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   └── HostnameSelect.tsx
│   │   │   ├── services/api.ts
│   │   │   ├── services/auth.ts
│   │   │   ├── utils/dateRange.ts                 # đối tượng test Jest
│   │   │   └── styles/themes/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                        # Express + TypeScript — REST API mock-able
│       ├── src/
│       │   ├── server.ts
│       │   ├── app.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts                 # POST /api/v1/auth/login
│       │   │   ├── accesslogs.routes.ts           # GET /api/v1/accesslogs
│       │   │   └── index.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middlewares/auth.ts
│       │   └── mock/accesslogs.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                       # Code dùng chung
│   ├── ui/                         # Tokens, Button, Card (cho web + console)
│   ├── sdk/                        # Client SDK gọi api.cdn-platform
│   └── eslint-config/
│
├── docs/                           # Docusaurus 3
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   ├── docs/
│   │   ├── getting-started/
│   │   │   └── introduction.md
│   │   ├── tutorials/
│   │   │   └── how-to-download-access-logs.md
│   │   └── api-reference/
│   │       └── access-logs-api.md
│   └── i18n/{en,vi}/
│
├── infrastructure/
│   ├── nginx/conf.d/{web,console,api,docs}.conf
│   ├── docker/{web,console,api}.Dockerfile
│   └── k8s/                        # (tuỳ chọn) helm chart
│
├── tests/
│   ├── unit/                       # Jest
│   │   └── dateRange.test.ts
│   └── e2e/                        # Cypress
│       ├── cypress.config.ts
│       └── cypress/e2e/login-and-download-log.cy.ts
│
└── scripts/
    ├── seed-mock.ts
    └── build-all.sh
```

Quy ước:
- **Mỗi app tự quản lý `package.json`**, được kết nối qua **pnpm workspaces**.
- **Nginx vhost** chia theo subdomain: `www`, `console`, `api`, `docs`.
- **Tất cả env** tập trung ở `.env.example` ở root, mỗi app có `.env.local` override.
- **`AI_CONTEXT.md`** liệt kê port, lệnh build, gotcha — agent đọc trước khi đụng code.
