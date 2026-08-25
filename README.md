# Project Gallery

A secure collaborative photo log for ECE5 build work. The app uses Sites authentication for identity, D1 for transactional metadata, and R2 for validated image uploads.

## Local development

```bash
pnpm install
pnpm dev
```

The local gallery is read-only unless authentication headers are supplied by the Sites environment. The first authenticated visitor to an unclaimed gallery can become its owner; all later write operations are authorized server-side.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```
