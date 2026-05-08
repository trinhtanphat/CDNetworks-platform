import { Router } from 'express';
import type { Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import mock from '../mock/accesslogs.json';

const r = Router();

type AccessLogMock = {
  id: string;
  hostname: string;
  date: string;
  size: number;
  format: 'gzip' | 'plain';
  status: 'ready' | 'processing' | 'failed';
  url?: string;
};

const DOWNLOAD_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

function signDownload(id: string, expires: number) {
  return createHmac('sha256', DOWNLOAD_SECRET).update(`${id}:${expires}`).digest('hex');
}

function hasValidDownloadSignature(id: string, expiresRaw: unknown, sigRaw: unknown) {
  const expires = Number(expiresRaw);
  const sig = typeof sigRaw === 'string' ? sigRaw : '';
  if (!expires || !sig || Date.now() > expires) return false;

  const expected = signDownload(id, expires);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function serveDownload(row: AccessLogMock, res: Response) {
  const body = [
    '#Fields: time c-ip cs-method cs-uri-stem sc-status sc-bytes time-taken cs(User-Agent)',
    `${row.date}T03:14:05Z 203.0.113.10 GET /index.html 200 12345 0.012 "Mozilla/5.0"`,
    `${row.date}T03:14:07Z 203.0.113.11 GET /api/orders 200 8421 0.034 "curl/8.0"`,
    `${row.date}T03:15:10Z 203.0.113.12 GET /missing.css 404 532 0.006 "Mozilla/5.0"`,
  ].join('\n');

  const extension = row.format === 'gzip' ? 'gz' : 'txt';
  res.setHeader('Content-Disposition', `attachment; filename="${row.id}.${extension}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');

  if (row.format === 'gzip') {
    res.type('application/gzip');
    return res.send(gzipSync(`${body}\n`));
  }

  res.type('text/plain');
  return res.send(`${body}\n`);
}

const QuerySchema = z.object({
  hostname: z.string().min(1),                 // CSV
  from: z.string().datetime(),
  to: z.string().datetime(),
  tz: z.string().default('UTC'),
});

/**
 * GET /api/v1/accesslogs?hostname=a,b&from=ISO&to=ISO&tz=Asia/Ho_Chi_Minh
 * Trả về danh sách file log đã hoặc đang được build.
 */
r.get('/', requireAuth, (req, res) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Bad query', details: parsed.error.flatten() });
  }
  const { hostname, from, to } = parsed.data;
  const hostFilter = hostname.split(',').map((s) => s.trim());

  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();

  const items = (mock as AccessLogMock[])
    .filter((row) => hostFilter.includes(row.hostname))
    .filter((row) => {
      const t = new Date(row.date).getTime();
      return t >= fromMs && t <= toMs;
    });

  return res.json({ items, total: items.length });
});

r.get('/:id/signed-url', requireAuth, (req, res) => {
  const row = (mock as AccessLogMock[]).find((item) => item.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Log file not found' });
  if (row.status !== 'ready') return res.status(409).json({ error: 'Log file is not ready' });

  const expires = Date.now() + 5 * 60_000;
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  const path = `/api/v1/accesslogs/${encodeURIComponent(row.id)}/download?expires=${expires}&sig=${signDownload(row.id, expires)}`;

  return res.json({
    url: host ? `${protocol}://${host}${path}` : path,
    expiresAt: new Date(expires).toISOString(),
  });
});

r.get('/:id/download', (req, res) => {
  const row = (mock as AccessLogMock[]).find((item) => item.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Log file not found' });
  if (row.status !== 'ready') return res.status(409).json({ error: 'Log file is not ready' });

  if (hasValidDownloadSignature(row.id, req.query.expires, req.query.sig)) {
    return serveDownload(row, res);
  }

  return requireAuth(req, res, () => serveDownload(row, res));
});

export default r;
