import { getD1, getFiles } from '@/db';
import { getGallerySnapshot } from '@/lib/gallery';
import { HttpError, jsonError, requireEditor } from '@/lib/security';
import { cleanTags, cleanText, isSupportedImage, MAX_UPLOAD_BYTES, safeFilename } from '@/lib/validation';

export async function POST(request: Request) {
  let objectKey: string | null = null;
  try {
    const user = await requireEditor(request, 'upload');
    const declaredSize = Number(request.headers.get('content-length') ?? 0);
    if (declaredSize > MAX_UPLOAD_BYTES + 256_000) throw new HttpError(413, 'That upload is too large.');

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose an image to upload.');
    if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Images must be 8 MB or smaller.');

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isSupportedImage(bytes, file.type)) throw new HttpError(415, 'Use a JPEG, PNG, WebP, or GIF image.');

    const id = crypto.randomUUID();
    objectKey = `photos/${id}`;
    const caption = cleanText(form.get('caption'), 600);
    const tags = cleanTags(form.get('tags'));
    const filename = safeFilename(file.name);
    const now = Date.now();

    await getFiles().put(objectKey, bytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: { photoId: id, ownerId: user.userId },
    });

    const db = getD1();
    const statements = [
      db.prepare(`INSERT INTO photos
        (id, object_key, filename, content_type, byte_size, caption, added_at, added_by, position, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT MAX(position) + 1 FROM photos WHERE deleted_at IS NULL), 0), 1)`)
        .bind(id, objectKey, filename, file.type, file.size, caption, now, user.userId),
      ...tags.map((tag) => db.prepare('INSERT INTO photo_tags (photo_id, tag) VALUES (?, ?)').bind(id, tag)),
      db.prepare('UPDATE gallery_meta SET revision = revision + 1 WHERE id = 1'),
    ];
    await db.batch(statements);
    return Response.json(await getGallerySnapshot(), { status: 201 });
  } catch (error) {
    if (objectKey) await getFiles().delete(objectKey).catch(() => undefined);
    return jsonError(error);
  }
}
