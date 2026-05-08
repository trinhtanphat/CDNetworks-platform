/**
 * Phân loại lỗi của SDK — gọi `instanceof` để phân nhánh xử lý ở app.
 */

export class CDNError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    opts: { status?: number; code?: string; requestId?: string; cause?: unknown } = {},
  ) {
    super(message);
    this.name      = 'CDNError';
    this.status    = opts.status;
    this.code      = opts.code;
    this.requestId = opts.requestId;
    this.cause     = opts.cause;
  }
}

/** 4xx — request không hợp lệ, KHÔNG retry. */
export class CDNValidationError extends CDNError { name = 'CDNValidationError' as const; }

/** 401 / 403 — token sai/hết hạn — KHÔNG retry tự động. */
export class CDNAuthError       extends CDNError { name = 'CDNAuthError'       as const; }

/** 429 — rate-limited — retry được, đọc Retry-After. */
export class CDNRateLimitError  extends CDNError {
  name = 'CDNRateLimitError' as const;
  public readonly retryAfterMs: number;
  constructor(message: string, retryAfterMs: number, opts: ConstructorParameters<typeof CDNError>[1] = {}) {
    super(message, opts);
    this.retryAfterMs = retryAfterMs;
  }
}

/** 5xx hoặc network — retry với backoff. */
export class CDNServerError     extends CDNError { name = 'CDNServerError'     as const; }

/** Tải file mà checksum không khớp HMAC. */
export class CDNIntegrityError  extends CDNError { name = 'CDNIntegrityError'  as const; }
