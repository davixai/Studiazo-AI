-- Studiazo AI — datele reale pentru raportul de business.
-- Se rulează în Supabase → SQL Editor (doar citire, fără conținutul mesajelor).
-- Întoarce un singur JSON: copiază celula rezultat și dă-i-o lui Claude.
-- Lunile sunt calculate pe fusul Europe/Bucharest. Ultimele 3 luni, inclusiv cea curentă.

with luni as (
  select date_trunc('month', (now() at time zone 'Europe/Bucharest') - make_interval(months => g)) as luna
  from generate_series(0, 2) as g
),
activitate as (
  select user_id, created_at as la from public.ai_usage
  union all select user_id, created_at from public.messages where role = 'user'
  union all select user_id, completed_at from public.quiz_attempts
  union all select user_id, created_at from public.materials
  union all select user_id, created_at from public.tasks
  union all select user_id, created_at from public.events
  union all select user_id, completed_at from public.tasks where completed_at is not null
  union all select user_id, completed_at from public.events where completed_at is not null
),
ai as (
  select date_trunc('month', created_at at time zone 'Europe/Bucharest') as luna,
         kind, model,
         count(*) as cereri,
         count(*) filter (where not ok) as esuate,
         count(distinct user_id) as utilizatori,
         sum(input_tokens) as tokeni_intrare,
         sum(output_tokens) as tokeni_iesire
  from public.ai_usage
  where created_at at time zone 'Europe/Bucharest' >= (select min(luna) from luni)
  group by 1, 2, 3
),
per_utilizator as (
  -- distribuția consumului: câți tokeni consumă utilizatorii mari față de cei obișnuiți
  select date_trunc('month', created_at at time zone 'Europe/Bucharest') as luna,
         user_id, sum(input_tokens) as intrare, sum(output_tokens) as iesire, count(*) as cereri
  from public.ai_usage
  where created_at at time zone 'Europe/Bucharest' >= (select min(luna) from luni)
  group by 1, 2
)
select jsonb_pretty(jsonb_build_object(
  'generat_la', to_char(now() at time zone 'Europe/Bucharest', 'YYYY-MM-DD HH24:MI'),
  'conturi_total', (select count(*) from auth.users),
  'luni', (
    select jsonb_agg(jsonb_build_object(
      'luna', to_char(l.luna, 'YYYY-MM'),
      'conturi_noi', (select count(*) from auth.users u
                      where date_trunc('month', u.created_at at time zone 'Europe/Bucharest') = l.luna),
      'onboarding_terminat', (select count(*) from public.profiles p
                      where date_trunc('month', p.onboarding_completed_at at time zone 'Europe/Bucharest') = l.luna),
      'utilizatori_activi', (select count(distinct a.user_id) from activitate a
                      where date_trunc('month', a.la at time zone 'Europe/Bucharest') = l.luna),
      'zile_active_medii', (select round(avg(z), 1) from (
                      select count(distinct (a.la at time zone 'Europe/Bucharest')::date) as z
                      from activitate a
                      where date_trunc('month', a.la at time zone 'Europe/Bucharest') = l.luna
                      group by a.user_id) s),
      'utilizatori_luna_trecuta_inca_activi', (select count(*) from (
                      select user_id from activitate
                      where date_trunc('month', la at time zone 'Europe/Bucharest') = l.luna - interval '1 month'
                      intersect
                      select user_id from activitate
                      where date_trunc('month', la at time zone 'Europe/Bucharest') = l.luna) r),
      'functii', jsonb_build_object(
        'mesaje_chat', (select count(*) from public.messages m where m.role = 'user'
                        and date_trunc('month', m.created_at at time zone 'Europe/Bucharest') = l.luna),
        'teste_completate', (select count(*) from public.quiz_attempts q
                        where date_trunc('month', q.completed_at at time zone 'Europe/Bucharest') = l.luna),
        'materiale_incarcate', (select count(*) from public.materials x
                        where date_trunc('month', x.created_at at time zone 'Europe/Bucharest') = l.luna),
        'propuneri_ai', (select count(*) from public.ai_proposals x
                        where date_trunc('month', x.created_at at time zone 'Europe/Bucharest') = l.luna),
        'propuneri_ai_confirmate', (select count(*) from public.ai_proposals x where x.status = 'confirmed'
                        and date_trunc('month', x.created_at at time zone 'Europe/Bucharest') = l.luna),
        'teme_create', (select count(*) from public.tasks x
                        where date_trunc('month', x.created_at at time zone 'Europe/Bucharest') = l.luna),
        'activitati_calendar', (select count(*) from public.events x
                        where date_trunc('month', x.created_at at time zone 'Europe/Bucharest') = l.luna)
      ),
      'ai', coalesce((select jsonb_agg(to_jsonb(ai) - 'luna') from ai where ai.luna = l.luna), '[]'::jsonb),
      'tokeni_per_utilizator', (select jsonb_build_object(
                      'median_intrare', percentile_cont(0.5) within group (order by intrare),
                      'median_iesire', percentile_cont(0.5) within group (order by iesire),
                      'p90_intrare', percentile_cont(0.9) within group (order by intrare),
                      'p90_iesire', percentile_cont(0.9) within group (order by iesire),
                      'max_intrare', max(intrare),
                      'max_iesire', max(iesire),
                      'max_cereri', max(cereri))
                      from per_utilizator pu where pu.luna = l.luna)
    ) order by l.luna desc)
    from luni l
  )
)) as raport;
