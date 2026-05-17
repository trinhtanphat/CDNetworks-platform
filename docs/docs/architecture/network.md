---
id: network
title: Network
sidebar_position: 4
---

# Network

## DNS records (vnso.vn — quản lý qua Cloudflare)

| Hostname | Type | Value | TTL | Proxy |
|---|---|---|---|---|
| cdnetworks.vnso.vn | A | 103.9.157.6 | Auto | ✅ |
| console-cdnetworks.vnso.vn | A | 103.9.157.6 | Auto | ✅ |
| api-cdnetworks.vnso.vn | A | 103.9.157.6 | Auto | ✅ |
| docs-cdnetworks.vnso.vn | CNAME | cdnetworks.vnso.vn | Auto | ✅ |
| _acme-challenge.* | TXT | (do certbot) | 60 | — |

> Mirror docs công khai: `https://trinhtanphat.github.io/CDNetworks-platform/` (GitHub Pages).

## Cổng & giao thức

| Layer | Cổng | Giao thức | Hướng | Ghi chú |
|---|---|---|---|---|
| Edge → Origin | 443 | TLS 1.2/1.3 | Inbound | Allow chỉ Cloudflare IP (`https://www.cloudflare.com/ips/`) |
| Edge → Origin | 80 | HTTP | Inbound | Redirect 301 → 443 |
| Admin | 22 | SSH | Inbound | Whitelist IP SRE, key-only, fail2ban |
| Outbound | 443 | HTTPS | Out | Pull image, npm/pnpm registry, ACME |
| Outbound | 53 | DNS | Out | Cloudflare 1.1.1.1 / Google 8.8.8.8 |

## Firewall (UFW + Cloudflare WAF)

### UFW host

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow from <SRE_IP> to any port 22 proto tcp
ufw allow 80,443/tcp
ufw enable
```

### Cloudflare WAF rule

- **Bot Fight Mode**: ON
- **OWASP Core Rule Set**: ON (Paranoia level 2)
- **Rate limit /api/v1/auth/login**: 10 req/min/IP
- **Country block**: tuỳ thị trường (mặc định Allow all).
- **TLS**: Min TLS 1.2, HSTS 6 tháng, preload sau khi xác minh.

## Network policy (roadmap, khi lên K8s)

```yaml
# Chỉ console + web mới được gọi api
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: api-ingress }
spec:
  podSelector: { matchLabels: { app: cdnetworks-api } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: cdnetworks-console } }
        - podSelector: { matchLabels: { app: cdnetworks-web } }
      ports:
        - { protocol: TCP, port: 4000 }
```

## mTLS giữa nginx ↔ origin app (roadmap)

- Cấp CA nội bộ (`step-ca`).
- Sidecar Envoy hoặc Linkerd auto-mTLS.

## IPv6

- Chưa cấp tại VPS. Cloudflare proxy đã hỗ trợ AAAA cho client; origin vẫn IPv4-only.
- Khi DC cấp /64, thêm `AAAA` cho mọi A record và bind `::1`/`[::]`.

## Băng thông

- VPS uplink 1 Gbps (chưa đo thực tế).
- Cloudflare cache offload >85% với CDN static (web + console + docs).
- API traffic không cache, đi thẳng origin.
