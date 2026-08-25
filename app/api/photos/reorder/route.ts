import { getD1 } from '@/db';
import { getGallerySnapshot } from '@/lib/gallery';
import { HttpError, jsonError, requireEditor } from '@/lib/security';

export async function POST(request: Request) {
  try {
    await requireEditor(request, 'reorder');
    const body = await request.json() as { ids?: unknown; expectedRevision?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isSafeInteger(expectedRevision) || new Set(ids).size !== ids.length) throw new HttpError(400, 'Invalid reorder request.');

    const db = getD1();
    const current = await db.prepare('SELECT id FROM photos WHERE deleted_at IS NULL ORDER BY position ASC').all<{ id: string }>();
    const currentIds = current.results.map((row) => row.id);
    if (ids.length !== currentIds.length || currentIds.some((id) => !ids.includes(id))) throw new HttpError(409, 'The gallery changed. Refresh and try again.');

    const results = await db.batch([
      ...ids.map((id, position) => db.prepare(`UPDATE photos SET position = ?
        WHERE id = ? AND deleted_at IS NULL AND (SELECT revision FROM gallery_meta WHERE id = 1) = ?`)
        .bind(position, id, expectedRevision)),
      db.prepare('UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1 AND revision = ?').bind(expectedRevision),
    ]);
    if (Number(results.at(-1)?.meta.changes ?? 0) !== 1) throw new HttpError(409, 'The gallery changed in another session. Refresh and try again.');
    return Response.json(await getGallerySnapshot());
  } catch (error) {
    return jsonError(error);
  }
}
