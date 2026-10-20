// Locurile gata alese din pagina Trasee: universitățile și facultățile din Iași (aceeași listă ca în Resurse),
// biblioteci și câteva repere. Coordonatele sunt luate din OpenStreetMap (căutare Photon/Nominatim, 2026-10-20).
// Facultățile care nu au un punct propriu în OpenStreetMap folosesc clădirea principală a universității
// și sunt marcate `approx`, ca interfața să spună asta. Nu adăuga coordonate ghicite.

export type LatLng = { lat: number; lng: number };

export type Place = LatLng & {
  id: string;
  name: string;
  /** Rândul mic de sub nume (universitatea, adresa). */
  detail?: string;
  group: PlaceGroup;
  /** Punctul este clădirea principală a universității, nu clădirea facultății. */
  approx?: boolean;
};

export const PLACE_GROUPS = ["Universități", "UAIC", "TUIASI", "UMF", "IULS", "UNAGE", "Biblioteci", "Repere"] as const;
export type PlaceGroup = (typeof PLACE_GROUPS)[number];

const UAIC_MAIN = { lat: 47.174251, lng: 27.571137 }; // Corpul A, Bd. Carol I 11
const TUIASI_MAIN = { lat: 47.154272, lng: 27.597008 }; // Str. Prof. Anton Șesan (campusul Tudor Vladimirescu)
const UMF_MAIN = { lat: 47.168363, lng: 27.584467 }; // Str. Universității 16
const UMF_KOGALNICEANU = { lat: 47.17343, lng: 27.579936 }; // Str. Mihail Kogălniceanu 9-13
const IULS_MAIN = { lat: 47.191475, lng: 27.556558 }; // Pavilionul Central, Aleea Mihail Sadoveanu 3
const UNAGE_MAIN = { lat: 47.16459, lng: 27.577558 }; // Str. Horia 7-9

const uaicApprox = (id: string, name: string): Place => ({ id, name, group: "UAIC", detail: "UAIC · Corpul A, Bd. Carol I 11", approx: true, ...UAIC_MAIN });

