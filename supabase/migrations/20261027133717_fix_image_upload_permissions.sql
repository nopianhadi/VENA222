-- Keep public gallery assets within the formats and size the app supports.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'gallery-images';

-- Client and team avatar screens are permissioned in the app for signed-in users.
drop policy if exists "Authenticated users can upload client and team avatars" on storage.objects;

create policy "Authenticated users can upload client and team avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery-images'
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] in ('clients', 'team-members')
  and (storage.foldername(name))[2] = 'avatars'
);

-- Bio Link images are managed from the Admin-only Bio Links page.
drop policy if exists "Admins can upload bio link assets" on storage.objects;

create policy "Admins can upload bio link assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery-images'
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
  and (storage.foldername(name))[1] = 'bio-links'
  and (storage.foldername(name))[2] in ('avatar', 'cover')
  and exists (
    select 1
    from public.users as app_user
    where app_user.id = (select auth.uid())
      and app_user.role = 'Admin'
  )
);
