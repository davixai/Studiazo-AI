// Anunțuri reale de joburi în Iași, potrivite pentru studenți. Fiecare are linkul direct către anunț.
// Totul vine din textul anunțului: tipul (cum îl declară angajatorul), modul de lucru și salariul apar doar
// dacă anunțul le spune. Anunțurile se închid în timp: verifică-le cu `node scripts/check-jobs.mjs`,
// scoate-le pe cele închise, adaugă altele noi și actualizează `JOBS_CHECKED_AT`.

export const JOBS_CHECKED_AT = "2026-10-18";

export const JOB_TYPES = ["part-time", "full-time", "internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  "part-time": "Part-time",
  "full-time": "Full-time",
  internship: "Internship",
};

export const JOB_DOMAINS = ["it", "inginerie", "clienti", "financiar", "marketing", "birou", "magazin"] as const;
export type JobDomain = (typeof JOB_DOMAINS)[number];

export const JOB_DOMAIN_LABELS: Record<JobDomain, string> = {
  it: "IT",
  inginerie: "Inginerie",
  clienti: "Suport clienți",
  financiar: "Financiar și audit",
  marketing: "Marketing",
  birou: "Birou și achiziții",
  magazin: "Magazine și vânzări",
};

export type WorkMode = "la-locatie" | "hibrid" | "remote";
export const WORK_MODE_LABELS: Record<WorkMode, string> = { "la-locatie": "La locație", hibrid: "Hibrid", remote: "Remote" };

export type Job = {
  /** ID-ul anunțului pe LinkedIn; din el se face linkul direct. */
  id: string;
  title: string;
  company: string;
  /** Unde anume în Iași, când anunțul spune (magazin, zonă). */
  place?: string;
  type: JobType;
  domain: JobDomain;
  /** Doar dacă anunțul îl spune. */
  mode?: WorkMode;
  /** Doar dacă anunțul îl publică, exact cum îl publică. */
  salary?: string;
  /** Programul, când anunțul îl descrie. */
  schedule?: string;
  /** Anunțul se adresează explicit studenților (internship, program pentru studenți). */
  forStudents: boolean;
  /** Anunțul spune că nu e nevoie de experiență sau că e doar un avantaj. */
  noExperience: boolean;
  /** Ce spune anunțul despre experiență. */
  experienceNote: string;
  description: string;
  requirements: string[];
  benefits: string[];
  /** Data publicării pe LinkedIn (AAAA-LL-ZZ). */
  postedAt: string;
  /** Cuvinte din numele facultății/specializării pentru care jobul e potrivit. */
  fits: string[];
};

