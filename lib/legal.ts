import { ensureSchema, getD1 } from '@/db';

export async function getPrivacyOwner(): Promise<{ name: string | null; email: string } | null> {
  await ensureSchema();
  const owner = await getD1()
    .prepare("SELECT display_name AS name, email FROM editors WHERE role = 'owner' LIMIT 1")
    .first<{ name: string | null; email: string }>();
  return owner ?? null;
}
