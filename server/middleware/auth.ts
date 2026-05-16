import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Nicht autorisiert' }, 401);
  }

  try {
    const payload = await verify(authHeader.slice(7), process.env.JWT_SECRET!, 'HS256');
    c.set('userId', payload.sub as number);
    c.set('username', payload.username as string);
    await next();
  } catch {
    return c.json({ success: false, error: 'Ungültiger Token' }, 401);
  }
}
