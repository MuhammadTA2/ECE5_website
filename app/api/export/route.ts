import { getGallerySnapshot } from '@/lib/gallery';
import { jsonError, requireEditor } from '@/lib/security';

export async function POST(request: Request) {
  try {
    await requireEditor(request, 'export');
    const snapshot = await getGallerySnapshot();
    const body = JSON.stringify({ exportedAt: new Date().toISOString(), ...snapshot }, null, 2);
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="project-gallery-backup.json"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
