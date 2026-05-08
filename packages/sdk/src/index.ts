/**
 * @cdn/sdk — Typed client cho CDNetworks Platform API.
 *
 * Tính năng:
 *   - HTTP client mỏng dựa trên fetch/undici
 *   - Tự retry 5xx/429 với backoff luỹ thừa + jitter
 *   - AbortController + timeout
 *   - HMAC-SHA256 verify cho file đã ký (signed download)
 *   - Pagination tiện lợi qua async iterator
 *
 * Cách dùng:
 *   ```ts
 *   import { CDNClient } from '@cdn/sdk';
 *
 *   const cdn = new CDNClient({
 *     baseUrl: 'https://console-cdnetworks.vnso.vn',
 *     token:   process.env.CDN_TOKEN!,
 *   });
 *
 *   const logs = await cdn.accessLogs.list({
 *     hostname: ['example.com'],
 *     from: '2025-01-01T00:00:00Z',
 *     to:   '2025-01-02T00:00:00Z',
 *   });
 *
 *   for await (const item of cdn.accessLogs.iterate({ hostname: ['example.com'] })) {
 *     console.log(item.id);
 *   }
 *
 *   const signed = await cdn.accessLogs.signedDownloadUrl(logs.items[0].id);
 *   await cdn.accessLogs.download(logs.items[0].id, '/tmp/log.gz');
 *   ```
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import {
  CDNError,
  CDNValidationError,
  CDNAuthError,
  CDNRateLimitError,
  CDNServerError,
  CDNIntegrityError,
} from './errors.js';

export * from './errors.js';

// ============================================================================
// Types
// ============================================================================

export interface CDNClientOptions {
  baseUrl:       string;
  token?:        string;
  apiKey?:       string;
  /** Số lần retry với 5xx/429. Mặc định 3. */
  retries?:      number;
  /** Timeout cho mỗi request (ms). Mặc định 30s. */
  timeout?:      number;
  /** Custom fetch (test/proxy). */
  fetch?:        typeof globalThis.fetch;
  /** User-Agent để gửi. */
  userAgent?:    string;
  /** HMAC secret để verify signed download. */
  hmacSecret?:   string;
}

export interface AccessLogQuery {
  hostname:  string[];
  from:      string;          // ISO8601
  to:        string;          // ISO8601
  timezone?: string;          // IANA tz, mặc định UTC
  page?:     number;
  pageSize?: number;
}

export interface AccessLogItem {
  id:        string;
  hostname:  string;
  startTime: string;
  endTime:   string;
  rows:      number;
  sizeBytes: number;
  url:       string;
  checksum?: { algo: 'sha256' | 'hmac-sha256'; value: string };
}

export interface Paginated<T> {
  items:    T[];
  page:     number;
  pageSize: number;
  total:    number;
}

export interface SignedUrl {
  url:       string;
  expiresAt: string;          // ISO
  checksum?: { algo: string; value: string };
}

// ============================================================================
// CDNClient
// ============================================================================

export class CDNClient {
  private readonly baseUrl:    string;
  private readonly token?:     string;
  private readonly apiKey?:    string;
  private readonly retries:    number;
  private readonly timeout:    number;
  private readonly fetchImpl:  typeof globalThis.fetch;
  private readonly userAgent:  string;
  private readonly hmacSecret?: string;

  /** Namespace API — mỗi resource gom vào sub-object. */
  public readonly accessLogs: AccessLogsAPI;
  public readonly hostnames:  HostnamesAPI;
  public readonly auth:       AuthAPI;

