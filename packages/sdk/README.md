# @cdn/sdk

Typed TypeScript SDK chính thức cho **CDNetworks Platform API**.

## Cài đặt

```bash
npm install @cdn/sdk
# hoặc
pnpm add @cdn/sdk
```

## Khởi tạo

```ts
import { CDNClient } from '@cdn/sdk';

const cdn = new CDNClient({
  baseUrl: 'https://api.cdnetworks-platform.local',
  token:   process.env.CDN_TOKEN!,
  retries: 3,
  timeout: 30_000,
});
```

## Tải Access Logs có signed URL + verify HMAC

```ts
const list = await cdn.accessLogs.list({
  hostname: ['example.com'],
  from: '2025-01-01T00:00:00Z',
  to:   '2025-01-02T00:00:00Z',
});

for (const item of list.items) {
  await cdn.accessLogs.download(item.id, `./logs/${item.id}.gz`);
}
```

## Pagination với async iterator

```ts
for await (const log of cdn.accessLogs.iterate({
  hostname: ['example.com'],
  from: '2025-01-01T00:00:00Z',
  to:   '2025-02-01T00:00:00Z',
})) {
  console.log(log.id, log.rows);
}
```

## Phân loại lỗi

| Class                  | Khi nào         | Có nên retry? |
|------------------------|-----------------|---------------|
| `CDNValidationError`   | 4xx (trừ auth)  | Không         |
| `CDNAuthError`         | 401/403         | Không (cần re-auth) |
| `CDNRateLimitError`    | 429             | Có (đã auto)  |
| `CDNServerError`       | 5xx / network   | Có (đã auto)  |
| `CDNIntegrityError`    | HMAC mismatch   | Không         |
