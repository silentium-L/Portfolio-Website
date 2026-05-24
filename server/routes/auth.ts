import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import sql from '../db';

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 Tage

const loginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, _ und - erlaubt'),
  password: z.string().min(6).max(72),
});

const registerSchema = loginSchema.extend({
  vorname:       z.string().min(1).max(100),
  nachname:      z.string().min(1).max(100),
  email:         z.string().email('Ungültige E-Mail-Adresse').max(255),
  profession:    z.string().max(100).optional().default(''),
  grund_besuchs: z.string().max(500).optional().default(''),
  telefonnummer: z.string().max(50).optional().default(''),
});

function makeToken(userId: number, username: string) {
  const exp = Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS;
  return sign({ sub: userId, username, exp }, JWT_SECRET, 'HS256');
}

// Alle definierten App-Berechtigungen — Fallback wenn permissions-Tabelle leer ist.
const ALL_PERMISSIONS = [
  'view:personal', 'view:terminal', 'view:gapped',
  'view:gymtracker',
  'manage:users',
];

// Gibt alle Permission-Keys für einen User zurück.
// Superadmins erhalten die Vereinigung aus DB-Permissions und ALL_PERMISSIONS,
// damit neue Permissions im Code sofort greifen — auch vor dem nächsten DB-Migration-Lauf.
async function resolvePermissions(userId: number, isSuperadmin: boolean): Promise<string[]> {
  if (isSuperadmin) {
    try {
      const rows = await sql`SELECT key FROM permissions ORDER BY id`;
      const dbPerms = rows.map(r => r.key as string);
      return [...new Set([...dbPerms, ...ALL_PERMISSIONS])];
    } catch (err) {
      console.error('[resolvePermissions] DB-Fehler bei Superadmin-Permissions — Fallback auf Hardcode:', err);
      return [...ALL_PERMISSIONS];
    }
  }
  const rows = await sql`
    SELECT p.key
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = ${userId}
    ORDER BY p.id
  `;
  return rows.map(r => r.key as string);
}

// ── POST /register ────────────────────────────────────────────────────────────
auth.post('/register', async (c) => {
  const body = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { username, password, vorname, nachname, email, profession, grund_besuchs, telefonnummer } = body.data;

  try {
    const existing = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Benutzername bereits vergeben' }, 409);
    }

    const existingEmail = await sql`SELECT user_id FROM contacts WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
    if (existingEmail.length > 0) {
      return c.json({ success: false, error: 'E-Mail-Adresse bereits vergeben' }, 409);
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await sql.begin(async (tx) => {
      const [newUser] = await tx`
        INSERT INTO users (username, password_hash) VALUES (${username}, ${hash})
        RETURNING id, username, is_superadmin, created_at
      `;
      await tx`
        INSERT INTO contacts (user_id, vorname, nachname, email, profession, grund_besuchs, telefonnummer)
        VALUES (${newUser.id}, ${vorname}, ${nachname}, ${email}, ${profession}, ${grund_besuchs}, ${telefonnummer})
      `;
      return newUser;
    });

    const permissions = await resolvePermissions(user.id, user.is_superadmin);
    const token = await makeToken(user.id, user.username);
    return c.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, vorname }, permissions },
    }, 201);
  } catch (err) {
    console.error('[register]', err);
    return c.json({ success: false, error: 'Registrierung fehlgeschlagen' }, 500);
  }
});

// ── POST /login ───────────────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const body = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
  }

  const { username, password } = body.data;

  try {
    const [user] = await sql`
      SELECT u.id, u.username, u.password_hash, u.is_superadmin, c.vorname
      FROM users u
      LEFT JOIN contacts c ON c.user_id = u.id
      WHERE LOWER(u.username) = LOWER(${username})
    `;

    // Timing-konsistente Antwort: auch bei unbekanntem User bcrypt ausführen
    const hashToCheck = user?.password_hash ?? '$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
    }

    const permissions = await resolvePermissions(user.id, user.is_superadmin);
    const token = await makeToken(user.id, user.username);
    return c.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, vorname: user.vorname ?? null }, permissions },
    });
  } catch (err) {
    console.error('[login]', err);
    return c.json({ success: false, error: 'Anmeldung fehlgeschlagen' }, 500);
  }
});

// ── POST /logout ──────────────────────────────────────────────────────────────
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
    const [user] = await sql`
      SELECT
        u.id, u.username, u.is_superadmin, u.created_at,
        c.vorname, c.nachname, c.email, c.profession, c.grund_besuchs, c.telefonnummer
      FROM users u
      LEFT JOIN contacts c ON c.user_id = u.id
      WHERE u.id = ${payload.sub as number}
    `;
    if (!user) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    const permissions = await resolvePermissions(user.id, user.is_superadmin);
    return c.json({ success: true, data: { ...user, permissions } });
  } catch {
    return c.json({ success: false, error: 'Ungültiger Token' }, 401);
  }
});

// ── GET /permissions ──────────────────────────────────────────────────────────
// Gibt die aktuellen Berechtigungen des eingeloggten Users zurück.
// Nützlich nach Token-Refresh ohne erneuten Login.
auth.get('/permissions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    const [user] = await sql`
      SELECT id, is_superadmin FROM users WHERE id = ${payload.sub as number}
    `;
    if (!user) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    const permissions = await resolvePermissions(user.id, user.is_superadmin);
    return c.json({ success: true, data: { permissions } });
  } catch {
    return c.json({ success: false, error: 'Ungültiger Token' }, 401);
  }
});

// ── DELETE /account ───────────────────────────────────────────────────────────
// Löscht den Account des eingeloggten Users (Art. 17 DSGVO).
// Erfordert Passwort-Bestätigung + Bearer Token.
auth.delete('/account', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  let body: { password?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Ungültige Request-Daten' }, 400);
  }

  const password = body.password || '';

  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    const [user] = await sql`SELECT password_hash, id FROM users WHERE id = ${payload.sub as number}`;
    if (!user) {
      return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Passwort falsch' }, 401);
    }

    // Löschen: ON DELETE CASCADE löscht auch contacts + user_permissions
    await sql`DELETE FROM users WHERE id = ${user.id}`;

    return c.json({
      success: true,
      data: { message: 'Account wurde gelöscht' },
    }, 200);
  } catch (err) {
    console.error('[delete account]', err);
    return c.json({ success: false, error: 'Löschung fehlgeschlagen' }, 500);
  }
});

// ── GET /export ────────────────────────────────────────────────────────────────
// Exportiert alle User-Daten als JSON (Art. 20 DSGVO — Datenportabilität).
auth.get('/export', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    const [user] = await sql`
      SELECT
        u.id, u.username, u.created_at,
        c.vorname, c.nachname, c.email, c.profession, c.grund_besuchs, c.telefonnummer
      FROM users u
      LEFT JOIN contacts c ON c.user_id = u.id
      WHERE u.id = ${payload.sub as number}
    `;
    if (!user) {
      return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    }

    return c.json({
      success: true,
      data: {
        export_date: new Date().toISOString(),
        user: user,
      },
    }, 200);
  } catch (err) {
    console.error('[export data]', err);
    return c.json({ success: false, error: 'Export fehlgeschlagen' }, 500);
  }
});

export default auth;
