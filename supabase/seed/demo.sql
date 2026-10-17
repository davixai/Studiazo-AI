-- Date demonstrative (opționale), separate de migrații.
-- Rulează în SQL Editor DUPĂ ce ți-ai creat contul în aplicație.
-- Înlocuiește adresa de email de mai jos cu cea a contului tău de test.
-- Toate titlurile sunt marcate „(demo)” ca să nu fie confundate cu date reale.

do $$
declare
  v_uid uuid;
  v_math uuid;
  v_prog uuid;
  v_monday date := date_trunc('week', (now() at time zone 'Europe/Bucharest'))::date;
begin
  select id into v_uid from auth.users where email = 'student.test@exemplu.ro';
  if v_uid is null then
    raise exception 'Nu există utilizatorul de test. Creează contul în aplicație și actualizează emailul din script.';
  end if;

  insert into public.subjects (user_id, name, color, professor)
  values (v_uid, 'Analiză matematică (demo)', 'blue', null) returning id into v_math;
  insert into public.subjects (user_id, name, color, professor)
  values (v_uid, 'Programare orientată pe obiecte (demo)', 'violet', null) returning id into v_prog;

  insert into public.events (user_id, subject_id, kind, title, location, starts_at, ends_at, recurrence)
  values
    (v_uid, v_math, 'curs', 'Analiză matematică (demo)', 'Sala C2',
      ((v_monday + time '08:00') at time zone 'Europe/Bucharest'),
      ((v_monday + time '10:00') at time zone 'Europe/Bucharest'), 'weekly'),
    (v_uid, v_prog, 'laborator', 'Laborator POO (demo)', 'Laborator C409',
      ((v_monday + 2 + time '12:00') at time zone 'Europe/Bucharest'),
      ((v_monday + 2 + time '14:00') at time zone 'Europe/Bucharest'), 'biweekly'),
    (v_uid, null, 'job', 'Tură part-time (demo)', null,
      ((v_monday + 3 + time '16:00') at time zone 'Europe/Bucharest'),
      ((v_monday + 3 + time '20:00') at time zone 'Europe/Bucharest'), 'weekly');

  insert into public.tasks (user_id, subject_id, kind, title, due_at, duration_minutes)
  values
    (v_uid, v_math, 'examen', 'Examen parțial analiză (demo)',
      ((v_monday + 11 + time '10:00') at time zone 'Europe/Bucharest'), 120),
    (v_uid, v_prog, 'tema', 'Tema 2 — moștenire (demo)',
      ((v_monday + 7 + time '23:59') at time zone 'Europe/Bucharest'), null);
end $$;