export const PLACES: Place[] = [
  { id: "uaic", name: "Universitatea „Alexandru Ioan Cuza”", detail: "Corpul A, Bd. Carol I 11", group: "Universități", ...UAIC_MAIN },
  { id: "tuiasi", name: "Universitatea Tehnică „Gheorghe Asachi”", detail: "Campusul Tudor Vladimirescu", group: "Universități", ...TUIASI_MAIN },
  { id: "umf", name: "Universitatea de Medicină și Farmacie „Grigore T. Popa”", detail: "Str. Universității 16", group: "Universități", ...UMF_MAIN },
  { id: "iuls", name: "Universitatea de Științele Vieții „Ion Ionescu de la Brad”", detail: "Aleea Mihail Sadoveanu 3", group: "Universități", ...IULS_MAIN },
  { id: "unage", name: "Universitatea Națională de Arte „George Enescu”", detail: "Str. Horia 7-9", group: "Universități", ...UNAGE_MAIN },

  { id: "uaic-bio", name: "Facultatea de Biologie", detail: "UAIC · Aleea Veronica Micle", group: "UAIC", lat: 47.174638, lng: 27.57416 },
  uaicApprox("uaic-chimie", "Facultatea de Chimie"),
  uaicApprox("uaic-drept", "Facultatea de Drept"),
  { id: "uaic-feaa", name: "Facultatea de Economie și Administrarea Afacerilor", detail: "UAIC · Bd. Carol I 20A", group: "UAIC", lat: 47.175311, lng: 27.573624 },
  { id: "uaic-sport", name: "Facultatea de Educație Fizică și Sport", detail: "UAIC · Str. Toma Cozma", group: "UAIC", lat: 47.172182, lng: 27.571567 },
  uaicApprox("uaic-fssp", "Facultatea de Filosofie și Științe Social-Politice"),
  uaicApprox("uaic-fizica", "Facultatea de Fizică"),
  { id: "uaic-geo", name: "Facultatea de Geografie și Geologie", detail: "UAIC · Bd. Carol I 20A", group: "UAIC", lat: 47.174951, lng: 27.573928 },
  { id: "uaic-info", name: "Facultatea de Informatică", detail: "UAIC · Str. General Berthelot 16", group: "UAIC", lat: 47.173984, lng: 27.574863 },
  { id: "uaic-istorie", name: "Facultatea de Istorie", detail: "UAIC · Bd. Carol I", group: "UAIC", lat: 47.175391, lng: 27.572268 },
  uaicApprox("uaic-litere", "Facultatea de Litere"),
  uaicApprox("uaic-mate", "Facultatea de Matematică"),
  uaicApprox("uaic-psih", "Facultatea de Psihologie și Științe ale Educației"),
  { id: "uaic-teo-ort", name: "Facultatea de Teologie Ortodoxă", detail: "UAIC · Str. Cloșca 9", group: "UAIC", lat: 47.162385, lng: 27.580734 },
  uaicApprox("uaic-teo-cat", "Facultatea de Teologie Romano-Catolică"),

  { id: "tuiasi-arh", name: "Facultatea de Arhitectură „G. M. Cantacuzino”", detail: "TUIASI · Bd. Mangeron 3", group: "TUIASI", lat: 47.152718, lng: 27.589454 },
  { id: "tuiasi-ac", name: "Facultatea de Automatică și Calculatoare", detail: "TUIASI · Bd. Mangeron 27", group: "TUIASI", lat: 47.153886, lng: 27.593992 },
  { id: "tuiasi-ci", name: "Facultatea de Construcții și Instalații", detail: "TUIASI · Bd. Mangeron 1", group: "TUIASI", lat: 47.152241, lng: 27.589035 },
  { id: "tuiasi-cmmi", name: "Facultatea de Construcții de Mașini și Management Industrial", detail: "TUIASI · Bd. Mangeron 59A", group: "TUIASI", lat: 47.153802, lng: 27.596924 },
  { id: "tuiasi-dima", name: "Facultatea de Design Industrial și Managementul Afacerilor", detail: "TUIASI · Bd. Mangeron 29", group: "TUIASI", lat: 47.153888, lng: 27.594822 },
  { id: "tuiasi-etti", name: "Facultatea de Electronică, Telecomunicații și Tehnologia Informației", detail: "TUIASI · Bd. Carol I 11", group: "TUIASI", lat: 47.174798, lng: 27.571092 },
  { id: "tuiasi-hgim", name: "Facultatea de Hidrotehnică, Geodezie și Ingineria Mediului", detail: "TUIASI · Bd. Mangeron 65", group: "TUIASI", lat: 47.155052, lng: 27.599888 },
  { id: "tuiasi-icpm", name: "Facultatea de Inginerie Chimică și Protecția Mediului „Cristofor Simionescu”", detail: "TUIASI · Bd. Mangeron 53A", group: "TUIASI", lat: 47.155607, lng: 27.603028 },
  { id: "tuiasi-ieeia", name: "Facultatea de Inginerie Electrică, Energetică și Informatică Aplicată", detail: "TUIASI · Bd. Mangeron 51-53", group: "TUIASI", lat: 47.153118, lng: 27.593686 },
  { id: "tuiasi-mec", name: "Facultatea de Mecanică", detail: "TUIASI · Bd. Mangeron 61-63", group: "TUIASI", lat: 47.154029, lng: 27.597939 },
  { id: "tuiasi-sim", name: "Facultatea de Știința și Ingineria Materialelor", detail: "TUIASI · Str. Melodiei", group: "TUIASI", lat: 47.154814, lng: 27.597532 },

  { id: "umf-med", name: "Facultatea de Medicină", detail: "UMF · Str. Universității 16", group: "UMF", approx: true, ...UMF_MAIN },
  { id: "umf-dent", name: "Facultatea de Medicină Dentară", detail: "UMF · Str. Universității 16", group: "UMF", approx: true, ...UMF_MAIN },
  { id: "umf-farm", name: "Facultatea de Farmacie", detail: "UMF · Str. Universității 16", group: "UMF", approx: true, ...UMF_MAIN },
  { id: "umf-bio", name: "Facultatea de Bioinginerie Medicală", detail: "UMF · Str. Mihail Kogălniceanu 9-13", group: "UMF", ...UMF_KOGALNICEANU },
  { id: "umf-sanatate", name: "Facultatea de Științe ale Sănătății", detail: "UMF · Str. Universității 16", group: "UMF", approx: true, ...UMF_MAIN },

  { id: "iuls-agri", name: "Facultatea de Agricultură", detail: "IULS · Aleea Mihail Sadoveanu 3", group: "IULS", approx: true, ...IULS_MAIN },
  { id: "iuls-hort", name: "Facultatea de Horticultură", detail: "IULS · Aleea Mihail Sadoveanu 3", group: "IULS", approx: true, ...IULS_MAIN },
  { id: "iuls-iraa", name: "Facultatea de Ingineria Resurselor Animale și Alimentare", detail: "IULS · Aleea Mihail Sadoveanu 3", group: "IULS", approx: true, ...IULS_MAIN },
  { id: "iuls-vet", name: "Facultatea de Medicină Veterinară", detail: "IULS · Aleea Mihail Sadoveanu 3", group: "IULS", approx: true, ...IULS_MAIN },

  { id: "unage-muzica", name: "Facultatea de Interpretare, Compoziție și Studii Muzicale Teoretice", detail: "UNAGE · Str. Horia 7-9", group: "UNAGE", lat: 47.16457, lng: 27.57734 },
  { id: "unage-arte", name: "Facultatea de Arte Vizuale și Design", detail: "UNAGE · Str. Sărărie", group: "UNAGE", lat: 47.181778, lng: 27.571007 },
  { id: "unage-teatru", name: "Facultatea de Teatru", detail: "UNAGE · Str. Horia 7-9", group: "UNAGE", lat: 47.164375, lng: 27.577887 },

  { id: "bcu", name: "Biblioteca Centrală Universitară „Mihai Eminescu”", detail: "Str. Păcurari 4", group: "Biblioteci", lat: 47.170261, lng: 27.575235 },
  { id: "bib-academie", name: "Biblioteca Academiei Române", detail: "Bd. Carol I 8", group: "Biblioteci", lat: 47.173156, lng: 27.574013 },
  { id: "bib-istorie-litere", name: "Biblioteca Istorie-Litere (BCU)", detail: "Str. Gheorghe Asachi 12", group: "Biblioteci", lat: 47.176951, lng: 27.573098 },
  { id: "bib-judeteana", name: "Biblioteca Județeană „Gheorghe Asachi”", detail: "Bd. Ștefan cel Mare și Sfânt", group: "Biblioteci", lat: 47.162819, lng: 27.581577 },
  { id: "bib-sadoveanu", name: "Biblioteca Județeană · Filiala „Mihail Sadoveanu”", detail: "Bd. Alexandru cel Bun 30", group: "Biblioteci", lat: 47.162682, lng: 27.566326 },

  { id: "gara", name: "Gara Iași", detail: "Piața Gării 1", group: "Repere", lat: 47.165532, lng: 27.569868 },
  { id: "unirii", name: "Piața Unirii", detail: "Centru", group: "Repere", lat: 47.166691, lng: 27.580116 },
  { id: "palas", name: "Palas", detail: "Centru", group: "Repere", lat: 47.156425, lng: 27.587655 },
];

/** Comparare fără diacritice și fără majuscule, pentru filtrarea listei. */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[„”"“]/g, "")
    .toLowerCase()
    .trim();
}

export function filterPlaces(query: string, places: Place[] = PLACES) {
  const q = normalize(query);
  if (!q) return places;
  const words = q.split(/\s+/);
  return places.filter((p) => {
    const hay = normalize(`${p.name} ${p.detail ?? ""} ${p.group}`);
    return words.every((w) => hay.includes(w));
  });
}
