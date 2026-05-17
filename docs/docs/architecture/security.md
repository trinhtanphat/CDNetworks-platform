---
id: security
title: Security
sidebar_position: 7
---

# Security

## Mô hình mối đe doạ

| Tác nhân | Mối đe doạ | Phòng vệ |
|---|---|---|
| Internet anonymous | DDoS L3/4/7, scrape | Cloudflare WAF + rate-limit |
| Người dùng bất hợp pháp | Đánh cắp token, CSRF | JWT short-lived + SameSite cookie roadmap |
| Người trong tổ chức | Lạm quyền | RBAC + audit log |
| Supply chain | NPM malicious | Lock file + `pnpm audit` CI |
| Insider DC | Truy cập đĩa | Disk encryption + secret ngoài repo |

## Quản lý danh tính & xác thực

- **JWT HS256**, claim `sub`, `email`, `role`, `exp` (15 phút roadmap, hiện 24h).
- **Refresh token** lưu Redis với jti — chưa triển khai (P1.3).
- **MFA TOTP** roadmap cho role admin.
- **OIDC** sẵn cấu trúc (`passport-openidconnect`) để tích hợp Azure AD / Keycloak.

### Lưu mật khẩu

- Hiện so sánh plaintext với `.env` (chỉ admin demo). **PHẢI** chuyển sang argon2id (P0.2):

```ts
import argon2 from 'argon2';
const hash = await argon2.hash(password, { type: argon2.argon2id });
const ok = await argon2.verify(hash, input);
```

## Authorization

- Role: `admin`, `operator`, `viewer`.
- Middleware `requireRole('admin')` trên route mutating.
- Mọi mutating endpoint ghi `audit_logs` (P1.5).

## Bảo vệ asset

| Asset | Cơ chế |
|---|---|
| Access log file | URL ký HMAC-SHA256(`id|exp`) bằng `JWT_SECRET`, hạn 5 phút, `timingSafeEqual` verify |
| Branding upload | Validate MIME + size + lưu tách `apps/console/public/branding/<uuid>` |
| Backup tarball | Mã hoá AES-256 trước khi upload (restic) |

## Headers (đã set / cần set)

```nginx
add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'nonce-$request_id'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api-cdnetworks.vnso.vn https://console-cdnetworks.vnso.vn; font-src 'self' data:;" always;
```

## Secret rotation

| Secret | Tần suất | Quy trình |
|---|---|---|
| `JWT_SECRET` | 90 ngày | `scripts/rotate-jwt.sh` → grace period 2 token cũ |
| `ADMIN_PASSWORD` | 60 ngày | Đổi qua `apps/api/scripts/set-admin.ts` |
| TLS cert | 60 ngày trước hết hạn (auto) | certbot + `nginx -s reload` |
| Cloudflare API token | 180 ngày | Tạo token mới, update GH Secret |

## Compliance / audit

- Log truy cập Bearer token → audit table (route, ip, ua, ts).
- Backup retention: 14 daily / 8 weekly / 6 monthly.
- Tuân thủ ND-13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân Việt Nam (lưu log truy cập 24 tháng).

## Vulnerability management

- `pnpm audit --prod` chạy weekly trên CI.
- `docker scout cves` trên image build.
- Dependabot bật ở `.github/dependabot.yml` (cần kích hoạt).