  constructor(opts: CDNClientOptions) {
    if (!opts.baseUrl) throw new CDNValidationError('CDNClient: baseUrl is required');
    this.baseUrl   = opts.baseUrl.replace(/\/+$/, '');
    this.token     = opts.token;
    this.apiKey    = opts.apiKey;
    this.retries   = opts.retries  ?? 3;
    this.timeout   = opts.timeout  ?? 30_000;
    this.fetchImpl = opts.fetch    ?? globalThis.fetch.bind(globalThis);
    this.userAgent = opts.userAgent ?? '@cdn/sdk-ts/0.1.0';
    this.hmacSecret = opts.hmacSecret;

    this.accessLogs = new AccessLogsAPI(this);
    this.hostnames  = new HostnamesAPI(this);
    this.auth       = new AuthAPI(this);
  }

  // --------- Public so các API namespace dùng chung -------------------------

  /** @internal */ getHmacSecret() { return this.hmacSecret; }

  /** Thực hiện 1 request có retry/timeout, parse JSON. */
  async request<T = unknown>(
    method: string,
    path:   string,
    body?:  unknown,
    init:   RequestInit = {},
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', this.userAgent);
    if (this.token)  headers.set('Authorization', `Bearer ${this.token}`);
    if (this.apiKey) headers.set('X-Api-Key', this.apiKey);
    if (body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const reqInit: RequestInit = {
      ...init,
      method,
      headers,
      body: body == null ? init.body : JSON.stringify(body),
    };

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const ctl = new AbortController();
      const timeoutId = setTimeout(() => ctl.abort(), this.timeout);
      try {
        const res = await this.fetchImpl(url, { ...reqInit, signal: ctl.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const ct = res.headers.get('content-type') ?? '';
          if (ct.includes('application/json')) return (await res.json()) as T;
          return (await res.text()) as T;
        }

        const requestId = res.headers.get('x-request-id') ?? undefined;
        const errBody   = await safeJson(res);
        const message   = (errBody?.error ?? errBody?.message ?? res.statusText) as string;

        if (res.status === 401 || res.status === 403) {
          throw new CDNAuthError(message, { status: res.status, requestId, cause: errBody });
        }
        if (res.status === 429) {
          const ra = parseInt(res.headers.get('retry-after') ?? '1', 10);
          const waitMs = Math.max(1000, (isNaN(ra) ? 1 : ra) * 1000);
          if (attempt < this.retries) { await sleep(waitMs + jitter(250)); continue; }
          throw new CDNRateLimitError(message, waitMs, { status: 429, requestId });
        }
        if (res.status >= 500) {
          if (attempt < this.retries) { await sleep(backoff(attempt) + jitter(250)); continue; }
          throw new CDNServerError(message, { status: res.status, requestId, cause: errBody });
        }
        // 4xx khác → không retry
        throw new CDNValidationError(message, { status: res.status, requestId, cause: errBody });
      } catch (err) {
        clearTimeout(timeoutId);
        lastErr = err;
        // Network/abort → retry
        if (err instanceof CDNError) {
          if (err instanceof CDNServerError || err instanceof CDNRateLimitError) {
            // đã handled retry phía trên; nếu rơi ra đây nghĩa là hết lượt
          }
          throw err;
        }
        if (attempt < this.retries) { await sleep(backoff(attempt) + jitter(250)); continue; }
        throw new CDNServerError('Network error', { cause: err });
      }
    }
    throw lastErr instanceof Error ? lastErr : new CDNServerError('Unknown error');
  }
}

// ============================================================================
// Resource APIs
// ============================================================================

class AccessLogsAPI {
  constructor(private readonly c: CDNClient) {}

  /** GET /api/v1/accesslogs — danh sách metadata các file log. */
  async list(q: AccessLogQuery): Promise<Paginated<AccessLogItem>> {
    if (!q.hostname?.length) throw new CDNValidationError('hostname is required');
    if (!q.from || !q.to)    throw new CDNValidationError('from/to are required (ISO8601)');

    const qs = new URLSearchParams({
      hostname: q.hostname.join(','),
      from:     q.from,
      to:       q.to,
      ...(q.timezone ? { tz: q.timezone } : {}),
      ...(q.page     ? { page:     String(q.page) }     : {}),
      ...(q.pageSize ? { pageSize: String(q.pageSize) } : {}),
    });
    return this.c.request<Paginated<AccessLogItem>>('GET', `/api/v1/accesslogs?${qs}`);
  }

