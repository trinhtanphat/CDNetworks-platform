---
id: access-logs-api
title: Access Logs API
sidebar_position: 1
---

# Access Logs API

## Endpoint

```
GET https://api.cdnetworks-platform.local/api/v1/accesslogs
```

Trả về danh sách file log có thể tải về cho một hoặc nhiều hostname trong
một khoảng thời gian.

## Authentication

Bắt buộc Bearer JWT (`Authorization: Bearer <accessToken>`) hoặc API key
(`X-Api-Key: <key>`).

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Query parameters

| Tham số  | Kiểu     | Bắt buộc | Mặc định | Mô tả |
|----------|----------|----------|----------|-------|
| `hostname` | string | ✅ | — | CSV danh sách hostname, ví dụ `www.example.com,api.example.com` |
| `from`     | ISO-8601 datetime | ✅ | — | Mốc đầu (inclusive) |
| `to`       | ISO-8601 datetime | ✅ | — | Mốc cuối (inclusive). `from` ≤ `to`, khoảng ≤ **31 ngày** |
| `tz`       | IANA timezone | ❌ | `UTC` | Áp dụng để format trường `date` trong response |
| `format`   | `gzip` \| `plain` | ❌ | (cả hai) | Lọc theo định dạng file |

## Ví dụ request

```bash
curl -G "https://api.cdnetworks-platform.local/api/v1/accesslogs" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "hostname=www.example.com,api.example.com" \
  --data-urlencode "from=2026-05-01T00:00:00Z" \
  --data-urlencode "to=2026-05-07T23:59:59Z" \
  --data-urlencode "tz=Asia/Ho_Chi_Minh"
```

## Response 200 OK

```json
{
  "total": 2,
  "items": [
    {
      "id": "log_001",
      "hostname": "www.example.com",
      "date": "2026-05-07",
      "size": 12582912,
      "format": "gzip",
      "status": "ready",
      "url": "https://logs.cdnetworks-platform.local/dl/log_001.gz?expires=..."
    },
    {
      "id": "log_002",
      "hostname": "www.example.com",
      "date": "2026-05-06",
      "size": 10485760,
      "format": "gzip",
      "status": "ready",
      "url": "https://logs.cdnetworks-platform.local/dl/log_002.gz?expires=..."
    }
  ]
}
```

### Trường response

| Trường   | Mô tả |
|----------|-------|
| `id`     | Mã định danh duy nhất của file log |
| `hostname` | Hostname tương ứng |
| `date`   | Ngày của log (theo `tz`) |
| `size`   | Kích thước bytes |
| `format` | `gzip` / `plain` |
| `status` | `ready` / `processing` / `failed` |
| `url`    | URL pre-signed, hiệu lực **5 phút**. Chỉ có khi `status=ready` |

## Mã lỗi

| HTTP | `error`                | Khi nào |
|------|------------------------|---------|
| 400  | `Bad query`            | Sai schema query (zod) |
| 400  | `Date range cannot exceed 31 days` | `to-from` > 31 ngày |
| 401  | `Missing bearer token` | Thiếu/sai JWT |
| 403  | `Insufficient scope`   | Token không có scope `logs:read` |
| 429  | `Too Many Requests`    | Vượt rate-limit (300 req/phút/IP) |

## Webhook (đăng ký nhận thông báo log mới)

`POST /api/v1/webhooks` để đăng ký URL nhận event `accesslog.ready`.
Payload được ký HMAC-SHA256 (header `X-CDN-Signature`).

```json
{
  "event": "accesslog.ready",
  "data": { "id": "log_001", "hostname": "www.example.com", "date": "2026-05-07" }
}
```

## SDK

```ts
import { CDNClient } from '@cdn/sdk';

const cdn = new CDNClient({ token: process.env.CDN_TOKEN! });

const logs = await cdn.accessLogs.list({
  hostnames: ['www.example.com'],
  from: '2026-05-01T00:00:00Z',
  to:   '2026-05-07T23:59:59Z',
  timezone: 'Asia/Ho_Chi_Minh',
});

for (const f of logs.items) {
  if (f.status === 'ready' && f.url) {
    await cdn.download(f.url, `./logs/${f.id}.gz`);
  }
}
```
