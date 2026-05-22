import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import sql from '../db';

const gymAuth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 Tage

// Login: identifier = username ODER E-Mail
const loginSchema = z.object({
  identifier: z.string().min(1).max(255),
  password:   z.string().min(6).max(72),
});

const registerSchema = z.object({
  username:        z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, _ und - erlaubt'),
  email:           z.string().email('Ungültige E-Mail-Adresse').max(255),
  password:        z.string().min(6).max(72),
  vorname:         z.string().min(1).max(100),
  nachname:        z.string().min(1).max(100),
  telefonnummer:   z.string().min(7).max(50).regex(/^\+?[\d\s\-()]{7,50}$/, 'Ungültige Telefonnummer'),
  geburtsdatum:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional().nullable(),
  geschlecht:      z.enum(['männlich', 'weiblich', 'divers', 'keine Angabe']).optional().nullable(),
  groesse_cm:      z.number().min(50).max(280).optional().nullable(),
  startgewicht_kg: z.number().min(20).max(500).optional().nullable(),
  zielgewicht_kg:  z.number().min(20).max(500).optional().nullable(),
});

function makeToken(userId: number, username: string) {
  const exp = Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS;
  return sign({ sub: userId, username, scope: 'gym', exp }, JWT_SECRET, 'HS256');
}

async function requireAuth(c: any): Promise<{ id: number; username: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256');
    if ((payload as any).scope !== 'gym') return null;
    return { id: payload.sub as number, username: payload.username as string };
  } catch {
    return null;
  }
}

// ── POST /register ────────────────────────────────────────────────────────────
gymAuth.post('/register', async (c) => {
  const body = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const {
    username, email, password, vorname, nachname, telefonnummer,
    geburtsdatum, geschlecht, groesse_cm, startgewicht_kg, zielgewicht_kg,
  } = body.data;

  try {
    // Eindeutigkeit prüfen — alles in einem Query für klare Fehlermeldungen
    const [existingUser] = await sql`
      SELECT username, email FROM gym_users
      WHERE username = ${username} OR email = ${email}
      LIMIT 1
    `;
    if (existingUser) {
      const field = existingUser.username === username ? 'Benutzername' : 'E-Mail';
      return c.json({ success: false, error: `${field} bereits vergeben` }, 409);
    }

    const [existingTel] = await sql`
      SELECT id FROM gym_profiles WHERE telefonnummer = ${telefonnummer} LIMIT 1
    `;
    if (existingTel) {
      return c.json({ success: false, error: 'Telefonnummer bereits registriert' }, 409);
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await sql.begin(async (tx) => {
      const [newUser] = await tx`
        INSERT INTO gym_users (username, email, password_hash)
        VALUES (${username}, ${email}, ${hash})
        RETURNING id, username, email, created_at
      `;
      await tx`
        INSERT INTO gym_profiles (
          user_id, vorname, nachname, telefonnummer,
          geburtsdatum, geschlecht, groesse_cm, startgewicht_kg, zielgewicht_kg
        ) VALUES (
          ${newUser.id}, ${vorname}, ${nachname}, ${telefonnummer},
          ${geburtsdatum ?? null}, ${geschlecht ?? null},
          ${groesse_cm ?? null}, ${startgewicht_kg ?? null}, ${zielgewicht_kg ?? null}
        )
      `;
      return newUser;
    });

    const token = await makeToken(user.id, user.username);
    return c.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, vorname },
      },
    }, 201);
  } catch (err) {
    console.error('[gym/register]', err);
    return c.json({ success: false, error: 'Registrierung fehlgeschlagen' }, 500);
  }
});

