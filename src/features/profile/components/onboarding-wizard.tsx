"use client";

import { ArrowLeft, ArrowRight, Check, Minus, Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState, type FormState } from "@/features/auth/schemas";
import type { PreferredTime, Profile } from "@/lib/contracts/domain";
import { cn, firstName } from "@/lib/utils";
import { finishOnboarding, skipOnboarding } from "../actions";
import {
  AGE_MAX,
  AGE_MIN,
  ONBOARDING_SUBJECTS_MAX,
  PREFERRED_TIME_OPTIONS,
  STUDY_GOAL_OPTIONS,
  STUDY_NEED_OPTIONS,
  STUDY_WORRY_OPTIONS,
  UNIVERSITY_OPTIONS,
  cleanSubjectName,
  facultiesFor,
  suggestSubjects,
  uniqueSubjects,
} from "../onboarding";

const STEPS = ["nume", "varsta", "universitate", "facultate", "an", "nevoie", "materii", "ingrijorare", "obiectiv", "ritm", "final"] as const;

/** Cât rămâne vizibilă alegerea înainte de pasul următor. */
const ADVANCE_DELAY_MS = 280;

type Answers = {
  fullName: string;
  age: string;
  university: string;
  faculty: string;
  specialization: string;
  studyYear: string;
  need: string;
  worry: string;
  goal: string;
  preferredTime: PreferredTime | "";
  subjects: string[];
};

