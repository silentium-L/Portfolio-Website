import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import sql from '../db';

const admin = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;

// Prüft JWT + is_superadmin. Gibt { adminId } zurück oder null.
async function verifyAdmin(c: Parameters<typeof admin.get>[1]): Promise<{ adminId: number } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    const [user] = await sql`
      SELECT id FROM users WHERE id = ${payload.sub as number} AND is_superadmin = true
    `;
    return user ? { adminId: user.id as number } : null;
  } catch {
    return null;
  }
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// Alle Benutzer mit Kontaktdaten + Permissions
admin.get('/users', async (c) => {
  const auth = await verifyAdmin(c);
  if (!auth) return c.json({ success: false, error: 'Keine Berechtigung' }, 403);

  try {
    const users = await sql`
      SELECT
        u.id, u.username, u.is_superadmin, u.created_at,
        c.vorname, c.nachname, c.email, c.profession, c.telefonnummer
      FROM users u
      LEFT JOIN contacts c ON c.user_id = u.id
      ORDER BY u.created_at DESC
    `;

    const allUserPerms = await sql`
      SELECT up.user_id, p.key
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      ORDER BY p.id
    `;

    const permsMap = new Map<number, string[]>();
    for (const row of allUserPerms) {
      const uid = row.user_id as number;
      if (!permsMap.has(uid)) permsMap.set(uid, []);
      permsMap.get(uid)!.push(row.key as string);
    }

    const result = users.map(u => ({
      ...u,
      permissions: u.is_superadmin ? ['*'] : (permsMap.get(u.id as number) ?? []),
    }));

    return c.json({ success: true, data: { users: result } });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return c.json({ success: false, error: 'Fehler beim Laden der Benutzer' }, 500);
  }
});

// ── GET /api/admin/permissions ────────────────────────────────────────────────
// Alle verfügbaren Berechtigungen (für Checkbox-Liste im Frontend)
admin.get('/permissions', async (c) => {
  const auth = await verifyAdmin(c);
  if (!auth) return c.json({ success: false, error: 'Keine Berechtigung' }, 403);

  try {
    const perms = await sql`
      SELECT id, key, label, description FROM permissions ORDER BY id
    `;
    return c.json({ success: true, data: { permissions: perms } });
  } catch (err) {
    console.error('[admin/permissions GET]', err);
    return c.json({ success: false, error: 'Fehler beim Laden der Berechtigungen' }, 500);
  }
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
// Neuen Benutzer anlegen (vereinfacht, ohne vollständige Kontaktpflicht)
const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, _ und - erlaubt'),
  password: z.string().min(6).max(72),
  vorname:  z.string().max(100).optional().default(''),
  nachname: z.string().max(100).optional().default(''),
  email:    z.string().max(255).optional().default(''),
});

admin.post('/users', async (c) => {
  const auth = await verifyAdmin(c);
  if (!auth) return c.json({ success: false, error: 'Keine Berechtigung' }, 403);

  const body = createUserSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { username, password, vorname, nachname, email } = body.data;

  try {
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Benutzername bereits vergeben' }, 409);
    }

    const hash = await bcrypt.hash(password, 12);

    const newUser = await sql.begin(async (tx) => {
      const [u] = await tx`
        INSERT INTO users (username, password_hash)
        VALUES (${username}, ${hash})
        RETURNING id, username, is_superadmin, created_at
      `;
      await tx`
        INSERT INTO contacts (user_id, vorname, nachname, email, profession, grund_besuchs, telefonnummer)
        VALUES (${u.id}, ${vorname}, ${nachname}, ${email}, '', '', '')
      `;
      return u;
    });

    return c.json({
      success: true,
      data: { user: { ...newUser, permissions: [], vorname, nachname, email } },
    }, 201);
  } catch (err) {
    console.error('[admin/users POST]', err);
    return c.json({ success: false, error: 'Benutzer konnte nicht angelegt werden' }, 500);
  }
});

// ── PUT /api/admin/users/:id/permissions ──────────────────────────────────────
// Setzt die Berechtigungen eines Benutzers (vollständig ersetzen)
const setPermissionsSchema = z.object({
  permissions: z.array(z.string()).max(50),
});

admin.put('/users/:id/permissions', async (c) => {
  const auth = await verifyAdmin(c);
  if (!auth) return c.json({ success: false, error: 'Keine Berechtigung' }, 403);

  const userId = Number(c.req.param('id'));
  if (!userId || isNaN(userId)) {
    return c.json({ success: false, error: 'Ungültige Benutzer-ID' }, 400);
  }

  const body = setPermissionsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: 'Ungültige Berechtigungen' }, 400);
  }

  try {
    const [targetUser] = await sql`SELECT id, is_superadmin FROM users WHERE id = ${userId}`;
    if (!targetUser) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    if (targetUser.is_superadmin) {
      return c.json({ success: false, error: 'Superadmin-Berechtigungen können nicht manuell geändert werden' }, 403);
    }

    const permKeys = body.data.permissions;

    await sql.begin(async (tx) => {
      await tx`DELETE FROM user_permissions WHERE user_id = ${userId}`;
      if (permKeys.length > 0) {
        const permRows = await tx`SELECT id, key FROM permissions WHERE key = ANY(${permKeys})`;
        for (const perm of permRows) {
          await tx`
            INSERT INTO user_permissions (user_id, permission_id)
            VALUES (${userId}, ${perm.id})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    });

    return c.json({ success: true, data: { message: 'Berechtigungen aktualisiert' } });
  } catch (err) {
    console.error('[admin/users/:id/permissions PUT]', err);
    return c.json({ success: false, error: 'Berechtigungen konnten nicht gesetzt werden' }, 500);
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
// Benutzer löschen — nicht sich selbst, nicht andere Superadmins
admin.delete('/users/:id', async (c) => {
  const auth = await verifyAdmin(c);
  if (!auth) return c.json({ success: false, error: 'Keine Berechtigung' }, 403);

  const userId = Number(c.req.param('id'));
  if (!userId || isNaN(userId)) {
    return c.json({ success: false, error: 'Ungültige Benutzer-ID' }, 400);
  }
  if (userId === auth.adminId) {
    return c.json({ success: false, error: 'Eigener Account kann nicht gelöscht werden' }, 400);
  }

  try {
    const [targetUser] = await sql`SELECT id, is_superadmin FROM users WHERE id = ${userId}`;
    if (!targetUser) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    if (targetUser.is_superadmin) {
      return c.json({ success: false, error: 'Superadmin-Accounts können nicht gelöscht werden' }, 403);
    }

    await sql`DELETE FROM users WHERE id = ${userId}`;
    return c.json({ success: true, data: { message: 'Benutzer gelöscht' } });
  } catch (err) {
    console.error('[admin/users/:id DELETE]', err);
    return c.json({ success: false, error: 'Benutzer konnte nicht gelöscht werden' }, 500);
  }
});

export default admin;