// ── POST /login ───────────────────────────────────────────────────────────────
gymAuth.post('/login', async (c) => {
  const body = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
  }

  const { identifier, password } = body.data;
  const isEmail = identifier.includes('@');

  try {
    const [user] = isEmail
      ? await sql`
          SELECT u.id, u.username, u.email, u.password_hash, p.vorname
          FROM gym_users u
          LEFT JOIN gym_profiles p ON p.user_id = u.id
          WHERE u.email = ${identifier}
        `
      : await sql`
          SELECT u.id, u.username, u.email, u.password_hash, p.vorname
          FROM gym_users u
          LEFT JOIN gym_profiles p ON p.user_id = u.id
          WHERE u.username = ${identifier}
        `;

    // Timing-konsistente Antwort: auch bei unbekanntem User bcrypt ausführen
    const hashToCheck = user?.password_hash ?? '$2b$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return c.json({ success: false, error: 'Ungültige Anmeldedaten' }, 401);
    }

    await sql`UPDATE gym_users SET last_login_at = NOW() WHERE id = ${user.id}`;

    const token = await makeToken(user.id, user.username);
    return c.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, vorname: user.vorname ?? null },
      },
    });
  } catch (err) {
    console.error('[gym/login]', err);
    return c.json({ success: false, error: 'Anmeldung fehlgeschlagen' }, 500);
  }
});

// ── POST /logout ──────────────────────────────────────────────────────────────
gymAuth.post('/logout', (c) => {
  return c.json({ success: true, data: { message: 'Abgemeldet' } });
});

// ── GET /me ───────────────────────────────────────────────────────────────────
gymAuth.get('/me', async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const [user] = await sql`
      SELECT u.id, u.username, u.email, u.created_at,
             p.vorname, p.nachname, p.telefonnummer,
             p.geburtsdatum, p.geschlecht,
             p.groesse_cm, p.startgewicht_kg, p.zielgewicht_kg
      FROM gym_users u
      LEFT JOIN gym_profiles p ON p.user_id = u.id
      WHERE u.id = ${auth.id}
    `;
    if (!user) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);
    return c.json({ success: true, data: user });
  } catch (err) {
    console.error('[gym/me]', err);
    return c.json({ success: false, error: 'Fehler beim Laden des Profils' }, 500);
  }
});

const updateProfileSchema = z.object({
  vorname:          z.string().min(1).max(100).optional(),
  nachname:         z.string().min(1).max(100).optional(),
  geburtsdatum:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional().nullable(),
  geschlecht:       z.enum(['männlich', 'weiblich', 'divers', 'keine Angabe']).optional().nullable(),
  groesse_cm:       z.number().min(50).max(280).optional().nullable(),
  startgewicht_kg:  z.number().min(20).max(500).optional().nullable(),
  zielgewicht_kg:   z.number().min(20).max(500).optional().nullable(),
});

// ── PATCH /me ─────────────────────────────────────────────────────────────────
gymAuth.patch('/me', async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const body = updateProfileSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const fields = body.data;
  if (Object.keys(fields).length === 0) {
    return c.json({ success: false, error: 'Keine Felder zum Aktualisieren' }, 400);
  }

  try {
    const [current] = await sql`
      SELECT vorname, nachname, geburtsdatum, geschlecht,
             groesse_cm, startgewicht_kg, zielgewicht_kg
      FROM gym_profiles WHERE user_id = ${auth.id}
    `;

    const merged = {
      vorname:         'vorname' in fields         ? fields.vorname         : current?.vorname,
      nachname:        'nachname' in fields         ? fields.nachname        : current?.nachname,
      geburtsdatum:    'geburtsdatum' in fields     ? fields.geburtsdatum    : current?.geburtsdatum,
      geschlecht:      'geschlecht' in fields       ? fields.geschlecht      : current?.geschlecht,
      groesse_cm:      'groesse_cm' in fields       ? fields.groesse_cm      : current?.groesse_cm,
      startgewicht_kg: 'startgewicht_kg' in fields  ? fields.startgewicht_kg : current?.startgewicht_kg,
      zielgewicht_kg:  'zielgewicht_kg' in fields   ? fields.zielgewicht_kg  : current?.zielgewicht_kg,
    };

    await sql`
      UPDATE gym_profiles SET
        vorname          = ${merged.vorname},
        nachname         = ${merged.nachname},
        geburtsdatum     = ${merged.geburtsdatum ?? null},
        geschlecht       = ${merged.geschlecht ?? null},
        groesse_cm       = ${merged.groesse_cm ?? null},
        startgewicht_kg  = ${merged.startgewicht_kg ?? null},
        zielgewicht_kg   = ${merged.zielgewicht_kg ?? null},
        updated_at       = NOW()
      WHERE user_id = ${auth.id}
    `;

    const [updated] = await sql`
      SELECT u.id, u.username, u.email, u.created_at,
             p.vorname, p.nachname, p.telefonnummer,
             p.geburtsdatum, p.geschlecht,
             p.groesse_cm, p.startgewicht_kg, p.zielgewicht_kg
      FROM gym_users u
      LEFT JOIN gym_profiles p ON p.user_id = u.id
      WHERE u.id = ${auth.id}
    `;
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('[gym/me/patch]', err);
    return c.json({ success: false, error: 'Aktualisierung fehlgeschlagen' }, 500);
  }
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Passwort erforderlich'),
});

