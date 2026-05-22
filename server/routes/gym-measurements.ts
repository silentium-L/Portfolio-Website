import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { z } from 'zod';
import sql from '../db';

const gymMeasurements = new Hono();
const JWT_SECRET = process.env.JWT_SECRET!;

async function requireGymAuth(c: any): Promise<{ id: number; username: string } | null> {
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

const measurementSchema = z.object({
  recorded_at: z.string().datetime().optional(),
  weight_kg:   z.number().positive().max(999).nullish(),
  chest_cm:    z.number().positive().max(999).nullish(),
  waist_cm:    z.number().positive().max(999).nullish(),
  hips_cm:     z.number().positive().max(999).nullish(),
  bicep_cm:    z.number().positive().max(999).nullish(),
  thigh_cm:    z.number().positive().max(999).nullish(),
  notes:       z.string().max(500).optional(),
  source:      z.enum(['profile', 'workout']).optional().default('profile'),
}).refine(
  d => d.weight_kg != null || d.chest_cm != null || d.waist_cm  != null
    || d.hips_cm   != null || d.bicep_cm != null || d.thigh_cm  != null,
  { message: 'Mindestens ein Messwert ist erforderlich' }
);

// ── GET / ─────────────────────────────────────────────────────────────────────
gymMeasurements.get('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const rows = await sql`
      SELECT id, recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source
      FROM gym_measurements
      WHERE user_id = ${auth.id}
      ORDER BY recorded_at DESC
      LIMIT 200
    `;
    return c.json({ success: true, data: rows });
  } catch (err) {
    console.error('[gym/measurements GET]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

// ── POST / ────────────────────────────────────────────────────────────────────
gymMeasurements.post('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const body = measurementSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source } = body.data;

  try {
    const [row] = await sql`
      INSERT INTO gym_measurements
        (user_id, recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source)
      VALUES (
        ${auth.id},
        ${recorded_at ?? new Date().toISOString()},
        ${weight_kg ?? null},
        ${chest_cm  ?? null},
        ${waist_cm  ?? null},
        ${hips_cm   ?? null},
        ${bicep_cm  ?? null},
        ${thigh_cm  ?? null},
        ${notes     ?? null},
        ${source ?? 'profile'}
      )
      RETURNING id, recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source
    `;
    return c.json({ success: true, data: row }, 201);
  } catch (err) {
    console.error('[gym/measurements POST]', err);
    return c.json({ success: false, error: 'Speichern fehlgeschlagen' }, 500);
  }
});

// ── PATCH /:id ────────────────────────────────────────────────────────────────
gymMeasurements.patch('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  const body = measurementSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes } = body.data;

  try {
    const [row] = await sql`
      UPDATE gym_measurements SET
        recorded_at = COALESCE(${recorded_at ?? null}::timestamptz, recorded_at),
        weight_kg   = ${weight_kg ?? null},
        chest_cm    = ${chest_cm  ?? null},
        waist_cm    = ${waist_cm  ?? null},
        hips_cm     = ${hips_cm   ?? null},
        bicep_cm    = ${bicep_cm  ?? null},
        thigh_cm    = ${thigh_cm  ?? null},
        notes       = ${notes     ?? null}
      WHERE id = ${idParam} AND user_id = ${auth.id}
      RETURNING id, recorded_at, weight_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes, source
    `;
    if (!row) return c.json({ success: false, error: 'Eintrag nicht gefunden' }, 404);
    return c.json({ success: true, data: row });
  } catch (err) {
    console.error('[gym/measurements PATCH]', err);
    return c.json({ success: false, error: 'Aktualisieren fehlgeschlagen' }, 500);
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
gymMeasurements.delete('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  try {
    const deleted = await sql`
      DELETE FROM gym_measurements
      WHERE id = ${idParam} AND user_id = ${auth.id}
      RETURNING id
    `;
    if (deleted.length === 0) {
      return c.json({ success: false, error: 'Eintrag nicht gefunden' }, 404);
    }
    return c.json({ success: true, data: { id: idParam } });
  } catch (err) {
    console.error('[gym/measurements DELETE]', err);
    return c.json({ success: false, error: 'Löschen fehlgeschlagen' }, 500);
  }
});

export default gymMeasurements;
