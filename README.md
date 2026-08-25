# Project Gallery

A public, collaborative photo log that runs as a static site on GitHub Pages. Supabase provides passwordless email authentication, Postgres metadata, and image storage. Database row-level security and storage policies—not browser code—decide who may edit.

## Local development

1. Complete [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
2. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
3. Run:

```bash
pnpm install
pnpm dev
```

## Deploy to GitHub Pages

Push to the repository’s `main` branch, add the two repository variables described in the setup guide, and select **GitHub Actions** as the Pages source. The included workflow tests and publishes the static build.

## Security model

- Anyone may view active gallery content.
- Sign-in uses an expiring link sent to the user’s email; no ChatGPT account or shared passkey is involved.
- Signing in does not grant editing. Only the owner or an invited email address becomes an editor.
- Supabase RLS and RPC checks protect every database mutation; Storage policies protect uploads.
- The Supabase publishable key is safe to expose when these policies are applied. Never place a service-role key in this repository or in a `VITE_` variable.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