// ── DELETE /account ────────────────────────────────────────────────────────────
gymAuth.delete('/account', async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const body = deleteAccountSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  try {
    const [user] = await sql`SELECT password_hash FROM gym_users WHERE id = ${auth.id}`;
    if (!user) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);

    const valid = await bcrypt.compare(body.data.password, user.password_hash);
    if (!valid) return c.json({ success: false, error: 'Falsches Passwort' }, 403);

    await sql`DELETE FROM gym_users WHERE id = ${auth.id}`;
    return c.json({ success: true, data: { message: 'Account gelöscht' } });
  } catch (err) {
    console.error('[gym/account/delete]', err);
    return c.json({ success: false, error: 'Löschen fehlgeschlagen' }, 500);
  }
});

// ── GET /export ────────────────────────────────────────────────────────────────
gymAuth.get('/export', async (c) => {
  const auth = await requireAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const [[userData], measurementRows, templateRows, workoutRows] = await Promise.all([
      sql`
        SELECT u.id, u.username, u.email, u.created_at, u.last_login_at,
               p.vorname, p.nachname, p.telefonnummer,
               p.geburtsdatum, p.geschlecht,
               p.groesse_cm, p.startgewicht_kg, p.zielgewicht_kg
        FROM gym_users u
        LEFT JOIN gym_profiles p ON p.user_id = u.id
        WHERE u.id = ${auth.id}
      `,
      sql`
        SELECT id, recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source
        FROM gym_measurements
        WHERE user_id = ${auth.id}
        ORDER BY recorded_at DESC
      `,
      sql`
        SELECT t.id, t.name, t.created_at,
               COALESCE(
                 json_agg(
                   json_build_object('exercise_id', te.exercise_id, 'sort_order', te.sort_order)
                   ORDER BY te.sort_order
                 ) FILTER (WHERE te.exercise_id IS NOT NULL),
                 '[]'
               ) AS exercises
        FROM gym_workout_templates t
        LEFT JOIN gym_workout_template_exercises te ON te.template_id = t.id
        WHERE t.user_id = ${auth.id}
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `,
      sql`
        SELECT
          w.id, w.name, w.started_at, w.finished_at, w.notes, w.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'exercise_id',  s.exercise_id,
                'set_number',   s.set_number,
                'reps',         s.reps,
                'weight_kg',    s.weight_kg,
                'duration_sec', s.duration_sec,
                'notes',        s.notes
              ) ORDER BY s.exercise_id, s.set_number
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) AS sets
        FROM gym_workouts w
        LEFT JOIN gym_workout_sets s ON s.workout_id = w.id
        WHERE w.user_id = ${auth.id}
        GROUP BY w.id
        ORDER BY w.finished_at DESC
      `,
    ]);
    if (!userData) return c.json({ success: false, error: 'Benutzer nicht gefunden' }, 404);

    return c.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        account: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          createdAt: userData.created_at,
          lastLoginAt: userData.last_login_at ?? null,
        },
        profile: {
          vorname:         userData.vorname         ?? null,
          nachname:        userData.nachname        ?? null,
          telefonnummer:   userData.telefonnummer   ?? null,
          geburtsdatum:    userData.geburtsdatum    ?? null,
          geschlecht:      userData.geschlecht      ?? null,
          groesse_cm:      userData.groesse_cm      ?? null,
          startgewicht_kg: userData.startgewicht_kg ?? null,
          zielgewicht_kg:  userData.zielgewicht_kg  ?? null,
        },
        measurements: measurementRows,
        workoutTemplates: templateRows,
        workouts: workoutRows,
      },
    });
  } catch (err) {
    console.error('[gym/export]', err);
    return c.json({ success: false, error: 'Export fehlgeschlagen' }, 500);
  }
});

export default gymAuth;
