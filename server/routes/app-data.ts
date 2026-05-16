import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import sql from '../db';

const appData = new Hono();
appData.use('*', requireAuth);

const keySchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Key darf nur Buchstaben, Zahlen, _ und - enthalten');
const MAX_VALUE_SIZE = 64 * 1024; // 64 KB

// ── GET /:key ─────────────────────────────────────────────────────────────────
appData.get('/:key', async (c) => {
  const keyParse = keySchema.safeParse(c.req.param('key'));
  if (!keyParse.success) {
    return c.json({ success: false, error: keyParse.error.issues[0]?.message }, 400);
  }

  const userId = c.get('userId');

  try {
    const [row] = await sql`SELECT value, updated_at FROM app_data WHERE user_id = ${userId} AND key = ${keyParse.data}`;
    return c.json({ success: true, data: row ? { value: row.value, updatedAt: row.updated_at } : null });
  } catch (err) {
    console.error('[app-data GET]', err);
    return c.json({ success: false, error: 'Fehler beim Laden' }, 500);
  }
});

// ── PUT /:key ─────────────────────────────────────────────────────────────────
appData.put('/:key', async (c) => {
  const keyParse = keySchema.safeParse(c.req.param('key'));
  if (!keyParse.success) {
    return c.json({ success: false, error: keyParse.error.issues[0]?.message }, 400);
  }

  const rawBody = await c.req.text();
  if (rawBody.length > MAX_VALUE_SIZE) {
    return c.json({ success: false, error: `Wert darf maximal ${MAX_VALUE_SIZE / 1024} KB groß sein` }, 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return c.json({ success: false, error: 'Ungültiges JSON' }, 400);
  }

  const bodySchema = z.object({ value: z.unknown() });
  const body = bodySchema.safeParse(parsed);
  if (!body.success || body.data.value === undefined) {
    return c.json({ success: false, error: '"value" fehlt im Request-Body' }, 400);
  }

  const userId = c.get('userId');

  try {
    const [row] = await sql`
      INSERT INTO app_data (user_id, key, value, updated_at)
      VALUES (${userId}, ${keyParse.data}, ${JSON.stringify(body.data.value)}, NOW())
      ON CONFLICT (user_id, key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING *
    `;
    return c.json({ success: true, data: row });
  } catch (err) {
    console.error('[app-data PUT]', err);
    return c.json({ success: false, error: 'Fehler beim Speichern' }, 500);
  }
});

// ── DELETE /:key ──────────────────────────────────────────────────────────────
appData.delete('/:key', async (c) => {
  const keyParse = keySchema.safeParse(c.req.param('key'));
  if (!keyParse.success) {
    return c.json({ success: false, error: keyParse.error.issues[0]?.message }, 400);
  }

  const userId = c.get('userId');

  try {
    await sql`DELETE FROM app_data WHERE user_id = ${userId} AND key = ${keyParse.data}`;
    return c.json({ success: true, data: { deleted: keyParse.data } });
  } catch (err) {
    console.error('[app-data DELETE]', err);
    return c.json({ success: false, error: 'Fehler beim Löschen' }, 500);
  }
});

export default appData;
