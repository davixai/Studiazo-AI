-- StudIA — schema inițială (MVP)
-- Reguli: nu modifica această migrație după ce a fost aplicată. Orice schimbare = migrație nouă.
-- Toate tabelele private au RLS activ; accesul se face numai pentru auth.uid().

-- ─────────────────────────────────────────────────────────────
-- Tipuri
-- ─────────────────────────────────────────────────────────────
create type public.event_kind as enum (
  'curs', 'seminar', 'laborator', 'studiu', 'job', 'sport', 'personal', 'pauza'
);

create type public.recurrence_kind as enum ('none', 'weekly', 'biweekly');

create type public.task_kind as enum ('tema', 'proiect', 'examen', 'colocviu', 'test', 'altul');

create type public.material_status as enum (
  'incarcat', 'in_procesare', 'procesat', 'fara_text', 'esuat'
);

create type public.proposal_kind as enum ('task', 'study_sessions');

create type public.proposal_status as enum ('pending', 'confirmed', 'rejected', 'expired');

create type public.preferred_time as enum ('dimineata', 'pranz', 'dupa_amiaza', 'seara', 'fara_preferinta');

-- ─────────────────────────────────────────────────────────────
-- Utilitare
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Profiluri (1:1 cu auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  university text check (char_length(university) <= 160),
  faculty text check (char_length(faculty) <= 160),
  specialization text check (char_length(specialization) <= 160),
  study_year smallint check (study_year between 1 and 6),
  city text not null default 'Iași' check (char_length(city) <= 80),
  timezone text not null default 'Europe/Bucharest',
  preferred_time public.preferred_time not null default 'fara_preferinta',
  session_minutes smallint not null default 50 check (session_minutes between 15 and 180),
  daily_study_limit_minutes smallint not null default 180 check (daily_study_limit_minutes between 30 and 720),
  -- [{ "weekday": 1-7 (ISO, 1 = luni), "start": "HH:MM", "end": "HH:MM" }], validat în aplicație (Zod)
  availability jsonb not null default '[]'::jsonb check (jsonb_typeof(availability) = 'array'),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profil creat automat la înregistrare.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Materii
-- ─────────────────────────────────────────────────────────────
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  color text not null default 'blue'
    check (color in ('blue', 'teal', 'green', 'amber', 'rose', 'violet', 'slate')),
  professor text check (char_length(professor) <= 120),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subjects_user_name_unique on public.subjects (user_id, lower(btrim(name)));
create index subjects_user_idx on public.subjects (user_id);

create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

-- Helper pentru politici: materia aparține utilizatorului curent (sau lipsește).
create or replace function public.owns_subject(p_subject_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select p_subject_id is null
    or exists (select 1 from public.subjects s where s.id = p_subject_id and s.user_id = (select auth.uid()));
$$;

-- ─────────────────────────────────────────────────────────────
-- Propuneri AI (create de server, confirmate de student)
-- ─────────────────────────────────────────────────────────────
create table public.ai_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conversation_id uuid,
  kind public.proposal_kind not null,
  -- Conținut validat cu src/lib/contracts/proposals.ts înainte de inserare și din nou la confirmare.
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  resolved_at timestamptz
);

create index ai_proposals_user_idx on public.ai_proposals (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Calendar: activități (inclusiv ore recurente)
-- starts_at/ends_at = prima apariție. Recurența se extinde în aplicație,
-- păstrând ora locală din `timezone` (corect la schimbarea orei).
-- ─────────────────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  kind public.event_kind not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  location text check (char_length(location) <= 160),
  notes text check (char_length(notes) <= 4000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Bucharest',
  recurrence public.recurrence_kind not null default 'none',
  recurrence_until date,
  excluded_dates date[] not null default '{}',
  completed_at timestamptz,
  proposal_id uuid references public.ai_proposals (id) on delete set null,
  proposal_item_index smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at),
  constraint events_max_duration check (ends_at - starts_at <= interval '24 hours'),
  constraint events_recurrence_until check (recurrence <> 'none' or recurrence_until is null),
  constraint events_proposal_item check ((proposal_id is null) = (proposal_item_index is null))
);

-- Previne salvarea dublă a aceleiași propuneri (reîncercări / dublu-click).
create unique index events_proposal_item_unique on public.events (proposal_id, proposal_item_index)
  where proposal_id is not null;
create index events_user_time_idx on public.events (user_id, starts_at);
create index events_user_recurring_idx on public.events (user_id) where recurrence <> 'none';

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Teme, proiecte, examene (termene)
-- ─────────────────────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  kind public.task_kind not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  notes text check (char_length(notes) <= 4000),
  location text check (char_length(location) <= 160),
  due_at timestamptz not null,
  -- Pentru examene: durata probei, dacă e cunoscută.
  duration_minutes smallint check (duration_minutes between 5 and 600),
  estimated_minutes smallint check (estimated_minutes between 5 and 6000),
  completed_at timestamptz,
  proposal_id uuid references public.ai_proposals (id) on delete set null,
  proposal_item_index smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_proposal_item check ((proposal_id is null) = (proposal_item_index is null))
);

