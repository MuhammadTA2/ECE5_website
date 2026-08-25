import { getD1 } from '@/db';
import { getGallerySnapshot } from '@/lib/gallery';
import { HttpError, jsonError, requireEditor } from '@/lib/security';
import { cleanTags, cleanText } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireEditor(request, 'photo-edit');
    const { id } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const caption = cleanText(body.caption, 600);
    const tags = cleanTags(body.tags);
    const expectedVersion = Number(body.expectedVersion);
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new HttpError(400, 'Invalid photo version.');

    const nextVersion = expectedVersion + 1;
    const db = getD1();
    const results = await db.batch([
      db.prepare(`UPDATE photos SET caption = ?, version = version + 1
        WHERE id = ? AND version = ? AND deleted_at IS NULL`).bind(caption, id, expectedVersion),
      db.prepare(`DELETE FROM photo_tags WHERE photo_id = ?
        AND EXISTS (SELECT 1 FROM photos WHERE id = ? AND version = ? AND deleted_at IS NULL)`)
        .bind(id, id, nextVersion),
      ...tags.map((tag) => db.prepare(`INSERT INTO photo_tags (photo_id, tag)
        SELECT id, ? FROM photos WHERE id = ? AND version = ? AND deleted_at IS NULL`).bind(tag, id, nextVersion)),
      db.prepare(`UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1
        AND EXISTS (SELECT 1 FROM photos WHERE id = ? AND version = ? AND deleted_at IS NULL)`)
        .bind(id, nextVersion),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) throw new HttpError(409, 'This photo changed in another session. Refresh and try again.');
    return Response.json(await getGallerySnapshot());
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireEditor(request, 'photo-delete');
    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as { expectedVersion?: unknown };
    const expectedVersion = Number(body.expectedVersion);
    if (!Number.isSafeInteger(expectedVersion)) throw new HttpError(400, 'Invalid photo version.');
    const db = getD1();
    const now = Date.now();
    const results = await db.batch([
      db.prepare(`UPDATE photos SET deleted_at = ?, version = version + 1
        WHERE id = ? AND version = ? AND deleted_at IS NULL`).bind(now, id, expectedVersion),
      db.prepare(`UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1
        AND EXISTS (SELECT 1 FROM photos WHERE id = ? AND deleted_at = ?)`).bind(id, now),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) throw new HttpError(409, 'This photo changed in another session. Refresh and try again.');
    return Response.json({ snapshot: await getGallerySnapshot(), deletedId: id });
  } catch (error) {
    return jsonError(error);
  }
}
