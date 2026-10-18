import { z } from "zod";
import { PREFERRED_TIMES, type PreferredTime } from "@/lib/contracts/domain";
import { IASI_UNIVERSITIES } from "@/lib/iasi";

// Configurarea inițială pe pași (/bun-venit). Opțiunile sunt comune pentru ghid (client) și validarea de pe server.

export const AGE_MIN = 15;
export const AGE_MAX = 99;
export const ONBOARDING_SUBJECTS_MAX = 12;

type Option<T extends string> = { value: T; title: string; description?: string; emoji: string };

export const STUDY_NEEDS = ["examene", "teme", "note", "organizare"] as const;
export type StudyNeed = (typeof STUDY_NEEDS)[number];
export const STUDY_NEED_OPTIONS: Option<StudyNeed>[] = [
  { value: "examene", title: "Am examene în curând", description: "Un plan de învățare rapid, fără stres.", emoji: "🧨" },
  { value: "teme", title: "Ajutor la teme și proiecte", description: "Pas cu pas, cu indicii, nu doar soluția.", emoji: "📝" },
  { value: "note", title: "Vreau note mai bune", description: "Învățat mai inteligent, rezultate mai bune.", emoji: "📈" },
  { value: "organizare", title: "Să mă organizez mai bine", description: "Cursuri, termene și studiu, la un loc.", emoji: "🗓️" },
];

export const STUDY_WORRIES = ["inceput", "volum", "explicatii", "timp", "promovare"] as const;
export type StudyWorry = (typeof STUDY_WORRIES)[number];
export const STUDY_WORRY_OPTIONS: Option<StudyWorry>[] = [
  { value: "inceput", title: "Nu știu de unde să încep", emoji: "🤔" },
  { value: "volum", title: "E prea mult material", emoji: "📚" },
  { value: "explicatii", title: "Nu înțeleg explicațiile", emoji: "💬" },
  { value: "timp", title: "Nu am suficient timp", emoji: "⏰" },
  { value: "promovare", title: "Mă tem că nu voi trece", emoji: "😟" },
];

export const STUDY_GOALS = ["promovare", "nota_buna", "nota_maxima"] as const;
export type StudyGoal = (typeof STUDY_GOALS)[number];
export const STUDY_GOAL_OPTIONS: Option<StudyGoal>[] = [
  { value: "promovare", title: "Doar să trec", description: "Țintesc nota 5–6", emoji: "✅" },
  { value: "nota_buna", title: "Să iau o notă bună", description: "Țintesc nota 8", emoji: "🎯" },
  { value: "nota_maxima", title: "Să iau nota maximă", description: "Țintesc nota 10", emoji: "🏆" },
];

export const PREFERRED_TIME_OPTIONS: Option<PreferredTime>[] = [
  { value: "dimineata", title: "Dimineața", description: "Mintea e limpede devreme.", emoji: "🌅" },
  { value: "pranz", title: "La prânz", description: "Între cursuri, cu energie.", emoji: "☀️" },
  { value: "dupa_amiaza", title: "După-amiaza", description: "După ce se termină orele.", emoji: "🌤️" },
  { value: "seara", title: "Seara", description: "Liniște și concentrare.", emoji: "🌙" },
  { value: "fara_preferinta", title: "Nu contează", description: "Mă adaptez programului.", emoji: "🔀" },
];

type University = (typeof IASI_UNIVERSITIES)[number];

