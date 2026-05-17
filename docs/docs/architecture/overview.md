---
id: overview
title: Tổng quan kiến trúc
sidebar_position: 1
---

# Tổng quan kiến trúc CDNetworks-platform

> Hệ thống mô phỏng nền tảng CDN/Edge enterprise gồm 5 mặt phẳng: **Marketing**, **Console**, **API**, **Docs**, và **Infrastructure**.
> Triển khai trên VPS đơn (103.9.157.6) sau Cloudflare; roadmap mở rộng sang Kubernetes đa vùng.

## System context (C4-L1)

```mermaid
graph LR
  user[Khách hàng / Admin] -->|HTTPS| cf[Cloudflare Edge<br/>WAF + CDN]
  ops[Operator / SRE] -->|SSH / GitOps| vps[VPS 103.9.157.6]
  cf --> nginx[OpenResty / Nginx<br/>Reverse Proxy]
  nginx --> web[Next.js Web<br/>:13601]
  nginx --> console[React Console<br/>:13602]
  nginx --> api[Express API<br/>:13603]
  nginx --> docs[Docusaurus Docs<br/>(static)]
  api --> store[(Mock JSON / Postgres roadmap)]
  api --> logs[(ClickHouse roadmap)]
  vps -.->|Backup| s3[(Object Storage)]
  ghpages[GitHub Pages] -->|Mirror docs| user
```

## Nguyên tắc thiết kế

| Nguyên tắc | Áp dụng |
|---|---|
| **Stateless app, stateful store tách biệt** | Container app không chứa data; mount volume cho DB/log. |
| **Đẩy bảo mật lên edge** | Cloudflare WAF/Bot/SSL trước; origin chỉ chấp nhận TLS từ CF. |
| **12-Factor** | Config qua env, log ra stdout, build = image bất biến. |
| **GitOps-first** | Mọi thay đổi infra qua commit + workflow; không sửa tay trên VPS trừ break-glass. |
| **Defense in depth** | TLS edge + TLS origin + JWT + HMAC signed URL + rate-limit. |
| **Quan sát được** | `/metrics` Prometheus + access log tập trung + trace OpenTelemetry roadmap. |

## Tầng (Layered View)

1. **Edge** — Cloudflare (DNS, WAF, CDN cache, DDoS mitigation).
2. **Ingress** — OpenResty/Nginx trong container `xiaozhi-esp32-server-web` (TLS termination origin, vhost routing).
3. **Application** — `cdnetworks-web`, `cdnetworks-console`, `cdnetworks-api` (Docker bridge `cdn-net`).
4. **Data** — Mock JSON (hiện tại) → Postgres + ClickHouse + Redis (roadmap).
5. **Observability** — Prometheus, Grafana, Loki, Alertmanager (scaffolding).
6. **GitOps/CI** — GitHub Actions, ArgoCD (roadmap khi lên K8s).

## Liên kết nhanh

- [Logical architecture](./logical-architecture.md)
- [Physical topology](./physical-topology.md)
- [Network](./network.md)
- [Capacity planning](./capacity-planning.md)
- [Observability](./observability.md)
- [Security](./security.md)
- [DR & BCP](./dr-bcp.md)
- [Runbook](./runbook.md)
- [Operations / CI-CD](./operations.md)
- [Roadmap](./roadmap.md)
