import { getGallerySnapshot } from '@/lib/gallery';
import { jsonError } from '@/lib/security';

export async function GET() {
  try {
    return Response.json(await getGallerySnapshot(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return jsonError(error);
  }
}
