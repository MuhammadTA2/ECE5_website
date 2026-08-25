import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { GalleryClient } from '@/app/gallery-client';
import type { GallerySnapshot, ViewerState } from '@/lib/types';
import { getGallerySnapshot, getViewerState, sendEmailSignInLink, signedOutViewer, signOut } from './gallery-service';
import { configurationError, supabase } from './supabase';
import { PrivacyPage, TermsPage } from './legal-pages';

const emptySnapshot: GallerySnapshot = {
  settings: {
    title: 'Project Gallery',
    subtitle: 'A secure, shared log of builds, breakthroughs, and the work between.',
  },
  photos: [],
  revision: 0,
};

export function App() {
  const [route, setRoute] = useState(window.location.hash.replace(/^#\/?/, '') || 'gallery');
  const [snapshot, setSnapshot] = useState<GallerySnapshot>(emptySnapshot);
  const [viewer, setViewer] = useState<ViewerState>(signedOutViewer);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(configurationError ?? '');
  const [authOpen, setAuthOpen] = useState(false);

  const load = useCallback(async () => {
    if (configurationError) { setLoading(false); return; }
    try {
      const [nextSnapshot, nextViewer] = await Promise.all([
        getGallerySnapshot(),
        getViewerState(true),
      ]);
      setSnapshot(nextSnapshot);
      setViewer(nextViewer);
      setError('');
      document.title = `${nextSnapshot.settings.title} · Project Gallery`;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The gallery could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace(/^#\/?/, '') || 'gallery');
    window.addEventListener('hashchange', onHashChange);
    const initialLoad = window.setTimeout(() => void load(), 0);
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void load(), 0);
    });
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.clearTimeout(initialLoad);
      listener.subscription.unsubscribe();
    };
  }, [load]);

  if (route === 'privacy') return <PrivacyPage />;
  if (route === 'terms') return <TermsPage />;

  if (loading) return <main className="app-state"><div className="state-card"><span className="state-spinner" aria-hidden="true" /><h1>Opening the gallery</h1><p>Loading the public archive and checking your editor session.</p></div></main>;

  if (error) return <main className="app-state"><div className="state-card"><p className="eyebrow">SETUP REQUIRED</p><h1>The GitHub-ready frontend is built.</h1><p>{error}</p><p>Apply the Supabase migration and add the two repository variables described in <code>SUPABASE_SETUP.md</code>.</p><button className="button" type="button" onClick={() => void load()}>Try again</button></div></main>;

  return <>
    <GalleryClient
      initialSnapshot={snapshot}
      viewer={viewer}
      onSignIn={() => setAuthOpen(true)}
      onSignOut={() => void signOut()}
    />
    {authOpen && <EmailSignInModal onClose={() => setAuthOpen(false)} />}
  </>;
}

function EmailSignInModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await sendEmailSignInLink(email);
      setMessage('Check your email for a secure one-time sign-in link. It may take a minute to arrive.');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'The sign-in email could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); previous?.focus(); };
  }, [onClose]);

  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="email-sign-in-title">
      <div className="modal-head"><h2 id="email-sign-in-title">Editor email sign in</h2><button type="button" onClick={onClose} aria-label="Close dialog">×</button></div>
      <p className="modal-intro">Enter your email. We’ll send a one-time sign-in link—no ChatGPT account or shared password is required. Editing remains limited to addresses invited by the gallery owner.</p>
      <form onSubmit={submit}>
        <label className="field"><span>Email address</span><input type="email" autoFocus autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button></div>
      </form>
      <p className="security-note">The link expires and can only sign in the email address that requested it. Read the <a href="#/privacy" onClick={onClose}>Privacy Policy</a> and <a href="#/terms" onClick={onClose}>Terms</a>.</p>
    </div>
  </div>;
}
