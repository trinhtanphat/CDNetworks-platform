---
id: introduction
title: Giới thiệu CDNetworks Platform
slug: /
sidebar_position: 1
---

# Giới thiệu CDNetworks Platform

**CDNetworks Platform** là nền tảng hợp nhất ba dòng sản phẩm cốt lõi:

1. **Web Performance** — tăng tốc website, ứng dụng động và truyền tải media trên mạng lưới CDN toàn cầu (2.800+ PoP, 70+ quốc gia).
2. **Cloud Security** — bảo vệ ứng dụng và API khỏi DDoS, OWASP Top 10, bot và lạm dụng API.
3. **Edge Computing** — chạy code/container ngay tại biên, gần người dùng cuối.

> Cùng một dashboard, một billing, một bộ API. Không còn cảnh tích hợp rời rạc nhiều vendor.

## Khi nào nên dùng?

| Bài toán | Module phù hợp |
|----------|---------------|
| Trang web bán hàng tải chậm ở thị trường quốc tế | Application Acceleration + Image CDN |
| Ứng dụng bị quét bot, brute-force login | Bot Shield + Application Shield (WAF) |
| Cần xử lý A/B test ngay tại biên, không round-trip về origin | Edge Functions |
| Streaming live, VOD đa khu vực | Media Acceleration |

## Điểm khác biệt

- **Single pane of glass**: 1 portal duy nhất quản lý cả CDN, WAF, DDoS, Edge.
- **API-first**: mọi thứ trên UI đều có endpoint REST tương ứng (`/api/v1/...`).
- **Realtime analytics**: traffic, status code, attack map cập nhật theo phút.
- **SSO doanh nghiệp**: SAML2/OIDC sẵn có; LDAP sync cho tenant lớn.

## Bắt đầu

- [Đăng ký dùng thử 14 ngày](https://cdnetworks-platform.local/free-trial)
- [Hướng dẫn tải Access Logs](../tutorials/how-to-download-access-logs.md)
- [API Reference: Access Logs](../api-reference/access-logs-api.md)

## Sơ đồ kiến trúc tổng quan

```
User ──▶ Edge PoP (Cache + WAF + Bot + Edge Function)
            │
            ├─ Hit  → trả ngay từ cache
            └─ Miss → Origin Shield → Origin server
```

Mọi traffic đi qua Edge đều được:
- Đo lường (metrics → analytics).
- Lưu access log (theo policy, default 7 ngày → tải qua Console hoặc API).
- Áp policy bảo mật (rate-limit, WAF rule, bot mitigation).