create unique index tasks_proposal_item_unique on public.tasks (proposal_id, proposal_item_index)
  where proposal_id is not null;
create index tasks_user_due_idx on public.tasks (user_id, due_at) where completed_at is null;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Notițe și materiale
-- ─────────────────────────────────────────────────────────────
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  topic text check (char_length(topic) <= 120),
  content text not null default '' check (char_length(content) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_subject_idx on public.notes (subject_id, updated_at desc);

create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  topic text check (char_length(topic) <= 120),
  -- Cale în bucketul privat `materials`: {user_id}/{subject_id}/{material_id}.{pdf|jpg|png|webp}
  storage_path text not null unique,
  -- PDF cu text selectabil sau fotografie (tablă, caiet, exercițiu) citită de AI.
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  page_count integer check (page_count >= 0),
  status public.material_status not null default 'incarcat',
  status_message text check (char_length(status_message) <= 500),
  studied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materials_path_owner check (split_part(storage_path, '/', 1) = user_id::text)
);

create index materials_subject_idx on public.materials (subject_id, created_at desc);

create trigger materials_updated_at before update on public.materials
  for each row execute function public.set_updated_at();

-- Text extras pe pagini (salvat o singură dată, folosit pentru citări „pagina N”).
create table public.material_pages (
  material_id uuid not null references public.materials (id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content text not null check (char_length(content) <= 40000),
  primary key (material_id, page_number)
);

create index material_pages_user_idx on public.material_pages (user_id);

-- ─────────────────────────────────────────────────────────────
-- Asistent: conversații și mesaje
-- ─────────────────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null default 'Conversație nouă' check (char_length(title) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_idx on public.conversations (user_id, updated_at desc);

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.ai_proposals
  add constraint ai_proposals_conversation_fk
  foreign key (conversation_id) references public.conversations (id) on delete set null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  -- { citations?: [{materialId, page}], proposalIds?: uuid[], quizId?: uuid }
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Teste grilă și încercări
-- ─────────────────────────────────────────────────────────────
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(title) <= 160),
  material_ids uuid[] not null default '{}',
  -- Validat cu QuizSchema din src/lib/contracts/quiz.ts
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  created_at timestamptz not null default now()
);

create index quizzes_subject_idx on public.quizzes (subject_id, created_at desc);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  -- Cât a durat rezolvarea (pentru „timp de învățare” și streak).
  duration_seconds integer check (duration_seconds between 0 and 86400),
  -- { [topic]: { correct, total } } — folosit de planificare
  topic_breakdown jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index quiz_attempts_user_idx on public.quiz_attempts (user_id, completed_at desc);

-- ─────────────────────────────────────────────────────────────
-- Consum AI (limite per utilizator și evidența costurilor)
-- ─────────────────────────────────────────────────────────────
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('chat', 'quiz', 'plan', 'summary')),
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  ok boolean not null default true,
  created_at timestamptz not null default now()
);

create index ai_usage_user_time_idx on public.ai_usage (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.ai_proposals enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.materials enable row level security;
alter table public.material_pages enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: profilul se creează prin trigger și se șterge odată cu contul.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- subjects
create policy "subjects_all_own" on public.subjects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- events / tasks: materia asociată trebuie să fie tot a utilizatorului.
create policy "events_all_own" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

create policy "tasks_all_own" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

-- notes / materials
create policy "notes_all_own" on public.notes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

create policy "materials_all_own" on public.materials
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

create policy "material_pages_all_own" on public.material_pages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.materials m where m.id = material_id and m.user_id = (select auth.uid()))
  );

-- conversations / messages
create policy "conversations_all_own" on public.conversations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

create policy "messages_select_own" on public.messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "messages_insert_own" on public.messages
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
create policy "messages_delete_own" on public.messages
  for delete to authenticated using (user_id = (select auth.uid()));

-- ai_proposals: create și citite de utilizator; starea se schimbă doar prin confirmare/respingere.
create policy "ai_proposals_select_own" on public.ai_proposals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_proposals_insert_own" on public.ai_proposals
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy "ai_proposals_update_own" on public.ai_proposals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- quizzes / attempts
create policy "quizzes_all_own" on public.quizzes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_subject(subject_id));

create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = (select auth.uid()))
  );

-- ai_usage: doar citire și inserare (fără update/delete, ca limitele să nu poată fi ocolite).
create policy "ai_usage_select_own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_usage_insert_own" on public.ai_usage
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- Storage: bucket privat pentru materiale (max. 20 MB; PDF și fotografii JPEG/PNG/WebP)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "materials_storage_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials_storage_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ─────────────────────────────────────────────────────────────
-- Ștergerea contului (fără cheia service role)
-- Fișierele din Storage se șterg din aplicație înainte de apel.
-- ─────────────────────────────────────────────────────────────
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