function initialAnswers(profile: Profile): Answers {
  return {
    fullName: profile.fullName,
    age: "",
    university: profile.university ?? "",
    faculty: profile.faculty ?? "",
    specialization: profile.specialization ?? "",
    studyYear: profile.studyYear ? String(profile.studyYear) : "",
    need: "",
    worry: "",
    goal: "",
    preferredTime: profile.onboardingCompletedAt ? profile.preferredTime : "",
    subjects: [],
  };
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function ageError(age: string) {
  if (age === "") return null;
  const n = Number(age);
  return Number.isInteger(n) && n >= AGE_MIN && n <= AGE_MAX ? null : `Vârsta trebuie să fie între ${AGE_MIN} și ${AGE_MAX} de ani.`;
}

export function OnboardingWizard({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<FormState, FormData>(finishOnboarding, initialFormState);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => initialAnswers(profile));
  const [otherUniversity, setOtherUniversity] = useState(
    () => answers.university !== "" && !UNIVERSITY_OPTIONS.some((u) => u.value === answers.university),
  );
  const [errors, setErrors] = useState<{ fullName?: string; age?: string; subject?: string }>({});
  const [seenState, setSeenState] = useState(state);
  const advancing = useRef(false);
  const moved = useRef(false);
  const stepRef = useRef<HTMLDivElement>(null);

  // Eroare de nume venită de pe server: ne întoarcem la primul pas.
  if (state !== seenState) {
    setSeenState(state);
    if (state.fieldErrors?.fullName) {
      setIndex(0);
      setErrors((e) => ({ ...e, fullName: state.fieldErrors?.fullName }));
    }
  }

  // La fiecare pas nou: focus pe câmpul pasului sau pe titlu (cititoare de ecran, tastatură).
  useEffect(() => {
    if (!moved.current) return;
    const root = stepRef.current;
    const target = root?.querySelector<HTMLElement>("[data-autofocus]") ?? root?.querySelector<HTMLElement>("h1");
    target?.focus({ preventScroll: true });
  }, [index]);

  const step = STEPS[index];
  const name = firstName(answers.fullName);

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function go(to: number) {
    moved.current = true;
    advancing.current = false;
    setIndex(Math.max(0, Math.min(STEPS.length - 1, to)));
    window.scrollTo({ top: 0 });
  }

  /** Alegere cu o singură atingere: se vede selecția, apoi trecem mai departe. */
  function choose<K extends keyof Answers>(key: K, value: Answers[K]) {
    if (advancing.current) return;
    advancing.current = true;
    set(key, value);
    const from = index;
    window.setTimeout(() => {
      if (advancing.current) go(from + 1);
    }, ADVANCE_DELAY_MS);
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    const value = answers.fullName.trim();
    if (value.length < 2) return setErrors((x) => ({ ...x, fullName: "Spune-ne cum te numești." }));
    setErrors((x) => ({ ...x, fullName: undefined }));
    go(index + 1);
  }

  function submitAge(e: React.FormEvent) {
    e.preventDefault();
    const error = ageError(answers.age);
    setErrors((x) => ({ ...x, age: error ?? undefined }));
    if (!error) go(index + 1);
  }

  function addSubject(raw: string) {
    const subject = cleanSubjectName(raw);
    if (!subject) return false;
    if (subject.length > 120) {
      setErrors((x) => ({ ...x, subject: "Numele unei materii poate avea cel mult 120 de caractere." }));
      return false;
    }
    if (answers.subjects.length >= ONBOARDING_SUBJECTS_MAX) {
      setErrors((x) => ({ ...x, subject: `Poți adăuga cel mult ${ONBOARDING_SUBJECTS_MAX} materii acum; restul, din Materii.` }));
      return false;
    }
    setErrors((x) => ({ ...x, subject: undefined }));
    set("subjects", uniqueSubjects([...answers.subjects, subject]));
    return true;
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_55%_at_50%_0%,var(--color-accent-line),transparent)] opacity-80"
      />

      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-4 sm:px-5 sm:pt-8">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Înapoi la pasul anterior"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-xs transition-[transform,background-color] duration-150 hover:bg-surface-muted active:scale-95",
            index === 0 && "invisible",
          )}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>

        <div
          role="progressbar"
          aria-label="Progresul configurării"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Pasul ${index + 1} din ${STEPS.length}`}
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="bg-brand h-full origin-left rounded-full transition-transform duration-500 ease-[var(--ease-out)]"
            style={{ transform: `scaleX(${(index + 1) / STEPS.length})` }}
          />
        </div>

        <form action={skipOnboarding}>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full px-3 text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Mai târziu
          </button>
        </form>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-8 sm:px-5 sm:pt-14">
        <div key={step} ref={stepRef} className="flex flex-1 flex-col">
          {step === "nume" ? (
            <form onSubmit={submitName} noValidate className="flex flex-1 flex-col">
              <StepTitle
                eyebrow="Bun venit în Studiazo 👋"
                title="Hai să ne cunoaștem"
                subtitle="Câteva întrebări scurte, ca asistentul să fie croit pe tine. Durează cam două minute."
              />
              <div className="stagger mt-10" style={{ "--i": 1 } as React.CSSProperties}>
                <label htmlFor="ob-name" className="mb-2 block text-center text-sm font-medium text-ink-soft">
                  Numele și prenumele tău
                </label>
                <Input
                  id="ob-name"
                  data-autofocus
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="ex. Andrei Popescu"
                  value={answers.fullName}
                  maxLength={120}
                  onChange={(e) => set("fullName", e.target.value)}
                  aria-invalid={Boolean(errors.fullName) || undefined}
                  aria-describedby={errors.fullName ? "ob-name-error" : undefined}
                  className="h-14 rounded-xl text-center text-lg font-semibold sm:h-14 sm:text-xl"
                />
                <FieldError id="ob-name-error" message={errors.fullName} />
              </div>
              <Footer>
                <PrimaryButton type="submit">Continuă</PrimaryButton>
              </Footer>
            </form>
          ) : null}

          {step === "varsta" ? (
            <form onSubmit={submitAge} noValidate className="flex flex-1 flex-col">
              <StepTitle
                title={name ? `${name}, câți ani ai?` : "Câți ani ai?"}
                subtitle="Ne ajută să potrivim tonul și exemplele din explicații."
              />
              <div className="stagger mt-10 flex flex-col items-center" style={{ "--i": 1 } as React.CSSProperties}>
                <div className="flex items-center gap-4 sm:gap-6">
                  <StepperButton
                    label="Mai puțin cu un an"
                    onClick={() => set("age", String(Math.max(AGE_MIN, (Number(answers.age) || 21) - 1)))}
                  >
                    <Minus className="size-5" aria-hidden="true" />
                  </StepperButton>
                  <label htmlFor="ob-age" className="sr-only">
                    Vârsta, în ani
                  </label>
                  <input
                    id="ob-age"
                    data-autofocus
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="20"
                    value={answers.age}
                    onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))}
                    aria-invalid={Boolean(errors.age) || undefined}
                    aria-describedby={errors.age ? "ob-age-error" : "ob-age-unit"}
                    className="tabular h-24 w-32 rounded-xl border border-line-strong bg-surface text-center font-display text-[56px] font-bold tracking-[-0.03em] text-ink shadow-xs placeholder:text-ink-faint/50 focus:border-accent focus:ring-3 focus:ring-accent/15 focus:outline-none aria-invalid:border-danger sm:text-[56px]"
                  />
                  <StepperButton
                    label="Mai mult cu un an"
                    onClick={() => set("age", String(Math.min(AGE_MAX, (Number(answers.age) || 19) + 1)))}
                  >
                    <Plus className="size-5" aria-hidden="true" />
                  </StepperButton>
                </div>
                <p id="ob-age-unit" className="mt-3 text-sm font-medium text-ink-muted">
                  ani
                </p>
                <FieldError id="ob-age-error" message={errors.age} />
              </div>
              <Footer>
                <PrimaryButton type="submit">Continuă</PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    set("age", "");
                    setErrors((x) => ({ ...x, age: undefined }));
                    go(index + 1);
                  }}
                >
                  Prefer să nu spun
                </SecondaryButton>
              </Footer>
            </form>
          ) : null}

          {step === "universitate" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(index + 1);
              }}
              className="flex flex-1 flex-col"
            >
              <StepTitle title="La ce universitate ești?" subtitle="Alege din Iași sau scrie numele universității tale." />
              <div className="mt-8 flex flex-col gap-3">
                {UNIVERSITY_OPTIONS.map((u, i) => (
                  <RowChoice
                    key={u.value}
                    i={i + 1}
                    emoji={u.emoji}
                    title={u.title}
                    description={`${u.short} · Iași`}
                    selected={!otherUniversity && answers.university === u.value}
                    onClick={() => {
                      setOtherUniversity(false);
                      choose("university", u.value);
                    }}
                  />
                ))}
                <RowChoice
                  i={UNIVERSITY_OPTIONS.length + 1}
                  emoji="✏️"
                  title="Altă universitate"
                  description="O scrii tu"
                  selected={otherUniversity}
                  onClick={() => {
                    if (!otherUniversity) set("university", "");
                    setOtherUniversity(true);
                  }}
                />
                {otherUniversity ? (
                  <div className="animate-rise-in">
                    <label htmlFor="ob-university" className="sr-only">
                      Numele universității
                    </label>
                    <Input
                      id="ob-university"
                      autoFocus
                      placeholder="Numele universității"
                      maxLength={160}
                      value={answers.university}
                      onChange={(e) => set("university", e.target.value)}
                      className="h-13 rounded-xl text-[16px] sm:h-13"
                    />
                  </div>
                ) : null}
              </div>
              {otherUniversity ? (
                <Footer>
                  <PrimaryButton type="submit">{answers.university.trim() ? "Continuă" : "Continuă fără universitate"}</PrimaryButton>
                </Footer>
              ) : null}
            </form>
          ) : null}

          {step === "facultate" ? (
            <FacultyStep
              answers={answers}
              set={set}
              onNext={() => go(index + 1)}
            />
          ) : null}

          {step === "an" ? (
            <>
              <StepTitle title="În ce an de studiu ești?" subtitle="Alege anul pe care îl parcurgi acum." />
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((year, i) => {
                  const selected = answers.studyYear === String(year);
                  return (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose("studyYear", String(year))}
                      style={{ "--i": i + 1 } as React.CSSProperties}
                      className={cn(
                        choiceBase,
                        "stagger flex aspect-[4/3.4] flex-col items-center justify-center gap-0.5 p-3 sm:aspect-[4/3]",
                      )}
                    >
                      <span className="tabular font-display text-[34px] leading-none font-bold tracking-[-0.03em] text-ink group-aria-pressed:text-accent-ink sm:text-[40px]">
                        {year}
                      </span>
                      <span className="text-[13px] font-medium text-ink-muted">{year === 1 ? "anul 1 · boboc" : `anul ${year}`}</span>
                      <SelectedMark selected={selected} className="top-2.5 right-2.5" />
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {step === "nevoie" ? (
            <>
              <StepTitle title="De ce ai nevoie cel mai mult acum?" />
              <div className="mt-8 flex flex-col gap-3">
                {STUDY_NEED_OPTIONS.map((o, i) => (
                  <HeroChoice
                    key={o.value}
                    i={i + 1}
                    {...o}
                    selected={answers.need === o.value}
                    onClick={() => choose("need", o.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "materii" ? (
            <SubjectsStep
              answers={answers}
              error={errors.subject}
              onAdd={addSubject}
              onRemove={(s) => set("subjects", answers.subjects.filter((x) => x !== s))}
              onNext={() => go(index + 1)}
            />
          ) : null}

          {step === "ingrijorare" ? (
            <>
              <StepTitle title="Ce te îngrijorează cel mai mult?" subtitle="Răspunsul ne ajută să știm cum să te sprijinim." />
              <div className="mt-8 flex flex-col gap-3">
                {STUDY_WORRY_OPTIONS.map((o, i) => (
                  <RowChoice
                    key={o.value}
                    i={i + 1}
                    {...o}
                    selected={answers.worry === o.value}
                    onClick={() => choose("worry", o.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "obiectiv" ? (
            <>
              <StepTitle title="Care este obiectivul tău?" subtitle="Pentru examenele din sesiunea care urmează." />
              <div className="mt-8 flex flex-col gap-3">
                {STUDY_GOAL_OPTIONS.map((o, i) => (
                  <HeroChoice
                    key={o.value}
                    i={i + 1}
                    {...o}
                    selected={answers.goal === o.value}
                    onClick={() => choose("goal", o.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "ritm" ? (
            <>
              <StepTitle title="Când te concentrezi cel mai bine?" subtitle="Îți propunem sesiuni de studiu în momentele potrivite." />
              <div className="mt-8 flex flex-col gap-3">
                {PREFERRED_TIME_OPTIONS.map((o, i) => (
                  <RowChoice
                    key={o.value}
                    i={i + 1}
                    {...o}
                    selected={answers.preferredTime === o.value}
                    onClick={() => choose("preferredTime", o.value)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {step === "final" ? (
            <form action={action} className="flex flex-1 flex-col">
              <StepTitle
                title="Ai cursurile și notițele la îndemână?"
                subtitle="Poți încărca PDF-uri și poze acum sau poți explora Studiazo mai întâi."
              />
              <HiddenAnswers answers={answers} />
              {state.status === "error" ? (
                <div className="mt-6">
                  <Alert tone="danger">
                    {state.message ?? Object.values(state.fieldErrors ?? {})[0] ?? "Nu am putut salva. Încearcă din nou."}
                  </Alert>
                </div>
              ) : null}
              <FinalChoices hasSubjects={answers.subjects.length > 0} />
            </form>
          ) : null}
        </div>
      </main>
    </div>
  );
}

/* ───────────────────────── pași cu câmpuri ───────────────────────── */

function FacultyStep({
  answers,
  set,
  onNext,
}: {
  answers: Answers;
  set: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  onNext: () => void;
}) {
  const university = UNIVERSITY_OPTIONS.find((u) => u.value === answers.university);
  const query = normalize(answers.faculty.trim());
  const suggestions = facultiesFor(answers.university).filter((f) => {
    const n = normalize(f);
    return n !== query && n.includes(query);
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="flex flex-1 flex-col"
    >
      <StepTitle
        title="Ce facultate și specializare?"
        subtitle={university ? `La ${university.short}. Le poți schimba oricând din Profil.` : "Le poți schimba oricând din Profil."}
      />
      <div className="mt-8 flex flex-col gap-6">
        <div className="stagger" style={{ "--i": 1 } as React.CSSProperties}>
          <label htmlFor="ob-faculty" className="mb-2 block text-sm font-medium text-ink">
            Facultatea
          </label>
          <Input
            id="ob-faculty"
            data-autofocus
            placeholder={university ? "Caută sau scrie facultatea" : "ex. Facultatea de Informatică"}
            maxLength={160}
            value={answers.faculty}
            onChange={(e) => set("faculty", e.target.value)}
            className="h-13 rounded-xl text-[16px] sm:h-13"
          />
          {suggestions.length > 0 ? (
            <ul aria-label="Facultăți sugerate" className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => set("faculty", f)}
                    className="min-h-10 rounded-full border border-line bg-surface px-3.5 py-2 text-left text-[13px] leading-5 font-medium text-ink-soft shadow-xs transition-[transform,border-color,color] duration-150 hover:border-accent-line hover:text-accent-ink active:scale-[0.97]"
                  >
                    {f.replace(/^Facultatea de /, "")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="stagger" style={{ "--i": 2 } as React.CSSProperties}>
          <label htmlFor="ob-specialization" className="mb-2 block text-sm font-medium text-ink">
            Specializarea
          </label>
          <Input
            id="ob-specialization"
            placeholder="ex. Informatică economică"
            maxLength={160}
            value={answers.specialization}
            onChange={(e) => set("specialization", e.target.value)}
            className="h-13 rounded-xl text-[16px] sm:h-13"
          />
        </div>
      </div>
      <Footer>
        <PrimaryButton type="submit">Continuă</PrimaryButton>
      </Footer>
    </form>
  );
}

function SubjectsStep({
  answers,
  error,
  onAdd,
  onRemove,
  onNext,
}: {
  answers: Answers;
  error?: string;
  onAdd: (name: string) => boolean;
  onRemove: (name: string) => void;
  onNext: () => void;
}) {
  const [draft, setDraft] = useState("");
  const chosen = new Set(answers.subjects.map((s) => s.toLocaleLowerCase("ro")));
  const suggestions = suggestSubjects(answers.faculty, answers.specialization).filter((s) => !chosen.has(s.toLocaleLowerCase("ro")));
  const count = answers.subjects.length;

  return (
    <div className="flex flex-1 flex-col">
      <StepTitle
        title="La ce materii ai nevoie de ajutor?"
        subtitle="Pentru teme, proiecte sau examene. Le adăugăm direct în Materii, ca să poți încărca apoi cursurile."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onAdd(draft)) setDraft("");
        }}
        className="stagger mt-8"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <label htmlFor="ob-subject" className="sr-only">
          Numele materiei
        </label>
        <div className="flex gap-2">
          <Input
            id="ob-subject"
            data-autofocus
            placeholder="Scrie o materie"
            maxLength={120}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? "ob-subject-error" : undefined}
            className="h-13 flex-1 rounded-xl text-[16px] sm:h-13"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className={buttonStyles({ variant: "secondary", size: "lg", className: "h-13 shrink-0 rounded-xl px-4" })}
          >
            <Plus aria-hidden="true" />
            Adaugă
          </button>
        </div>
        <FieldError id="ob-subject-error" message={error} />
      </form>

      {count > 0 ? (
        <section aria-label="Materiile alese" className="mt-6">
          <p className="mb-2.5 text-[13px] font-semibold text-ink-soft">
            Alese <span className="tabular text-ink-muted">· {count === 1 ? "o materie" : `${count} materii`}</span>
          </p>
          <ul className="flex flex-wrap gap-2">
            {answers.subjects.map((s) => (
              <li key={s} className="animate-pop-in">
                <span className="inline-flex min-h-10 items-center gap-1 rounded-full border border-accent-line bg-accent-soft py-1 pr-1 pl-3.5 text-[14px] font-semibold text-accent-ink">
                  {s}
                  <button
                    type="button"
                    onClick={() => onRemove(s)}
                    aria-label={`Scoate ${s}`}
                    className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-accent-line"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section aria-label="Sugestii" className="stagger mt-6" style={{ "--i": 2 } as React.CSSProperties}>
          <p className="mb-2.5 text-[13px] font-semibold text-ink-soft">Sugestii pentru tine</p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onAdd(s)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[14px] font-medium text-ink-soft shadow-xs transition-[transform,border-color,color] duration-150 hover:border-accent-line hover:text-accent-ink active:scale-[0.97]"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Footer>
        <PrimaryButton onClick={onNext}>{count > 0 ? "Continuă" : "Continuă fără materii"}</PrimaryButton>
      </Footer>
    </div>
  );
}

/* ───────────────────────── finalul ───────────────────────── */

function HiddenAnswers({ answers }: { answers: Answers }) {
  const fields: [string, string][] = [
    ["fullName", answers.fullName],
    ["age", answers.age],
    ["university", answers.university],
    ["faculty", answers.faculty],
    ["specialization", answers.specialization],
    ["studyYear", answers.studyYear],
    ["need", answers.need],
    ["worry", answers.worry],
    ["goal", answers.goal],
    ["preferredTime", answers.preferredTime || "fara_preferinta"],
  ];
  return (
    <>
      {fields.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {answers.subjects.map((s) => (
        <input key={s} type="hidden" name="subject" value={s} />
      ))}
    </>
  );
}

function FinalChoices({ hasSubjects }: { hasSubjects: boolean }) {
  const { pending, data } = useFormStatus();
  const chosen = data?.get("next");

  return (
    <div className="mt-8 flex flex-col gap-3">
      <HeroChoice
        i={1}
        type="submit"
        name="next"
        value="materii"
        emoji="📝"
        tag="Recomandat"
        title="Da, îmi încarc cursurile"
        description={
          hasSubjects ? "Te ducem la materiile tale. Asistentul va explica din ele." : "Pregătirea ta se va baza pe materialele tale."
        }
        selected={chosen === "materii"}
        loading={pending && chosen === "materii"}
        disabled={pending}
      />
      <HeroChoice
        i={2}
        type="submit"
        name="next"
        value="azi"
        emoji="🧭"
        title="Prefer să explorez mai întâi"
        description="Intră direct în aplicație. Încarci materialele când vrei."
        selected={chosen === "azi"}
        loading={pending && chosen === "azi"}
        disabled={pending}
      />
    </div>
  );
}

/* ───────────────────────── piese comune ───────────────────────── */

const choiceBase =
  "group relative w-full overflow-hidden rounded-xl border border-line bg-surface text-left shadow-xs " +
  "transition-[transform,border-color,box-shadow,background-color] duration-200 ease-[var(--ease-out)] " +
  "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md active:translate-y-0 active:scale-[0.985] " +
  "aria-pressed:border-accent aria-pressed:bg-accent-soft/40 aria-pressed:ring-3 aria-pressed:ring-accent/15 " +
  "disabled:pointer-events-none disabled:opacity-60 disabled:aria-pressed:opacity-100";

function StepTitle({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <p className="animate-fade-in mb-4 inline-flex items-center rounded-full border border-accent-line bg-surface/80 px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink shadow-xs">
          {eyebrow}
        </p>
      ) : null}
      <h1
        tabIndex={-1}
        className="animate-rise-in font-display text-[30px] leading-[1.12] font-bold tracking-[-0.035em] text-balance text-ink focus:outline-none sm:text-[40px]"
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className="stagger mx-auto mt-3 max-w-md text-[15px] leading-6 text-pretty text-ink-muted sm:text-base sm:leading-7"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function SelectedMark({ selected, className }: { selected: boolean; className?: string }) {
  if (!selected) return null;
  return (
    <span
      aria-hidden="true"
      className={cn("animate-pop-in absolute flex size-6 items-center justify-center rounded-full bg-accent text-white shadow-accent", className)}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  );
}

type ChoiceProps = {
  i: number;
  emoji: string;
  title: string;
  description?: string;
  selected: boolean;
  onClick?: () => void;
} & Pick<React.ComponentProps<"button">, "type" | "name" | "value" | "disabled">;

/** Card mare, cu emoji în colț (ca în pașii cu obiective). */
function HeroChoice({
  i,
  emoji,
  title,
  description,
  tag,
  selected,
  loading,
  type = "button",
  ...props
}: ChoiceProps & { tag?: string; loading?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      aria-busy={loading || undefined}
      style={{ "--i": i } as React.CSSProperties}
      className={cn(choiceBase, "stagger min-h-[112px] p-5 pr-24 sm:min-h-[124px] sm:p-6 sm:pr-32")}
      {...props}
    >
      <span className="block text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink sm:text-[19px] sm:leading-7">{title}</span>
      {tag ? (
        <span className="mt-1.5 block text-[11px] font-bold tracking-[0.14em] text-accent uppercase">{tag}</span>
      ) : null}
      {description ? <span className="mt-1.5 block text-[14px] leading-6 text-ink-muted sm:text-[15px]">{description}</span> : null}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-1 -bottom-3 text-[64px] leading-none drop-shadow-sm transition-transform duration-300 ease-[var(--ease-spring)] select-none group-hover:scale-110 group-hover:-rotate-6 group-aria-pressed:scale-110 group-aria-pressed:-rotate-6 sm:text-[76px]"
      >
        {emoji}
      </span>
      {loading ? (
        <span className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-surface text-accent shadow-xs">
          <Spinner />
        </span>
      ) : (
        <SelectedMark selected={selected} className="top-4 right-4" />
      )}
    </button>
  );
}

/** Rând cu emoji în stânga (ca în lista de griji). */
function RowChoice({ i, emoji, title, description, selected, type = "button", ...props }: ChoiceProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      style={{ "--i": i } as React.CSSProperties}
      className={cn(choiceBase, "stagger flex min-h-[72px] items-center gap-4 px-4 py-3.5 sm:px-5")}
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-[26px] transition-transform duration-300 ease-[var(--ease-spring)] select-none group-hover:scale-110 group-aria-pressed:scale-110 group-aria-pressed:bg-surface"
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-6 font-semibold text-ink sm:text-[17px]">{title}</span>
        {description ? <span className="block text-[13px] leading-5 text-ink-muted sm:text-[14px]">{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-aria-pressed:border-accent group-aria-pressed:bg-accent group-aria-pressed:text-white"
      >
        {selected ? <Check className="animate-pop-in size-3.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

function StepperButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-12 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-xs transition-[transform,background-color] duration-150 hover:bg-surface-muted active:scale-90"
    >
      {children}
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="animate-fade-in mt-2 text-center text-[13px] leading-5 font-medium text-danger">
      {message}
    </p>
  );
}

/** Butoanele de jos: lipite de marginea ecranului pe telefon, deasupra tastaturii. */
function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto -mx-4 flex flex-col gap-2 bg-linear-to-t from-canvas from-70% to-canvas/0 px-4 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-10 sm:pb-12">
      {children}
    </div>
  );
}

function PrimaryButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={buttonStyles({ size: "lg", className: "shine group h-14 w-full rounded-full text-[16px] font-semibold shadow-accent" })}
    >
      {children}
      <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

function SecondaryButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" {...props} className={buttonStyles({ variant: "ghost", size: "lg", className: "h-12 w-full rounded-full" })}>
      {children}
    </button>
  );
}
