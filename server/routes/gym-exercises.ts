import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import sql from '../db';

const gymExercises = new Hono();
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

// ── GET / — alle Übungen mit primärer Muskelgruppe ────────────────────────────
gymExercises.get('/', async (c) => {
  const auth = await requireGymAuth(c);
  if (!auth) return c.json({ success: false, error: 'Nicht autorisiert' }, 401);

  try {
    const exercises = await sql`
      SELECT
        e.id,
        e.name_de        AS name,
        e.equipment_type,
        e.tracking_type,
        e.unilateral,
        mg.name_de       AS muscle
      FROM gym_exercises e
      LEFT JOIN gym_exercise_muscle_groups emg
        ON emg.exercise_id = e.id AND emg.is_primary = true
      LEFT JOIN gym_muscle_groups mg
        ON mg.id = emg.muscle_group_id
      ORDER BY mg.name_de, e.name_de
    `;
    return c.json({ success: true, data: exercises });
  } catch (err) {
    console.error('[gym/exercises GET]', err);
    return c.json({ success: false, error: 'Laden fehlgeschlagen' }, 500);
  }
});

export default gymExercises;
