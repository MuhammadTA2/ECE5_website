export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOADS_PER_BATCH = 12;
export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

export function cleanTags(value: unknown): string[] {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(source
    .map((tag) => cleanText(tag, 28).toLocaleLowerCase())
    .map((tag) => tag.replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean))].slice(0, 8);
}

export function isSupportedImage(bytes: Uint8Array, contentType: string): boolean {
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) return false;
  if (contentType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === 'image/png') return bytes.slice(0, 8).every((byte, i) => byte === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][i]);
  if (contentType === 'image/gif') return new TextDecoder().decode(bytes.slice(0, 6)) === 'GIF87a' || new TextDecoder().decode(bytes.slice(0, 6)) === 'GIF89a';
  if (contentType === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export function safeFilename(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
  return cleaned || 'image';
}
