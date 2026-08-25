import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalShell({ eyebrow, title, updated, children }: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <Link className="legal-back" href="/">← Back to Project Gallery</Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-updated">Effective and last updated: {updated}</p>
      </header>
      <article className="legal-card">{children}</article>
      <nav className="legal-nav" aria-label="Legal information">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
      </nav>
    </main>
  );
}
