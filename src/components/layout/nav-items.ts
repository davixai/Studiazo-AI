import { BriefcaseBusiness, CalendarDays, Compass, Flame, GraduationCap, House, LibraryBig, Route, Sparkles, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Afișat în bara de jos pe mobil */ mobile: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/azi", label: "Acasă", icon: House, mobile: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, mobile: true },
  { href: "/materii", label: "Materii", icon: LibraryBig, mobile: true },
  // Pe mobil bara de jos are deja 7 secțiuni; Classroom se deschide din Profil și din meniul de sus.
  { href: "/classroom", label: "Classroom", icon: GraduationCap, mobile: false },
  { href: "/asistent", label: "Asistent", icon: Sparkles, mobile: true },
  // Pe mobil se deschide apăsând pe streak, pe Acasă.
  { href: "/progres", label: "Progres", icon: Flame, mobile: false },
  { href: "/buget", label: "Buget", icon: Wallet, mobile: true },
  { href: "/joburi", label: "Joburi", icon: BriefcaseBusiness, mobile: true },
  { href: "/resurse", label: "Resurse Iași", icon: Compass, mobile: true },
  // Pe mobil se deschide din Resurse Iași.
  { href: "/trasee", label: "Trasee", icon: Route, mobile: false },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
