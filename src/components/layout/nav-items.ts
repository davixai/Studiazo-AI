import { BriefcaseBusiness, CalendarDays, Compass, Flame, GraduationCap, House, LibraryBig, Route, Sparkles, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** O frază scurtă, arătată în „Mai mult” pe telefon. */
  detail: string;
  /** La vedere (meniul principal și bara de jos de pe telefon); restul stă sub „Mai mult”. */
  main: boolean;
};

// Simplu: la vedere doar ce folosește studentul zilnic (învață + joburi). Restul rămâne la un clic, sub „Mai mult”.
export const NAV_ITEMS: NavItem[] = [
  { href: "/azi", label: "Acasă", icon: House, detail: "Ziua ta dintr-o privire", main: true },
  { href: "/asistent", label: "Asistent", icon: Sparkles, detail: "AI la orice materie", main: true },
  { href: "/materii", label: "Materii", icon: LibraryBig, detail: "Cursurile tale", main: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, detail: "Orarul și termenele", main: true },
  { href: "/joburi", label: "Joburi", icon: BriefcaseBusiness, detail: "Part-time și stagii potrivite", main: true },
  { href: "/progres", label: "Progres", icon: Flame, detail: "Zile la rând și timp învățat", main: false },
  { href: "/classroom", label: "Classroom", icon: GraduationCap, detail: "Importă cursurile și temele", main: false },
  { href: "/buget", label: "Buget", icon: Wallet, detail: "Unde se duc banii", main: false },
  { href: "/resurse", label: "Resurse Iași", icon: Compass, detail: "Burse, cămin, cantină", main: false },
  { href: "/trasee", label: "Trasee", icon: Route, detail: "Drumul prin oraș", main: false },
];

export const MAIN_ITEMS = NAV_ITEMS.filter((i) => i.main);
export const MORE_ITEMS = NAV_ITEMS.filter((i) => !i.main);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
