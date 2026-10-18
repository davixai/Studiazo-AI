-- Configurarea pe pași (/bun-venit) permite acum mai multe nevoi și mai multe griji: coloanele devin liste.
-- Se poate rula singură: adaugă și coloanele din 20261017183100_profile_onboarding dacă lipsesc,
-- iar răspunsurile vechi (o singură alegere) trec în liste înainte ca vechile coloane să fie șterse.

alter table public.profiles
  add column if not exists age smallint check (age between 15 and 99),
  add column if not exists study_goal text check (study_goal in ('promovare', 'nota_buna', 'nota_maxima')),
  add column if not exists study_needs text[] not null default '{}'
    check (study_needs <@ array['examene', 'teme', 'note', 'organizare']::text[]),
  add column if not exists study_worries text[] not null default '{}'
    check (study_worries <@ array['inceput', 'volum', 'explicatii', 'timp', 'promovare']::text[]);

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'study_need') then
    update public.profiles set study_needs = array[study_need] where study_need is not null;
    alter table public.profiles drop column study_need;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'study_worry') then
    update public.profiles set study_worries = array[study_worry] where study_worry is not null;
    alter table public.profiles drop column study_worry;
  end if;
end $$;

comment on column public.profiles.age is 'Vârsta declarată la configurare (opțională).';
comment on column public.profiles.study_goal is 'Obiectivul de notă.';
comment on column public.profiles.study_needs is 'De ce are nevoie studentul cel mai mult acum (una sau mai multe).';
comment on column public.profiles.study_worries is 'Ce îl îngrijorează cel mai mult (una sau mai multe).';
