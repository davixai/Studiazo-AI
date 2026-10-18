-- Date pentru prezentarea aplicației (opționale), separate de migrații.
-- Rulează în Supabase → SQL Editor, după ce contul există și ai importat orarul.
-- Pune mai jos emailul contului cu care prezinți. Scriptul se poate rula de mai multe ori:
-- întâi șterge ce a adăugat data trecută (după titluri), apoi adaugă din nou, cu datele calculate față de azi.

do $$
declare
  v_email text := 'baltadavid123@gmail.com';
  v_uid uuid;
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_month date := date_trunc('month', (now() at time zone 'Europe/Bucharest'))::date;
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
    raise exception 'Nu există contul %. Verifică emailul de sus.', v_email;
  end if;

  -- Curățenie de la rularea anterioară
  delete from public.tasks where user_id = v_uid and title = any (v_titles);
  delete from public.events where user_id = v_uid and kind = 'studiu' and notes = 'Sesiune de studiu';
  delete from public.quizzes where user_id = v_uid and title = 'Oscilații și unde: test rapid';
  delete from public.notes where user_id = v_uid and title in ('Oscilații: formule de bază', 'Moștenire în C++: pe scurt');
  delete from public.finance_entries where user_id = v_uid and note = any (v_notes);

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
