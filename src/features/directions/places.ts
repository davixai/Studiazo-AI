// Locurile gata alese din pagina Trasee: universitățile și facultățile din Iași (aceeași listă ca în Resurse),
// biblioteci, cămine, cantine și repere. Coordonatele sunt luate din OpenStreetMap (căutare Photon/Nominatim, verificate punct cu punct prin căutare inversă, 2026-10-20).
// Facultățile care nu au un punct propriu în OpenStreetMap folosesc clădirea principală a universității
// și sunt marcate `approx`, ca interfața să spună asta. Nu adăuga coordonate ghicite.
//
// Locurile pentru timpul liber (cafenele, restaurante, cluburi, supermarketuri, farmacii non-stop, cinema, sport) au fost alese de echipă
// din surse publice (site-urile oficiale ale lanțurilor, Colegiul Farmaciștilor, Zile și Nopți, Tripadvisor) și verificate pe 2026-11-07:
// fiecare are în OpenStreetMap un punct cu același nume la adresa din listă, iar coordonatele sunt ale acelui punct.
// Excepție: magazinele dintr-un mall care nu au punct propriu folosesc coordonatele mall-ului (scrie „Iulius Mall” / „Palas Mall”).
// Ce nu s-a găsit pe hartă sau nu era confirmat ca deschis a rămas pe dinafară.

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

export const PLACE_GROUPS = [
  "Universități",
  "UAIC",
  "TUIASI",
  "UMF",
  "IULS",
  "UNAGE",
  "Biblioteci",
  "Cămine și cantine",
  "Repere",
  "Cafenele",
  "Restaurante",
  "Cluburi și baruri",
  "Supermarketuri",
  "Farmacii non-stop",
  "Timp liber",
] as const;
export type PlaceGroup = (typeof PLACE_GROUPS)[number];

const UAIC_MAIN = { lat: 47.174251, lng: 27.571137 }; // Corpul A, Bd. Carol I 11
const TUIASI_MAIN = { lat: 47.154272, lng: 27.597008 }; // Str. Prof. Anton Șesan (campusul Tudor Vladimirescu)
const UMF_MAIN = { lat: 47.168363, lng: 27.584467 }; // Str. Universității 16
const UMF_KOGALNICEANU = { lat: 47.17343, lng: 27.579936 }; // Str. Mihail Kogălniceanu 9-13
const IULS_MAIN = { lat: 47.191475, lng: 27.556558 }; // Pavilionul Central, Aleea Mihail Sadoveanu 3
const UNAGE_MAIN = { lat: 47.16457, lng: 27.57734 }; // Str. Costache Negruzzi 7-9 (fosta Horia)

const uaicApprox = (id: string, name: string): Place => ({ id, name, group: "UAIC", detail: "UAIC · Corpul A, Bd. Carol I 11", approx: true, ...UAIC_MAIN });

