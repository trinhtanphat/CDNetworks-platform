import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import mock from '../mock/accesslogs.json';

const r = Router();

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

  const items = (mock as { id: string; hostname: string; date: string; size: number; format: string; status: string; url?: string }[])
    .filter((row) => hostFilter.includes(row.hostname))
    .filter((row) => {
      const t = new Date(row.date).getTime();
      return t >= fromMs && t <= toMs;
    });

  return res.json({ items, total: items.length });
});

export default r;
