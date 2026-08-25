import { ensureSchema, getD1, getFiles } from '@/db';
import { HttpError, jsonError } from '@/lib/security';
import { safeFilename } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const row = await getD1().prepare(`SELECT object_key, content_type, filename
      FROM photos WHERE id = ? AND deleted_at IS NULL`).bind(id).first<{
        object_key: string; content_type: string; filename: string;
      }>();
    if (!row) throw new HttpError(404, 'Image not found.');
    const object = await getFiles().get(row.object_key);
    if (!object) throw new HttpError(404, 'Image not found.');
    const filename = encodeURIComponent(safeFilename(row.filename));
    return new Response(object.body, {
      headers: {
        'Content-Type': row.content_type,
        'Content-Length': String(object.size),
        'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
