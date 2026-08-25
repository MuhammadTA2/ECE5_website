import { ensureSchema, getD1 } from '@/db';
import type { GallerySnapshot } from './types';

type SettingsRow = { title: string; subtitle: string };
type MetaRow = { revision: number };
type PhotoRow = {
  id: string;
  caption: string;
  filename: string;
  content_type: string;
  byte_size: number;
  added_at: number;
  position: number;
  version: number;
};
type TagRow = { photo_id: string; tag: string };

export async function getGallerySnapshot(): Promise<GallerySnapshot> {
  await ensureSchema();
  const db = getD1();
  const [settingsResult, metaResult, photosResult, tagsResult] = await db.batch([
    db.prepare('SELECT title, subtitle FROM gallery_settings WHERE id = 1'),
    db.prepare('SELECT revision FROM gallery_meta WHERE id = 1'),
    db.prepare(`SELECT id, caption, filename, content_type, byte_size, added_at, position, version
      FROM photos WHERE deleted_at IS NULL ORDER BY position ASC, added_at DESC`),
    db.prepare(`SELECT photo_tags.photo_id, photo_tags.tag
      FROM photo_tags JOIN photos ON photos.id = photo_tags.photo_id
      WHERE photos.deleted_at IS NULL ORDER BY photo_tags.tag ASC`),
  ]);

  const settings = settingsResult.results[0] as unknown as SettingsRow | undefined;
  const meta = metaResult.results[0] as unknown as MetaRow | undefined;
  const tagsByPhoto = new Map<string, string[]>();
  for (const row of tagsResult.results as unknown as TagRow[]) {
    const tags = tagsByPhoto.get(row.photo_id) ?? [];
    tags.push(row.tag);
    tagsByPhoto.set(row.photo_id, tags);
  }

  return {
    settings: {
      title: settings?.title ?? 'Project Gallery',
      subtitle: settings?.subtitle ?? '',
    },
    revision: meta?.revision ?? 0,
    photos: (photosResult.results as unknown as PhotoRow[]).map((photo) => ({
      id: photo.id,
      caption: photo.caption,
      filename: photo.filename,
      contentType: photo.content_type,
      byteSize: photo.byte_size,
      addedAt: photo.added_at,
      position: photo.position,
      version: photo.version,
      tags: tagsByPhoto.get(photo.id) ?? [],
      imageUrl: `/api/images/${encodeURIComponent(photo.id)}`,
    })),
  };
}

export async function getEditorState(userId: string | null): Promise<{
  isEditor: boolean;
  canClaimOwnership: boolean;
}> {
  await ensureSchema();
  const db = getD1();
  const [countResult, editorResult] = await db.batch([
    db.prepare('SELECT COUNT(*) AS count FROM editors'),
    db.prepare('SELECT role FROM editors WHERE user_id = ?').bind(userId ?? ''),
  ]);
  const count = Number((countResult.results[0] as { count?: number } | undefined)?.count ?? 0);
  return {
    isEditor: editorResult.results.length > 0,
    canClaimOwnership: Boolean(userId) && count === 0,
  };
}
