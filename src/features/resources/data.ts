import { IASI_UNIVERSITIES } from "@/lib/iasi";

// Resurse pentru studenții din Iași. Doar linkuri oficiale, verificate manual (pagina se deschide și titlul confirmă).
// La adăugare: verifică linkul, actualizează `VERIFIED_AT`. Nu adăuga oferte sau date inventate.

export const VERIFIED_AT = "2026-10-18";

export type Resource = { title: string; description: string; url: string };

type Faculty = {
  name: string;
  url: string;
  /** Cuvinte (fără diacritice) după care recunoaștem facultatea scrisă de student în profil. */
  match: string[];
};

export type UniversityResources = {
  /** Exact ca în profil (`IASI_UNIVERSITIES`). */
  name: (typeof IASI_UNIVERSITIES)[number];
  short: string;
  site: string;
  items: Resource[];
  faculties: Faculty[];
};

export const UNIVERSITY_RESOURCES: UniversityResources[] = [
  {
    name: "Universitatea „Alexandru Ioan Cuza” din Iași",
    short: "UAIC",
    site: "https://www.uaic.ro/",
    items: [
      { title: "Ghidul studentului", description: "Tot ce trebuie să știi ca student UAIC, într-un singur loc.", url: "https://www.uaic.ro/studenti/ghidul-studentului-uaic/" },
      { title: "Structura anului universitar", description: "Când încep cursurile, sesiunile și vacanțele.", url: "https://www.uaic.ro/studii/structura-anului-universitar/" },
      { title: "Cum îți verifici notele", description: "Notele și situația școlară, în eSIMS.", url: "https://www.uaic.ro/studenti/cum-iti-poti-verifica-notele/" },
      { title: "Burse", description: "Burse de merit, sociale și regulamentul de acordare.", url: "https://www.uaic.ro/studenti/burse/" },
      { title: "Cazare", description: "Cămine, repartizare și tarife.", url: "https://www.uaic.ro/studenti/cazare/" },
      { title: "Cantine", description: "Cantinele universității și programul lor.", url: "https://www.uaic.ro/studenti/cantinele-universitatii-alexandru-ioan-cuza/" },
      { title: "Transport pentru studenți", description: "Reducerile la transportul public și pe tren.", url: "https://www.uaic.ro/studenti/facilitati-de-transport/" },
      { title: "Carieră și consiliere", description: "Serviciul Suport pentru Studenți și Alumni.", url: "https://www.uaic.ro/studenti/cariera/" },
    ],
    faculties: [
      { name: "Facultatea de Biologie", url: "https://www.bio.uaic.ro/", match: ["biologi"] },
      { name: "Facultatea de Chimie", url: "https://www.chem.uaic.ro/", match: ["chimi"] },
      { name: "Facultatea de Drept", url: "https://laws.uaic.ro/", match: ["drept"] },
      { name: "Facultatea de Economie și Administrarea Afacerilor", url: "https://www.feaa.uaic.ro/", match: ["econom", "feaa", "afacer"] },
      { name: "Facultatea de Educație Fizică și Sport", url: "https://www.sport.uaic.ro/", match: ["sport", "educatie fizica"] },
      { name: "Facultatea de Filosofie și Științe Social-Politice", url: "https://www.fssp.uaic.ro/", match: ["filosof", "social", "politic", "fssp", "sociolog"] },
      { name: "Facultatea de Fizică", url: "https://www.uaic.ro/studii/facultati-2/facultatea-de-fizica/", match: ["fizic"] },
      { name: "Facultatea de Geografie și Geologie", url: "https://www.geo.uaic.ro/", match: ["geograf", "geolog"] },
      { name: "Facultatea de Informatică", url: "https://info.uaic.ro/", match: ["informatic"] },
      { name: "Facultatea de Istorie", url: "https://history.uaic.ro/", match: ["istori"] },
      { name: "Facultatea de Litere", url: "https://litere.uaic.ro/", match: ["litere", "filolog", "limb", "jurnalism", "comunicare"] },
      { name: "Facultatea de Matematică", url: "http://www.math.uaic.ro/", match: ["matematic"] },
      { name: "Facultatea de Psihologie și Științe ale Educației", url: "https://www.psih.uaic.ro/", match: ["psiholog", "educatie", "pedagog"] },
      { name: "Facultatea de Teologie Ortodoxă", url: "https://www.teologie.uaic.ro/", match: ["ortodox"] },
      { name: "Facultatea de Teologie Romano-Catolică", url: "https://www.ftrc.uaic.ro/", match: ["catolic"] },
    ],
  },
  {
    name: "Universitatea Tehnică „Gheorghe Asachi” din Iași",
    short: "TUIASI",
    site: "https://www.tuiasi.ro/",
    items: [
      { title: "Cămine", description: "Căminele din campusul „Tudor Vladimirescu”, cazare și tarife.", url: "https://campus.tuiasi.ro/camine/" },
      { title: "Meniul de la cantină", description: "Ce se gătește azi la cantina din campus.", url: "https://campus.tuiasi.ro/meniul-zilei/" },
      { title: "Baza sportivă", description: "Acces gratuit pentru studenți, cu rezervare.", url: "https://campus.tuiasi.ro/baza-sportiva/" },
      { title: "Dispensarul medical", description: "Cabinetul medical din campus.", url: "https://campus.tuiasi.ro/dispensarul-medical/" },
      { title: "Biblioteca universității", description: "Catalog, săli de lectură și program.", url: "https://biblioteca.tuiasi.ro/" },
    ],
    faculties: [
      { name: "Facultatea de Arhitectură „G. M. Cantacuzino”", url: "https://arh.tuiasi.ro/", match: ["arhitect"] },
      { name: "Facultatea de Automatică și Calculatoare", url: "https://ac.tuiasi.ro/", match: ["automatic", "calculatoare"] },
      { name: "Facultatea de Construcții și Instalații", url: "https://ci.tuiasi.ro/", match: ["constructii si instalatii", "instalatii"] },
      { name: "Facultatea de Construcții de Mașini și Management Industrial", url: "https://cmmi.tuiasi.ro/", match: ["masini", "management industrial", "cmmi"] },
      { name: "Facultatea de Design Industrial și Managementul Afacerilor", url: "https://dima.tuiasi.ro/", match: ["design industrial", "dima", "textil"] },
      { name: "Facultatea de Electronică, Telecomunicații și Tehnologia Informației", url: "https://etti.tuiasi.ro/", match: ["electronic", "telecomunicatii", "etti"] },
      { name: "Facultatea de Hidrotehnică, Geodezie și Ingineria Mediului", url: "https://hgim.tuiasi.ro/", match: ["hidrotehnic", "geodezi", "hgim"] },
      { name: "Facultatea de Inginerie Chimică și Protecția Mediului „Cristofor Simionescu”", url: "https://icpm.tuiasi.ro/", match: ["chimic", "icpm"] },
      { name: "Facultatea de Inginerie Electrică, Energetică și Informatică Aplicată", url: "https://ieeia.tuiasi.ro/", match: ["electric", "energetic", "ieeia"] },
      { name: "Facultatea de Mecanică", url: "https://mec.tuiasi.ro/", match: ["mecanic"] },
      { name: "Facultatea de Știința și Ingineria Materialelor", url: "https://sim.tuiasi.ro/", match: ["material"] },
    ],
  },
  {
    name: "Universitatea de Medicină și Farmacie „Grigore T. Popa” din Iași",
    short: "UMF",
    site: "https://www.umfiasi.ro/ro",
    items: [
      { title: "Pagina studentului", description: "Informațiile pentru studenți ale universității.", url: "https://www.umfiasi.ro/ro/academic/student/Pagini/default.aspx" },
      { title: "Burse", description: "Tipurile de burse și regulamentul.", url: "https://www.umfiasi.ro/ro/academic/Pagini/Burse.aspx" },
      { title: "Cazare și facilități", description: "Serviciul Facilități Studenți: cămine și cazare.", url: "https://www.umfiasi.ro/ro/academic/Pagini/Serviciul-Facilit%C4%83%C5%A3i-Studen%C5%A3i.aspx" },
      { title: "Biblioteca universitară", description: "Catalog, baze de date medicale și program.", url: "https://www.umfiasi.ro/ro/academic/biblioteca/Pagini/default.aspx" },
    ],
    faculties: [
      { name: "Facultatea de Medicină Dentară", url: "https://www.umfiasi.ro/ro/academic/facultati/medicina-dentara/Pagini/default.aspx", match: ["dentar", "stomatolog"] },
      { name: "Facultatea de Farmacie", url: "https://www.umfiasi.ro/ro/academic/facultati/farmacie/Pagini/default.aspx", match: ["farmac"] },
      { name: "Facultatea de Bioinginerie Medicală", url: "https://www.umfiasi.ro/ro/academic/facultati/bioinginerie-medicala/Pagini/default.aspx", match: ["bioinginer"] },
      { name: "Facultatea de Științe ale Sănătății", url: "https://www.umfiasi.ro/ro/academic/facultati/stiinte-ale-sanatatii/", match: ["sanatatii", "asistent", "nutriti", "balneo", "kinetoterap"] },
      // Ultima: „medicin” apare și în numele celorlalte.
      { name: "Facultatea de Medicină", url: "https://www.umfiasi.ro/ro/academic/facultati/medicina-generala/Pagini/default.aspx", match: ["medicin"] },
    ],
  },
  {
    name: "Universitatea de Științele Vieții „Ion Ionescu de la Brad” din Iași",
    short: "IULS",
    site: "https://iuls.ro/",
    items: [
      { title: "Situația școlară", description: "Smart Portal: notele și situația ta, cu acces individual.", url: "https://smartportal.iuls.ro/" },
      { title: "Burse de merit și sociale", description: "Tipuri de burse și condiții.", url: "https://iuls.ro/studenti/burse-de-merit-si-sociale/" },
      { title: "Cazare", description: "Căminele universității și repartizarea.", url: "https://iuls.ro/studenti/cazare/" },
      { title: "Cantină", description: "Cantina din campus.", url: "https://iuls.ro/universitate/cantina/" },
      { title: "Transport", description: "Reducerile la transport pentru studenți.", url: "https://iuls.ro/studenti/transport/" },
      { title: "Consiliere și carieră", description: "Centrul de Consiliere și Orientare în Carieră.", url: "https://iuls.ro/studenti/centrul-de-consiliere-si-orientare-in-cariera-ccoc/" },
    ],
    faculties: [
      { name: "Facultatea de Agricultură", url: "https://iuls.ro/agricultura/", match: ["agricult"] },
      { name: "Facultatea de Horticultură", url: "https://iuls.ro/horticultura/", match: ["horticult"] },
      { name: "Facultatea de Ingineria Resurselor Animale și Alimentare", url: "https://iuls.ro/firaa/", match: ["resurse", "alimentar", "zooteh", "firaa"] },
      { name: "Facultatea de Medicină Veterinară", url: "https://iuls.ro/medicina/", match: ["medicina veterinara", "veterin"] },
    ],
  },
  {
    name: "Universitatea Națională de Arte „George Enescu” din Iași",
    short: "UNAGE",
    site: "https://www.arteiasi.ro/",
    items: [
      { title: "Pagina studenților", description: "Anunțuri și informații pentru studenți.", url: "https://www.arteiasi.ro/studenti/" },
      { title: "Burse", description: "Burse de merit, sociale și medicale.", url: "https://www.arteiasi.ro/studenti/burse-unage/" },
      { title: "Cazare", description: "Căminele universității și repartizarea.", url: "https://www.arteiasi.ro/studenti/cazare-unage/" },
      { title: "Consiliere și carieră", description: "Centrul de Consiliere și Orientare în Carieră.", url: "https://www.arteiasi.ro/studenti/centrul-de-consiliere-si-orientare-in-cariera/" },
      { title: "Biblioteca", description: "Program și informații despre bibliotecă.", url: "https://www.arteiasi.ro/informatii-biblioteca/" },
    ],
    faculties: [
      { name: "Facultatea de Interpretare, Compoziție și Studii Muzicale Teoretice", url: "https://www.arteiasi.ro/facultatea-de-interpretare-compozitie-si-studii-muzicale-teoretice/", match: ["muzic", "interpretare", "compozitie"] },
      { name: "Facultatea de Arte Vizuale și Design", url: "https://www.arteiasi.ro/facultatea-de-arte-vizuale-si-design/", match: ["arte vizuale", "design", "arte plastice"] },
      { name: "Facultatea de Teatru", url: "https://www.arteiasi.ro/facultatea-de-teatru/", match: ["teatru", "actorie", "regie"] },
    ],
  },
];

