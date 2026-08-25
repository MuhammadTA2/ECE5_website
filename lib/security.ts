import { ensureSchema, getD1 } from '@/db';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;
  if (!origin || origin !== requestOrigin) throw new HttpError(403, 'Cross-origin request blocked.');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') throw new HttpError(403, 'Cross-site request blocked.');
}

export async function requireEditor(request: Request, action = 'mutation'): Promise<ChatGPTUser> {
  assertSameOrigin(request);
  await ensureSchema();
  const user = await getChatGPTUser();
  if (!user) throw new HttpError(401, 'Sign in to continue.');
  const editor = await getD1().prepare('SELECT role FROM editors WHERE user_id = ?').bind(user.userId).first();
  if (!editor) throw new HttpError(403, 'Editor access is required.');
  await enforceRateLimit(`${action}:${user.userId}`, action === 'upload' ? 20 : 90, 60_000);
  return user;
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();
  const result = await getD1().prepare(`INSERT INTO rate_limits (key, window_start, count)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      window_start = CASE WHEN ? - window_start >= ? THEN ? ELSE window_start END,
      count = CASE WHEN ? - window_start >= ? THEN 1 ELSE count + 1 END
    RETURNING count`)
    .bind(key, now, now, windowMs, now, now, windowMs)
    .first<{ count: number }>();
  if ((result?.count ?? limit + 1) > limit) throw new HttpError(429, 'Too many requests. Try again shortly.');
}

export function jsonError(error: unknown): Response {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError ? error.message : 'Something went wrong.';
  return Response.json({ error: message }, { status });
}
