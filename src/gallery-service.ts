import type { User } from '@supabase/supabase-js';
import type { GalleryPhoto, GallerySnapshot, ViewerState } from '@/lib/types';
import { cleanTags, cleanText, isSupportedImage, MAX_UPLOAD_BYTES, safeFilename } from '@/lib/validation';
import { LEGAL_POLICY_VERSION } from '@/lib/legal-shared';
import { supabase, throwIfUnconfigured } from './supabase';

const IMAGE_BUCKET = 'gallery-images';
const SIGNED_IMAGE_URL_LIFETIME_SECONDS = 60 * 60;

type SettingsRow = { title: string; subtitle: string };
type MetaRow = { revision: number };
type PhotoRow = {
  id: string;
  storage_path: string;
  filename: string;
  content_type: string;
  byte_size: number;
  caption: string;
  added_at: string;
  position: number;
  version: number;
};
type TagRow = { photo_id: string; tag: string };

export type Collaborator = {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'editor';
  createdAt: string;
};

export type CollaboratorInvite = {
  email: string;
  invitedAt: string;
  expiresAt: string;
};

export async function getGallerySnapshot(): Promise<GallerySnapshot> {
  throwIfUnconfigured();
  const [settingsResult, metaResult, photosResult, tagsResult] = await Promise.all([
    supabase.from('gallery_settings').select('title, subtitle').eq('id', 1).single(),
    supabase.from('gallery_meta').select('revision').eq('id', 1).single(),
    supabase.from('photos').select('id, storage_path, filename, content_type, byte_size, caption, added_at, position, version').is('deleted_at', null).order('position').order('added_at', { ascending: false }),
    supabase.from('photo_tags').select('photo_id, tag').order('tag'),
  ]);
  throwDataError(settingsResult.error);
  throwDataError(metaResult.error);
  throwDataError(photosResult.error);
  throwDataError(tagsResult.error);

  const settings = settingsResult.data as SettingsRow;
  const meta = metaResult.data as MetaRow;
  const photoRows = (photosResult.data ?? []) as PhotoRow[];
  const signedUrls = photoRows.length
    ? await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(photoRows.map((row) => row.storage_path), SIGNED_IMAGE_URL_LIFETIME_SECONDS)
    : { data: [], error: null };
  throwDataError(signedUrls.error);
  const imageUrls = new Map((signedUrls.data ?? []).map((item) => [item.path, item.signedUrl]));
  const tagsByPhoto = new Map<string, string[]>();
  for (const row of (tagsResult.data ?? []) as TagRow[]) {
    const tags = tagsByPhoto.get(row.photo_id) ?? [];
    tags.push(row.tag);
    tagsByPhoto.set(row.photo_id, tags);
  }

  return {
    settings,
    revision: Number(meta.revision),
    photos: photoRows.map((row): GalleryPhoto => ({
      id: row.id,
      caption: row.caption,
      filename: row.filename,
      contentType: row.content_type,
      byteSize: row.byte_size,
      addedAt: new Date(row.added_at).getTime(),
      position: row.position,
      version: row.version,
      tags: tagsByPhoto.get(row.id) ?? [],
      imageUrl: imageUrls.get(row.storage_path) ?? '',
    })),
  };
}

export async function getViewerState(acceptInvite = true): Promise<ViewerState> {
  throwIfUnconfigured();
  const { data: { user }, error } = await supabase.auth.getUser();
  throwDataError(error);
  if (!user) return signedOutViewer;

  if (acceptInvite) {
    const { error: acceptError } = await supabase.rpc('accept_editor_invite');
    throwDataError(acceptError);
  }

  const { data: editor, error: editorError } = await supabase
    .from('editors')
    .select('role, display_name, email')
    .eq('user_id', user.id)
    .maybeSingle();
  throwDataError(editorError);
  const role = editor?.role === 'owner' || editor?.role === 'editor' ? editor.role : null;
  return {
    isSignedIn: true,
    isEditor: Boolean(role),
    isOwner: role === 'owner',
    canClaimOwnership: false,
    displayName: editor?.display_name || userDisplayName(user),
    email: editor?.email || user.email || null,
  };
}

export async function sendEmailSignInLink(email: string): Promise<void> {
  throwIfUnconfigured();
  const normalized = normalizeEmail(email);
  const redirectTo = new URL('.', window.location.href);
  redirectTo.hash = '';
  redirectTo.search = '';
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirectTo.toString(), shouldCreateUser: true },
  });
  throwDataError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  throwDataError(error);
}

