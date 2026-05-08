/**
 * Tiện ích xử lý Date Range trong trang Access Logs.
 * Tách ra để Jest unit-test dễ.
 */

export type DateRangeInput = {
  hostnames: string[];
  from: Date;
  to: Date;
  timezone: string;
};

export type DateRangeQuery = {
  hostname: string;        // CSV
  from: string;            // ISO
  to: string;              // ISO
  tz: string;
};

export const MAX_RANGE_DAYS = 31;

/**
 * Build query string cho `GET /api/v1/accesslogs`.
 * - Hostnames được join CSV.
 * - Khoảng tối đa MAX_RANGE_DAYS ngày — vượt sẽ throw để form hiển thị lỗi.
 * - `from` phải <= `to`.
 */
export function buildDateRangeQuery(input: DateRangeInput): DateRangeQuery {
  if (!Array.isArray(input.hostnames) || input.hostnames.length === 0) {
    throw new Error('At least one hostname is required');
  }
  if (!(input.from instanceof Date) || !(input.to instanceof Date)) {
    throw new Error('from/to must be Date');
  }
  if (input.from.getTime() > input.to.getTime()) {
    throw new Error('from must be <= to');
  }
  const diffDays = Math.ceil((input.to.getTime() - input.from.getTime()) / 86_400_000);
  if (diffDays > MAX_RANGE_DAYS) {
    throw new Error(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
  }
  return {
    hostname: input.hostnames.join(','),
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    tz: input.timezone || 'UTC',
  };
}
