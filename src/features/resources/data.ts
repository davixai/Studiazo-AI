// Resurse pentru studenții din Iași. Doar linkuri oficiale, verificate manual (titlul paginii confirmat).
// La adăugare: verifică linkul, actualizează `VERIFIED_AT`. Nu adăuga oferte sau date inventate.

export const VERIFIED_AT = "2026-10-17";

export type Resource = { title: string; description: string; url: string };
export type ResourceGroup = { id: string; title: string; items: Resource[] };

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    id: "universitati",
    title: "Universități",
    items: [
      { title: "Universitatea „Alexandru Ioan Cuza”", description: "Facultăți, orar, burse, admitere.", url: "https://www.uaic.ro/" },
      { title: "Universitatea Tehnică „Gheorghe Asachi”", description: "Facultăți, anunțuri, viața de student.", url: "https://www.tuiasi.ro/" },
      { title: "UMF „Grigore T. Popa”", description: "Facultăți de medicină, farmacie și medicină dentară.", url: "https://www.umfiasi.ro/ro" },
      { title: "Universitatea de Științele Vieții „Ion Ionescu de la Brad”", description: "Agronomie, horticultură, medicină veterinară.", url: "https://iuls.ro/" },
      { title: "Universitatea Națională de Arte „George Enescu”", description: "Muzică, arte plastice, teatru.", url: "https://www.arteiasi.ro/" },
    ],
  },
  {
    id: "camin-cantina",
    title: "Cămine și cantine",
    items: [
      { title: "Cazare — UAIC", description: "Informații oficiale despre cămine și repartizare.", url: "https://www.uaic.ro/studenti/cazare/" },
      { title: "Cantina Gaudeamus — UAIC", description: "Program și informații despre cantină.", url: "https://www.uaic.ro/studenti/cantina/" },
    ],
  },
  {
    id: "studiu",
    title: "Biblioteci și locuri de studiu",
    items: [
      { title: "Biblioteca Centrală Universitară „Mihai Eminescu”", description: "Săli de lectură, program, catalog online.", url: "https://www.bcu-iasi.ro/" },
    ],
  },
  {
    id: "transport",
    title: "Transport",
    items: [{ title: "CTP Iași", description: "Trasee, program și abonamente pentru transportul public.", url: "https://www.sctpiasi.ro/" }],
  },
  {
    id: "joburi",
    title: "Joburi și internshipuri",
    items: [
      { title: "eJobs", description: "Caută „Iași” și filtrează după part-time sau internship.", url: "https://www.ejobs.ro/" },
      { title: "BestJobs", description: "Anunțuri de muncă, inclusiv part-time și remote.", url: "https://www.bestjobs.eu/locuri-de-munca" },
    ],
  },
];
