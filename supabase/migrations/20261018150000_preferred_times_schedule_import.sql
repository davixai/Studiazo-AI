-- 1. „Când te concentrezi cel mai bine?” acceptă mai multe momente ale zilei (listă goală = nu contează).
--    `preferred_time` rămâne (primul moment ales), pentru compatibilitate.
-- 2. Importul orarului din poză (/bun-venit) se numără în ai_usage cu tipul „orar”.

alter table public.profiles
  add column if not exists preferred_times text[] not null default '{}'
    check (preferred_times <@ array['dimineata', 'pranz', 'dupa_amiaza', 'seara']::text[]);

update public.profiles
  set preferred_times = array[preferred_time::text]
  where preferred_time <> 'fara_preferinta' and preferred_times = '{}';

comment on column public.profiles.preferred_times is 'Momentele zilei în care se concentrează cel mai bine (unul sau mai multe; gol = nu contează).';

alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage
  add constraint ai_usage_kind_check check (kind in ('chat', 'quiz', 'plan', 'summary', 'finance', 'orar'));