export async function updateSettings(title: string, subtitle: string, expectedRevision: number) {
  const { error } = await supabase.rpc('update_gallery_settings', {
    p_title: cleanText(title, 80),
    p_subtitle: cleanText(subtitle, 220),
    p_expected_revision: expectedRevision,
  });
  throwDataError(error);
  return getGallerySnapshot();
}

export async function updatePhoto(photoId: string, caption: string, tags: string, expectedVersion: number) {
  const { error } = await supabase.rpc('update_gallery_photo', {
    p_photo_id: photoId,
    p_caption: cleanText(caption, 600),
    p_tags: cleanTags(tags),
    p_expected_version: expectedVersion,
  });
  throwDataError(error);
  return getGallerySnapshot();
}

export async function reorderPhotos(ids: string[], expectedRevision: number) {
  const { error } = await supabase.rpc('reorder_gallery_photos', {
    p_photo_ids: ids,
    p_expected_revision: expectedRevision,
  });
  throwDataError(error);
  return getGallerySnapshot();
}

export async function removePhoto(photoId: string, expectedVersion: number) {
  const { error } = await supabase.rpc('soft_delete_gallery_photo', {
    p_photo_id: photoId,
    p_expected_version: expectedVersion,
  });
  throwDataError(error);
  return getGallerySnapshot();
}

export async function restorePhoto(photoId: string) {
  const { error } = await supabase.rpc('restore_gallery_photo', { p_photo_id: photoId });
  throwDataError(error);
  return getGallerySnapshot();
}

export async function uploadPhoto(
  file: File,
  caption: string,
  tags: string,
  rightsConfirmed: boolean,
  onProgress: (progress: number) => void,
) {
  if (!rightsConfirmed) throw new Error('Confirm that you have permission to upload this image.');
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) throw new Error('Images must be 8 MB or smaller.');
  const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!isSupportedImage(signature, file.type)) throw new Error('Use a valid JPEG, PNG, WebP, or GIF image.');

  const id = crypto.randomUUID();
  const extension = extensionFor(file.type);
  const storagePath = `photos/${id}.${extension}`;
  onProgress(15);
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(storagePath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  throwDataError(uploadError);
  onProgress(75);

  const { error: createError } = await supabase.rpc('create_gallery_photo', {
    p_photo_id: id,
    p_storage_path: storagePath,
    p_filename: safeFilename(file.name),
    p_content_type: file.type,
    p_byte_size: file.size,
    p_caption: cleanText(caption, 600),
    p_tags: cleanTags(tags),
    p_policy_version: LEGAL_POLICY_VERSION,
  });
  if (createError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]).catch(() => undefined);
    throwDataError(createError);
  }
  onProgress(100);
  return getGallerySnapshot();
}

export async function listCollaborators(): Promise<{ collaborators: Collaborator[]; invites: CollaboratorInvite[] }> {
  const [editorsResult, invitesResult] = await Promise.all([
    supabase.from('editors').select('user_id, email, display_name, role, created_at').order('created_at'),
    supabase.from('editor_invites').select('email, invited_at, expires_at').order('invited_at', { ascending: false }),
  ]);
  throwDataError(editorsResult.error);
  throwDataError(invitesResult.error);
  return {
    collaborators: (editorsResult.data ?? []).map((row) => ({
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role as 'owner' | 'editor',
      createdAt: row.created_at,
    })),
    invites: (invitesResult.data ?? []).map((row) => ({
      email: row.email,
      invitedAt: row.invited_at,
      expiresAt: row.expires_at,
    })),
  };
}

export async function inviteCollaborator(email: string): Promise<void> {
  const { error } = await supabase.rpc('invite_gallery_editor', { p_email: normalizeEmail(email) });
  throwDataError(error);
}

export async function removeCollaborator(userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_gallery_editor', { p_user_id: userId });
  throwDataError(error);
}

export async function revokeInvite(email: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_gallery_editor_invite', { p_email: normalizeEmail(email) });
  throwDataError(error);
}

export const signedOutViewer: ViewerState = {
  isSignedIn: false,
  isEditor: false,
  isOwner: false,
  canClaimOwnership: false,
  displayName: null,
  email: null,
};

function userDisplayName(user: User) {
  const value = user.user_metadata?.display_name ?? user.user_metadata?.name;
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : user.email?.split('@')[0] ?? 'Signed-in user';
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLocaleLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new Error('Enter a valid email address.');
  }
  return normalized;
}

function extensionFor(contentType: string) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[contentType] ?? 'img';
}

function throwDataError(error: { message: string } | null | undefined): asserts error is null | undefined {
  if (!error) return;
  const friendly = error.message
    .replace(/new row violates row-level security policy/gi, 'Your account is not authorized to make that change')
    .replace(/JWT expired/gi, 'Your sign-in expired. Sign in again');
  throw new Error(friendly);
}
