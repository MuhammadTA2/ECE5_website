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

  it('enforces editor access in database functions and storage policies', () => {
    const migration = read('supabase/migrations/0001_github_pages_backend.sql');
    expect(migration).toContain('public.is_gallery_editor()');
    expect(migration).toContain('Editors upload gallery images');
    expect(migration).toContain('Visitors read active gallery images');
    expect(migration).toContain('owner_id = (select auth.uid())::text');
    expect(read('src/gallery-service.ts')).toContain('createSignedUrls');
    expect(migration).toContain('revoke all on public.gallery_settings');
  });

  it('keeps browser storage out of the data layer', () => {
    const files = [read('src/gallery-service.ts'), read('app/gallery-client.tsx')].join('\n');
    expect(files).not.toMatch(/localStorage|sessionStorage|window\.storage/);
  });

  it('declares baseline browser security headers', () => {
    const html = read('index.html');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain("object-src 'none'");
    expect(html).toContain("connect-src 'self' https://*.supabase.co");
  });

  it('publishes legal notices and records upload permission confirmations', () => {
    expect(read('src/legal-pages.tsx')).toContain('Privacy Policy');
    expect(read('src/legal-pages.tsx')).toContain('Terms of Use');
    expect(read('app/gallery-client.tsx')).toContain('rightsConfirmed');
    expect(read('src/gallery-service.ts')).toContain('LEGAL_POLICY_VERSION');
    expect(read('supabase/migrations/0001_github_pages_backend.sql')).toContain('upload_consents');
  });

  it('keeps owner bootstrap and service credentials out of browser reach', () => {
    const migration = read('supabase/migrations/0001_github_pages_backend.sql');
    const browserSource = [read('src/supabase.ts'), read('src/gallery-service.ts'), read('.github/workflows/pages.yml')].join('\n');
    expect(migration).toContain('revoke execute on function public.bootstrap_gallery_owner(text)');
    expect(browserSource).not.toMatch(/service[_-]?role/i);
  });

  it('deploys a static artifact through the supported GitHub Pages actions', () => {
    const workflow = read('.github/workflows/pages.yml');
    expect(workflow).toContain('actions/upload-pages-artifact@v4');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).toContain('pages: write');
  });
});
