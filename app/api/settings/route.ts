import { getD1 } from '@/db';
import { getGallerySnapshot } from '@/lib/gallery';
import { HttpError, jsonError, requireEditor } from '@/lib/security';
import { cleanText } from '@/lib/validation';

export async function PATCH(request: Request) {
  try {
    await requireEditor(request, 'settings');
    const body = await request.json() as Record<string, unknown>;
    const title = cleanText(body.title, 80);
    const subtitle = cleanText(body.subtitle, 220);
    const expectedRevision = Number(body.expectedRevision);
    if (!title) throw new HttpError(400, 'A gallery title is required.');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new HttpError(400, 'Invalid gallery revision.');

    const db = getD1();
    const results = await db.batch([
      db.prepare(`UPDATE gallery_settings SET title = ?, subtitle = ?, updated_at = ?
        WHERE id = 1 AND (SELECT revision FROM gallery_meta WHERE id = 1) = ?`)
        .bind(title, subtitle, Date.now(), expectedRevision),
      db.prepare('UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1 AND revision = ?')
        .bind(expectedRevision),
    ]);
    if (Number(results[1].meta.changes ?? 0) !== 1) throw new HttpError(409, 'The gallery changed in another session. Refresh and try again.');
    return Response.json(await getGallerySnapshot());
  } catch (error) {
    return jsonError(error);
  }
}
