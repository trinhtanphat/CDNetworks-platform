/**
 * Unit-test cho hàm xử lý Date Range trong trang Access Logs.
 * Cover: happy path, validation, ranh giới 31 ngày, hostname rỗng, sai thứ tự.
 */
import { buildDateRangeQuery, MAX_RANGE_DAYS } from '@/utils/dateRange';

describe('buildDateRangeQuery', () => {
  const baseFrom = new Date('2026-05-01T00:00:00.000Z');
  const baseTo   = new Date('2026-05-07T23:59:59.000Z');

  it('trả về query đúng cho input hợp lệ', () => {
    const q = buildDateRangeQuery({
      hostnames: ['www.example.com', 'api.example.com'],
      from: baseFrom,
      to: baseTo,
      timezone: 'Asia/Ho_Chi_Minh',
    });

    expect(q.hostname).toBe('www.example.com,api.example.com');
    expect(q.from).toBe(baseFrom.toISOString());
    expect(q.to).toBe(baseTo.toISOString());
    expect(q.tz).toBe('Asia/Ho_Chi_Minh');
  });

  it('mặc định tz = UTC khi rỗng', () => {
    const q = buildDateRangeQuery({
      hostnames: ['a.example.com'], from: baseFrom, to: baseTo, timezone: '',
    });
    expect(q.tz).toBe('UTC');
  });

  it('throw khi hostnames rỗng', () => {
    expect(() =>
      buildDateRangeQuery({ hostnames: [], from: baseFrom, to: baseTo, timezone: 'UTC' }),
    ).toThrow(/hostname/i);
  });

  it('throw khi from > to', () => {
    expect(() =>
      buildDateRangeQuery({
        hostnames: ['a'], from: baseTo, to: baseFrom, timezone: 'UTC',
      }),
    ).toThrow(/from must be <= to/);
  });

  it(`throw khi range vượt ${MAX_RANGE_DAYS} ngày`, () => {
    const tooFar = new Date(baseFrom.getTime() + (MAX_RANGE_DAYS + 1) * 86_400_000);
    expect(() =>
      buildDateRangeQuery({
        hostnames: ['a'], from: baseFrom, to: tooFar, timezone: 'UTC',
      }),
    ).toThrow(/cannot exceed/);
  });

  it(`chấp nhận range đúng ${MAX_RANGE_DAYS} ngày (biên)`, () => {
    const edge = new Date(baseFrom.getTime() + MAX_RANGE_DAYS * 86_400_000);
    expect(() =>
      buildDateRangeQuery({
        hostnames: ['a'], from: baseFrom, to: edge, timezone: 'UTC',
      }),
    ).not.toThrow();
  });

  it('throw khi from/to không phải Date', () => {
    // @ts-expect-error — chủ ý truyền sai kiểu
    expect(() => buildDateRangeQuery({ hostnames: ['a'], from: 'x', to: 'y', timezone: 'UTC' }))
      .toThrow(/Date/);
  });
});
