import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import sql from '../db';

const fitness = new Hono();
fitness.use('*', requireAuth);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIMIT = 200;

const logSchema = z.object({
  exercise:  z.string().min(1).max(100),
  sets:      z.number().int().min(1).max(999).optional(),
  reps:      z.number().int().min(1).max(999).optional(),
  weight_kg: z.number().min(0).max(9999).optional(),
  notes:     z.string().max(500).optional(),
  logged_at: z.string().regex(ISO_DATE, 'Datum muss ISO-Format haben (YYYY-MM-DD)').optional(),
});

const updateSchema = logSchema.partial();

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) return null;
  return id;
}

function parseLimit(raw: string | undefined) {
  const n = Number(raw ?? '50');
  if (!Number.isFinite(n)) return 50;
  return Math.min(Math.max(Math.floor(n), 1), MAX_LIMIT);
}

// ── GET / ─────────────────────────────────────────────────────────────────────
fitness.get('/', async (c) => {
  const userId = c.get('userId');
  const { date, limit } = c.req.query();

  if (date !== undefined && !ISO_DATE.test(date)) {
    return c.json({ success: false, error: 'Datum muss ISO-Format haben (YYYY-MM-DD)' }, 400);
  }

  try {
    const logs = date
      ? await sql`SELECT * FROM fitness_logs WHERE user_id = ${userId} AND logged_at = ${date} ORDER BY created_at DESC`
      : await sql`SELECT * FROM fitness_logs WHERE user_id = ${userId} ORDER BY logged_at DESC, created_at DESC LIMIT ${parseLimit(limit)}`;

    return c.json({ success: true, data: logs });
  } catch (err) {
    console.error('[fitness GET]', err);
    return c.json({ success: false, error: 'Fehler beim Laden der Einträge' }, 500);
  }
});

// ── POST / ────────────────────────────────────────────────────────────────────
fitness.post('/', async (c) => {
  const userId = c.get('userId');
  const body = logSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { exercise, sets, reps, weight_kg, notes, logged_at } = body.data;

  try {
    const [log] = await sql`
      INSERT INTO fitness_logs (user_id, exercise, sets, reps, weight_kg, notes, logged_at)
      VALUES (${userId}, ${exercise}, ${sets ?? null}, ${reps ?? null}, ${weight_kg ?? null}, ${notes ?? null}, ${logged_at ?? sql`CURRENT_DATE`})
      RETURNING *
    `;
    return c.json({ success: true, data: log }, 201);
  } catch (err) {
    console.error('[fitness POST]', err);
    return c.json({ success: false, error: 'Fehler beim Speichern' }, 500);
  }
});

// ── PUT /:id ──────────────────────────────────────────────────────────────────
fitness.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseId(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'Ungültige ID' }, 400);

  const body = updateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { exercise, sets, reps, weight_kg, notes } = body.data;

  try {
    const [log] = await sql`
      UPDATE fitness_logs SET
        exercise  = COALESCE(${exercise ?? null}, exercise),
        sets      = COALESCE(${sets ?? null}, sets),
        reps      = COALESCE(${reps ?? null}, reps),
        weight_kg = COALESCE(${weight_kg ?? null}, weight_kg),
        notes     = COALESCE(${notes ?? null}, notes)
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    if (!log) return c.json({ success: false, error: 'Eintrag nicht gefunden' }, 404);
    return c.json({ success: true, data: log });
  } catch (err) {
    console.error('[fitness PUT]', err);
    return c.json({ success: false, error: 'Fehler beim Aktualisieren' }, 500);
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
fitness.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseId(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'Ungültige ID' }, 400);

  try {
    const result = await sql`DELETE FROM fitness_logs WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
    if (result.length === 0) return c.json({ success: false, error: 'Eintrag nicht gefunden' }, 404);
    return c.json({ success: true, data: { deleted: id } });
  } catch (err) {
    console.error('[fitness DELETE]', err);
    return c.json({ success: false, error: 'Fehler beim Löschen' }, 500);
  }
});

export default fitness;
