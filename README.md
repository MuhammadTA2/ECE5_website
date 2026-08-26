# Muhammad Abouelkhir — Engineering Portfolio

A static personal portfolio for embedded systems, robotics, telemetry, and software projects. The site is built with React, TypeScript, and Vite and is hosted entirely on GitHub Pages.

There is no authentication, database, external storage, server runtime, or third-party service dependency.

## Add a project

The project catalog and every detail page are generated from [`src/projects.ts`](./src/projects.ts).

1. Create `public/projects/your-project-slug/` and upload the preview and gallery images.
2. Copy one project object in `src/projects.ts` and update its name, slug, summary, sections, tags, and links.
3. Set `previewImage` to a path such as `projects/your-project-slug/preview.jpg`.
4. Add any detail images to `gallery` using the same path style. Each image supports alt text and an optional caption.
5. Commit the files to `main`. GitHub Pages rebuilds the portfolio automatically.

Projects without an uploaded preview image receive a designed technical placeholder, so incomplete media never produces a broken image.

## Local development

```bash
pnpm install
pnpm dev
```

## Deployment

Every push to `main` runs validation and deploys the static build through GitHub Pages.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
