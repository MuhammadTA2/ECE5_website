import { getD1 } from '@/db';
import { getGallerySnapshot } from '@/lib/gallery';
import { HttpError, jsonError, requireEditor } from '@/lib/security';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireEditor(request, 'photo-restore');
    const { id } = await context.params;
    const db = getD1();
    const results = await db.batch([
      db.prepare(`UPDATE photos SET deleted_at = NULL,
        position = COALESCE((SELECT MAX(position) + 1 FROM photos AS active WHERE active.deleted_at IS NULL), 0),
        version = version + 1 WHERE id = ? AND deleted_at IS NOT NULL`).bind(id),
      db.prepare(`UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1
        AND EXISTS (SELECT 1 FROM photos WHERE id = ? AND deleted_at IS NULL)`).bind(id),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) throw new HttpError(409, 'That photo can no longer be restored.');
    return Response.json(await getGallerySnapshot());
  } catch (error) {
    return jsonError(error);
  }
}
