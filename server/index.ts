import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { verify } from 'hono/jwt';
import { readFile } from 'fs/promises';
import { join } from 'path';
import authRoutes from './routes/auth';
import fitnessRoutes from './routes/fitness';
import appDataRoutes from './routes/app-data';
import adminRoutes from './routes/admin';
import gymAuthRoutes from './routes/gym-auth';
import gymMeasurementsRoutes from './routes/gym-measurements';
import gymTemplatesRoutes from './routes/gym-templates';
import gymExercisesRoutes from './routes/gym-exercises';
import gymWorkoutsRoutes from './routes/gym-workouts';
import availabilityRoutes from './routes/availability';

// Whitelist: nur diese JSX-Dateien können über /api/src/:key abgerufen werden.
// Schlüssel = URL-Key, Wert = Pfad relativ zum Projekt-Root (eine Ebene über server/).
const PROTECTED_SOURCES: Record<string, string> = {
  'dashboard':  'dashboard/dashboard.jsx',
  'about-me':   'about-me/about-me.jsx',
  'ai-chat':    'ai-chat/ai-chat.jsx',
  'admin-page': 'shared/admin-page.jsx',
};

const PROJECT_ROOT = join(import.meta.dir, '..');

// ── Startup: Pflichtumgebungsvariablen prüfen ─────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Umgebungsvariable "${key}" fehlt.`);
    process.exit(1);
  }
}

// ── In-Memory Rate-Limiter (IP-basiert) ──────────────────────────────────────
function makeRateLimiter(maxRequests: number, windowMs: number) {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return async function rateLimiter(c: Parameters<typeof app.use>[1], next: () => Promise<void>) {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const now = Date.now();
    const entry = windows.get(ip);

    if (!entry || now > entry.resetAt) {
      windows.set(ip, { count: 1, resetAt: now + windowMs });
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

const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5500')
  .split(',')
  .map(s => s.trim())
  .flatMap(origin => {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const port = url.port ? `:${url.port}` : '';
        return [`${url.protocol}//localhost${port}`, `${url.protocol}//127.0.0.1${port}`];
      }
    } catch { /* ignorieren */ }
    return [origin];
  });

app.use('*', cors({ origin: allowedOrigins, credentials: true }));
app.use('*', secureHeaders());
app.use('*', logger());

// Rate-Limiter: Auth-Endpunkte strenger (10 req/min), alles andere 120 req/min
app.use('/api/auth/*',     makeRateLimiter(10,  60_000) as never);
app.use('/api/gym/auth/*', makeRateLimiter(10,  60_000) as never);
app.use('/api/*',          makeRateLimiter(120, 60_000) as never);

// ── Routen ────────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// ── Geschützte Quelltext-Auslieferung ─────────────────────────────────────────
// Nur eingeloggte User erhalten die protected JSX-Dateien.
// Whitelist verhindert Path-Traversal — nur bekannte Keys sind erlaubt.
app.get('/api/src/:key', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  try {
    await verify(authHeader.slice(7), process.env.JWT_SECRET!, 'HS256');
  } catch {
    return c.json({ success: false, error: 'Ungültiger Token' }, 401);
  }

  const key = c.req.param('key');
  const relPath = PROTECTED_SOURCES[key];
  if (!relPath) {
    return c.json({ success: false, error: 'Nicht gefunden' }, 404);
  }

  try {
    const absPath = join(PROJECT_ROOT, relPath);
    console.log('[src] PROJECT_ROOT:', PROJECT_ROOT);
    console.log('[src] absPath:', absPath);
    const content = await readFile(absPath, 'utf-8');
    return c.text(content, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (e) {
    console.error('[src] readFile error:', e);
    return c.json({ success: false, error: 'Datei nicht verfügbar' }, 404);
  }
});

app.route('/api/auth',     authRoutes);
app.route('/api/fitness',  fitnessRoutes);
app.route('/api/data',     appDataRoutes);
app.route('/api/admin',    adminRoutes);
app.route('/api/gym/auth',         gymAuthRoutes);
app.route('/api/gym/measurements', gymMeasurementsRoutes);
app.route('/api/gym/templates',    gymTemplatesRoutes);
app.route('/api/gym/exercises',    gymExercisesRoutes);
app.route('/api/gym/workouts',     gymWorkoutsRoutes);
app.route('/api/availability',     availabilityRoutes);

// ── Globaler Fehler-Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[Server Error]', err);
  return c.json({ success: false, error: 'Interner Serverfehler' }, 500);
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Server läuft auf http://localhost:${port}`);

export default { port, fetch: app.fetch };
