import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'cdn-api', ts: Date.now() }));

app.use('/api/v1', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.path }));

// Error handler
app.use(
  (err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[CDN-API] error', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Error' });
  },
);
