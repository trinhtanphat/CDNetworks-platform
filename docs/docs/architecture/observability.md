---
id: observability
title: Observability
sidebar_position: 6
---

# Observability

## Trụ cột

| Trụ | Tool dự kiến | Endpoint |
|---|---|---|
| Metrics | Prometheus + Grafana | `/metrics` trên mỗi service |
| Logs | Loki + Promtail (hoặc Vector) | stdout container → Loki |
| Traces | Tempo + OpenTelemetry SDK | OTLP gRPC `:4317` |
| Alerts | Alertmanager → Telegram/Email | Rule trong `infrastructure/observability/alerts.yml` |
| Uptime | UptimeRobot + Cloudflare Health | `infrastructure/uptime/uptimerobot.yaml` |

## Metrics gợi ý (apps/api)

```ts
import client from 'prom-client';
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});
```

Liệt kê tối thiểu:
- `http_requests_total{method,route,status}`
- `http_request_duration_seconds_bucket`
- `process_resident_memory_bytes`
- `nodejs_eventloop_lag_seconds`
- `auth_login_failures_total`
- `accesslog_download_total{result}`

## SLO / SLI

| Service | SLI | Mục tiêu (SLO) | Error budget / 30d |
|---|---|---|---|
| API | Availability (2xx+3xx / total) | 99.9% | 43.2 phút |
| API | p95 latency `/api/v1/*` | < 500ms | 5% tháng được vượt |
| Console | Time-to-Interactive | < 3s p75 | — |
| Docs | Availability | 99.95% | 21.6 phút |

## Dashboards Grafana (cần tạo)

1. **API Overview** — RPS, error rate, p50/95/99, top routes.
2. **Container Host** — CPU, RAM, disk, network theo container.
3. **Nginx** — 2xx/3xx/4xx/5xx, upstream latency, cache hit.
4. **Auth** — login success/fail, lockouts.
5. **Business** — số log download, số DNS record CRUD, sign-ups.

## Alert rules (mẫu)

```yaml
groups:
- name: api
  rules:
  - alert: ApiHighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 10m
    labels: { severity: critical }
    annotations: { summary: "API 5xx > 5% trong 10m" }
  - alert: ApiLatencyP95
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
    for: 15m
    labels: { severity: warning }
- name: host
  rules:
  - alert: DiskAlmostFull
    expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes < 0.15
    for: 30m
    labels: { severity: critical }
```

## Trace (roadmap)

- Instrument Express bằng `@opentelemetry/instrumentation-express`.
- Forward OTLP → Tempo (`http://tempo:4318/v1/traces`).
- Link trace_id vào Grafana logs panel (Loki derived field).
