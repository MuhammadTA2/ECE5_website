import type { Metadata } from 'next';
import './globals.css';

function trustedOrigin(): URL | undefined {
  const value = process.env.PUBLIC_SITE_ORIGIN;
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url : undefined;
  } catch {
    return undefined;
  }
}

const metadataBase = trustedOrigin();

export const metadata: Metadata = {
  metadataBase,
  title: 'Project Gallery',
  description: 'A secure, shared visual log of builds, breakthroughs, and the work between.',
  openGraph: {
    title: 'Project Gallery',
    description: 'Builds, documented together.',
    type: 'website',
    ...(metadataBase ? { images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Project Gallery — Builds, documented together.' }] } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Gallery',
    description: 'Builds, documented together.',
    ...(metadataBase ? { images: ['/og.png'] } : {}),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
