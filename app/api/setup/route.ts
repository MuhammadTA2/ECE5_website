import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';
import { assertSameOrigin, enforceRateLimit, HttpError, jsonError } from '@/lib/security';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await ensureSchema();
    const user = await getChatGPTUser();
    if (!user) throw new HttpError(401, 'Sign in to claim editor access.');
    await enforceRateLimit(`setup:${user.userId}`, 8, 60_000);

    const db = getD1();
    const result = await db.prepare(`INSERT INTO editors (user_id, email, display_name, role, created_at)
      SELECT ?, ?, ?, 'owner', ?
      WHERE NOT EXISTS (SELECT 1 FROM editors)`)
      .bind(user.userId, user.email, user.displayName, Date.now())
      .run();
    const changes = Number(result.meta.changes ?? 0);
    if (changes === 0) {
      const existing = await db.prepare('SELECT role FROM editors WHERE user_id = ?').bind(user.userId).first();
      if (!existing) throw new HttpError(409, 'This gallery already has an owner.');
    }
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
