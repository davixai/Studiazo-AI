"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, isActive } from "./nav-items";

type AppNavProps = { userName: string; userDetail: string | null };

/** Bara laterală (≥ lg). */
export function Sidebar({ userName, userDetail }: AppNavProps) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-canvas px-4 py-5 lg:flex">
      <Link href="/azi" className="mx-2 mb-8 rounded-md" aria-label="StudIA — Azi">
        <Logo />
      </Link>
      <nav aria-label="Navigare principală" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-muted hover:bg-surface-sunken/60 hover:text-ink",
              )}
            >
              <Icon className={cn("size-4.5", active ? "text-accent" : "text-ink-faint group-hover:text-ink-muted")} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Link
          href="/profil"
          aria-current={isActive(pathname, "/profil") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-sunken/60",
            isActive(pathname, "/profil") && "bg-surface shadow-sm ring-1 ring-line",
          )}
        >
          <Avatar name={userName} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{userName || "Profilul meu"}</span>
            {userDetail ? <span className="block truncate text-xs text-ink-muted">{userDetail}</span> : null}
          </span>
        </Link>
      </div>
    </aside>
  );
}

/** Bara de sus (< lg): logo + profil. */
export function MobileTopBar({ userName }: { userName: string }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/80 lg:hidden">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/azi" className="rounded-md" aria-label="StudIA — Azi">
          <Logo />
        </Link>
        <Link href="/profil" className="rounded-full" aria-label="Profilul meu">
          <Avatar name={userName} />
        </Link>
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
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {NAV_ITEMS.filter((i) => i.mobile).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="size-5.5" strokeWidth={active ? 2.1 : 1.8} />
                <span className="max-w-full truncate px-1">{label === "Resurse Iași" ? "Resurse" : label}</span>
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
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold tracking-wide text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