/** Pentru toți studenții din Iași, indiferent de universitate. */
export const CITY_RESOURCES: Resource[] = [
  { title: "Biblioteca Centrală Universitară „Mihai Eminescu”", description: "Săli de lectură, program, catalog online.", url: "https://www.bcu-iasi.ro/" },
  { title: "CTP Iași", description: "Trasee, program și abonamente pentru transportul public.", url: "https://www.sctpiasi.ro/" },
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Cât de sigură e potrivirea: numele exact > cuvântul cheie cel mai lung > nimic (0). */
function matchScore(faculty: Faculty, text: string) {
  if (normalize(faculty.name) === text) return Infinity;
  return Math.max(0, ...faculty.match.filter((word) => text.includes(word)).map((word) => word.length));
}

function bestFaculty(university: UniversityResources, faculty: string | null | undefined) {
  if (!faculty?.trim()) return null;
  const text = normalize(faculty.trim());
  let best: { faculty: Faculty; score: number } | null = null;
  for (const f of university.faculties) {
    const score = matchScore(f, text);
    if (score > 0 && (!best || score > best.score)) best = { faculty: f, score };
  }
  return best;
}

/** Facultatea din lista universității care se potrivește cu ce a scris studentul (numele exact sau un cuvânt cheie). */
export function findFaculty(university: UniversityResources, faculty: string | null | undefined) {
  return bestFaculty(university, faculty)?.faculty ?? null;
}

/**
 * Resursele studentului, după profil: universitatea aleasă; dacă lipsește, cea a cărei facultate
 * se potrivește cel mai bine cu ce a scris (doar dacă nu e la egalitate, ca să nu ghicim greșit).
 */
export function resourcesFor(profile: { university?: string | null; faculty?: string | null } | null) {
  const chosen = UNIVERSITY_RESOURCES.find((u) => u.name === profile?.university);
  if (chosen) return { university: chosen, faculty: findFaculty(chosen, profile?.faculty) };
  const ranked = UNIVERSITY_RESOURCES.map((u) => ({ university: u, best: bestFaculty(u, profile?.faculty) }))
    .filter((r) => r.best)
    .sort((a, b) => b.best!.score - a.best!.score);
  if (ranked.length === 0 || (ranked.length > 1 && ranked[0].best!.score === ranked[1].best!.score)) return { university: null, faculty: null };
  return { university: ranked[0].university, faculty: ranked[0].best!.faculty };
}
