-- Match the proof upload formats accepted by the public and admin booking forms.
update storage.buckets
set allowed_mime_types = array[
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf'
]
where id = 'dp-proofs';
