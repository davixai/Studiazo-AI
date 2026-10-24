"use client";

import { ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { LiveClockCard, LiveClockCompact } from "./live-clock";
import { NAV_ITEMS, isActive } from "./nav-items";

const MOBILE_ITEMS = NAV_ITEMS.filter((i) => i.mobile);

type AppNavProps = { userName: string; userDetail: string | null };

/** Bara laterală (≥ lg). */
export function Sidebar({ userName, userDetail }: AppNavProps) {
  const pathname = usePathname();
  return (
    // Pe ecranele joase (laptop 1280×720, zoom în browser) meniul se derulează, ca profilul de jos să rămână accesibil.
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-line/70 bg-surface px-4 py-6 [scrollbar-width:thin] lg:flex">
      <Link href="/azi" className="mx-2 mb-5 rounded-md" aria-label="Studiazo AI — Acasă">
        <Logo />
      </Link>
      <LiveClockCard className="mb-7" />
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase">Meniu</p>
      <nav aria-label="Navigare principală" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-200",
                active ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              <Icon
                className={cn("size-[18px] transition-colors", active ? "text-accent" : "text-ink-faint group-hover:text-ink-muted")}
                strokeWidth={2}
              />
              {label}
              {active ? <span className="absolute inset-y-2 -left-4 w-1 animate-indicator-in rounded-r-full bg-accent" aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Link
          href="/profil"
          aria-current={isActive(pathname, "/profil") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-line/80 bg-surface-muted/60 p-2.5 transition-colors hover:border-line-strong hover:bg-surface-muted",
            isActive(pathname, "/profil") && "border-accent-line bg-accent-soft",
          )}
        >
          <Avatar name={userName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{userName || "Profilul meu"}</span>
            <span className="block truncate text-xs text-ink-muted">{userDetail ?? "Vezi profilul"}</span>
          </span>
          <ChevronRight className="size-4 text-ink-faint" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

/** Bara de sus (< lg): logo + profil. */
export function MobileTopBar({ userName }: { userName: string }) {
  return (
    <header className="pt-safe sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/azi" className="rounded-md" aria-label="Studiazo AI — Acasă">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <LiveClockCompact />
          <Link
            href="/classroom"
            aria-label="Google Classroom"
            className="flex size-9 items-center justify-center rounded-full border border-line/70 bg-surface text-ink-soft transition-colors hover:text-ink"
          >
            <GraduationCap className="size-[18px]" aria-hidden="true" />
          </Link>
          <Link href="/profil" className="rounded-full" aria-label="Profilul meu">
            <Avatar name={userName} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Bara de jos (< lg): ținte mari pentru deget, zona sigură respectată. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigare principală"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-surface/90 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl px-1 max-[389px]:px-0" style={{ gridTemplateColumns: `repeat(${MOBILE_ITEMS.length}, minmax(0, 1fr))` }}>
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors",
                  active ? "text-accent" : "text-ink-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-11 max-w-full items-center justify-center rounded-full transition-all duration-300",
                    active && "animate-pop-in bg-accent-soft",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.3 : 1.9} />
                </span>
                {/* Sub 390px (majoritatea telefoanelor Android au 360px) etichetele se strâng puțin, ca să nu se taie. */}
                <span className="max-w-full truncate px-1 max-[389px]:px-0 max-[389px]:text-[10px] max-[389px]:tracking-[-0.02em]">
                  {label === "Resurse Iași" ? "Resurse" : label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold tracking-wide text-white ring-2 ring-surface",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
