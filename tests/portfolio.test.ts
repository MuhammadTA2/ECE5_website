import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../src/projects';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('static portfolio', () => {
  it('publishes factual project links and portfolio identity', () => {
    const app = read('src/app.tsx');
    const projects = read('src/projects.ts');
    expect(app).toContain('Muhammad Abouelkhir');
    expect(projects).toContain('Occupancy-Grid-Compression');
    expect(projects).toContain('ece5RobotCode');
  });

  it('builds project tabs and dedicated detail pages from reusable records', () => {
    const app = read('src/app.tsx');
    const projects = read('src/projects.ts');
    expect(app).toContain('project-tabs');
    expect(app).toContain("path.startsWith('projects/')");
    expect(app).toContain('project.gallery.map');
    expect(projects).toContain('previewImage?: string');
    expect(projects).toContain('gallery: ProjectMedia[]');
    expect(projects).toContain("type: 'video'");
    expect(app).toContain('<video controls preload="metadata"');
  });

  it('ships every configured project asset and keeps videos browser-uploadable', () => {
    const occupancyProject = projects.find((project) => project.slug === 'occupancy-grid-compression');
    expect(occupancyProject).toBeDefined();
    expect(occupancyProject?.previewImage).toBeTruthy();

    for (const media of occupancyProject?.gallery ?? []) {
      const mediaPath = resolve(root, 'public', media.src);
      expect(existsSync(mediaPath), `${media.src} should exist`).toBe(true);
      if (media.type === 'video') {
        expect(statSync(mediaPath).size).toBeLessThan(25 * 1024 * 1024);
        expect(existsSync(resolve(root, 'public', media.poster)), `${media.poster} should exist`).toBe(true);
      }
    }
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
