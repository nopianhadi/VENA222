-- Public booking forms submit proof files before a client account exists.
-- Keep anonymous access limited to inserting supported files in dp-proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dp-proofs',
  'dp-proofs',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can upload payment proofs" on storage.objects;

create policy "Public can upload payment proofs"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'dp-proofs'
  and storage.extension(name) in ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);
