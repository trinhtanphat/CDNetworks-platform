---
id: capacity-planning
title: Capacity Planning
sidebar_position: 5
---

# Capacity Planning

## Baseline (2026-05)

| Tài nguyên | Hiện tại | Sử dụng | Ngưỡng cảnh báo | Ngưỡng critical |
|---|---|---|---|---|
| Disk `/` | 353 GB | **83%** (~292 GB used) | 80% | 90% |
| RAM | 16 GB | đo qua `docker stats` | 75% | 90% |
| CPU | 8 vCPU | trung bình < 20% | 60% sustained 5m | 85% |
| Inodes | — | `df -i` | 80% | 95% |
| Network | 1 Gbps | — | 60% | 85% |

> **Lưu ý**: Disk đã chạm ngưỡng cảnh báo. Cần dọn ngay (xem [Runbook — Dọn disk khẩn cấp](./runbook.md)).

## Profile tải kỳ vọng

| Tình huống | RPS | Concurrent users | Storage delta/ngày |
|---|---|---|---|
| Demo / dev | < 5 | < 10 | ~50 MB log |
| Baseline production | 50 | 200 | ~500 MB |
| Peak (campaign) | 500 | 2,000 | ~5 GB |
| DDoS giả lập | 5,000+ | — | Cloudflare hấp thụ |

## Sizing component (per 100 RPS)

| Component | CPU | RAM |
|---|---|---|
| cdnetworks-api (Node) | 0.5 vCPU | 256 MB |
| cdnetworks-console (nginx static) | 0.1 vCPU | 64 MB |
| cdnetworks-web (Next.js SSR mỏng) | 0.5 vCPU | 384 MB |
| Postgres (roadmap) | 1 vCPU | 1 GB + WAL |
| ClickHouse (roadmap) | 2 vCPU | 4 GB |
| Redis | 0.2 vCPU | 256 MB |

## Trigger scaling

- **Vertical**: RAM > 75% trong 30m hoặc CPU > 60% sustained 10m → upgrade VPS tier.
- **Horizontal**: > 1,000 RPS sustained → migrate sang K8s cluster (3 worker tối thiểu).
- **Cache offload**: cache-hit ratio Cloudflare < 70% → review Cache-Control + Page Rules.

## Cost model (ước tính)

| Hạng mục | Tháng |
|---|---|
| VPS hiện tại | ~3.5 triệu VND |
| Cloudflare Pro | ~$20 |
| Domain `vnso.vn` | ~$15/năm |
| Backup S3 (B2) | ~$5–$10 |
| Email/SMTP relay | ~$10 |
| **Tổng (xấp xỉ)** | **~4.5 triệu VND/tháng** |

Sau khi lên K8s 3-node: dự kiến ~15–20 triệu VND/tháng.
