-- Buget: veniturile și cheltuielile lunare ale studentului (opțional).
-- Statisticile se calculează în aplicație; sfaturile AI se generează la cerere și nu se salvează.

create type public.finance_kind as enum ('venit', 'cheltuiala');

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.finance_kind not null,
  -- Lista oglindește src/features/finance/categories.ts.
  category text not null check (category in (
    'bursa', 'job', 'parinti', 'freelance', 'alte_venituri',
    'chirie', 'mancare', 'transport', 'facturi', 'facultate', 'sanatate',
    'iesiri', 'abonamente', 'cumparaturi', 'alte_cheltuieli'
  )),
  amount numeric(10, 2) not null check (amount > 0 and amount <= 1000000),
  note text check (char_length(note) <= 120),
  -- Prima zi a lunii (ex. 2026-10-01).
  month date not null check (extract(day from month) = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index finance_entries_user_month_idx on public.finance_entries (user_id, month);

create trigger finance_entries_updated_at before update on public.finance_entries
  for each row execute function public.set_updated_at();

alter table public.finance_entries enable row level security;

create policy "finance_entries_all_own" on public.finance_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sfaturile financiare intră în aceeași limită orară de cereri AI.
alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('chat', 'quiz', 'plan', 'summary', 'finance'));
