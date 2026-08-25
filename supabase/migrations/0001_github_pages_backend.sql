-- Project Gallery: Supabase backend for a static GitHub Pages frontend.
-- Apply this file in the Supabase SQL editor before configuring the frontend.

create table if not exists public.gallery_settings (
  id smallint primary key default 1 check (id = 1),
  title text not null check (char_length(title) between 1 and 80),
  subtitle text not null default '' check (char_length(subtitle) <= 220),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_meta (
  id smallint primary key default 1 check (id = 1),
  revision bigint not null default 0 check (revision >= 0)
);

create table if not exists public.editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(trim(email)) and char_length(email) <= 254),
  display_name text not null check (char_length(display_name) between 1 and 120),
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create unique index if not exists editors_single_owner
  on public.editors ((role)) where role = 'owner';

create table if not exists public.editor_invites (
  email text primary key check (email = lower(trim(email)) and char_length(email) <= 254),
  invited_by uuid not null references public.editors(user_id) on delete cascade,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  check (expires_at > invited_at)
);

create table if not exists public.photos (
  id uuid primary key,
  storage_path text not null unique check (char_length(storage_path) <= 180),
  filename text not null check (char_length(filename) between 1 and 120),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  byte_size integer not null check (byte_size between 1 and 8388608),
  caption text not null default '' check (char_length(caption) <= 600),
  added_at timestamptz not null default now(),
  added_by uuid not null references public.editors(user_id),
  position integer not null check (position >= 0),
  deleted_at timestamptz,
  version integer not null default 1 check (version >= 1)
);

create index if not exists photos_active_position on public.photos(position) where deleted_at is null;
create index if not exists photos_deleted_at on public.photos(deleted_at);

create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 28 and tag = lower(trim(tag))),
  primary key (photo_id, tag)
);

create index if not exists photo_tags_tag on public.photo_tags(tag, photo_id);

