import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { z } from 'zod';
import sql from '../db';

const gymTemplates = new Hono();
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

const templateSchema = z.object({
  name:         z.string().min(1).max(100).transform(s => s.trim()),
  exercise_ids: z.array(z.number().int().positive()).min(0).max(50),
});

// ── GET / — alle Vorlagen des Users ──────────────────────────────────────────
gymTemplates.get('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const templates = await sql`
      SELECT
        t.id,
        t.name,
        t.created_at,
        t.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'exercise_id',   te.exercise_id,
              'sort_order',    te.sort_order,
              'name',          e.name_de,
              'muscle',        mg.name_de,
              'equipment',     e.equipment,
              'tracking_type', e.tracking_type
            ) ORDER BY te.sort_order
          ) FILTER (WHERE te.exercise_id IS NOT NULL),
          '[]'
        ) AS exercises
      FROM gym_workout_templates t
      LEFT JOIN gym_workout_template_exercises te ON te.template_id = t.id
      LEFT JOIN gym_exercises e ON e.id = te.exercise_id
      LEFT JOIN gym_exercise_muscle_groups emg ON emg.exercise_id = e.id AND emg.is_primary = true
      LEFT JOIN gym_muscle_groups mg ON mg.id = emg.muscle_group_id
      WHERE t.user_id = ${auth.id}
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    return c.json({ success: true, data: templates });
  } catch (err) {
    console.error('[gym/templates GET]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

// ── POST / — neue Vorlage erstellen ──────────────────────────────────────────
gymTemplates.post('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const body = templateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { name, exercise_ids } = body.data;

  try {
    const template = await sql.begin(async tx => {
      const [row] = await tx`
        INSERT INTO gym_workout_templates (user_id, name)
        VALUES (${auth.id}, ${name})
        RETURNING id, name, created_at, updated_at
      `;
      if (exercise_ids.length > 0) {
        const rows = exercise_ids.map((exId, idx) => ({
          template_id: row.id,
          exercise_id: exId,
          sort_order:  idx,
        }));
        await tx`
          INSERT INTO gym_workout_template_exercises ${tx(rows, 'template_id', 'exercise_id', 'sort_order')}
          ON CONFLICT (template_id, exercise_id) DO NOTHING
        `;
      }
      return row;
    });

    return c.json({ success: true, data: { ...template, exercises: [] } }, 201);
  } catch (err) {
    console.error('[gym/templates POST]', err);
    return c.json({ success: false, error: 'Erstellen fehlgeschlagen' }, 500);
  }
});

// ── GET /:id — eine Vorlage mit Übungen ──────────────────────────────────────
gymTemplates.get('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  try {
    const [template] = await sql`
      SELECT
        t.id,
        t.name,
        t.created_at,
        t.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'exercise_id',   te.exercise_id,
              'sort_order',    te.sort_order,
              'name',          e.name_de,
              'muscle',        mg.name_de,
              'equipment',     e.equipment,
              'tracking_type', e.tracking_type
            ) ORDER BY te.sort_order
          ) FILTER (WHERE te.exercise_id IS NOT NULL),
          '[]'
        ) AS exercises
      FROM gym_workout_templates t
      LEFT JOIN gym_workout_template_exercises te ON te.template_id = t.id
      LEFT JOIN gym_exercises e ON e.id = te.exercise_id
      LEFT JOIN gym_exercise_muscle_groups emg ON emg.exercise_id = e.id AND emg.is_primary = true
      LEFT JOIN gym_muscle_groups mg ON mg.id = emg.muscle_group_id
      WHERE t.id = ${idParam} AND t.user_id = ${auth.id}
      GROUP BY t.id
    `;
    if (!template) return c.json({ success: false, error: 'Vorlage nicht gefunden' }, 404);
    return c.json({ success: true, data: template });
  } catch (err) {
    console.error('[gym/templates GET/:id]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

// ── PATCH /:id — Vorlage umbenennen oder Übungen ersetzen ────────────────────
gymTemplates.patch('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  const body = templateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { name, exercise_ids } = body.data;

  try {
    const updated = await sql.begin(async tx => {
      const [row] = await tx`
        UPDATE gym_workout_templates
        SET name = ${name}, updated_at = NOW()
        WHERE id = ${idParam} AND user_id = ${auth.id}
        RETURNING id, name, created_at, updated_at
      `;
      if (!row) return null;

      await tx`DELETE FROM gym_workout_template_exercises WHERE template_id = ${idParam}`;

      if (exercise_ids.length > 0) {
        const rows = exercise_ids.map((exId, idx) => ({
          template_id: idParam,
          exercise_id: exId,
          sort_order:  idx,
        }));
        await tx`
          INSERT INTO gym_workout_template_exercises ${tx(rows, 'template_id', 'exercise_id', 'sort_order')}
          ON CONFLICT (template_id, exercise_id) DO NOTHING
        `;
      }
      return row;
    });

    if (!updated) return c.json({ success: false, error: 'Vorlage nicht gefunden' }, 404);
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('[gym/templates PATCH/:id]', err);
    return c.json({ success: false, error: 'Aktualisieren fehlgeschlagen' }, 500);
  }
});

// ── DELETE /:id — Vorlage löschen ────────────────────────────────────────────
gymTemplates.delete('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  try {
    const deleted = await sql`
      DELETE FROM gym_workout_templates
      WHERE id = ${idParam} AND user_id = ${auth.id}
      RETURNING id
    `;
    if (deleted.length === 0) return c.json({ success: false, error: 'Vorlage nicht gefunden' }, 404);
    return c.json({ success: true, data: { id: idParam } });
  } catch (err) {
    console.error('[gym/templates DELETE/:id]', err);
    return c.json({ success: false, error: 'Löschen fehlgeschlagen' }, 500);
  }
});

export default gymTemplates;
