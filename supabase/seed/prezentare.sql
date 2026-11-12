-- Date pentru prezentarea aplicației (opționale), separate de migrații.
-- Rulează în Supabase → SQL Editor, după ce contul există. Umple tot ca la un student real: profil, orar
-- (doar dacă nu ai deja unul), job și sport, teme și examene, sesiuni de studiu, test, notițe, buget,
-- conversații cu asistentul și ce ține minte asistentul despre tine.
-- Pune mai jos emailul contului; dacă nu există, folosește contul cu care te-ai autentificat ultima dată.
-- Scriptul se poate rula de mai multe ori: întâi șterge ce a adăugat data trecută (după titluri), apoi adaugă
-- din nou, cu datele calculate față de azi.

do $$
declare
  v_email text := 'baltadavid123@gmail.com';
  v_uid uuid;
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_month date := date_trunc('month', (now() at time zone 'Europe/Bucharest'))::date;
  v_monday date := date_trunc('week', (now() at time zone 'Europe/Bucharest'))::date;
  v_until date;
  v_conv uuid;
  v_convs text[] := array['Plan pentru parțialul de Teoria sistemelor', 'Oscilații amortizate pe înțeles'];
  v_memories text[] := array[
    'Lucrează part-time sâmbăta și duminica, 10:00–16:00.',
    'Învață cel mai bine seara, după 18:00, în sesiuni de 50 de minute.',
    'Merge la sală marțea și joia seara.',
    'Vrea bursă de merit și în semestrul următor, deci țintește note de 9–10.',
    'La Teoria sistemelor îi e greu cu transformata Laplace.',
    'Preferă explicații scurte, cu un exemplu concret înainte de formule.',
    'Stă în căminul T13 din Tudor Vladimirescu.'
  ];
  v_fiz uuid;
  v_poo uuid;
  v_cel uuid;
  v_sup uuid;
  v_ts uuid;
  v_quiz uuid;
  v_titles text[] := array[
    'Laborator 4: moștenire și polimorfism', 'Referat: oscilații amortizate', 'Tema 2: amplificatorul diferențial',
    'Parțial Teoria sistemelor', 'Proiect: semafor cu microcontroler', 'Colocviu laborator Fizică', 'Tema 1: clase și obiecte'
  ];
  v_notes text[] := array['Bursă de merit', 'Part-time weekend', 'De la părinți', 'Cămin', 'Mâncare și cantină',
    'Abonament transport', 'Cărți și imprimare', 'Ieșiri cu prietenii', 'Spotify și iCloud', 'Haine'];
  i int;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    select id, email into v_uid, v_email from auth.users order by last_sign_in_at desc nulls last limit 1;
  end if;
  if v_uid is null then
    raise exception 'Nu există niciun cont. Creează-ți contul în aplicație, apoi rulează din nou.';
  end if;
  raise notice 'Adaug datele în contul %', v_email;
  v_until := case when extract(month from v_today) >= 8 then make_date(extract(year from v_today)::int + 1, 1, 20)
                  when extract(month from v_today) = 1 then make_date(extract(year from v_today)::int, 1, 20)
                  else make_date(extract(year from v_today)::int, 6, 7) end;

  -- Curățenie de la rularea anterioară
  delete from public.tasks where user_id = v_uid and title = any (v_titles);
  delete from public.events where user_id = v_uid and kind = 'studiu' and notes = 'Sesiune de studiu';
  delete from public.quizzes where user_id = v_uid and title = 'Oscilații și unde: test rapid';
  delete from public.notes where user_id = v_uid and title in ('Oscilații: formule de bază', 'Moștenire în C++: pe scurt');
  delete from public.finance_entries where user_id = v_uid and note = any (v_notes);
  delete from public.events where user_id = v_uid and notes = 'Activitate personală';
  delete from public.conversations where user_id = v_uid and title = any (v_convs);
  delete from public.assistant_memories where user_id = v_uid and content = any (v_memories);

  -- Materiile: le folosește pe cele din orar dacă există, altfel le creează
  select id into v_fiz from public.subjects where user_id = v_uid and name = 'Fizică 2' limit 1;
  if v_fiz is null then insert into public.subjects (user_id, name, color) values (v_uid, 'Fizică 2', 'blue') returning id into v_fiz; end if;
  select id into v_poo from public.subjects where user_id = v_uid and name = 'Programare orientată pe obiecte' limit 1;
  if v_poo is null then insert into public.subjects (user_id, name, color) values (v_uid, 'Programare orientată pe obiecte', 'violet') returning id into v_poo; end if;
  select id into v_cel from public.subjects where user_id = v_uid and name = 'Circuite electronice liniare I' limit 1;
  if v_cel is null then insert into public.subjects (user_id, name, color) values (v_uid, 'Circuite electronice liniare I', 'green') returning id into v_cel; end if;
  select id into v_sup from public.subjects where user_id = v_uid and name = 'Sisteme cu microprocesoare' limit 1;
  if v_sup is null then insert into public.subjects (user_id, name, color) values (v_uid, 'Sisteme cu microprocesoare', 'teal') returning id into v_sup; end if;
  select id into v_ts from public.subjects where user_id = v_uid and name = 'Teoria sistemelor 1' limit 1;
  if v_ts is null then insert into public.subjects (user_id, name, color) values (v_uid, 'Teoria sistemelor 1', 'amber') returning id into v_ts; end if;
  update public.subjects set professor = coalesce(professor, case id
      when v_fiz then 'Conf. dr. Andrei Diaconu' when v_poo then 'Prof. dr. Radu Matei'
      when v_cel then 'Conf. dr. Elena Pavel' when v_sup then 'Ș.l. dr. Mihai Ionescu'
      when v_ts then 'Prof. dr. Ioana Rusu' end)
    where id in (v_fiz, v_poo, v_cel, v_sup, v_ts);

  -- Profilul (păstrează ce ai completat deja)
  update public.profiles set
    full_name = coalesce(nullif(full_name, ''), 'David'),
    university = coalesce(university, 'Universitatea Tehnică „Gheorghe Asachi” din Iași'),
    faculty = coalesce(faculty, 'Electronică, Telecomunicații și Tehnologia Informației'),
    specialization = coalesce(specialization, 'Tehnologii și sisteme de telecomunicații'),
    study_year = coalesce(study_year, 2),
    age = coalesce(age, 20),
    preferred_time = 'seara',
    preferred_times = '{seara}',
    session_minutes = 50,
    daily_study_limit_minutes = 150,
    study_needs = case when study_needs = '{}' then '{examene,teme,organizare}' else study_needs end,
    study_worries = case when study_worries = '{}' then '{timp,volum}' else study_worries end,
    study_goal = coalesce(study_goal, 'nota_buna'),
    onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = v_uid;

  -- Orarul: doar dacă nu ai deja cursuri, seminare sau laboratoare (prima apariție în săptămâna curentă)
  if not exists (select 1 from public.events where user_id = v_uid and kind in ('curs', 'seminar', 'laborator')) then
    insert into public.events (user_id, subject_id, kind, title, location, notes, starts_at, ends_at, recurrence, recurrence_until)
    select v_uid, s, k::public.event_kind, t, loc, 'Profesor: ' || prof,
      ((v_monday + d) + st) at time zone 'Europe/Bucharest', ((v_monday + d) + en) at time zone 'Europe/Bucharest',
      r::public.recurrence_kind, v_until
    from (values
      (v_ts, 'curs', 'Teoria sistemelor 1', 'P5', 'Prof. dr. Ioana Rusu', 0, time '08:00', time '10:00', 'weekly'),
      (v_poo, 'laborator', 'Programare orientată pe obiecte', 'C112', 'Asist. Vlad Ciobanu', 0, time '12:00', time '14:00', 'weekly'),
      (v_fiz, 'curs', 'Fizică 2', 'P2', 'Conf. dr. Andrei Diaconu', 1, time '10:00', time '12:00', 'weekly'),
      (v_cel, 'seminar', 'Circuite electronice liniare I', 'II.13', 'Conf. dr. Elena Pavel', 1, time '14:00', time '16:00', 'biweekly'),
      (v_poo, 'curs', 'Programare orientată pe obiecte', 'P4', 'Prof. dr. Radu Matei', 2, time '08:00', time '10:00', 'weekly'),
      (v_sup, 'laborator', 'Sisteme cu microprocesoare', 'III.21', 'Ș.l. dr. Mihai Ionescu', 2, time '12:00', time '14:00', 'weekly'),
      (v_cel, 'curs', 'Circuite electronice liniare I', 'P5', 'Conf. dr. Elena Pavel', 3, time '10:00', time '12:00', 'weekly'),
      (v_fiz, 'laborator', 'Fizică 2', 'L3', 'Asist. Ana Moraru', 3, time '14:00', time '16:00', 'biweekly'),
      (v_sup, 'curs', 'Sisteme cu microprocesoare', 'P2', 'Ș.l. dr. Mihai Ionescu', 4, time '09:00', time '11:00', 'weekly'),
      (v_ts, 'seminar', 'Teoria sistemelor 1', 'II.08', 'Asist. Dan Cristea', 4, time '12:00', time '14:00', 'weekly')
    ) as o(s, k, t, loc, prof, d, st, en, r);
  end if;

  -- Job și sport (recurente)
  insert into public.events (user_id, kind, title, location, notes, starts_at, ends_at, recurrence, recurrence_until)
  values
    (v_uid, 'job', 'Part-time cafenea', 'Palas', 'Activitate personală', ((v_monday + 5) + time '10:00') at time zone 'Europe/Bucharest', ((v_monday + 5) + time '16:00') at time zone 'Europe/Bucharest', 'weekly', v_until),
    (v_uid, 'job', 'Part-time cafenea', 'Palas', 'Activitate personală', ((v_monday + 6) + time '10:00') at time zone 'Europe/Bucharest', ((v_monday + 6) + time '16:00') at time zone 'Europe/Bucharest', 'weekly', v_until),
    (v_uid, 'sport', 'Sală', 'Complexul studențesc Tudor', 'Activitate personală', ((v_monday + 1) + time '19:30') at time zone 'Europe/Bucharest', ((v_monday + 1) + time '20:30') at time zone 'Europe/Bucharest', 'weekly', v_until),
    (v_uid, 'sport', 'Sală', 'Complexul studențesc Tudor', 'Activitate personală', ((v_monday + 3) + time '19:30') at time zone 'Europe/Bucharest', ((v_monday + 3) + time '20:30') at time zone 'Europe/Bucharest', 'weekly', v_until);

  -- Ce ține minte asistentul (se vede și se poate șterge în Profil)
  insert into public.assistant_memories (user_id, content, created_at)
  select v_uid, m, now() - make_interval(days => 10 - n::int)
  from unnest(v_memories) with ordinality as u(m, n);

  -- Conversație în chatul general
  insert into public.conversations (user_id, title, created_at, updated_at)
  values (v_uid, 'Plan pentru parțialul de Teoria sistemelor', now() - interval '2 days', now() - interval '2 days' + interval '6 minutes')
  returning id into v_conv;
  insert into public.messages (conversation_id, user_id, role, content, metadata, created_at) values
    (v_conv, v_uid, 'user', 'Am parțial la Teoria sistemelor în curând și n-am început. Lucrez și în weekend. Cum mă organizez?', '{}', now() - interval '2 days'),
    (v_conv, v_uid, 'assistant', E'Se poate, dacă începi de azi cu bucăți mici. Ținând cont că lucrezi sâmbăta și duminica, îți propun serile din cursul săptămânii:\n\n1. **Azi, 18:00–18:50**: recapitulezi transformata Laplace (proprietățile de bază, 5 exemple).\n2. **Mâine, 18:00–18:50**: funcția de transfer și schemele bloc.\n3. **Joi, după sală, 21:00–21:40**: stabilitate (criteriul Hurwitz), doar exerciții.\n4. **Cu o zi înainte**: un test rapid de 10 întrebări și recitești greșelile.\n\nVrei să le pun în calendar?', '{"memory": [{"action": "remembered", "text": "Lucrează part-time sâmbăta și duminica, 10:00–16:00."}]}', now() - interval '2 days' + interval '20 seconds'),
    (v_conv, v_uid, 'user', 'Da, dar Laplace mi se pare cel mai greu, poți să-mi dai mai mult timp acolo?', '{}', now() - interval '2 days' + interval '4 minutes'),
    (v_conv, v_uid, 'assistant', E'Sigur. Mut stabilitatea în aceeași seară cu funcția de transfer și îți las **două seri pentru Laplace**: una pentru proprietăți, una doar pentru transformata inversă (descompunerea în fracții simple, acolo greșesc cei mai mulți).\n\nAm reținut că Laplace îți dă bătăi de cap, ca să insist pe el și la teste.', '{"memory": [{"action": "remembered", "text": "La Teoria sistemelor îi e greu cu transformata Laplace."}]}', now() - interval '2 days' + interval '4 minutes 25 seconds');

  -- Conversație în chatul materiei Fizică 2
  insert into public.conversations (user_id, subject_id, title, created_at, updated_at)
  values (v_uid, v_fiz, 'Oscilații amortizate pe înțeles', now() - interval '1 day', now() - interval '1 day' + interval '3 minutes')
  returning id into v_conv;
  insert into public.messages (conversation_id, user_id, role, content, metadata, created_at) values
    (v_conv, v_uid, 'user', 'Explică-mi pe scurt oscilațiile amortizate, am de scris un referat.', '{}', now() - interval '1 day'),
    (v_conv, v_uid, 'assistant', E'Imaginează-ți un leagăn pe care nu-l mai împinge nimeni: se mișcă tot mai puțin, pentru că frecarea îi „fură” energia la fiecare balans.\n\nAsta e o **oscilație amortizată**: amplitudinea scade exponențial, A(t) = A₀·e^(−βt), unde β arată cât de puternică e frecarea.\n\nTrei cazuri, după cât de mare e β:\n- **subamortizat** (β mic): oscilează, dar tot mai slab;\n- **critic**: revine la echilibru cel mai repede, fără să oscileze;\n- **supraamortizat** (β mare): revine încet, fără oscilații.\n\nPentru referat, un exemplu bun e amortizorul mașinii, gândit să fie aproape de cazul critic.', '{}', now() - interval '1 day' + interval '15 seconds');

  -- Teme, proiecte și examene (trei în următoarele 7 zile, restul în 30)
  insert into public.tasks (user_id, subject_id, kind, title, due_at, duration_minutes, estimated_minutes, completed_at)
  values
    (v_uid, v_poo, 'tema', 'Laborator 4: moștenire și polimorfism', ((v_today + 2) + time '23:59') at time zone 'Europe/Bucharest', null, 120, null),
    (v_uid, v_fiz, 'tema', 'Referat: oscilații amortizate', ((v_today + 4) + time '20:00') at time zone 'Europe/Bucharest', null, 180, null),
    (v_uid, v_cel, 'tema', 'Tema 2: amplificatorul diferențial', ((v_today + 6) + time '23:59') at time zone 'Europe/Bucharest', null, 150, null),
    (v_uid, v_ts, 'examen', 'Parțial Teoria sistemelor', ((v_today + 9) + time '10:00') at time zone 'Europe/Bucharest', 120, 600, null),
    (v_uid, v_sup, 'proiect', 'Proiect: semafor cu microcontroler', ((v_today + 14) + time '23:59') at time zone 'Europe/Bucharest', null, 480, null),
    (v_uid, v_fiz, 'colocviu', 'Colocviu laborator Fizică', ((v_today + 20) + time '14:00') at time zone 'Europe/Bucharest', 60, 240, null),
    (v_uid, v_poo, 'tema', 'Tema 1: clase și obiecte', ((v_today - 3) + time '23:59') at time zone 'Europe/Bucharest', null, 90, now() - interval '4 days');

  -- Sesiuni de studiu finalizate în ultimele 11 zile (streak) și una azi, terminată acum o jumătate de oră
  for i in 1..11 loop
    insert into public.events (user_id, subject_id, kind, title, notes, starts_at, ends_at, completed_at)
    values (
      v_uid,
      (array[v_fiz, v_poo, v_cel, v_ts, v_sup])[1 + i % 5],
      'studiu',
      'Studiu: ' || (array['Fizică 2', 'POO', 'Circuite', 'Teoria sistemelor', 'Microprocesoare'])[1 + i % 5],
      'Sesiune de studiu',
      ((v_today - i) + time '18:00') at time zone 'Europe/Bucharest',
      ((v_today - i) + time '18:00' + make_interval(mins => (array[45, 60, 50, 75, 40, 90])[1 + i % 6])) at time zone 'Europe/Bucharest',
      ((v_today - i) + time '19:30') at time zone 'Europe/Bucharest'
    );
  end loop;
  insert into public.events (user_id, subject_id, kind, title, notes, starts_at, ends_at, completed_at)
  values (v_uid, v_poo, 'studiu', 'Studiu: POO', 'Sesiune de studiu', now() - interval '80 minutes', now() - interval '30 minutes', now() - interval '30 minutes');

  -- Sesiuni planificate în zilele următoare
  insert into public.events (user_id, subject_id, kind, title, notes, starts_at, ends_at)
  values
    (v_uid, v_fiz, 'studiu', 'Studiu: referat oscilații', 'Sesiune de studiu', ((v_today + 1) + time '18:00') at time zone 'Europe/Bucharest', ((v_today + 1) + time '19:00') at time zone 'Europe/Bucharest'),
    (v_uid, v_ts, 'studiu', 'Studiu: recapitulare parțial', 'Sesiune de studiu', ((v_today + 3) + time '17:00') at time zone 'Europe/Bucharest', ((v_today + 3) + time '18:30') at time zone 'Europe/Bucharest');

  -- Un test grilă și două încercări
  insert into public.quizzes (user_id, subject_id, title, questions)
  values (v_uid, v_fiz, 'Oscilații și unde: test rapid', jsonb_build_array(
    jsonb_build_object('id', 'q1', 'prompt', 'Ce mărime nu depinde de amplitudine la un oscilator armonic?',
      'options', jsonb_build_array('Energia totală', 'Perioada', 'Viteza maximă', 'Accelerația maximă'), 'correctIndex', 1,
      'explanation', 'Perioada T = 2π√(m/k) depinde doar de masă și de constanta elastică.', 'topic', 'Oscilatorul armonic',
      'source', jsonb_build_object('materialId', null, 'page', null)),
    jsonb_build_object('id', 'q2', 'prompt', 'La rezonanță, amplitudinea oscilațiilor forțate este:',
      'options', jsonb_build_array('Minimă', 'Zero', 'Maximă', 'Egală cu cea a forței'), 'correctIndex', 2,
      'explanation', 'Când frecvența forței e apropiată de frecvența proprie, amplitudinea devine maximă.', 'topic', 'Oscilații forțate',
      'source', jsonb_build_object('materialId', null, 'page', null)),
    jsonb_build_object('id', 'q3', 'prompt', 'Într-o oscilație amortizată, amplitudinea scade:',
      'options', jsonb_build_array('Liniar', 'Exponențial', 'Brusc, la zero', 'Nu scade'), 'correctIndex', 1,
      'explanation', 'Amplitudinea scade după A·e^(−βt).', 'topic', 'Oscilații amortizate',
      'source', jsonb_build_object('materialId', null, 'page', null)),
    jsonb_build_object('id', 'q4', 'prompt', 'Viteza unei unde este produsul dintre:',
      'options', jsonb_build_array('Lungimea de undă și frecvență', 'Amplitudine și perioadă', 'Masă și accelerație', 'Frecvență și amplitudine'), 'correctIndex', 0,
      'explanation', 'v = λ·f.', 'topic', 'Unde',
      'source', jsonb_build_object('materialId', null, 'page', null))
  )) returning id into v_quiz;

  insert into public.quiz_attempts (quiz_id, user_id, answers, score, total, duration_seconds, topic_breakdown, completed_at)
  values
    (v_quiz, v_uid, '[1, 0, 1, 0]', 3, 4, 540,
      '{"Oscilatorul armonic": {"correct": 1, "total": 1}, "Oscilații forțate": {"correct": 0, "total": 1}, "Oscilații amortizate": {"correct": 1, "total": 1}, "Unde": {"correct": 1, "total": 1}}',
      now() - interval '3 days'),
    (v_quiz, v_uid, '[1, 2, 1, 0]', 4, 4, 420,
      '{"Oscilatorul armonic": {"correct": 1, "total": 1}, "Oscilații forțate": {"correct": 1, "total": 1}, "Oscilații amortizate": {"correct": 1, "total": 1}, "Unde": {"correct": 1, "total": 1}}',
      now() - interval '1 day');

  -- Notițe
  insert into public.notes (user_id, subject_id, title, topic, content)
  values
    (v_uid, v_fiz, 'Oscilații: formule de bază', 'Oscilații',
      'T = 2π√(m/k)' || chr(10) || 'ω = 2π/T' || chr(10) || 'Amortizare: A(t) = A₀·e^(−βt)' || chr(10) || 'Rezonanță: amplitudine maximă când ω ≈ ω₀'),
    (v_uid, v_poo, 'Moștenire în C++: pe scurt', 'Moștenire',
      'class Derivata : public Baza { … }' || chr(10) || 'virtual → legare dinamică (polimorfism)' || chr(10) || 'Destructorul clasei de bază: virtual!');

  -- Buget: luna curentă și ultimele două
  for i in 0..2 loop
    insert into public.finance_entries (user_id, kind, category, amount, note, month)
    values
      (v_uid, 'venit', 'bursa', 1050, 'Bursă de merit', (v_month - make_interval(months => i))::date),
      (v_uid, 'venit', 'job', (array[1200, 1100, 950])[i + 1], 'Part-time weekend', (v_month - make_interval(months => i))::date),
      (v_uid, 'venit', 'parinti', 600, 'De la părinți', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'chirie', 450, 'Cămin', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'mancare', (array[980, 1060, 1120])[i + 1], 'Mâncare și cantină', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'transport', 40, 'Abonament transport', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'facultate', (array[120, 60, 210])[i + 1], 'Cărți și imprimare', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'iesiri', (array[260, 340, 410])[i + 1], 'Ieșiri cu prietenii', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'abonamente', 45, 'Spotify și iCloud', (v_month - make_interval(months => i))::date),
      (v_uid, 'cheltuiala', 'cumparaturi', (array[180, 90, 320])[i + 1], 'Haine', (v_month - make_interval(months => i))::date);
  end loop;
end $$;
