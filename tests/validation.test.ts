import { describe, expect, it } from 'vitest';
import { cleanTags, cleanText, isSupportedImage, safeFilename } from '@/lib/validation';

describe('input validation', () => {
  it('normalizes and deduplicates tags', () => {
    expect(cleanTags(' PCB, pcb, bench test!,  , Prototype ')).toEqual(['pcb', 'bench test', 'prototype']);
  });

  it('removes control characters and caps text', () => {
    expect(cleanText('  safe\u0000 title  ', 8)).toBe('safe tit');
  });

  it('sanitizes filenames used in response headers', () => {
    expect(safeFilename('../../project photo\r\n.jpg')).toBe('.._.._project_photo__.jpg');
  });

  it('checks file signatures instead of trusting MIME types', () => {
    expect(isSupportedImage(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg')).toBe(true);
    expect(isSupportedImage(new Uint8Array([0x00, 0x01, 0x02]), 'image/jpeg')).toBe(false);
    expect(isSupportedImage(new TextEncoder().encode('not a png'), 'image/png')).toBe(false);
    expect(isSupportedImage(new Uint8Array([0xff, 0xd8, 0xff]), 'image/svg+xml')).toBe(false);
  });
});
