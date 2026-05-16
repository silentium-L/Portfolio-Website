import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import sql from '../db';

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 Tage

const credentialsSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, _ und - erlaubt'),
  password: z.string().min(6).max(72),
});

function makeToken(userId: number, username: string) {
  const exp = Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS;
  return sign({ sub: userId, username, exp }, JWT_SECRET, 'HS256');
}

// ── POST /register ────────────────────────────────────────────────────────────
auth.post('/register', async (c) => {
  const body = credentialsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { username, password } = body.data;

  try {
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Benutzername bereits vergeben' }, 409);
    }

    const hash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (username, password_hash) VALUES (${username}, ${hash})
      RETURNING id, username, created_at
    `;

    const token = await makeToken(user.id, user.username);
    return c.json({ success: true, data: { token, user: { id: user.id, username: user.username } } }, 201);
  } catch (err) {
    console.error('[register]', err);
    return c.json({ success: false, error: 'Registrierung fehlgeschlagen' }, 500);
  }
});

// ── POST /login ───────────────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const body = credentialsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
  }

  const { username, password } = body.data;

  try {
    const [user] = await sql`SELECT id, username, password_hash FROM users WHERE username = ${username}`;

    // Timing-konsistente Antwort: auch bei unbekanntem User bcrypt ausführen
    const hashToCheck = user?.password_hash ?? '$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
    }

    const token = await makeToken(user.id, user.username);
    return c.json({ success: true, data: { token, user: { id: user.id, username: user.username } } });
  } catch (err) {
    console.error('[login]', err);
    return c.json({ success: false, error: 'Anmeldung fehlgeschlagen' }, 500);
  }
});

// ── POST /logout ──────────────────────────────────────────────────────────────
// Tokens sind stateless; Client löscht das Token. Server-seitige Blacklist
// kann hier bei Bedarf ergänzt werden (Redis/DB).
auth.post('/logout', (c) => {
  return c.json({ success: true, data: { message: 'Abgemeldet' } });
});

// ── GET /me ───────────────────────────────────────────────────────────────────
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    const [user] = await sql`SELECT id, username, created_at FROM users WHERE id = ${payload.sub as number}`;
    if (!user) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    return c.json({ success: true, data: user });
  } catch {
    return c.json({ success: false, error: 'Ungültiger Token' }, 401);
  }
});

export default auth;
