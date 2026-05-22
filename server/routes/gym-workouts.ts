import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { z } from 'zod';
import sql from '../db';

const gymWorkouts = new Hono();
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

const setSchema = z.object({
  exercise_id:  z.number().int().positive(),
  set_number:   z.number().int().min(1).max(100),
  reps:         z.number().int().min(0).max(9999).nullish(),
  weight_kg:    z.number().min(0).max(9999).nullish(),
  duration_sec: z.number().int().min(0).nullish(),
  notes:        z.string().max(500).optional(),
}).refine(
  d => d.reps != null || d.duration_sec != null,
  { message: 'Satz benötigt Wiederholungen oder Dauer' }
);

const workoutSchema = z.object({
  name:        z.string().max(100).optional().default(''),
  started_at:  z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
  notes:       z.string().max(1000).optional(),
  sets:        z.array(setSchema).max(500).default([]),
});

// ── GET / — alle Workouts des Users ──────────────────────────────────────────
gymWorkouts.get('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const workouts = await sql`
      SELECT
        w.id,
        w.name,
        w.started_at,
        w.finished_at,
        w.notes,
        w.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           s.id,
              'exercise_id',  s.exercise_id,
              'exercise_name', e.name_de,
              'muscle',       mg.name_de,
              'equipment',    e.equipment_type,
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
      LEFT JOIN gym_exercises e ON e.id = s.exercise_id
      LEFT JOIN gym_exercise_muscle_groups emg ON emg.exercise_id = e.id AND emg.is_primary = true
      LEFT JOIN gym_muscle_groups mg ON mg.id = emg.muscle_group_id
      WHERE w.user_id = ${auth.id}
      GROUP BY w.id
      ORDER BY w.finished_at DESC
      LIMIT 100
    `;
    return c.json({ success: true, data: workouts });
  } catch (err) {
    console.error('[gym/workouts GET]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

// ── POST / — Workout speichern ────────────────────────────────────────────────
gymWorkouts.post('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const body = workoutSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ success: false, error: body.error.issues[0]?.message ?? 'Ungültige Eingabe' }, 400);
  }

  const { name, started_at, finished_at, notes, sets } = body.data;
  const now = new Date().toISOString();

  try {
    const workout = await sql.begin(async tx => {
      const [row] = await tx`
        INSERT INTO gym_workouts (user_id, name, started_at, finished_at, notes)
        VALUES (
          ${auth.id},
          ${name ?? ''},
          ${started_at ?? now},
          ${finished_at ?? now},
          ${notes ?? null}
        )
        RETURNING id, name, started_at, finished_at, notes, created_at
      `;

      if (sets.length > 0) {
        const setRows = sets.map(s => ({
          workout_id:   row.id,
          exercise_id:  s.exercise_id,
          set_number:   s.set_number,
          reps:         s.reps ?? null,
          weight_kg:    s.weight_kg ?? null,
          duration_sec: s.duration_sec ?? null,
          notes:        s.notes ?? null,
        }));
        await tx`
          INSERT INTO gym_workout_sets ${tx(setRows,
            'workout_id', 'exercise_id', 'set_number',
            'reps', 'weight_kg', 'duration_sec', 'notes'
          )}
        `;
      }

      return row;
    });

    return c.json({ success: true, data: { ...workout, sets } }, 201);
  } catch (err) {
    console.error('[gym/workouts POST]', err);
    return c.json({ success: false, error: 'Speichern fehlgeschlagen' }, 500);
  }
});

// ── GET /:id — einzelnes Workout mit Sets ────────────────────────────────────
gymWorkouts.get('/:id', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  const idParam = parseInt(c.req.param('id'), 10);
  if (isNaN(idParam) || idParam < 1) {
    return c.json({ success: false, error: 'Ungültige ID' }, 400);
  }

  try {
    const [workout] = await sql`
      SELECT
        w.id,
        w.name,
        w.started_at,
        w.finished_at,
        w.notes,
        w.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           s.id,
              'exercise_id',  s.exercise_id,
              'exercise_name', e.name_de,
              'muscle',       mg.name_de,
              'equipment',    e.equipment_type,
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
      LEFT JOIN gym_exercises e ON e.id = s.exercise_id
      LEFT JOIN gym_exercise_muscle_groups emg ON emg.exercise_id = e.id AND emg.is_primary = true
      LEFT JOIN gym_muscle_groups mg ON mg.id = emg.muscle_group_id
      WHERE w.id = ${idParam} AND w.user_id = ${auth.id}
      GROUP BY w.id
    `;
    if (!workout) return c.json({ success: false, error: 'Workout nicht gefunden' }, 404);
    return c.json({ success: true, data: workout });
  } catch (err) {
    console.error('[gym/workouts GET/:id]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

export default gymWorkouts;
