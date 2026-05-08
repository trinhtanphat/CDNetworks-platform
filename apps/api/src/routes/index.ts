import { Router } from 'express';
import auth from './auth.routes';
import accesslogs from './accesslogs.routes';

const r = Router();
r.use('/auth', auth);
r.use('/accesslogs', accesslogs);

// Hostname list (mock)
r.get('/hostnames', (_req, res) => {
  res.json({ items: ['www.example.com', 'static.example.com', 'api.example.com', 'cdn.example.com'] });
});

// Free-trial lead capture (mock)
r.post('/leads/free-trial', (req, res) => {
  res.status(201).json({ ok: true, id: `lead_${Date.now()}`, payload: req.body });
});

export default r;
