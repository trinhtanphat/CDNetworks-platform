# Architecture Review — Khoảng cách so với CDNetworks Production

> Tài liệu này so sánh kiến trúc hiện tại của `CDNetworks-platform` (monorepo
> SaaS clone) với hệ thống thực **console.cdnetworks.com**, liệt kê khoảng
> trống, mức ưu tiên, và phương án bổ sung để đạt độ "production-like".

Cập nhật lần cuối: tự động sinh — đồng bộ với sprint hiện tại.

---

## 1. Tổng quan trạng thái

| Khối                        | Hiện trạng                                               | Mức hoàn thiện |
|----------------------------|-----------------------------------------------------------|----------------|
| Marketing site (`apps/web`) | Next.js 14 standalone, Hero/Service grid/Free trial form | 70%            |
| Console (`apps/console`)    | React 18 + Vite + AntD 5, sidebar 2-cấp, topbar, dashboard, login + protected route | 65% |
| API (`apps/api`)            | Express + zod + JWT, auth/access-logs/hostnames/leads     | 50%            |
| Docs (`docs`)               | Docusaurus 3, i18n en/vi, 3 sidebar                      | 40%            |
| SDK (`packages/sdk`)        | `@cdn/sdk` v0.1 — retry/backoff, signed download HMAC    | 60%            |
| Infra Nginx + Dockerfile    | 4 vhost, 4 multi-stage Dockerfile                        | 70%            |
| CI/CD (GitHub Actions)      | lint → unit → build matrix → e2e → release GHCR + cosign | 70%            |
| Quan sát/observability      | **Thiếu**                                                 | 5%             |
| Multi-tenant + RBAC         | **Thiếu** (chỉ JWT user đơn lẻ)                          | 10%            |
| Billing & metering          | **Thiếu**                                                | 0%             |
| Edge worker runtime         | **Thiếu**                                                | 0%             |
| Log analytics               | Mock JSON                                                | 5%             |

---

## 2. Khoảng trống lớn (P0 — phải có để production-like)

### 2.1. Đa khách hàng (multi-tenant) + RBAC

CDNetworks thật có cây **Customer → Sub-account → User**, mỗi role (Admin,
Operator, Read-only, Auditor) ràng buộc theo **scope domain/property**.

**Khuyến nghị:**
- Bảng `tenants`, `users`, `memberships(tenant_id, user_id, role)`,
  `policies(role, resource, action)`.
- Middleware `requireScope('accessLogs:read', tenantId)` ở `apps/api`.
- Decode JWT có `tenantId` + `roles[]`; UI ẩn/hiện theo policy ở console.
- Tách hạ tầng từ "single-token" → "OAuth2 / OIDC + scopes" (Keycloak hoặc
  Auth0) cho enterprise SSO/SAML/SCIM.

### 2.2. Billing & metering

- Pipeline đo lường: edge log → Kafka/Redpanda → ClickHouse rollup →
  metric tháng (GB out, requests, attacks blocked).
- Service `billing-svc` phát hành invoice (Stripe), package
  `packages/pricing` mô hình giá theo region.
- UI: trang **Billing → Usage / Invoices / Payment methods**.

### 2.3. Log Analytics chuyên dụng

Hiện `accesslogs.routes.ts` đọc JSON tĩnh. Production cần:

- **Object storage** S3-compatible (MinIO local, AWS S3 prod) chứa file gz
  thô `logs/{tenant}/{hostname}/{date}/{hour}.gz`.
- **ClickHouse** cluster cho query realtime (top URL, status code mix).
- **Signed URL service** (đã có hook trong SDK) — service riêng phát hành
  HMAC-SHA256 link TTL ngắn (5–15 phút).
- **Retention policy** + **lifecycle to Glacier** sau 90 ngày.

### 2.4. Observability

- **OpenTelemetry SDK** ở api/console (browser-rum), export OTLP →
  Tempo/Jaeger.
- **Prometheus** scrape `/metrics` của api (đã thêm tag, cần thêm endpoint).
- **Grafana** dashboard preset: latency p50/p95/p99, error rate, RPS.
- **Loki** hoặc **Elastic** lưu app log; `pino-pretty` ở dev, `pino` JSON
  ở prod.
- **Alertmanager** — SLO 99.95%, burn-rate alert.

### 2.5. Edge runtime cho Edge Functions

CDNetworks bán "EdgeWorkers". Để clone đúng tinh thần:
- Service `edge-runtime-svc` chạy V8 isolates (workerd / Deno Deploy clone).
- API publish: `POST /api/v1/edge-functions/:id/deploy` upload bundle JS.
- UI: editor Monaco + console log realtime qua WebSocket.

---

## 3. Khoảng trống vừa (P1 — should-have)

| Mục                      | Mô tả                                                                          |
|--------------------------|--------------------------------------------------------------------------------|
| **Status page**          | Subpath `https://cdnetworks.vnso.vn/status/` hoặc subdomain riêng khi có DNS/SLO công khai |
| **Webhook signing**      | HMAC v1 + replay-protection nonce, `services/webhook-svc`                      |
| **IP allowlist**         | Cho api keys: trang **API Keys → Restrict IP**                                 |
| **SCIM 2.0 provisioning**| Đồng bộ user từ Okta/Azure AD: `POST /scim/v2/Users` + `Groups`                |
| **Audit log**            | Service `audit-svc` ghi mọi mutation; UI trang **Audit Logs** (đã có route)    |
| **Sandbox env per PR**   | Đã có `deploy-preview.yml`, cần Helm chart deploy lên k3s preview cluster      |
| **Terraform IaC**        | Module `infrastructure/terraform/{aws,gcp,onprem}/`                            |
| **Helm charts**          | `infrastructure/helm/cdn-platform/{web,console,api,docs,sdk-edge}`            |
| **Feature flags**        | Unleash hoặc OpenFeature provider, gate UI và API                              |
| **i18n full**            | Hiện docs en/vi; cần web + console hỗ trợ en/vi/zh/ja/ko                       |