/** Universitățile din Iași, cu numele scurt și facultățile (pentru sugestii; studentul poate scrie orice). */
export const UNIVERSITY_OPTIONS: { value: University; title: string; short: string; emoji: string; faculties: string[] }[] = [
  {
    value: "Universitatea „Alexandru Ioan Cuza” din Iași",
    title: "„Alexandru Ioan Cuza”",
    short: "UAIC",
    emoji: "🏛️",
    faculties: [
      "Facultatea de Biologie",
      "Facultatea de Chimie",
      "Facultatea de Drept",
      "Facultatea de Economie și Administrarea Afacerilor",
      "Facultatea de Educație Fizică și Sport",
      "Facultatea de Filosofie și Științe Social-Politice",
      "Facultatea de Fizică",
      "Facultatea de Geografie și Geologie",
      "Facultatea de Informatică",
      "Facultatea de Istorie",
      "Facultatea de Litere",
      "Facultatea de Matematică",
      "Facultatea de Psihologie și Științe ale Educației",
      "Facultatea de Teologie Ortodoxă",
      "Facultatea de Teologie Romano-Catolică",
    ],
  },
  {
    value: "Universitatea Tehnică „Gheorghe Asachi” din Iași",
    title: "Tehnică „Gheorghe Asachi”",
    short: "TUIASI",
    emoji: "⚙️",
    faculties: [
      "Facultatea de Arhitectură „G. M. Cantacuzino”",
      "Facultatea de Automatică și Calculatoare",
      "Facultatea de Construcții și Instalații",
      "Facultatea de Construcții de Mașini și Management Industrial",
      "Facultatea de Design Industrial și Managementul Afacerilor",
      "Facultatea de Electronică, Telecomunicații și Tehnologia Informației",
      "Facultatea de Hidrotehnică, Geodezie și Ingineria Mediului",
      "Facultatea de Inginerie Chimică și Protecția Mediului „Cristofor Simionescu”",
      "Facultatea de Inginerie Electrică, Energetică și Informatică Aplicată",
      "Facultatea de Mecanică",
      "Facultatea de Știința și Ingineria Materialelor",
    ],
  },
  {
    value: "Universitatea de Medicină și Farmacie „Grigore T. Popa” din Iași",
    title: "Medicină și Farmacie „Grigore T. Popa”",
    short: "UMF",
    emoji: "🩺",
    faculties: ["Facultatea de Medicină", "Facultatea de Medicină Dentară", "Facultatea de Farmacie", "Facultatea de Bioinginerie Medicală"],
  },
  {
    value: "Universitatea de Științele Vieții „Ion Ionescu de la Brad” din Iași",
    title: "Științele Vieții „Ion Ionescu de la Brad”",
    short: "IULS",
    emoji: "🌾",
    faculties: [
      "Facultatea de Agricultură",
      "Facultatea de Horticultură",
      "Facultatea de Ingineria Resurselor Animale și Alimentare",
      "Facultatea de Medicină Veterinară",
    ],
  },
  {
    value: "Universitatea Națională de Arte „George Enescu” din Iași",
    title: "Arte „George Enescu”",
    short: "UNAGE",
    emoji: "🎻",
    faculties: [
      "Facultatea de Interpretare, Compoziție și Studii Muzicale Teoretice",
      "Facultatea de Arte Vizuale și Design",
      "Facultatea de Teatru",
    ],
  },
];

export function facultiesFor(university: string): string[] {
  return UNIVERSITY_OPTIONS.find((u) => u.value === university)?.faculties ?? [];
}

const SUBJECT_SUGGESTIONS: { match: RegExp; subjects: string[] }[] = [
  {
    match: /informatic|calculatoare|automatic/i,
    subjects: ["Structuri de date", "Algoritmi", "Programare orientată pe obiecte", "Baze de date", "Sisteme de operare", "Rețele de calculatoare"],
  },
  { match: /medicin|farmac|bioinginer/i, subjects: ["Anatomie", "Biochimie", "Fiziologie", "Histologie", "Biologie celulară", "Farmacologie"] },
  {
    match: /econom|afacer|management/i,
    subjects: ["Microeconomie", "Macroeconomie", "Contabilitate", "Statistică", "Finanțe", "Marketing"],
  },
  { match: /drept/i, subjects: ["Drept civil", "Drept constituțional", "Drept penal", "Drept roman", "Drept administrativ"] },
  { match: /matematic/i, subjects: ["Analiză matematică", "Algebră liniară", "Geometrie", "Ecuații diferențiale", "Probabilități"] },
  {
    match: /electr|mecanic|construc|hidro|material|chimic|arhitect/i,
    subjects: ["Analiză matematică", "Algebră liniară", "Fizică", "Mecanică", "Rezistența materialelor", "Desen tehnic"],
  },
  { match: /psiholog|educați/i, subjects: ["Psihologie generală", "Psihologia dezvoltării", "Statistică", "Metodologia cercetării"] },
  { match: /litere|filolog/i, subjects: ["Literatură română", "Lingvistică", "Teoria literaturii", "Limba engleză"] },
];

