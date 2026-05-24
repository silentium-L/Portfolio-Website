import { Hono } from 'hono';
import sql from '../db';

const availability = new Hono();

// GET /api/availability/check?username=foo&email=bar@baz.com
// Prüft ob Benutzername und/oder E-Mail noch verfügbar sind.
// Kein Auth erforderlich — für Echtzeit-Validierung bei der Registrierung.
availability.get('/check', async (c) => {
  const username = c.req.query('username');
  const email = c.req.query('email');

  if (!username && !email) {
    return c.json({ success: false, error: 'username oder email Parameter erforderlich' }, 400);
  }

  const result: Record<string, { available: boolean }> = {};

  try {
    if (username) {
      const v = username.trim();
      if (v.length >= 3 && v.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(v)) {
        const rows = await sql`SELECT 1 FROM users WHERE LOWER(username) = LOWER(${v}) LIMIT 1`;
        result.username = { available: rows.length === 0 };
      }
    }

    if (email) {
      const v = email.trim();
      if (v.length > 0 && v.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        const rows = await sql`SELECT 1 FROM contacts WHERE LOWER(email) = LOWER(${v}) LIMIT 1`;
        result.email = { available: rows.length === 0 };
      }
    }

    return c.json({ success: true, data: result });
  } catch {
    return c.json({ success: false, error: 'Prüfung fehlgeschlagen' }, 500);
  }
});

export default availability;
