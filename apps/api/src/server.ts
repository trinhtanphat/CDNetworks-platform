import { app } from './app';

const PORT = Number(process.env.API_PORT || 4000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[CDN-API] listening on :${PORT}`);
});
