import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('static portfolio', () => {
  it('publishes factual project links and portfolio identity', () => {
    const app = read('src/app.tsx');
    expect(app).toContain('Muhammad Abouelkhir');
    expect(app).toContain('Occupancy-Grid-Compression');
    expect(app).toContain('ece5RobotCode');
  });

  it('has no authentication, database, or external runtime dependency', () => {
    const packageJson = read('package.json');
    const app = read('src/app.tsx');
    expect(packageJson).not.toMatch(/supabase|next|drizzle|vinext|wrangler/i);
    expect(app).not.toMatch(/sign.?in|password|database|supabase/i);
  });

  it('uses restrictive static-site browser policy and social metadata', () => {
    const html = read('index.html');
    expect(html).toContain("connect-src 'self'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain('Muhammad Abouelkhir · Engineering Portfolio');
    expect(html).toContain('/og.png');
  });

  it('deploys a static artifact through GitHub Pages', () => {
    const workflow = read('.github/workflows/pages.yml');
    expect(workflow).toContain('actions/upload-pages-artifact@v4');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).not.toContain('VITE_SUPABASE');
  });
});
