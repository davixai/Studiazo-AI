-- Configurarea inițială pe pași (/bun-venit): vârsta și ce îl ajută pe student să învețe.
-- Coloanele sunt opționale; aplicația funcționează și înainte ca migrația să fie aplicată (le ignoră la salvare).

alter table public.profiles
  add column age smallint check (age between 15 and 99),
  add column study_need text check (study_need in ('examene', 'teme', 'note', 'organizare')),
  add column study_worry text check (study_worry in ('inceput', 'volum', 'explicatii', 'timp', 'promovare')),
  add column study_goal text check (study_goal in ('promovare', 'nota_buna', 'nota_maxima'));

comment on column public.profiles.age is 'Vârsta declarată la configurare (opțională).';
comment on column public.profiles.study_need is 'De ce are nevoie studentul cel mai mult acum.';
comment on column public.profiles.study_worry is 'Ce îl îngrijorează cel mai mult.';
comment on column public.profiles.study_goal is 'Obiectivul de notă.';