  /** Async iterator — duyệt qua tất cả trang một cách an toàn. */
  async *iterate(q: AccessLogQuery): AsyncGenerator<AccessLogItem> {
    let page = q.page ?? 1;
    const pageSize = q.pageSize ?? 100;
    while (true) {
      const res = await this.list({ ...q, page, pageSize });
      for (const it of res.items) yield it;
      if (res.items.length < pageSize) return;
      if (page * pageSize >= res.total) return;
      page++;
    }
  }

  /** GET /api/v1/accesslogs/:id/signed-url — lấy URL có chữ ký. */
  async signedDownloadUrl(id: string): Promise<SignedUrl> {
    if (!id) throw new CDNValidationError('id is required');
    return this.c.request<SignedUrl>('GET', `/api/v1/accesslogs/${encodeURIComponent(id)}/signed-url`);
  }

  /**
   * Tải file log về `destPath`. Nếu server cung cấp HMAC checksum và SDK biết
   * `hmacSecret`, sẽ verify integrity sau khi tải xong.
   */
  async download(id: string, destPath: string): Promise<{ bytes: number; verified: boolean }> {
    const signed = await this.signedDownloadUrl(id);

    let lastErr: unknown;
    const maxAttempt = 3;
    for (let attempt = 0; attempt < maxAttempt; attempt++) {
      try {
        const res = await fetch(signed.url);
        if (!res.ok || !res.body) {
          throw new CDNServerError(`Download failed: HTTP ${res.status}`);
        }

        const hmac = signed.checksum?.algo === 'hmac-sha256' && this.c.getHmacSecret()
          ? createHmac('sha256', this.c.getHmacSecret()!)
          : null;

        let bytes = 0;
        const ws = createWriteStream(destPath);
        const nodeStream = Readable.fromWeb(res.body as never);
        nodeStream.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          hmac?.update(chunk);
        });
        await pipeline(nodeStream, ws);

        if (hmac && signed.checksum?.value) {
          const calc = Buffer.from(hmac.digest('hex'), 'utf8');
          const want = Buffer.from(signed.checksum.value, 'utf8');
          if (calc.length !== want.length || !timingSafeEqual(calc, want)) {
            throw new CDNIntegrityError('HMAC mismatch — file may be tampered.');
          }
          return { bytes, verified: true };
        }
        return { bytes, verified: false };
      } catch (err) {
        lastErr = err;
        if (err instanceof CDNIntegrityError || err instanceof CDNAuthError) throw err;
        if (attempt < maxAttempt - 1) { await sleep(backoff(attempt) + jitter(500)); continue; }
        throw err instanceof Error ? err : new CDNServerError('Download failed', { cause: err });
      }
    }
    throw lastErr instanceof Error ? lastErr : new CDNServerError('Download failed');
  }
}

class HostnamesAPI {
  constructor(private readonly c: CDNClient) {}
  list() { return this.c.request<{ items: { id: string; hostname: string }[] }>('GET', '/api/v1/hostnames'); }
}

class AuthAPI {
  constructor(private readonly c: CDNClient) {}
  login(email: string, password: string) {
    return this.c.request<{ accessToken: string; user: { id: string; email: string } }>(
      'POST', '/api/v1/auth/login', { email, password },
    );
  }
  logout() { return this.c.request<void>('POST', '/api/v1/auth/logout'); }
}

// ============================================================================
// Helpers
// ============================================================================

function backoff(attempt: number): number {
  return Math.min(30_000, 500 * Math.pow(2, attempt)); // 500, 1000, 2000, 4000…
}
function jitter(maxMs: number): number { return Math.floor(Math.random() * maxMs); }
function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try { return (await res.json()) as Record<string, unknown>; } catch { return null; }
}
