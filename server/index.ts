import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import authRoutes from './routes/auth';
import fitnessRoutes from './routes/fitness';
import appDataRoutes from './routes/app-data';

// ── Startup: Pflichtumgebungsvariablen prüfen ─────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Umgebungsvariable "${key}" fehlt.`);
    process.exit(1);
  }
}

// ── In-Memory Rate-Limiter (IP-basiert) ──────────────────────────────────────
const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();

function makeRateLimiter(maxRequests: number, windowMs: number) {
  return async function rateLimiter(c: Parameters<typeof app.use>[1], next: () => Promise<void>) {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const now = Date.now();
    const entry = rateLimitWindows.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitWindows.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > maxRequests) {
        return c.json({ success: false, error: 'Zu viele Anfragen – bitte warte kurz.' }, 429);
      }
    }

    await next();
  };
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono();

const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5500').split(',').map(s => s.trim());

app.use('*', cors({ origin: allowedOrigins, credentials: true }));
app.use('*', secureHeaders());
app.use('*', logger());

// Rate-Limiter: Auth-Endpunkte strenger (10 req/min), alles andere 120 req/min
app.use('/api/auth/*', makeRateLimiter(10, 60_000) as never);
app.use('/api/*', makeRateLimiter(120, 60_000) as never);

// ── Routen ────────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/fitness', fitnessRoutes);
app.route('/api/data', appDataRoutes);

// ── Globaler Fehler-Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[Server Error]', err);
  return c.json({ success: false, error: 'Interner Serverfehler' }, 500);
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Server läuft auf http://localhost:${port}`);

export default { port, fetch: app.fetch };
