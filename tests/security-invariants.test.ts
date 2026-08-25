import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('security invariants', () => {
  it('does not ship a client-side passphrase', () => {
    const client = read('app/gallery-client.tsx');
    expect(client).not.toMatch(/passphrase|password|EDIT_PASSPHRASE/i);
  });

  it('protects every write route with server authorization', () => {
    for (const path of [
      'app/api/settings/route.ts',
      'app/api/photos/route.ts',
      'app/api/photos/reorder/route.ts',
      'app/api/photos/[id]/route.ts',
      'app/api/photos/[id]/restore/route.ts',
      'app/api/export/route.ts',
    ]) {
      expect(read(path), path).toContain('requireEditor(request');
    }
  });

  it('keeps browser storage out of the data layer', () => {
    const files = [read('lib/gallery.ts'), read('app/gallery-client.tsx')].join('\n');
    expect(files).not.toMatch(/localStorage|sessionStorage|window\.storage/);
  });

  it('declares baseline browser security headers', () => {
    const config = read('next.config.ts');
    expect(config).toContain('Content-Security-Policy');
    expect(config).toContain('X-Content-Type-Options');
    expect(config).toContain('frame-ancestors');
  });
});
