---
id: runbook
title: Operational Runbook
sidebar_position: 9
---

# Runbook

> Mọi lệnh chạy trong `/root/CDNetworks-platform` trên VPS `103.9.157.6`.

## Deploy thay đổi

```bash
# 1. Pull code mới
cd /root/CDNetworks-platform
git pull origin main

# 2. Cài deps (nếu lockfile thay đổi)
pnpm install --frozen-lockfile

# 3. Rebuild image bị ảnh hưởng
docker compose -f docker-compose.deploy.yml build cdn-api cdn-console cdn-web

# 4. Cuộn rolling
docker compose -f docker-compose.deploy.yml up -d cdn-api cdn-console cdn-web

# 5. Reload nginx (nếu sửa conf.d/*)
docker exec xiaozhi-esp32-server-web nginx -t \
  && docker exec xiaozhi-esp32-server-web nginx -s reload

# 6. Smoke
curl -sI https://cdnetworks.vnso.vn | head -1
curl -sI https://console-cdnetworks.vnso.vn/dashboard | head -1
curl -s https://api-cdnetworks.vnso.vn/api/v1/health
```

## Rollback

```bash
git log --oneline -n 10
git checkout <commit_truoc>
docker compose -f docker-compose.deploy.yml build <service>
docker compose -f docker-compose.deploy.yml up -d <service>
```

Khuyến nghị tag image: `cdn/api:rollback-YYYYMMDD` trước khi push image mới.

## Restart từng service

```bash
docker compose -f docker-compose.deploy.yml restart cdn-api
docker compose -f docker-compose.deploy.yml restart cdn-console
docker compose -f docker-compose.deploy.yml restart cdn-web
docker exec xiaozhi-esp32-server-web nginx -s reload
```

## Inspect logs

```bash
docker logs --tail 200 -f cdnetworks-api
docker logs --tail 200 -f cdnetworks-console
docker logs --tail 200 -f cdnetworks-web
docker exec xiaozhi-esp32-server-web tail -f /var/log/nginx/access.log
docker exec xiaozhi-esp32-server-web tail -f /var/log/nginx/error.log
```

## Dọn disk khẩn cấp

```bash
# 1. Xem ai chiếm chỗ
du -sh /var/lib/docker /root/* 2>/dev/null | sort -h | tail -20

# 2. Dọn image / build cache
docker system prune -af --volumes

# 3. Xoá log nginx cũ
docker exec xiaozhi-esp32-server-web sh -c 'find /var/log/nginx -name "*.log.*" -mtime +14 -delete'

# 4. Truncate journal
journalctl --vacuum-time=14d
```

## Đổi mật khẩu admin

```bash
# Sửa .env
nano /root/CDNetworks-platform/.env  # ADMIN_PASSWORD=...

# Rebuild + restart api
docker compose -f docker-compose.deploy.yml up -d --force-recreate cdn-api
```

## Rotate `JWT_SECRET`

```bash
NEW=$(openssl rand -base64 48)
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${NEW}|" /root/CDNetworks-platform/.env
docker compose -f docker-compose.deploy.yml up -d --force-recreate cdn-api
# Tất cả phiên login hiện tại sẽ bị invalidate — thông báo user.
```

## Renew TLS cert

```bash
certbot renew --dry-run                 # test
certbot renew                           # thật
docker exec xiaozhi-esp32-server-web nginx -s reload
```

## Build docs (GH Pages + /document/)

```bash
cd /root/CDNetworks-platform/docs
DOCS_TARGET=github-pages pnpm run build   # bản GH Pages
pnpm run build                            # bản /document/
```

Workflow `.github/workflows/docs.yml` tự push lên GH Pages khi merge `main`.

## Khi container không healthy

```bash
docker inspect --format '{{json .State.Health}}' cdnetworks-api | jq
docker compose -f docker-compose.deploy.yml restart cdn-api
# Nếu vẫn fail, xem logs + rollback image tag.
```

## Break-glass (sửa tay trên VPS)

1. Tạo branch `hotfix/YYYYMMDD-<desc>`.
2. Sửa file trên VPS.
3. `git diff > /tmp/hotfix.patch` và commit ngay lên branch.
4. PR + revert apply qua quy trình GitOps trong vòng 24h.