const DEFAULT_SUBJECTS = ["Matematică", "Statistică", "Limba engleză", "Programare", "Metodologia cercetării"];

/** Sugestii de materii după facultate (prioritar), apoi după specializare; doar un punct de plecare. */
export function suggestSubjects(faculty: string, specialization = ""): string[] {
  const byText = (text: string) => (text.trim() ? SUBJECT_SUGGESTIONS.find((s) => s.match.test(text))?.subjects : undefined);
  return byText(faculty) ?? byText(specialization) ?? DEFAULT_SUBJECTS;
}

/** Numele materiei, curățat: fără spații în plus. */
export function cleanSubjectName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

/** Păstrează prima apariție a fiecărei materii (fără diferență de majuscule) și elimină golurile. */
export function uniqueSubjects(names: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = cleanSubjectName(raw);
    const key = name.toLocaleLowerCase("ro");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim());
const optionalText = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.string().transform(emptyToNull).pipe(z.enum(values).nullable());
const enumList = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).transform((list) => [...new Set(list)]);

/** Răspunsurile din configurare după care asistentul își adaptează sfaturile. */
export type StudyProfile = {
  age: number | null;
  needs: StudyNeed[];
  worries: StudyWorry[];
  goal: StudyGoal | null;
  /** Momentele zilei în care se concentrează (gol = nu contează). */
  times: PreferredTime[];
};

/** Mai multe momente ale zilei; „Nu contează” nu se păstrează în listă (lista goală înseamnă exact asta). */
export const preferredTimesList = enumList(PREFERRED_TIMES).transform((list) => list.filter((t) => t !== "fara_preferinta"));

export const OnboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Spune-ne cum te numești.").max(120, "Numele poate avea cel mult 120 de caractere."),
  age: z
    .string()
    .transform((v) => (v.trim() === "" ? null : Number(v)))
    .pipe(
      z
        .number(`Vârsta trebuie să fie între ${AGE_MIN} și ${AGE_MAX} de ani.`)
        .int(`Vârsta trebuie să fie între ${AGE_MIN} și ${AGE_MAX} de ani.`)
        .min(AGE_MIN, `Vârsta trebuie să fie între ${AGE_MIN} și ${AGE_MAX} de ani.`)
        .max(AGE_MAX, `Vârsta trebuie să fie între ${AGE_MIN} și ${AGE_MAX} de ani.`)
        .nullable(),
    ),
  university: optionalText(160),
  faculty: optionalText(160),
  specialization: optionalText(160),
  studyYear: z
    .string()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().min(1).max(6).nullable()),
  needs: enumList(STUDY_NEEDS),
  worries: enumList(STUDY_WORRIES),
  goal: optionalEnum(STUDY_GOALS),
  preferredTimes: preferredTimesList,
  subjects: z
    .array(z.string().max(120, "Numele unei materii poate avea cel mult 120 de caractere."))
    .transform(uniqueSubjects)
    .pipe(z.array(z.string()).max(ONBOARDING_SUBJECTS_MAX, `Poți adăuga cel mult ${ONBOARDING_SUBJECTS_MAX} materii acum.`)),
  next: z.enum(["materii", "azi"]).catch("azi"),
});

export type OnboardingValues = z.infer<typeof OnboardingSchema>;
