---
id: dr-bcp
title: DR & BCP
sidebar_position: 8
---

# Disaster Recovery & Business Continuity

## Mục tiêu

| Loại sự cố | RPO | RTO |
|---|---|---|
| Mất container | 0 | < 5 phút (auto restart) |
| Mất volume data | < 24h | < 2h (restore Postgres dump) |
| Mất VPS | < 24h | < 4h (deploy lại + restore) |
| Mất DC | < 24h | < 24h (rebuild ở DC khác) |
| Mất domain | 0 (TTL Cloudflare) | < 1h chuyển registrar |

## Backup

| Đối tượng | Tần suất | Giữ | Đích |
|---|---|---|---|
| Postgres dump (roadmap) | Daily 02:00 ICT | 14 daily / 8 weekly / 6 monthly | S3-compatible (B2 / MinIO) |
| `apps/api/data/` & uploads | Daily | 14 daily | S3 |
| Docker volume manifest | Weekly | 12 weekly | Git (encrypted) |
| TLS cert + key | Khi rotate | Vô thời hạn (KMS) | Vault roadmap |
| Cloudflare zone | Tuần | 12 weekly | Export JSON, git lfs |

### Lệnh mẫu

```bash
# Postgres
docker exec -t postgres pg_dump -U cdn -F c cdn > /backups/cdn-$(date +%F).dump

# App data
restic -r b2:cdnetworks-backup:/api backup /root/CDNetworks-platform/apps/api/data
```

## Quy trình khôi phục

### Mất container
1. `docker compose ps` xác định.
2. `docker compose up -d <service>` (auto restart đã bật).

### Mất volume / corrupt DB
1. Dừng API: `docker compose stop cdn-api`.
2. `restic restore latest --target /tmp/restore`.
3. `pg_restore -U cdn -d cdn /tmp/restore/cdn-YYYY-MM-DD.dump`.
4. `docker compose start cdn-api`.
5. Smoke: login + GET `/api/v1/dns/zones`.

### Mất VPS
1. Provision VPS mới (Terraform module `infrastructure/terraform`).
2. Cài Docker + clone repo + copy `.env` từ Vault.
3. `docker compose --profile prod up -d`.
4. Đổi DNS record A sang IP mới (TTL Cloudflare 1–5 phút).
5. Restore backup theo bước trên.

## Failover docs

- Mất `cdnetworks.vnso.vn/document/`: redirect tạm sang GitHub Pages `https://trinhtanphat.github.io/CDNetworks-platform/`.
- Cấu hình Cloudflare Page Rule fallback.

## Drill (diễn tập)

- **Quý**: 1 lần restore Postgres từ backup vào môi trường stage.
- **6 tháng**: 1 lần rebuild toàn bộ VPS từ Terraform + restore.
- Ghi report drill vào `docs/runbooks/dr-YYYY-Q.md`.

## Liên hệ khẩn cấp

| Vai trò | Người | Kênh |
|---|---|---|
| On-call SRE | (TBD) | Telegram + Phone |
| DBA | (TBD) | Telegram |
| Vendor VPS | VNSO Support | hotline DC |
| Cloudflare | Dashboard ticket | Pro plan SLA |
