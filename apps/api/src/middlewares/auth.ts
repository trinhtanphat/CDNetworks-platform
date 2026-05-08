import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  user?: { sub: string; email: string; role: string; tenantId: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

/**
 * requireAuth — verify Bearer JWT.
 * Trong dev, có thể bỏ qua bằng header `X-Dev-Bypass: 1` (KHÔNG bao giờ bật trong prod).
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production' && req.header('X-Dev-Bypass') === '1') {
    req.user = { sub: 'u_dev', email: 'dev@local', role: 'admin', tenantId: 't_demo' };
    return next();
  }

  const auth = req.header('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    const payload = jwt.verify(m[1], JWT_SECRET) as AuthedRequest['user'];
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
