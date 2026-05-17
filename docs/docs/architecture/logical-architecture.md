---
id: logical-architecture
title: Logical Architecture (C4-L2)
sidebar_position: 2
---

# Logical Architecture

## Container diagram

```mermaid
graph TB
  subgraph Edge
    CF[Cloudflare]
  end
  subgraph Origin[VPS 103.9.157.6 - Docker host]
    direction TB
    NGX[OpenResty / Nginx<br/>:443/:80]
    subgraph cdn-net[Docker bridge cdn-net]
      WEB[cdnetworks-web<br/>Next.js 14<br/>172.17.0.1:13601]
      CON[cdnetworks-console<br/>React+Vite+AntD<br/>172.17.0.1:13602]
      API[cdnetworks-api<br/>Express+TS<br/>172.17.0.1:13603]
    end
    subgraph data[Data plane - roadmap]
      PG[(Postgres 16)]
      CH[(ClickHouse 24)]
      RDS[(Redis 7)]
    end
    subgraph obs[Observability - roadmap]
      PROM[Prometheus]
      GRA[Grafana]
      LOK[Loki]
      ALT[Alertmanager]
    end
  end
  CF --> NGX
  NGX --> WEB
  NGX --> CON
  NGX --> API
  API --> PG
  API --> CH
  API --> RDS
  API -. /metrics .-> PROM
  CON -. /metrics .-> PROM
  WEB -. /metrics .-> PROM
  PROM --> GRA
  LOK --> GRA
  PROM --> ALT
```

## Vai trò từng container

| Container | Image | Port nội bộ | Bind ngoài | Vai trò |
|---|---|---|---|---|
| cdnetworks-web | `cdn/web:latest` (multi-stage Next.js) | 3000 | 172.17.0.1:13601 | Marketing site + nhúng docs `/document/` |
| cdnetworks-console | `cdn/console:latest` (Vite SPA + nginx static) | 80 | 172.17.0.1:13602 | UI quản trị |
| cdnetworks-api | `cdn/api:latest` (Node 20 Alpine) | 4000 | 172.17.0.1:13603 | REST API + JWT + HMAC signed log |

## Luồng dữ liệu chính

### Login flow

```mermaid
sequenceDiagram
  participant U as Browser
  participant CF as Cloudflare
  participant N as Nginx
  participant A as API
  U->>CF: POST /api/v1/auth/login
  CF->>N: TLS pass-through
  N->>A: Forward request
  A->>A: Verify email + password (argon2 roadmap)
  A->>A: Sign JWT HS256, exp=15m
  A-->>U: { token, user }
  U->>U: Persist token vào localStorage
```

### Access log signed download

```mermaid
sequenceDiagram
  participant U as Console
  participant A as API
  U->>A: GET /api/v1/accesslogs/:id/signed-url (Bearer)
  A->>A: HMAC-SHA256(id|exp, JWT_SECRET)
  A-->>U: { url: /api/v1/accesslogs/:id/download?t=...&e=... }
  U->>A: GET signed URL
  A->>A: timingSafeEqual verify + exp check
  A-->>U: 200 application/gzip stream
```

## Module decomposition (Console)

```mermaid
mindmap
  root((Console))
    Dashboard
      Traffic chart
      Status donut
      Region table
    CDN
      Reports
      Edge configurations
      Access logs
      Origin logs
    Security
      Shield (WAF)
      Flood (DDoS)
      SSL certs
    DNS
      Zones
      Records
      DNSSEC
    Media
      Live
      VOD
    Edge
      Functions
      Rules
    Settings
      Branding
      Team
      Billing
      API keys
      Audit logs
```