export const JOBS: Job[] = [
  {
    id: "4479358628",
    title: "Internship în audit (part-time sau full-time)",
    company: "EY",
    type: "internship",
    domain: "financiar",
    schedule: "Perioadă determinată: noiembrie 2026 – aprilie 2027, part-time sau full-time",
    forStudents: true,
    noExperience: true,
    experienceNote: "Fără experiență: caută studenți sau absolvenți recenți",
    description:
      "Lucrezi în echipa de audit: participi la întâlniri cu clienții, organizezi documentele primite, ajuți la pregătirea și verificarea informațiilor financiare și participi la inventare, cu sprijinul echipei.",
    requirements: [
      "Student sau absolvent, de preferat la Economie",
      "Română și engleză bune",
      "Excel de bază (funcții uzuale)",
      "Atenție la detalii și dorința de a învăța",
    ],
    benefits: ["Certificări gratuite și traininguri naționale și internaționale", "Abonament medical, inclusiv pentru familie", "Asigurare de viață și de accidente"],
    postedAt: "2026-10-16",
    fits: ["economi", "fea", "finant", "contabil", "audit", "cibernetic", "administrarea afacerilor"],
  },
  {
    id: "4468148314",
    title: "Software Development Engineer Intern 2027",
    company: "Amazon",
    type: "internship",
    domain: "it",
    mode: "la-locatie",
    schedule: "Full-time, la birou, luni–vineri, până la 40 de ore pe săptămână (de obicei 8–17). Nu trebuie să ai cursuri în timpul programului.",
    forStudents: true,
    noExperience: true,
    experienceNote: "Pentru studenți: un internship tehnic anterior e un avantaj, nu o cerință",
    description:
      "Proiectezi, scrii și pui în funcțiune cod pentru servicii folosite de milioane de clienți, cu un manager și un mentor dedicați. Participi la code review-uri și scrii documentație tehnică.",
    requirements: [
      "Student la licență sau mai sus în Informatică, Calculatoare sau domenii apropiate",
      "Bazele informaticii: programare orientată pe obiecte, algoritmi, structuri de date, sisteme de operare",
      "Experiență cu cel puțin un limbaj (Java, Python, C++, C#, Go, Rust sau TypeScript)",
      "După internship trebuie să-ți mai rămână cel puțin un semestru de studii",
    ],
    benefits: ["Salariu lunar competitiv", "Mentor și manager dedicați", "Poți primi o ofertă pentru un post de absolvent sau un al doilea internship"],
    postedAt: "2026-10-13",
    fits: ["informatic", "calculatoare", "automatic", "electronic", "matematic", "cibernetic"],
  },
  {
    id: "4476134993",
    title: "Internship în Project Management Office",
    company: "Schaeffler",
    type: "internship",
    domain: "birou",
    forStudents: true,
    noExperience: true,
    experienceNote: "Pentru studenți, fără experiență cerută",
    description:
      "Creezi coșuri de cumpărături și comenzi de achiziție în SAP, verifici prețuri, cantități și termene, urmărești comenzile până la livrare și ții legătura cu furnizorii.",
    requirements: [
      "Student în prezent",
      "Engleză la nivel avansat",
      "Excel avansat, Power BI și Power Automate",
      "Noțiuni de bază de SAP și multă atenție la cifre",
    ],
    benefits: ["Asigurare medicală privată și de viață", "Tichete de masă și bonusuri de performanță", "Program flexibil, adaptat rolului"],
    postedAt: "2026-10-06",
    fits: ["economi", "fea", "management", "inginerie economic", "logistic", "administrarea afacerilor"],
  },
  {
    id: "4479530931",
    title: "Hardware Test Engineer – Internship",
    company: "AUMOVIO",
    type: "internship",
    domain: "inginerie",
    forStudents: true,
    noExperience: true,
    experienceNote: "Pentru studenți în anul 4 sau la master",
    description:
      "Testezi unități electronice de control (ECU) pentru suspensii active: pregătești montaje de test, lucrezi cu osciloscop, multimetru și surse, măsori circuite și scrii rapoarte. Îți poți face și lucrarea de licență sau de master cu sprijinul echipei.",
    requirements: [
      "Student în anul 4 sau la master (Electronică și Telecomunicații, Inginerie Electrică, Bioinginerie, Automatică și Calculatoare)",
      "Citești o schemă electronică și o foaie de catalog a unei componente",
      "Engleză B1/B2",
    ],
    benefits: ["Bonus anual", "Tichete de masă de 35 de lei", "Program flexibil"],
    postedAt: "2026-10-14",
    fits: ["electronic", "telecomunicatii", "etti", "inginerie electrica", "electrotehnic", "bioinginerie", "automatic", "calculatoare"],
  },
  {
    id: "4479539582",
    title: "Hardware Designer în producția de serie – Internship",
    company: "AUMOVIO",
    type: "internship",
    domain: "inginerie",
    forStudents: true,
    noExperience: true,
    experienceNote: "Pentru studenți în anul 4 sau la master",
    description:
      "Analizezi scheme și componente pentru unitățile de control produse în serie, faci documentația pentru schimbările de componente și prezinți rapoartele echipei de proiect. Îți poți face și lucrarea de licență cu sprijinul echipei.",
    requirements: [
      "Student în anul 4 la licență sau la master (Electronică și Telecomunicații, Inginerie Electrică, Bioinginerie, Automatică și Calculatoare)",
      "Cunoștințe de bază despre circuite electronice",
      "Engleză B1/B2 și abilități de prezentare",
    ],
    benefits: ["Bonus anual", "Tichete de masă de 35 de lei", "Program flexibil"],
    postedAt: "2026-10-14",
    fits: ["electronic", "telecomunicatii", "etti", "inginerie electrica", "electrotehnic", "bioinginerie", "automatic", "calculatoare"],
  },
  {
    id: "4475599238",
    title: "Red Bull Student Marketeer",
    company: "Red Bull",
    type: "part-time",
    domain: "marketing",
    schedule: "Part-time, program flexibil (nu de la 9 la 17), pe lângă facultate",
    forStudents: true,
    noExperience: true,
    experienceNote: "Pentru studenți, fără experiență cerută",
    description:
      "Ești ambasadorul Red Bull în campus: organizezi acțiuni pentru studenți, faci sampling, ajuți la evenimente și lucrezi cu echipa de vânzări ca Red Bull să fie prezent în magazinele din zonă.",
    requirements: [
      "Student, implicat în viața de campus și în evenimentele din oraș",
      "Comunicare foarte bună",
      "Poți împăca un job part-time cu facultatea",
      "Permis auto categoria B",
    ],
    benefits: ["Program flexibil", "Experiență în marketing, negociere și vânzări"],
    postedAt: "2026-10-05",
    fits: ["marketing", "comunicare", "relatii publice", "economi", "fea", "jurnalism", "sport"],
  },
  {
    id: "4478406499",
    title: "Customer Agent cu franceză și engleză",
    company: "Concentrix",
    type: "full-time",
    domain: "clienti",
    mode: "la-locatie",
    forStudents: false,
    noExperience: true,
    experienceNote: "Fără experiență: training plătit",
    description:
      "Ești principalul punct de contact pentru clienții unei companii de tehnologie financiară: îi ajuți la telefon și pe email și faci activități de back-office pentru conturile lor, la biroul din Iași.",
    requirements: ["Franceză fluentă", "Engleză avansată", "Atenție la detalii"],
    benefits: ["Training complet plătit", "Contract pe perioadă nedeterminată", "Salariu atractiv"],
    postedAt: "2026-10-14",
    fits: ["litere", "limbi", "filologie", "traduc", "francez", "relatii internationale", "economi", "fea"],
  },
  {
    id: "4445517444",
    title: "Customer Agent cu germană și engleză",
    company: "Concentrix",
    type: "full-time",
    domain: "clienti",
    mode: "la-locatie",
    forStudents: false,
    noExperience: true,
    experienceNote: "Fără experiență: training plătit",
    description:
      "Ești principalul punct de contact pentru clienții unei companii de tehnologie financiară: îi ajuți la telefon și pe email și faci activități de back-office pentru conturile lor, la biroul din Iași.",
    requirements: ["Germană fluentă", "Engleză avansată", "Atenție la detalii"],
    benefits: ["Training complet plătit", "Contract pe perioadă nedeterminată", "Salariu atractiv"],
    postedAt: "2026-10-03",
    fits: ["litere", "limbi", "filologie", "traduc", "german", "relatii internationale", "economi", "fea"],
  },
  {
    id: "4479544623",
    title: "Agent cu italiană – chat (bancar)",
    company: "Concentrix",
    type: "full-time",
    domain: "clienti",
    mode: "hibrid",
    schedule: "Full-time sau part-time, la alegere; hibrid, de acasă și de la biroul din Iași",
    forStudents: false,
    noExperience: true,
    experienceNote: "Fără experiență: training plătit integral",
    description: "Oferi suport doar prin chat (fără apeluri) pentru conturi curente, carduri și servicii bancare, după procedurile băncii.",
    requirements: ["Italiană la nivel avansat", "Diplomă de bacalaureat", "Lucrezi bine pe calculator (Windows, Office)"],
    benefits: ["Poți alege full-time sau part-time", "Training plătit integral", "Contract pe perioadă nedeterminată și beneficii flexibile"],
    postedAt: "2026-10-14",
    fits: ["litere", "limbi", "filologie", "traduc", "italian", "economi", "fea"],
  },
  {
    id: "4477569843",
    title: "Travel Agent cu engleză",
    company: "Conduent",
    type: "full-time",
    domain: "clienti",
    mode: "hibrid",
    schedule: "Full-time, hibrid, după un training de 8 săptămâni la biroul din Iași",
    forStudents: false,
    noExperience: true,
    experienceNote: "Experiența în relații cu clienții e recomandată, dar nu obligatorie",
    description:
      "Construiești pachete de vacanță și itinerarii de croazieră pentru clienți internaționali: răspunzi la telefon, email și chat, faci rezervări și modificări și recomanzi destinații.",
    requirements: ["Engleză B2 sau mai bine, scris și vorbit", "Microsoft Office", "Atenție la detalii"],
    benefits: ["Training de 8 săptămâni", "Promovare din interior (aproximativ 70% dintre team leaderi)"],
    postedAt: "2026-10-12",
    fits: ["litere", "limbi", "turism", "geografi", "economi", "fea", "comunicare"],
  },
  {
    id: "4474969388",
    title: "Junior QA Engineer",
    company: "GlobalLogic",
    type: "full-time",
    domain: "it",
    forStudents: false,
    noExperience: false,
    experienceNote: "Cere 1–2 ani de testare manuală",
    description:
      "Testezi o platformă nouă de comunicare și conferințe pe dispozitivele partenerilor unui client mare din IT: scrii cazuri de test, găsești cauza problemelor și faci rapoarte de bug.",
    requirements: ["1–2 ani de testare manuală", "Testare pe dispozitive Android", "Rapoarte de bug clare și comunicare bună"],
    benefits: ["Proiect la început, cu loc de creștere", "Echipă de learning & development"],
    postedAt: "2026-10-06",
    fits: ["informatic", "calculatoare", "automatic", "electronic", "cibernetic"],
  },
  {
    id: "4474199124",
    title: "IT Support cu engleză",
    company: "SCC Services Romania",
    type: "full-time",
    domain: "it",
    forStudents: false,
    noExperience: false,
    experienceNote: "Nivel de început, dar cere experiență de depanare într-un rol de suport",
    description:
      "Ești primul punct de contact pentru utilizatori: rezolvi probleme de hardware și software, ajuți la rezervarea sălilor și la videoconferințe și înregistrezi solicitările în sistemul de tichete.",
    requirements: ["Engleză foarte bună, scris și vorbit", "Experiență de depanare într-un rol de suport", "Noțiuni de bază de rețelistică"],
    benefits: ["Traininguri tehnice și certificări decontate", "Abonament medical, decont transport", "Tichete de masă și vouchere"],
    postedAt: "2026-10-01",
    fits: ["informatic", "calculatoare", "automatic", "electronic", "telecomunicatii"],
  },
  {
    id: "4478398446",
    title: "1st Line Service Desk Analyst",
    company: "Potentiam",
    type: "full-time",
    domain: "it",
    schedule: "Full-time, cu ture ocazionale seara sau în weekend",
    forStudents: false,
    noExperience: true,
    experienceNote: "Experiența de helpdesk e de dorit, nu obligatorie",
    description:
      "Oferi suport tehnic de prim nivel la telefon, pe email și prin acces la distanță: Windows, Microsoft 365, conturi de utilizator, imprimante și conexiuni. Problemele complexe le escaladezi.",
    requirements: ["Noțiuni de bază de Windows și Microsoft 365", "Engleză bună, scris și vorbit", "Orientare spre client și dorința de a învăța"],
    benefits: ["Clienți din Marea Britanie și Europa", "Dezvoltarea abilităților tehnice"],
    postedAt: "2026-10-12",
    fits: ["informatic", "calculatoare", "automatic", "electronic", "telecomunicatii"],
  },
  {
    id: "4472931486",
    title: "Junior Marketing Specialist",
    company: "Panifcom",
    type: "full-time",
    domain: "marketing",
    forStudents: false,
    noExperience: true,
    experienceNote: "0–2 ani; internshipurile și proiectele din facultate contează",
    description:
      "Ajuți la campaniile de marketing ale brandurilor de panificație, urmărești piața și concurența, contribui la lansări de produse și organizezi degustări și evenimente locale.",
    requirements: ["Studii în curs sau terminate în marketing, comunicare sau economie", "Excel și PowerPoint", "Comunicare bună, scris și vorbit"],
    benefits: ["Tichete de masă", "Decont transport", "Mentorat"],
    postedAt: "2026-10-01",
    fits: ["marketing", "comunicare", "economi", "fea", "relatii publice", "jurnalism"],
  },
  {
    id: "4470442772",
    title: "Contabil junior",
    company: "VEO Worldwide Services",
    type: "full-time",
    domain: "financiar",
    forStudents: false,
    noExperience: false,
    experienceNote: "Cere minimum 1 an în contabilitate",
    description:
      "Înregistrezi facturi, plăți și încasări, reconciliezi conturi bancare, de clienți și de furnizori și pregătești documentele contabile lunare, într-o companie internațională.",
    requirements: ["Studii în Economie, Contabilitate sau domeniu similar", "Minimum 1 an în contabilitate", "Engleză de conversație; franceza e un avantaj"],
    benefits: ["Training inițial și coaching", "O zi liberă de ziua ta", "Beneficii flexibile: tichete de masă, asigurare medicală, abonament la sală"],
    postedAt: "2026-09-22",
    fits: ["economi", "fea", "contabil", "finant"],
  },
  {
    id: "4473646889",
    title: "Junior Accountant – Accounts Receivable",
    company: "Awin",
    type: "full-time",
    domain: "financiar",
    mode: "hibrid",
    schedule: "Full-time, hibrid, cu săptămână flexibilă de 4 zile (o zi mai ușoară sau liberă), la salariu întreg",
    forStudents: false,
    noExperience: false,
    experienceNote: "Cere 1–2 ani de contabilitate",
    description:
      "Răspunzi la întrebările clienților despre facturi și plăți, identifici încasările nealocate, faci reconcilieri de creanțe și ajuți la închiderea de lună.",
    requirements: ["Licență în contabilitate sau domeniu apropiat", "1–2 ani de contabilitate", "Excel și engleză fluentă"],
    benefits: ["Săptămână flexibilă de 4 zile", "Lucru hibrid", "Bani lunar pentru costurile de acasă și mobilier de birou"],
    postedAt: "2026-10-05",
    fits: ["economi", "fea", "contabil", "finant"],
  },
  {
    id: "4477952283",
    title: "Lucrător comercial part-time",
    company: "Kaufland",
    place: "Magazinul Alexandru cel Bun",
    type: "part-time",
    domain: "magazin",
    mode: "la-locatie",
    salary: "4.125 lei brut pe lună pentru 6 ore pe zi, plus bonuri de masă",
    schedule: "6 ore pe zi, în ture, inclusiv în weekend și de sărbători",
    forStudents: false,
    noExperience: true,
    experienceNote: "Experiența într-un post similar e un avantaj, nu o cerință",
    description:
      "Aprovizionezi rafturile, verifici termenele de valabilitate, ții ordinea în magazin și servești clienții la vitrină, la grill și la casa de marcat.",
    requirements: ["Studii medii", "Disponibilitate pentru ture, weekend și sărbători legale", "Seriozitate și amabilitate"],
    benefits: ["Contract pe perioadă nedeterminată", "Asigurare de sănătate privată", "Abonament la sală (Sanopass Fit)"],
    postedAt: "2026-10-13",
    fits: [],
  },
  {
    id: "4477246240",
    title: "Personal de serviciu part-time (4 ore)",
    company: "Lidl",
    place: "Magazinul Tudor Neculai",
    type: "part-time",
    domain: "magazin",
    mode: "la-locatie",
    salary: "Venit mediu brut de 4.390 lei pe lună pentru această normă (cu tichete, bonusuri și sporuri)",
    schedule: "4 ore pe zi, ture de dimineață sau după-amiază și în weekend; 2 zile libere în timpul săptămânii",
    forStudents: false,
    noExperience: true,
    experienceNote: "Fără experiență cerută",
    description: "Te ocupi de curățenia magazinului (sala de vânzare, grupurile sanitare, parcarea) și de zona de reciclare a ambalajelor.",
    requirements: ["Disponibilitate pentru ture și weekend", "Organizat și comunicativ"],
    benefits: ["Orele suplimentare și cele din weekend se plătesc", "Asigurare medicală privată, de viață și de accidente", "Zi liberă de ziua ta"],
    postedAt: "2026-10-11",
    fits: [],
  },
  {
    id: "4473230693",
    title: "Sales Assistant part-time",
    company: "MANGO",
    place: "Mall Moldova",
    type: "part-time",
    domain: "magazin",
    mode: "la-locatie",
    forStudents: false,
    noExperience: true,
    experienceNote: "Experiența în retail de modă e de dorit, nu obligatorie",
    description: "Consiliezi clienții în magazin, ajuți la atingerea țintelor de vânzări și ții magazinul ordonat și aprovizionat.",
    requirements: ["Comunicare foarte bună și atitudine proactivă", "Îți place să lucrezi cu oamenii, în echipă"],
    benefits: ["35% reducere la toate colecțiile MANGO", "Învățare la locul de muncă"],
    postedAt: "2026-09-29",
    fits: ["marketing", "economi", "fea", "design", "arte"],
  },
  {
    id: "4475143517",
    title: "Asistent vânzări",
    company: "JYSK",
    place: "Magazinul Tudor",
    type: "full-time",
    domain: "magazin",
    mode: "la-locatie",
    schedule: "Program flexibil, inclusiv în weekend",
    forStudents: false,
    noExperience: true,
    experienceNote: "Nivel de început, fără experiență cerută",
    description:
      "Vinzi și consiliezi clienții, ții magazinul curat și aprovizionat și ajuți la recepția, despachetarea și depozitarea mărfii (implică și efort fizic).",
    requirements: ["Atitudine prietenoasă și inițiativă", "Disponibilitate și în weekend"],
    benefits: ["Bonus pentru vânzări", "20% reducere la produsele JYSK", "Tichete de masă și asigurare medicală"],
    postedAt: "2026-10-07",
    fits: [],
  },
  {
    id: "4475704155",
    title: "Beauty Advisor",
    company: "The Estée Lauder Companies",
    type: "full-time",
    domain: "magazin",
    mode: "la-locatie",
    schedule: "Program de magazin, inclusiv seara, în weekend și la evenimente",
    forStudents: false,
    noExperience: true,
    experienceNote: "Experiența de makeup e preferată, dar sunt acceptați și amatorii",
    description: "Consiliezi clientele în magazin și le faci machiaj, organizezi evenimente în magazin și ai grijă de felul în care sunt expuse produsele.",
    requirements: ["Pasiune pentru makeup (și nivel amator e acceptat)", "Servire personalizată a clienților", "Program de retail, inclusiv weekend"],
    benefits: ["Training și dezvoltare", "Salariu și beneficii competitive"],
    postedAt: "2026-10-07",
    fits: ["arte", "design", "farmac", "chimie", "marketing"],
  },
  {
    id: "4471740081",
    title: "Graduate Electrical Engineer",
    company: "Arcadis",
    type: "full-time",
    domain: "inginerie",
    forStudents: false,
    noExperience: true,
    experienceNote: "Pentru absolvenți, cu sprijinul inginerilor experimentați",
    description:
      "Proiectezi, sub supravegherea unor ingineri experimentați, iluminatul, distribuția de energie și sisteme de joasă tensiune pentru clădiri: calcule, scheme, modele 3D și rapoarte tehnice.",
    requirements: [
      "Licență în inginerie electrică, instalații pentru construcții sau domeniu apropiat",
      "AutoCAD și Microsoft Office; Revit e un plus",
      "Engleză foarte bună, scris și vorbit",
    ],
    benefits: ["Lucrezi pe proiecte reale alături de ingineri cu experiență", "Formare continuă"],
    postedAt: "2026-09-29",
    fits: ["inginerie electrica", "electrotehnic", "energetic", "instalatii", "constructii"],
  },
];

/** Linkul direct către anunț. */
export function jobUrl(job: Pick<Job, "id">) {
  return `https://www.linkedin.com/jobs/view/${job.id}/`;
}
