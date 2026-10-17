import { CalendarDays, Compass, House, LibraryBig, Sparkles, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Afișat în bara de jos pe mobil */ mobile: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/azi", label: "Azi", icon: House, mobile: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, mobile: true },
  { href: "/materii", label: "Materii", icon: LibraryBig, mobile: true },
  { href: "/asistent", label: "Asistent", icon: Sparkles, mobile: true },
  { href: "/resurse", label: "Resurse Iași", icon: Compass, mobile: true },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