export const PLACES: Place[] = [
  { id: "uaic", name: "Universitatea „Alexandru Ioan Cuza”", detail: "Corpul A, Bd. Carol I 11", group: "Universități", ...UAIC_MAIN },
  { id: "tuiasi", name: "Universitatea Tehnică „Gheorghe Asachi”", detail: "Campusul Tudor Vladimirescu", group: "Universități", ...TUIASI_MAIN },
  { id: "umf", name: "Universitatea de Medicină și Farmacie „Grigore T. Popa”", detail: "Str. Universității 16", group: "Universități", ...UMF_MAIN },
  { id: "iuls", name: "Universitatea de Științele Vieții „Ion Ionescu de la Brad”", detail: "Aleea Mihail Sadoveanu 3", group: "Universități", ...IULS_MAIN },
  { id: "unage", name: "Universitatea Națională de Arte „George Enescu”", detail: "Str. Costache Negruzzi 7-9", group: "Universități", ...UNAGE_MAIN },

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
  { id: "tuiasi-icpm", name: "Facultatea de Inginerie Chimică și Protecția Mediului „Cristofor Simionescu”", detail: "TUIASI · Campusul Tudor Vladimirescu", group: "TUIASI", lat: 47.155607, lng: 27.603028 },
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

  { id: "unage-muzica", name: "Facultatea de Interpretare, Compoziție și Studii Muzicale Teoretice", detail: "UNAGE · Str. Costache Negruzzi 7-9", group: "UNAGE", lat: 47.16457, lng: 27.57734 },
  { id: "unage-arte", name: "Facultatea de Arte Vizuale și Design", detail: "UNAGE · Str. Sărărie", group: "UNAGE", lat: 47.181778, lng: 27.571007 },
  { id: "unage-teatru", name: "Facultatea de Teatru", detail: "UNAGE · Str. Costache Negruzzi 7-9", group: "UNAGE", lat: 47.164375, lng: 27.577887 },

  { id: "bcu", name: "Biblioteca Centrală Universitară „Mihai Eminescu”", detail: "Str. Păcurari 4", group: "Biblioteci", lat: 47.170261, lng: 27.575235 },
  { id: "bib-academie", name: "Biblioteca Academiei Române", detail: "Bd. Carol I 8", group: "Biblioteci", lat: 47.173156, lng: 27.574013 },
  { id: "bib-istorie-litere", name: "Biblioteca Istorie-Litere (BCU)", detail: "Str. Gheorghe Asachi 12", group: "Biblioteci", lat: 47.176951, lng: 27.573098 },
  { id: "bib-judeteana", name: "Biblioteca Județeană „Gheorghe Asachi”", detail: "Bd. Ștefan cel Mare și Sfânt", group: "Biblioteci", lat: 47.162819, lng: 27.581577 },
  { id: "bib-umf", name: "Biblioteca UMF „Grigore T. Popa”", detail: "Pasajul Cuza Vodă", group: "Biblioteci", lat: 47.166092, lng: 27.583893 },
  { id: "bib-usv", name: "Biblioteca Universității de Științele Vieții", detail: "Aleea Mihail Sadoveanu 3", group: "Biblioteci", lat: 47.191951, lng: 27.556217 },
  { id: "bib-sadoveanu", name: "Biblioteca Județeană · Filiala „Mihail Sadoveanu”", detail: "Bd. Alexandru cel Bun 30", group: "Biblioteci", lat: 47.162682, lng: 27.566326 },

  { id: "camin-gaudeamus", name: "Căminul „Gaudeamus”", detail: "Campusul Codrescu · Str. Teodor Codrescu 1", group: "Cămine și cantine", lat: 47.177672, lng: 27.572686 },
  { id: "cantina-gaudeamus", name: "Cantina „Gaudeamus”", detail: "Str. Teodor Codrescu 1", group: "Cămine și cantine", lat: 47.177737, lng: 27.572198 },
  { id: "cantina-titu", name: "Cantina Titu Maiorescu (UAIC)", detail: "Str. Titu Maiorescu", group: "Cămine și cantine", lat: 47.174453, lng: 27.569726 },
  { id: "campus-targusor", name: "Campusul Târgușor Copou", detail: "Copou", group: "Cămine și cantine", lat: 47.187557, lng: 27.563788 },
  { id: "campus-tudor", name: "Complexul studențesc Tudor Vladimirescu", detail: "Căminele TUIASI · Bd. Tudor Vladimirescu", group: "Cămine și cantine", lat: 47.155763, lng: 27.607986 },
  { id: "cantina-tudor", name: "Cantina campusului Tudor Vladimirescu", detail: "Aleea Prof. Vasile Petrescu", group: "Cămine și cantine", lat: 47.154484, lng: 27.609974 },
  { id: "ccs", name: "Casa de Cultură a Studenților", detail: "Str. Vasile Conta 30", group: "Cămine și cantine", lat: 47.170343, lng: 27.577282 },

  { id: "gara", name: "Gara Iași", detail: "Piața Gării 1", group: "Repere", lat: 47.165532, lng: 27.569868 },
  { id: "unirii", name: "Piața Unirii", detail: "Centru", group: "Repere", lat: 47.166691, lng: 27.580116 },
  { id: "palas", name: "Palas", detail: "Centru", group: "Repere", lat: 47.156425, lng: 27.587655 },
  { id: "palatul-culturii", name: "Palatul Culturii", detail: "Bd. Ștefan cel Mare și Sfânt 1", group: "Repere", lat: 47.157307, lng: 27.586261 },
  { id: "teatrul-national", name: "Teatrul Național „Vasile Alecsandri”", detail: "Str. Agatha Bârsescu 18", group: "Repere", lat: 47.163439, lng: 27.585404 },
  { id: "mitropolia", name: "Mitropolia Moldovei și Bucovinei", detail: "Bd. Ștefan cel Mare și Sfânt 16", group: "Repere", lat: 47.161369, lng: 27.582085 },
  { id: "primaria", name: "Primăria Iași", detail: "Bd. Ștefan cel Mare și Sfânt 11", group: "Repere", lat: 47.161761, lng: 27.584173 },
  { id: "parcul-copou", name: "Parcul Copou", detail: "Copou", group: "Repere", lat: 47.178888, lng: 27.566802 },
  { id: "gradina-botanica", name: "Grădina Botanică „Anastasie Fătu”", detail: "Str. Dumbrava Roșie", group: "Repere", lat: 47.185125, lng: 27.553392 },
  { id: "spital-spiridon", name: "Spitalul Clinic Județean de Urgență „Sf. Spiridon”", detail: "Bd. Independenței 1", group: "Repere", lat: 47.168796, lng: 27.583009 },
  { id: "spital-copii", name: "Spitalul Clinic de Urgență pentru Copii „Sf. Maria”", detail: "Str. Vasile Lupu 62", group: "Repere", lat: 47.159331, lng: 27.607352 },
  { id: "iulius", name: "Iulius Mall", detail: "Bd. Tudor Vladimirescu", group: "Repere", lat: 47.155289, lng: 27.605741 },
  { id: "stadion", name: "Stadionul „Emil Alexandrescu”", detail: "Str. George Coșbuc", group: "Repere", lat: 47.184565, lng: 27.561198 },
  { id: "sala-polivalenta", name: "Sala Polivalentă", detail: "Str. Sfântul Constantin", group: "Repere", lat: 47.154331, lng: 27.588424 },
  { id: "aeroport", name: "Aeroportul Internațional Iași", detail: "Drumul Aeroportului", group: "Repere", lat: 47.179896, lng: 27.62038 },

  { id: "cafe-gist-specialty-coffee-shop", name: "Gist Specialty Coffee Shop", detail: "Str. Cuza Vodă 4", group: "Cafenele", lat: 47.165144, lng: 27.581836 },
  { id: "cafe-jassyro-specialty-coffee-to-go", name: "Jassyro Specialty Coffee To Go", detail: "Bd. Ștefan cel Mare 1C", group: "Cafenele", lat: 47.164778, lng: 27.58096 },
  { id: "cafe-fika", name: "Fika", detail: "Piața Unirii 7", group: "Cafenele", lat: 47.165227, lng: 27.580005 },
  { id: "cafe-harmony-cafe", name: "Harmony Cafe", detail: "Bd. Carol I 27", group: "Cafenele", lat: 47.177062, lng: 27.569485 },
  { id: "cafe-tucano-coffee-india", name: "Tucano Coffee India", detail: "Bd. Ștefan cel Mare 52", group: "Cafenele", lat: 47.160894, lng: 27.583869 },
  { id: "cafe-tucano-coffee-indonesia-iulius-mall", name: "Tucano Coffee Indonesia (Iulius Mall)", detail: "Iulius Mall", group: "Cafenele", lat: 47.155214, lng: 27.605742 },
  { id: "cafe-navar-specialty-coffee", name: "Navar Specialty Coffee", detail: "Bd. Ștefan cel Mare 18-20", group: "Cafenele", lat: 47.160613, lng: 27.584216 },
  { id: "cafe-coffee-story", name: "Coffee Story", detail: "Str. Sfântul Lazăr 30", group: "Cafenele", lat: 47.157012, lng: 27.590606 },
  { id: "cafe-cafeneaua-noastra", name: "Cafeneaua Noastră", detail: "Str. Sfântul Lazăr 30", group: "Cafenele", lat: 47.157051, lng: 27.590621 },
  { id: "cafe-acaju-cafe", name: "Acaju Cafe", detail: "Str. Anastasie Fătu 2A", group: "Cafenele", lat: 47.169108, lng: 27.574 },
  { id: "cafe-bistro-la-noi", name: "Bistro „La noi”", detail: "Bd. Ștefan cel Mare 8", group: "Cafenele", lat: 47.163389, lng: 27.581655 },

  { id: "rest-toujours", name: "Toujours", detail: "Str. Gându 2", group: "Restaurante", lat: 47.166083, lng: 27.576913 },
  { id: "rest-mamma-mia", name: "Mamma Mia", detail: "Bd. Ștefan cel Mare 10-12", group: "Restaurante", lat: 47.164192, lng: 27.580807 },
  { id: "rest-cuib", name: "Cuib", detail: "Str. Gavriil Musicescu 14", group: "Restaurante", lat: 47.167189, lng: 27.576743 },
  { id: "rest-blue-acqua", name: "Blue Acqua", detail: "Șos. Arcu 78", group: "Restaurante", lat: 47.17143, lng: 27.564634 },
  { id: "rest-romeo-e-giulietta", name: "Romeo e Giulietta", detail: "Piața Unirii 2", group: "Restaurante", lat: 47.166817, lng: 27.579964 },
  { id: "rest-oscar", name: "Oscar", detail: "Str. Lascăr Catargi 12-16", group: "Restaurante", lat: 47.171156, lng: 27.579525 },
  { id: "rest-andalu-gastrobar", name: "Andalu Gastrobar", detail: "Str. Codrescu 6", group: "Restaurante", lat: 47.17865, lng: 27.572949 },
  { id: "rest-popeyes-mall-moldova", name: "Popeyes Mall Moldova", detail: "Mall Moldova, Șos. Păcurari 121", group: "Restaurante", lat: 47.167955, lng: 27.516447 },
  { id: "rest-popeyes-palas", name: "Popeyes Palas", detail: "Palas Mall", group: "Restaurante", lat: 47.157772, lng: 27.589879 },
  { id: "rest-hesburger-mall-moldova", name: "Hesburger Mall Moldova", detail: "Mall Moldova, Șos. Păcurari 121", group: "Restaurante", lat: 47.167669, lng: 27.516501 },

  { id: "bar-rock-n-rolla", name: "Rock'n'Rolla", detail: "Str. Grigore Ghica Vodă 14", group: "Cluburi și baruri", lat: 47.160614, lng: 27.595288 },
  { id: "bar-la-baza", name: "La Bază", detail: "Galeriile Ștefan cel Mare, demisol", group: "Cluburi și baruri", lat: 47.162707, lng: 27.581466 },
  { id: "bar-the-gate-bar", name: "The Gate Bar", detail: "Bd. Ștefan cel Mare 8B", group: "Cluburi și baruri", lat: 47.163124, lng: 27.581413 },
  { id: "bar-beer-zone", name: "Beer Zone", detail: "Str. Alexandru Lăpușneanu 16", group: "Cluburi și baruri", lat: 47.167887, lng: 27.578988 },
  { id: "bar-taverna-music-pub", name: "Taverna Music Pub", detail: "Pasajul Comercial Ștefan cel Mare, demisol", group: "Cluburi și baruri", lat: 47.162863, lng: 27.58127 },

  { id: "mag-lidl-pantelimon-halipa", name: "Lidl Pantelimon Halipa", detail: "Str. Pantelimon Halipa 3C", group: "Supermarketuri", lat: 47.152179, lng: 27.573076 },
  { id: "mag-lidl-vasile-lupu", name: "Lidl Vasile Lupu", detail: "Str. Vasile Lupu 78", group: "Supermarketuri", lat: 47.15993, lng: 27.610098 },
  { id: "mag-lidl-tabacului", name: "Lidl Tabacului", detail: "Str. Tabacului 7A", group: "Supermarketuri", lat: 47.16991, lng: 27.553406 },
  { id: "mag-lidl-chimiei", name: "Lidl Chimiei", detail: "Bd. Chimiei 2A", group: "Supermarketuri", lat: 47.153321, lng: 27.604891 },
  { id: "mag-lidl-primaverii", name: "Lidl Primăverii", detail: "Bd. Primăverii 2", group: "Supermarketuri", lat: 47.147287, lng: 27.593508 },
  { id: "mag-lidl-poitiers", name: "Lidl Poitiers", detail: "Bd. Poitiers 1", group: "Supermarketuri", lat: 47.137617, lng: 27.596296 },
  { id: "mag-lidl-bucium", name: "Lidl Bucium", detail: "Șos. Bucium 53E", group: "Supermarketuri", lat: 47.127169, lng: 27.618069 },
  { id: "mag-lidl-moara-de-foc", name: "Lidl Moara de Foc", detail: "Șos. Moara de Foc 2", group: "Supermarketuri", lat: 47.172946, lng: 27.551722 },
  { id: "mag-lidl-tudor-neculai", name: "Lidl Tudor Neculai", detail: "Aleea Tudor Neculai 50", group: "Supermarketuri", lat: 47.136531, lng: 27.571921 },
  { id: "mag-kaufland-pacurari", name: "Kaufland Păcurari", detail: "Șos. Păcurari 86M", group: "Supermarketuri", lat: 47.174624, lng: 27.536557 },
  { id: "mag-kaufland-tatarasi", name: "Kaufland Tătărași", detail: "Str. Aurel Vlaicu 54A", group: "Supermarketuri", lat: 47.157407, lng: 27.624353 },
  { id: "mag-kaufland-galata", name: "Kaufland Galata", detail: "Șos. Voinești 37", group: "Supermarketuri", lat: 47.145965, lng: 27.556952 },
  { id: "mag-kaufland-alexandru-cel-bun", name: "Kaufland Alexandru cel Bun", detail: "Str. Theodor Râșcanu 6A", group: "Supermarketuri", lat: 47.161361, lng: 27.575891 },
  { id: "mag-kaufland-chimiei", name: "Kaufland Chimiei", detail: "Bd. Chimiei 2D", group: "Supermarketuri", lat: 47.152203, lng: 27.605913 },
  { id: "mag-kaufland-mitropolit-varlaam", name: "Kaufland Mitropolit Varlaam", detail: "Str. Mitropolit Varlaam 20", group: "Supermarketuri", lat: 47.14342, lng: 27.587291 },
  { id: "mag-carrefour-era", name: "Carrefour Era", detail: "Mall Moldova, Șos. Păcurari 121", group: "Supermarketuri", lat: 47.166603, lng: 27.513084 },
  { id: "mag-carrefour-felicia", name: "Carrefour Felicia", detail: "Str. Bucium 36", group: "Supermarketuri", lat: 47.144815, lng: 27.611597 },
  { id: "mag-carrefour-market-hala-centrala", name: "Carrefour Market Hala Centrală", detail: "Str. Anastasie Panu 46", group: "Supermarketuri", lat: 47.161449, lng: 27.590361 },
  { id: "mag-carrefour-market-iulius-mall", name: "Carrefour Market Iulius Mall", detail: "Iulius Mall", group: "Supermarketuri", lat: 47.155374, lng: 27.605494 },
  { id: "mag-carrefour-market-alexandru-cel-bun", name: "Carrefour Market Alexandru cel Bun", detail: "Piața Voievozilor 1", group: "Supermarketuri", lat: 47.162878, lng: 27.564335 },
  { id: "mag-carrefour-market-salciilor", name: "Carrefour Market Sălciilor", detail: "Str. Sălciilor 8", group: "Supermarketuri", lat: 47.143535, lng: 27.577371 },
  { id: "mag-carrefour-express-pacurari", name: "Carrefour Express Păcurari", detail: "Șos. Păcurari 23", group: "Supermarketuri", lat: 47.174515, lng: 27.547082 },
  { id: "mag-carrefour-express-palas", name: "Carrefour Express Palas", detail: "Palas Campus, Str. Sfântul Andrei 39A", group: "Supermarketuri", lat: 47.156604, lng: 27.580597 },
  { id: "mag-carrefour-express-vasile-lupu-esplanada", name: "Carrefour Express Vasile Lupu (Esplanada)", detail: "Str. Vasile Lupu 82A", group: "Supermarketuri", lat: 47.159643, lng: 27.613315 },
  { id: "mag-carrefour-express-gemi", name: "Carrefour Express Gemi", detail: "Calea Galata 5-9", group: "Supermarketuri", lat: 47.153075, lng: 27.570071 },
  { id: "mag-carrefour-express-tatarasi", name: "Carrefour Express Tătărași", detail: "Str. Tătărași 73-75", group: "Supermarketuri", lat: 47.163149, lng: 27.604998 },
  { id: "mag-auchan-palas", name: "Auchan Palas", detail: "Str. Palas 5C", group: "Supermarketuri", lat: 47.155131, lng: 27.588767 },
  { id: "mag-auchan-bucium", name: "Auchan Bucium", detail: "Șos. Bucium 34E", group: "Supermarketuri", lat: 47.131355, lng: 27.612258 },
  { id: "mag-mega-image-copou", name: "Mega Image Copou", detail: "Bd. Carol I 48 · non-stop", group: "Supermarketuri", lat: 47.179951, lng: 27.568569 },
  { id: "mag-mega-image-independentei", name: "Mega Image Independenței", detail: "Bd. Independenței 33", group: "Supermarketuri", lat: 47.165894, lng: 27.589808 },
  { id: "mag-mega-image-stefan-cel-mare", name: "Mega Image Ștefan cel Mare", detail: "Bd. Ștefan cel Mare 9 · non-stop", group: "Supermarketuri", lat: 47.162719, lng: 27.582795 },
  { id: "mag-mega-image-pacurari", name: "Mega Image Păcurari", detail: "Șos. Păcurari 58-64", group: "Supermarketuri", lat: 47.174566, lng: 27.540738 },
  { id: "mag-mega-image-podu-ros", name: "Mega Image Podu Roș", detail: "Str. Nicolina", group: "Supermarketuri", lat: 47.150243, lng: 27.588077 },
  { id: "mag-mega-image-lacului", name: "Mega Image Lacului", detail: "Str. Lacului 16", group: "Supermarketuri", lat: 47.14289, lng: 27.582754 },
  { id: "mag-mega-image-vama-veche", name: "Mega Image Vama Veche", detail: "Str. Gării 22", group: "Supermarketuri", lat: 47.166579, lng: 27.571141 },
  { id: "mag-mega-image-nationala", name: "Mega Image Națională", detail: "Șos. Națională 55-59 · non-stop", group: "Supermarketuri", lat: 47.151827, lng: 27.585861 },
  { id: "mag-shop-go-mircea-cel-batran-1", name: "Shop&Go Mircea cel Bătrân 1", detail: "Str. Mircea cel Bătrân 1 · non-stop", group: "Supermarketuri", lat: 47.155224, lng: 27.570102 },
  { id: "mag-shop-go-basarabi-5a", name: "Shop&Go Basarabi 5A", detail: "Str. Basarabi 5A · non-stop", group: "Supermarketuri", lat: 47.163032, lng: 27.559807 },

  { id: "farm-farmacia-ropharma", name: "Farmacia Ropharma", detail: "Piața Unirii 3 · non-stop", group: "Farmacii non-stop", lat: 47.167358, lng: 27.580808 },
  { id: "farm-farmacia-rosmarin", name: "Farmacia Rosmarin", detail: "Bd. Tudor Vladimirescu 44 · non-stop", group: "Farmacii non-stop", lat: 47.15786, lng: 27.601868 },
  { id: "farm-farmacia-help-flux-med", name: "Farmacia Help Flux Med", detail: "Bd. Tudor Vladimirescu 105 · non-stop", group: "Farmacii non-stop", lat: 47.157265, lng: 27.602905 },

  { id: "liber-cinema-city-iulius-mall", name: "Cinema City Iulius Mall", detail: "Iulius Mall", group: "Timp liber", lat: 47.155767, lng: 27.605483 },
  { id: "liber-cinema-city-mall-moldova", name: "Cinema City Mall Moldova", detail: "Mall Moldova, Șos. Păcurari 121", group: "Timp liber", lat: 47.167074, lng: 27.516697 },
  { id: "liber-world-class-mall-moldova", name: "World Class Mall Moldova", detail: "Mall Moldova, Șos. Păcurari 121", group: "Timp liber", lat: 47.167423, lng: 27.516045 },
  { id: "liber-stay-fit-gym-palas-campus", name: "Stay Fit Gym Palas Campus", detail: "Str. Iancu Bacalu 24", group: "Timp liber", lat: 47.156898, lng: 27.581616 },
  { id: "liber-stay-fit-gym-iulius-mall", name: "Stay Fit Gym Iulius Mall", detail: "Iulius Mall, etaj 1", group: "Timp liber", lat: 47.155214, lng: 27.605742 },
  { id: "liber-stay-fit-gym-palas-mall", name: "Stay Fit Gym Palas Mall", detail: "Palas Mall, etaj 1", group: "Timp liber", lat: 47.157772, lng: 27.589879 },
];

/** Locul în linkul paginii (?de=…&la=…): id-ul din listă sau „lat,lng” pentru adrese și puncte de pe hartă. */
export function placeToParam(place: Place) {
  return PLACES.some((p) => p.id === place.id) ? place.id : `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`;
}

export function placeFromParam(value: string | undefined | null): Place | null {
  if (!value) return null;
  const known = PLACES.find((p) => p.id === value);
  if (known) return known;
  const m = /^(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)$/.exec(value);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < 47.08 || lat > 47.25 || lng < 27.45 || lng > 27.75) return null;
  return { id: `pt-${value}`, name: "Punct pe hartă", group: "Repere", lat, lng };
}

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