create table if not exists public.upload_consents (
  photo_id uuid primary key references public.photos(id) on delete cascade,
  user_id uuid not null references public.editors(user_id),
  policy_version text not null,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  target text not null default '' check (char_length(target) <= 254),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at on public.audit_events(created_at desc);

insert into public.gallery_settings (id, title, subtitle)
values (1, 'Project Gallery', 'A secure, shared log of builds, breakthroughs, and the work between.')
on conflict (id) do nothing;

insert into public.gallery_meta (id, revision)
values (1, 0)
on conflict (id) do nothing;

create or replace function public.is_gallery_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.editors where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_gallery_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.editors where user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Run this from the SQL editor after the owner has signed in once.
-- It is intentionally not executable by browser roles.
create or replace function public.bootstrap_gallery_owner(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  owner_user auth.users%rowtype;
begin
  if exists (select 1 from public.editors where role = 'owner') then
    raise exception 'The gallery already has an owner.';
  end if;

  select * into owner_user from auth.users where lower(email) = normalized_email limit 1;
  if owner_user.id is null then
    raise exception 'Sign in with this email once before bootstrapping the owner.';
  end if;

  insert into public.editors (user_id, email, display_name, role)
  values (
    owner_user.id,
    normalized_email,
    coalesce(nullif(trim(owner_user.raw_user_meta_data ->> 'display_name'), ''), split_part(normalized_email, '@', 1)),
    'owner'
  );
  insert into public.audit_events (actor_user_id, action, target)
  values (owner_user.id, 'owner.bootstrapped', normalized_email);
end;
$$;

create or replace function public.accept_editor_invite()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text := lower(trim(coalesce((select auth.jwt() ->> 'email'), '')));
  invite public.editor_invites%rowtype;
  display_name text;
begin
  if current_user_id is null or current_email = '' then return false; end if;
  if exists (select 1 from public.editors where user_id = current_user_id) then return true; end if;

  select * into invite from public.editor_invites
    where email = current_email and expires_at > now()
    for update;
  if invite.email is null then return false; end if;

  display_name := coalesce(
    nullif(trim((select raw_user_meta_data ->> 'display_name' from auth.users where id = current_user_id)), ''),
    split_part(current_email, '@', 1)
  );
  insert into public.editors (user_id, email, display_name, role)
  values (current_user_id, current_email, display_name, 'editor');
  delete from public.editor_invites where email = current_email;
  insert into public.audit_events (actor_user_id, action, target)
  values (current_user_id, 'editor.accepted', current_email);
  return true;
end;
$$;

create or replace function public.invite_gallery_editor(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
begin
  if not public.is_gallery_owner() then raise exception 'Only the gallery owner can invite editors.'; end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(normalized_email) > 254 then
    raise exception 'Enter a valid email address.';
  end if;
  if exists (select 1 from public.editors where email = normalized_email) then
    raise exception 'That email already has editor access.';
  end if;

  insert into public.editor_invites (email, invited_by, invited_at, expires_at)
  values (normalized_email, (select auth.uid()), now(), now() + interval '30 days')
  on conflict (email) do update set invited_by = excluded.invited_by, invited_at = excluded.invited_at, expires_at = excluded.expires_at;
  insert into public.audit_events (actor_user_id, action, target)
  values ((select auth.uid()), 'editor.invited', normalized_email);
end;
$$;

create or replace function public.revoke_gallery_editor_invite(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare normalized_email text := lower(trim(p_email));
begin
  if not public.is_gallery_owner() then raise exception 'Only the gallery owner can revoke invitations.'; end if;
  delete from public.editor_invites where email = normalized_email;
  insert into public.audit_events (actor_user_id, action, target)
  values ((select auth.uid()), 'editor.invite_revoked', normalized_email);
end;
$$;

create or replace function public.remove_gallery_editor(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare removed_email text;
begin
  if not public.is_gallery_owner() then raise exception 'Only the gallery owner can remove editors.'; end if;
  delete from public.editors where user_id = p_user_id and role = 'editor' returning email into removed_email;
  if removed_email is null then raise exception 'That editor does not exist or cannot be removed.'; end if;
  insert into public.audit_events (actor_user_id, action, target)
  values ((select auth.uid()), 'editor.removed', removed_email);
end;
$$;

create or replace function public.update_gallery_settings(p_title text, p_subtitle text, p_expected_revision bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  if char_length(trim(p_title)) not between 1 and 80 or char_length(p_subtitle) > 220 then raise exception 'Invalid gallery settings.'; end if;
  update public.gallery_meta set revision = revision + 1 where id = 1 and revision = p_expected_revision;
  if not found then raise exception 'The gallery changed in another session. Refresh and try again.'; end if;
  update public.gallery_settings set title = trim(p_title), subtitle = trim(p_subtitle), updated_at = now() where id = 1;
  insert into public.audit_events (actor_user_id, action) values ((select auth.uid()), 'settings.updated');
end;
$$;

create or replace function public.create_gallery_photo(
  p_photo_id uuid,
  p_storage_path text,
  p_filename text,
  p_content_type text,
  p_byte_size integer,
  p_caption text,
  p_tags text[],
  p_policy_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  if p_policy_version <> '2026-08-25' then raise exception 'Accept the current upload terms.'; end if;
  if p_content_type not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') or p_byte_size not between 1 and 8388608 then raise exception 'Invalid image.'; end if;
  if p_storage_path !~ ('^photos/' || p_photo_id::text || '\.(jpg|png|webp|gif)$') then raise exception 'Invalid storage path.'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'gallery-images' and name = p_storage_path and owner_id = (select auth.uid())::text) then
    raise exception 'The uploaded image is missing or is not owned by this account.';
  end if;

  insert into public.photos (id, storage_path, filename, content_type, byte_size, caption, added_by, position)
  values (p_photo_id, p_storage_path, left(p_filename, 120), p_content_type, p_byte_size, left(trim(p_caption), 600), (select auth.uid()), coalesce((select max(position) + 1 from public.photos where deleted_at is null), 0));
  insert into public.photo_tags (photo_id, tag)
    select p_photo_id, tag from (
      select distinct lower(trim(item.value)) as tag
      from unnest(coalesce(p_tags, array[]::text[])) as item(value)
      where char_length(trim(item.value)) between 1 and 28 and trim(item.value) ~ '^[[:alnum:] _-]+$'
      limit 8
    ) cleaned;
  insert into public.upload_consents (photo_id, user_id, policy_version) values (p_photo_id, (select auth.uid()), p_policy_version);
  update public.gallery_meta set revision = revision + 1 where id = 1;
  insert into public.audit_events (actor_user_id, action, target) values ((select auth.uid()), 'photo.created', p_photo_id::text);
end;
$$;

create or replace function public.update_gallery_photo(p_photo_id uuid, p_caption text, p_tags text[], p_expected_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  update public.photos set caption = left(trim(p_caption), 600), version = version + 1
    where id = p_photo_id and version = p_expected_version and deleted_at is null;
  if not found then raise exception 'This photo changed in another session. Refresh and try again.'; end if;
  delete from public.photo_tags where photo_id = p_photo_id;
  insert into public.photo_tags (photo_id, tag)
    select p_photo_id, tag from (
      select distinct lower(trim(item.value)) as tag
      from unnest(coalesce(p_tags, array[]::text[])) as item(value)
      where char_length(trim(item.value)) between 1 and 28 and trim(item.value) ~ '^[[:alnum:] _-]+$'
      limit 8
    ) cleaned;
  update public.gallery_meta set revision = revision + 1 where id = 1;
  insert into public.audit_events (actor_user_id, action, target) values ((select auth.uid()), 'photo.updated', p_photo_id::text);
end;
$$;

create or replace function public.soft_delete_gallery_photo(p_photo_id uuid, p_expected_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  update public.photos set deleted_at = now(), version = version + 1 where id = p_photo_id and version = p_expected_version and deleted_at is null;
  if not found then raise exception 'This photo changed in another session. Refresh and try again.'; end if;
  update public.gallery_meta set revision = revision + 1 where id = 1;
  insert into public.audit_events (actor_user_id, action, target) values ((select auth.uid()), 'photo.deleted', p_photo_id::text);
end;
$$;

create or replace function public.restore_gallery_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  update public.photos set deleted_at = null, position = coalesce((select max(position) + 1 from public.photos where deleted_at is null), 0), version = version + 1
    where id = p_photo_id and deleted_at is not null;
  if not found then raise exception 'That photo is no longer restorable.'; end if;
  update public.gallery_meta set revision = revision + 1 where id = 1;
  insert into public.audit_events (actor_user_id, action, target) values ((select auth.uid()), 'photo.restored', p_photo_id::text);
end;
$$;

create or replace function public.reorder_gallery_photos(p_photo_ids uuid[], p_expected_revision bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare current_ids uuid[];
begin
  if not public.is_gallery_editor() then raise exception 'Editor access is required.'; end if;
  select coalesce(array_agg(id order by position, added_at desc), array[]::uuid[]) into current_ids from public.photos where deleted_at is null;
  if cardinality(current_ids) <> cardinality(p_photo_ids)
     or cardinality(p_photo_ids) <> (select count(distinct value) from unnest(p_photo_ids) as value)
     or not (current_ids @> p_photo_ids and p_photo_ids @> current_ids) then
    raise exception 'The gallery changed. Refresh and try again.';
  end if;
  update public.gallery_meta set revision = revision + 1 where id = 1 and revision = p_expected_revision;
  if not found then raise exception 'The gallery changed in another session. Refresh and try again.'; end if;
  update public.photos as photo set position = ordered.ordinality - 1
    from unnest(p_photo_ids) with ordinality as ordered(id, ordinality)
    where photo.id = ordered.id and photo.deleted_at is null;
  insert into public.audit_events (actor_user_id, action) values ((select auth.uid()), 'photos.reordered');
end;
$$;

alter table public.gallery_settings enable row level security;
alter table public.gallery_meta enable row level security;
alter table public.editors enable row level security;
alter table public.editor_invites enable row level security;
alter table public.photos enable row level security;
alter table public.photo_tags enable row level security;
alter table public.upload_consents enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.gallery_settings, public.gallery_meta, public.editors, public.editor_invites, public.photos, public.photo_tags, public.upload_consents, public.audit_events from anon, authenticated;
grant select on public.gallery_settings, public.gallery_meta, public.photos, public.photo_tags to anon, authenticated;
grant select on public.editors, public.editor_invites, public.audit_events to authenticated;

create policy "Public reads gallery settings" on public.gallery_settings for select to anon, authenticated using (true);
create policy "Public reads gallery revision" on public.gallery_meta for select to anon, authenticated using (true);
create policy "Public reads active photos" on public.photos for select to anon, authenticated using (deleted_at is null);
create policy "Public reads active photo tags" on public.photo_tags for select to anon, authenticated using (
  exists (select 1 from public.photos where photos.id = photo_tags.photo_id and photos.deleted_at is null)
);
create policy "Users read own editor role and owners read roster" on public.editors for select to authenticated using (
  user_id = (select auth.uid()) or public.is_gallery_owner()
);
create policy "Owners and invited addresses read invitations" on public.editor_invites for select to authenticated using (
  public.is_gallery_owner() or email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
);
create policy "Owners read audit events" on public.audit_events for select to authenticated using (public.is_gallery_owner());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Editors upload gallery images" on storage.objects for insert to authenticated with check (
  bucket_id = 'gallery-images'
  and public.is_gallery_editor()
  and (storage.foldername(name))[1] = 'photos'
  and owner_id = (select auth.uid())::text
);
create policy "Visitors read active gallery images" on storage.objects for select to anon, authenticated using (
  bucket_id = 'gallery-images'
  and exists (select 1 from public.photos where photos.storage_path = storage.objects.name and photos.deleted_at is null)
);
create policy "Editors read their own gallery uploads" on storage.objects for select to authenticated using (
  bucket_id = 'gallery-images' and public.is_gallery_editor() and owner_id = (select auth.uid())::text
);
create policy "Editors delete their failed gallery uploads" on storage.objects for delete to authenticated using (
  bucket_id = 'gallery-images' and public.is_gallery_editor() and owner_id = (select auth.uid())::text
);

revoke execute on function public.bootstrap_gallery_owner(text) from public, anon, authenticated;
revoke execute on function public.is_gallery_editor() from public;
revoke execute on function public.is_gallery_owner() from public;
revoke execute on function public.accept_editor_invite() from public;
revoke execute on function public.invite_gallery_editor(text) from public;
revoke execute on function public.revoke_gallery_editor_invite(text) from public;
revoke execute on function public.remove_gallery_editor(uuid) from public;
revoke execute on function public.update_gallery_settings(text, text, bigint) from public;
revoke execute on function public.create_gallery_photo(uuid, text, text, text, integer, text, text[], text) from public;
revoke execute on function public.update_gallery_photo(uuid, text, text[], integer) from public;
revoke execute on function public.soft_delete_gallery_photo(uuid, integer) from public;
revoke execute on function public.restore_gallery_photo(uuid) from public;
revoke execute on function public.reorder_gallery_photos(uuid[], bigint) from public;

grant execute on function public.is_gallery_editor(), public.is_gallery_owner(), public.accept_editor_invite(), public.invite_gallery_editor(text), public.revoke_gallery_editor_invite(text), public.remove_gallery_editor(uuid), public.update_gallery_settings(text, text, bigint), public.create_gallery_photo(uuid, text, text, text, integer, text, text[], text), public.update_gallery_photo(uuid, text, text[], integer), public.soft_delete_gallery_photo(uuid, integer), public.restore_gallery_photo(uuid), public.reorder_gallery_photos(uuid[], bigint) to authenticated;
