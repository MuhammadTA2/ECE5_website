'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type DragEvent, type FormEvent, type ReactNode } from 'react';
import type { GalleryPhoto, GallerySnapshot, ViewerState } from '@/lib/types';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MAX_UPLOADS_PER_BATCH } from '@/lib/validation';
import {
  inviteCollaborator,
  listCollaborators,
  removeCollaborator,
  removePhoto,
  reorderPhotos,
  restorePhoto as restoreGalleryPhoto,
  revokeInvite,
  updatePhoto,
  updateSettings,
  uploadPhoto,
  getGallerySnapshot,
  type Collaborator,
  type CollaboratorInvite,
} from '@/src/gallery-service';

type ModalState =
  | { type: 'upload' }
  | { type: 'settings' }
  | { type: 'edit'; photo: GalleryPhoto }
  | { type: 'delete'; photo: GalleryPhoto }
  | { type: 'collaborators' }
  | { type: 'lightbox'; photoId: string }
  | null;

type ToastState = { message: string; actionLabel?: string; action?: () => void } | null;
type UploadItem = { file: File; progress: number; status: 'ready' | 'uploading' | 'done' | 'error'; error?: string };

export function GalleryClient({
  initialSnapshot,
  viewer,
  onSignIn,
  onSignOut,
  signInPath,
  signOutPath,
}: {
  initialSnapshot: GallerySnapshot;
  viewer: ViewerState;
  onSignIn?: () => void;
  onSignOut?: () => void;
  signInPath?: string;
  signOutPath?: string;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [manage, setManage] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState(false);

  const tags = useMemo(() => [...new Set(snapshot.photos.flatMap((photo) => photo.tags))].sort(), [snapshot.photos]);
  const filtered = useMemo(() => {
    const needle = query.toLocaleLowerCase().trim();
    return snapshot.photos.filter((photo) => {
      const matchesTag = tag === 'all' || photo.tags.includes(tag);
      const haystack = `${photo.caption} ${photo.filename} ${photo.tags.join(' ')}`.toLocaleLowerCase();
      return matchesTag && (!needle || haystack.includes(needle));
    });
  }, [query, snapshot.photos, tag]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.action ? 7000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function refresh(message?: string) {
    try {
      const data = await getGallerySnapshot();
      setSnapshot(data);
      if (message) setToast({ message });
    } catch (error) {
      setToast({ message: errorMessage(error) });
    }
  }

  async function reorder(photoId: string, direction: -1 | 1) {
    const from = snapshot.photos.findIndex((photo) => photo.id === photoId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= snapshot.photos.length) return;
    const previousIds = snapshot.photos.map((photo) => photo.id);
    const ids = [...previousIds];
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setSnapshot((current) => ({ ...current, photos: ids.map((id) => current.photos.find((photo) => photo.id === id)!) }));
    try {
      const updated = await reorderPhotos(ids, snapshot.revision);
      setSnapshot(updated);
      setToast({
        message: 'Order saved.',
        actionLabel: 'Undo',
        action: () => void restoreOrder(previousIds, updated.revision),
      });
    } catch (error) {
      setSnapshot(snapshot);
      setToast({ message: errorMessage(error) });
    }
  }

  async function restoreOrder(ids: string[], expectedRevision: number) {
    try {
      const updated = await reorderPhotos(ids, expectedRevision);
      setSnapshot(updated);
      setToast({ message: 'Previous order restored.' });
    } catch (error) {
      setToast({ message: errorMessage(error) });
    }
  }

  async function deletePhoto(photo: GalleryPhoto) {
    setBusy(true);
    try {
      const updated = await removePhoto(photo.id, photo.version);
      setSnapshot(updated);
      setModal(null);
      setToast({
        message: 'Photo moved out of the gallery.',
        actionLabel: 'Undo',
        action: () => void restorePhoto(photo.id),
      });
    } catch (error) {
      setToast({ message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function restorePhoto(id: string) {
    try {
      const updated = await restoreGalleryPhoto(id);
      setSnapshot(updated);
      setToast({ message: 'Photo restored.' });
    } catch (error) {
      setToast({ message: errorMessage(error) });
    }
  }

  async function exportBackup() {
    try {
      const backup = JSON.stringify({ exportedAt: new Date().toISOString(), ...snapshot }, null, 2);
      const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'project-gallery-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Backup exported.' });
    } catch (error) {
      setToast({ message: errorMessage(error) });
    }
  }

  const activeLightbox = modal?.type === 'lightbox'
    ? snapshot.photos.find((photo) => photo.id === modal.photoId) ?? null
    : null;

  function stepLightbox(direction: -1 | 1) {
    if (!activeLightbox) return;
    const index = filtered.findIndex((photo) => photo.id === activeLightbox.id);
    const next = filtered[(index + direction + filtered.length) % filtered.length];
    if (next) setModal({ type: 'lightbox', photoId: next.id });
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="circuit" aria-hidden="true"><span /><span /><span /></div>
        <div className="status-line">
          <span className="status-pill"><span className="status-dot" />{viewer.isEditor ? 'SECURE EDITOR SESSION' : 'GALLERY ONLINE · READ ONLY'}</span>
          <AccountMenu viewer={viewer} onSignIn={onSignIn ?? (() => { if (signInPath) window.location.assign(signInPath); })} onSignOut={onSignOut ?? (() => { if (signOutPath) window.location.assign(signOutPath); })} />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">ECE5 · BUILD ARCHIVE</p>
          <h1>{snapshot.settings.title}</h1>
          <p>{snapshot.settings.subtitle}</p>
        </div>
        <div className="hero-stats" aria-label="Gallery summary">
          <span><strong>{snapshot.photos.length}</strong> documented {snapshot.photos.length === 1 ? 'moment' : 'moments'}</span>
          <span><strong>{tags.length}</strong> active {tags.length === 1 ? 'tag' : 'tags'}</span>
          <span><strong>R{snapshot.revision}</strong> synced revision</span>
        </div>
      </header>

      <section className="workspace" aria-labelledby="gallery-heading">
        <div className="section-heading">
          <div><p className="eyebrow">VISUAL LOG</p><h2 id="gallery-heading">Document the work as it happens.</h2></div>
          {viewer.isEditor && (
            <button className={`button ${manage ? 'button-dark' : ''}`} type="button" onClick={() => setManage((value) => !value)} aria-pressed={manage}>
              {manage ? 'Finish editing' : 'Manage gallery'}
            </button>
          )}
        </div>

        <div className="toolbar">
          <label className="search-box">
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Descriptions, files, or tags" />
          </label>
          <div className="toolbar-actions">
            {manage && viewer.isEditor && <>
              <button className="button" type="button" onClick={() => setModal({ type: 'settings' })}>Gallery settings</button>
              {viewer.isOwner && <button className="button" type="button" onClick={() => setModal({ type: 'collaborators' })}>Collaborators</button>}
              <button className="button" type="button" onClick={() => void exportBackup()}>Export backup</button>
              <button className="button button-primary" type="button" onClick={() => setModal({ type: 'upload' })}>＋ Add photos</button>
            </>}
            <button className="button button-quiet" type="button" onClick={() => void refresh('Gallery refreshed.')} aria-label="Refresh gallery">↻ Refresh</button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="tag-filter" aria-label="Filter by tag">
            <button className={tag === 'all' ? 'active' : ''} type="button" onClick={() => setTag('all')}>All</button>
            {tags.map((item) => <button className={tag === item ? 'active' : ''} type="button" onClick={() => setTag(item)} key={item}>#{item}</button>)}
          </div>
        )}

        <p className="result-count" aria-live="polite">Showing {filtered.length} of {snapshot.photos.length}</p>

        {filtered.length > 0 ? (
          <div className="gallery-grid">
            {filtered.map((photo) => {
              const absoluteIndex = snapshot.photos.findIndex((item) => item.id === photo.id);
              return (
                <article className="photo-card" key={photo.id}>
                  <button className="photo-open" type="button" onClick={() => setModal({ type: 'lightbox', photoId: photo.id })} aria-label={`Open ${photo.caption || photo.filename}`}>
                    <img src={photo.imageUrl} alt={photo.caption || 'Project build photo'} loading="lazy" />
                    <span className="open-hint">View</span>
                  </button>
                  <div className="card-copy">
                    <div className="card-topline"><time dateTime={new Date(photo.addedAt).toISOString()}>{formatDate(photo.addedAt)}</time><span>{formatBytes(photo.byteSize)}</span></div>
                    <p className={photo.caption ? '' : 'muted'}>{photo.caption || 'No description yet.'}</p>
                    {photo.tags.length > 0 && <div className="card-tags">{photo.tags.map((item) => <span key={item}>#{item}</span>)}</div>}
                    {manage && viewer.isEditor && (
                      <div className="card-actions">
                        <button type="button" onClick={() => setModal({ type: 'edit', photo })}>Edit details</button>
                        <button type="button" disabled={absoluteIndex === 0} onClick={() => void reorder(photo.id, -1)} aria-label={`Move ${photo.caption || photo.filename} earlier`}>↑</button>
                        <button type="button" disabled={absoluteIndex === snapshot.photos.length - 1} onClick={() => void reorder(photo.id, 1)} aria-label={`Move ${photo.caption || photo.filename} later`}>↓</button>
                        <button className="danger-link" type="button" onClick={() => setModal({ type: 'delete', photo })}>Remove</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">◎</span>
            <h3>{snapshot.photos.length ? 'No moments match.' : 'The first build moment starts here.'}</h3>
            <p>{snapshot.photos.length ? 'Try a different search or tag.' : viewer.isEditor ? 'Open Manage gallery and add the first set of photos.' : 'An editor can add the first set of project photos.'}</p>
            {manage && viewer.isEditor && !snapshot.photos.length && <button className="button button-primary" type="button" onClick={() => setModal({ type: 'upload' })}>Add the first photos</button>}
          </div>
        )}
      </section>

      <footer><span>Project Gallery</span><nav aria-label="Legal information"><a href="#/privacy">Privacy Policy</a><a href="#/terms">Terms of Use</a></nav><span>GitHub-hosted · email authenticated · recoverable</span></footer>

      {modal?.type === 'upload' && <UploadModal onClose={() => setModal(null)} onComplete={(updated) => { setSnapshot(updated); setModal(null); setToast({ message: 'Photos added.' }); }} />}
      {modal?.type === 'settings' && <SettingsModal snapshot={snapshot} onClose={() => setModal(null)} onComplete={(updated) => { setSnapshot(updated); setModal(null); setToast({ message: 'Gallery details saved.' }); }} />}
      {modal?.type === 'edit' && <EditPhotoModal photo={modal.photo} onClose={() => setModal(null)} onComplete={(updated) => { setSnapshot(updated); setModal(null); setToast({ message: 'Photo details saved.' }); }} />}
      {modal?.type === 'collaborators' && <CollaboratorsModal onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <Modal title="Remove this photo?" onClose={() => !busy && setModal(null)}>
        <p className="modal-intro">It will disappear from the gallery, but you can undo the removal immediately afterward.</p>
        <div className="modal-actions"><button className="button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="button button-danger" type="button" disabled={busy} onClick={() => void deletePhoto(modal.photo)}>{busy ? 'Removing…' : 'Remove photo'}</button></div>
      </Modal>}
      {activeLightbox && <Lightbox photo={activeLightbox} hasMultiple={filtered.length > 1} onClose={() => setModal(null)} onStep={stepLightbox} />}

      {toast && <div className="toast" role="status" aria-live="polite"><span>{toast.message}</span>{toast.action && <button type="button" onClick={() => { const action = toast.action; setToast(null); action?.(); }}>{toast.actionLabel}</button>}</div>}
    </main>
  );
}

function AccountMenu({ viewer, onSignIn, onSignOut }: { viewer: ViewerState; onSignIn: () => void; onSignOut: () => void }) {
  if (!viewer.isSignedIn) return <div className="sign-in-area"><button className="button" type="button" onClick={onSignIn}>Editor email sign in</button><small>Signing in is subject to our <a href="#/privacy">Privacy Policy</a> and <a href="#/terms">Terms</a>.</small></div>;
  return <div className="account"><span className="avatar" aria-hidden="true">{(viewer.displayName ?? 'U').slice(0, 1).toUpperCase()}</span><span><strong>{viewer.displayName}</strong><small>{viewer.isOwner ? 'Owner' : viewer.isEditor ? 'Editor' : 'Viewer'}</small></span><button className="account-signout" type="button" onClick={onSignOut}>Sign out</button></div>;
}

function UploadModal({ onClose, onComplete }: { onClose: () => void; onComplete: (snapshot: GallerySnapshot) => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState('');
  const uploading = items.some((item) => item.status === 'uploading');

  function addFiles(files: File[]) {
    setError('');
    const accepted = files.slice(0, MAX_UPLOADS_PER_BATCH).filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES || file.size < 1) return false;
      return true;
    });
    if (accepted.length !== files.length) setError(`Some files were skipped. Use up to ${MAX_UPLOADS_PER_BATCH} JPEG, PNG, WebP, or GIF images under 8 MB each.`);
    setItems((current) => [...current, ...accepted.map((file) => ({ file, progress: 0, status: 'ready' as const }))].slice(0, MAX_UPLOADS_PER_BATCH));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles([...event.dataTransfer.files]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!items.length) { setError('Choose at least one image.'); return; }
    if (!rightsConfirmed) { setError('Confirm that you have the rights and permissions required for these photos.'); return; }
    let latest: GallerySnapshot | null = null;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      setItems((current) => current.map((entry, i) => i === index ? { ...entry, status: 'uploading', progress: 0 } : entry));
      try {
        latest = await uploadPhoto(item.file, caption, tags, rightsConfirmed, (progress) => {
          setItems((current) => current.map((entry, i) => i === index ? { ...entry, progress } : entry));
        });
        setItems((current) => current.map((entry, i) => i === index ? { ...entry, status: 'done', progress: 100 } : entry));
      } catch (uploadError) {
        setItems((current) => current.map((entry, i) => i === index ? { ...entry, status: 'error', error: errorMessage(uploadError) } : entry));
      }
    }
    if (latest) onComplete(latest);
  }

  return <Modal title="Add project photos" onClose={() => !uploading && onClose()} wide>
    <p className="modal-intro">Upload up to 12 images at once. Originals are validated and stored securely; descriptions and tags remain searchable.</p>
    <form onSubmit={submit}>
      <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <span aria-hidden="true">＋</span><strong>Drop images here</strong><p>or choose them from your device</p>
        <label className="button"><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => addFiles([...(event.target.files ?? [])])} />Choose photos</label>
      </div>
      {items.length > 0 && <div className="upload-list">{items.map((item, index) => <div key={`${item.file.name}-${item.file.lastModified}`}><span className="upload-name">{item.file.name}<small>{formatBytes(item.file.size)}</small></span><span className={`upload-status ${item.status}`}>{item.status === 'uploading' ? `${item.progress}%` : item.status}</span><button type="button" aria-label={`Remove ${item.file.name}`} disabled={uploading} onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>×</button><span className="progress" style={{ '--progress': `${item.progress}%` } as CSSProperties} />{item.error && <small className="field-error">{item.error}</small>}</div>)}</div>}
      <label className="field"><span>Description for this batch <small>optional</small></span><textarea value={caption} maxLength={600} onChange={(event) => setCaption(event.target.value)} placeholder="What changed, worked, or surprised you?" /></label>
      <label className="field"><span>Tags <small>comma separated</small></span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="prototype, testing, pcb" /></label>
      <label className="consent-check"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /><span>I own these images or have permission to use them, have obtained any consent required for identifiable people, and agree to the <a href="#/terms">Terms of Use</a> and <a href="#/privacy">Privacy Policy</a>.</span></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="modal-actions"><button className="button" type="button" disabled={uploading} onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={uploading || !items.length || !rightsConfirmed}>{uploading ? 'Uploading…' : `Upload ${items.length || ''} ${items.length === 1 ? 'photo' : 'photos'}`}</button></div>
    </form>
  </Modal>;
}

function SettingsModal({ snapshot, onClose, onComplete }: { snapshot: GallerySnapshot; onClose: () => void; onComplete: (snapshot: GallerySnapshot) => void }) {
  const [title, setTitle] = useState(snapshot.settings.title);
  const [subtitle, setSubtitle] = useState(snapshot.settings.subtitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { onComplete(await updateSettings(title, subtitle, snapshot.revision)); }
    catch (submitError) { setError(errorMessage(submitError)); setBusy(false); }
  }
  return <Modal title="Gallery settings" onClose={onClose}><form onSubmit={submit}><label className="field"><span>Gallery title</span><input value={title} required maxLength={80} onChange={(event) => setTitle(event.target.value)} /></label><label className="field"><span>Intro</span><textarea value={subtitle} maxLength={220} onChange={(event) => setSubtitle(event.target.value)} /></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="modal-actions"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save changes'}</button></div></form></Modal>;
}

function EditPhotoModal({ photo, onClose, onComplete }: { photo: GalleryPhoto; onClose: () => void; onComplete: (snapshot: GallerySnapshot) => void }) {
  const [caption, setCaption] = useState(photo.caption);
  const [tags, setTags] = useState(photo.tags.join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { onComplete(await updatePhoto(photo.id, caption, tags, photo.version)); }
    catch (submitError) { setError(errorMessage(submitError)); setBusy(false); }
  }
  return <Modal title="Edit photo details" onClose={onClose}><form onSubmit={submit}><label className="field"><span>Description</span><textarea value={caption} maxLength={600} onChange={(event) => setCaption(event.target.value)} autoFocus /></label><label className="field"><span>Tags <small>comma separated</small></span><input value={tags} onChange={(event) => setTags(event.target.value)} /></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="modal-actions"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save details'}</button></div></form></Modal>;
}

function CollaboratorsModal({ onClose }: { onClose: () => void }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<CollaboratorInvite[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    setError('');
    try {
      const data = await listCollaborators();
      setCollaborators(data.collaborators);
      setInvites(data.invites);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await inviteCollaborator(email);
      setEmail('');
      await load();
    } catch (inviteError) {
      setError(errorMessage(inviteError));
      setBusy(false);
    }
  }

  async function removeEditor(collaborator: Collaborator) {
    if (!window.confirm(`Remove editor access for ${collaborator.email}?`)) return;
    setBusy(true);
    try { await removeCollaborator(collaborator.userId); await load(); }
    catch (removeError) { setError(errorMessage(removeError)); setBusy(false); }
  }

  async function removeInvite(invite: CollaboratorInvite) {
    setBusy(true);
    try { await revokeInvite(invite.email); await load(); }
    catch (removeError) { setError(errorMessage(removeError)); setBusy(false); }
  }

  return <Modal title="Collaborators" onClose={onClose} wide>
    <p className="modal-intro">Invite collaborators by email. They open this site, request a secure email sign-in link, and receive editor access automatically after signing in with the invited address.</p>
    <form className="invite-form" onSubmit={invite}>
      <label className="field"><span>Collaborator email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" required /></label>
      <button className="button button-primary" type="submit" disabled={busy || !email.trim()}>Create invitation</button>
    </form>
    {error && <p className="field-error" role="alert">{error}</p>}
    <section className="collaborator-section" aria-labelledby="current-collaborators"><h3 id="current-collaborators">People with access</h3>{collaborators.length ? <div className="collaborator-list">{collaborators.map((person) => <div key={person.userId}><span className="avatar" aria-hidden="true">{person.displayName.slice(0, 1).toUpperCase()}</span><span><strong>{person.displayName}</strong><small>{person.email} · {person.role}</small></span>{person.role !== 'owner' && <button type="button" disabled={busy} onClick={() => void removeEditor(person)}>Remove</button>}</div>)}</div> : <p className="modal-intro">{busy ? 'Loading collaborators…' : 'No collaborators found.'}</p>}</section>
    <section className="collaborator-section" aria-labelledby="pending-invites"><h3 id="pending-invites">Pending invitations</h3>{invites.length ? <div className="collaborator-list">{invites.map((invite) => <div key={invite.email}><span className="invite-mark" aria-hidden="true">@</span><span><strong>{invite.email}</strong><small>Expires {new Date(invite.expiresAt).toLocaleDateString()}</small></span><button type="button" disabled={busy} onClick={() => void removeInvite(invite)}>Revoke</button></div>)}</div> : <p className="modal-intro">No pending invitations.</p>}</section>
    <p className="security-note">Invitations authorize access but do not send email by themselves. Share the public gallery link with the collaborator; Supabase sends the one-time sign-in link when they request it.</p>
    <div className="modal-actions"><button className="button" type="button" onClick={onClose}>Done</button></div>
  </Modal>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const focusable = dialog?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, button:not([disabled]), a[href]');
    focusable?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>('input:not([type="hidden"]), textarea, button:not([disabled]), a[href]')];
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal ${wide ? 'modal-wide' : ''}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="modal-head"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog">×</button></div>{children}</div></div>;
}

function Lightbox({ photo, hasMultiple, onClose, onStep }: { photo: GalleryPhoto; hasMultiple: boolean; onClose: () => void; onStep: (direction: -1 | 1) => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if (event.key === 'ArrowLeft') onStep(-1); if (event.key === 'ArrowRight') onStep(1); if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.caption || photo.filename}><button className="lightbox-close" type="button" onClick={onClose} aria-label="Close photo">×</button>{hasMultiple && <button className="lightbox-prev" type="button" onClick={() => onStep(-1)} aria-label="Previous photo">‹</button>}<figure><img src={photo.imageUrl} alt={photo.caption || 'Project build photo'} /><figcaption><p>{photo.caption || 'No description yet.'}</p><span>{formatDate(photo.addedAt)}{photo.tags.length ? ` · ${photo.tags.map((item) => `#${item}`).join(' ')}` : ''}</span></figcaption></figure>{hasMultiple && <button className="lightbox-next" type="button" onClick={() => onStep(1)} aria-label="Next photo">›</button>}</div>;
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong.'; }
function formatDate(value: number) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(value); }
function formatBytes(value: number) { return value < 1_000_000 ? `${Math.max(1, Math.round(value / 1000))} KB` : `${(value / 1_000_000).toFixed(1)} MB`; }
