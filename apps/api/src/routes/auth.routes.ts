import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const r = Router();

// ⚠️ DEV-ONLY in-memory user store. Production: dùng Postgres + bảng users.
const USERS = [
  {
    id: 'u_1',
    email: 'admin@demo.com',
    // password = "demo1234"
    passwordHash: bcrypt.hashSync('demo1234', 10),
    role: 'admin' as const,
    tenantId: 't_demo',
  },
];

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const JWT_TTL = process.env.JWT_ACCESS_TTL || '15m';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Resp: { accessToken, user }
 */
r.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = USERS.find((u) => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: JWT_TTL } as jwt.SignOptions,
  );

  return res.json({
    accessToken,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
  });
});

r.post('/logout', (_req, res) => res.json({ ok: true }));

export default r;
