-- Asistentul te cunoaște:
-- 1. Memoria: lucruri pe care studentul i le spune în chat și care contează mai târziu
--    („lucrez sâmbăta”, „înțeleg mai bine cu exemple”). Le salvează asistentul; studentul le vede și le șterge în Profil.
-- 2. Mesajul zilei: asistentul scrie primul, o dată pe zi. Indexul unic oprește dublarea (două file deschise).

create table public.assistant_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 3 and 200),
  created_at timestamptz not null default now()
);

create index assistant_memories_user_idx on public.assistant_memories (user_id, created_at desc);

alter table public.assistant_memories enable row level security;

create policy "assistant_memories_select_own" on public.assistant_memories
  for select to authenticated using (user_id = (select auth.uid()));
create policy "assistant_memories_insert_own" on public.assistant_memories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "assistant_memories_delete_own" on public.assistant_memories
  for delete to authenticated using (user_id = (select auth.uid()));

create unique index messages_daily_unique on public.messages (user_id, (metadata ->> 'dailyDay'))
  where metadata ? 'dailyDay';