---

## 4. Khoảng trống nhỏ (P2 — polish)

- Theme dark mode đầy đủ cho console (AntD 5 token + custom).
- Skeleton loader cho từng container thay cho `Spin` toàn trang.
- Keyboard shortcut palette (Cmd+K) — fuzzy search route + hostnames.
- Profile page với 2FA setup (TOTP + WebAuthn passkey).
- Rate-limit theo plan (Free 60/m, Pro 600/m, Enterprise 6000/m).
- E2E tests bao phủ thêm: change password, add domain wizard, purge cache flow.
- Bundle size budget Lighthouse CI < 200KB JS / route.
- A11y audit: `eslint-plugin-jsx-a11y`, axe-playwright.

---

## 5. Cấu trúc thư mục đề xuất bổ sung

```
CDNetworks-platform/
├── services/                       # NEW — microservices ngoài "apps/api"
│   ├── billing-svc/                # Stripe + invoice
│   ├── audit-svc/                  # Append-only audit log
│   ├── webhook-svc/                # HMAC v1 publisher
│   ├── edge-runtime-svc/           # workerd/V8 isolates
│   └── log-pipeline/
│       ├── ingest/                 # Vector → Kafka
│       ├── rollup/                 # Flink/MaterializedView ClickHouse
│       └── signed-url-svc/         # HMAC URL issuer
├── packages/
│   ├── sdk/                        ✅ existing
│   ├── ui/                         # Shared AntD wrappers, design tokens
│   ├── eslint-config/              ✅ existing
│   ├── pricing/                    # NEW — pricing model + estimator
│   ├── policy/                     # NEW — RBAC matrix, casbin model
│   └── observability/              # NEW — pino + OTel preset
├── infrastructure/
│   ├── nginx/                      ✅ existing
│   ├── docker/                     ✅ existing
│   ├── helm/                       # NEW — chart per app + umbrella
│   ├── terraform/
│   │   ├── modules/{vpc,k8s,clickhouse,minio,grafana}
│   │   └── envs/{dev,staging,prod}
│   └── k8s-manifests/              # plain manifests cho ai không dùng helm
├── observability/
│   ├── grafana/dashboards/
│   ├── prometheus/rules/
│   └── otel-collector/config.yaml
└── compliance/
    ├── SOC2/                       # checklists, evidence templates
    └── GDPR/                       # DPA, sub-processor list
```

---

## 6. Lộ trình đề xuất (theo 4 đợt)

### Đợt 1 — "Hợp nhất nền tảng" (2–3 sprint)
1. RBAC + tenant scoping (P0).
2. Audit log service + UI (P1).
3. Observability tối thiểu: pino + OTel + 1 Grafana board (P0).
4. SDK 0.2 — thêm `purgeCache`, `domains`, `apiKeys` resource.

### Đợt 2 — "Đo lường & tiền" (2 sprint)
1. Pipeline log ClickHouse + signed URL svc.
2. Metering job → bảng `usage_daily`.
3. Trang Billing/Usage/Invoices.

### Đợt 3 — "Edge & Sandbox" (3 sprint)
1. Edge runtime svc (workerd) + UI editor Monaco.
2. Sandbox preview env via Helm + k3s.
3. Status page subdomain.

### Đợt 4 — "Enterprise readiness" (2 sprint)
1. SCIM 2.0 + SAML SSO.
2. SOC2 evidence pack + GDPR DPA.
3. Terraform module hoá → 1-click bootstrap môi trường mới.

---

## 7. Quyết định kiến trúc (ADR ngắn)

- **ADR-001**: Chọn ClickHouse thay vì Elasticsearch cho log analytics —
  rẻ hơn, query OLAP nhanh, schema rõ.
- **ADR-002**: Chọn workerd làm edge runtime — open source, Cloudflare-compat,
  không vendor-lock.
- **ADR-003**: Chọn Casbin cho policy engine — model RBAC + ABAC, dễ test.
- **ADR-004**: Chọn pino + OTel JS SDK + OTel Collector — vendor-agnostic
  (Grafana / Datadog / Honeycomb đều exporter được).
- **ADR-005**: Monorepo dùng pnpm workspaces, không turbo (giảm phụ thuộc),
  caching CI dùng GHA cache + pnpm store.

---

## 8. Rủi ro chính

| Rủi ro                                | Tác động | Giảm thiểu                                                      |
|---------------------------------------|---------|------------------------------------------------------------------|
| Không có người vận hành ClickHouse    | Cao     | Bắt đầu với MinIO + DuckDB; chuyển ClickHouse khi >100M dòng/ngày |
| RBAC sai sót → leak cross-tenant      | Cao     | Test policy bằng casbin assertion + e2e với 2 tenant giả lập      |
| Edge runtime tốn RAM                  | TB      | Quota memory/CPU isolate, kill switch                            |
| Bundle console tăng quá ngưỡng        | TB      | Lighthouse CI gate, code-split route, lazy AntD icons            |

---

_Last review owner: Platform Architecture WG · cập nhật mỗi sprint review._
