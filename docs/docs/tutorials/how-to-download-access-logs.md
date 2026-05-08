---
id: how-to-download-access-logs
title: Cách tải Access Logs từ Console
sidebar_position: 1
---

# Cách tải Access Logs từ Console

Bài hướng dẫn này giúp bạn tải file Access Log từ giao diện Console của
CDNetworks Platform — phục vụ phân tích traffic, debug 4xx/5xx, hoặc
nạp vào hệ thống SIEM.

## Yêu cầu trước

- Tài khoản đã được cấp quyền **Logs : read**.
- Hostname đã bật tính năng **Access Log Delivery** trong Edge Configuration
  (mặc định: bật, retention 7 ngày).

## Các bước thực hiện

### Bước 1 — Mở trang Access Logs

1. Đăng nhập vào [Console](https://console.cdnetworks-platform.local).
2. Sidebar → **Access Logs** (icon kính lúp).

![Sidebar](../../static/img/console-sidebar.png)

### Bước 2 — Chọn Hostname

- Mục **Hostname** hỗ trợ multi-select.
- Chọn 1 hoặc nhiều hostname (ví dụ `www.example.com`, `api.example.com`).
- Hostname không xuất hiện? → Liên hệ admin để bật Access Log Delivery.

### Bước 3 — Chọn Date Range & Timezone

- **Date Range**: tối đa **31 ngày** mỗi lần truy vấn.
- **Timezone**: mặc định `Asia/Ho_Chi_Minh (UTC+07:00)`. Đổi nếu team bạn ở múi giờ khác.

> ⚠️ Khoảng vượt 31 ngày sẽ bị chặn ngay phía client với thông báo
> *"Date range cannot exceed 31 days"*.

### Bước 4 — Bấm **Search**

Hệ thống truy vấn `GET /api/v1/accesslogs` với query đã build và hiển thị
bảng kết quả gồm các cột:

| Cột      | Ý nghĩa |
|----------|---------|
| Hostname | Tên miền đã chọn |
| Date     | Ngày của file log (theo timezone đã chọn) |
| Size     | Kích thước file (MB) |
| Format   | `gzip` hoặc `plain` |
| Status   | `READY` / `PROCESSING` / `FAILED` |
| Action   | Nút **Download** (chỉ hiện khi status = READY) |

### Bước 5 — Tải file

- Bấm **Download** → file được tải qua URL ký pre-signed (hết hạn sau 5 phút).
- File `.gz` có thể giải nén:
  ```bash
  gunzip -c log_001.gz | head
  ```

## Định dạng log (W3C Extended)

```
#Fields: time c-ip cs-method cs-uri-stem sc-status sc-bytes time-taken cs(User-Agent)
2026-05-07T03:14:05Z 203.0.113.10 GET /index.html 200 12345 0.012 "Mozilla/5.0..."
```

## Tự động hoá bằng API

Xem [API Reference: Access Logs](../api-reference/access-logs-api.md) nếu bạn
muốn tải log định kỳ qua cron/CI thay vì click thủ công.

## Câu hỏi thường gặp

**Q: File ở trạng thái `PROCESSING` trong bao lâu?**
A: Trung bình 5–15 phút sau khi log batch được đóng (theo giờ).

**Q: Có giới hạn dung lượng tải không?**
A: Trong gói Free Trial: 10 GB/ngày. Plan Enterprise: không giới hạn.

**Q: Log có chứa PII (IP, header)?**
A: Có. Vui lòng tuân thủ GDPR/PDPL khi xử lý log ở phía bạn.
