import { ensureSchema, getD1 } from '@/db';

export async function getPrivacyContact(): Promise<string | null> {
  await ensureSchema();
  const owner = await getD1()
    .prepare("SELECT email FROM editors WHERE role = 'owner' LIMIT 1")
    .first<{ email: string }>();
  return owner?.email ?? null;
}
