-- Materialele pot fi și documente Word (.docx), PowerPoint (.pptx) și text (.txt), pe lângă PDF și poze.
-- Textul lor se extrage pe pagini în material_pages, ca la PDF (un slide = o pagină).

alter table public.materials drop constraint if exists materials_mime_type_check;
alter table public.materials add constraint materials_mime_type_check check (mime_type in (
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
));

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id = 'materials';
