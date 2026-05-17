---
id: roadmap
title: Architecture Roadmap
sidebar_position: 11
---

# Roadmap

## 2026 Q2 (đang chạy)

- ✅ Console: charts, route coverage, branding admin.
- ✅ HMAC signed URL cho access log.
- ✅ Docs Docusaurus + GH Pages mirror.
- ⏳ Wire Postgres + Prisma vào API.
- ⏳ Hash admin password argon2id.
- ⏳ Rate-limit `/auth/login`.

## 2026 Q3

- Observability stack chạy thật (Prometheus/Grafana/Loki/Alertmanager).
- CI pipeline đầy đủ (lint/test/build/image push).
- E2E Playwright trong CI.
- OIDC integration với Keycloak self-hosted.

## 2026 Q4

- Kubernetes cluster 3 control-plane + 3 worker (HAN/SGN/TYO).
- Helm chart `infrastructure/helm/cdnetworks/`.
- ArgoCD GitOps.
- Vault cho secret + dynamic DB creds.

## 2027 H1

- Multi-region active-active (GeoDNS Cloudflare Load Balancer).
- OpenResty + Lua WAF rule custom.
- SDK Python + Go + Java sinh từ OpenAPI.
- Edge Functions runtime (V8 isolate, isolate-vm).

## 2027 H2

- Marketplace plugin (community WAF rules, edge scripts).
- DDoS scrubbing tier riêng.
- ISO 27001 audit readiness.

## KPI theo dõi

| Quý | Mục tiêu | KPI |
|---|---|---|
| Q2/26 | Stabilize | 0 P0 outstanding, uptime ≥ 99.9% |
| Q3/26 | Observability | MTTR < 30 phút, alert-to-page < 5 phút |
| Q4/26 | K8s migration | Tất cả app chạy K8s, deploy < 10 phút |
| Q1/27 | Multi-region | RTO mất 1 region < 5 phút |
