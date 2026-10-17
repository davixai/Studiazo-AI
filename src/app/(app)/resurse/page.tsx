import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RESOURCE_GROUPS, VERIFIED_AT } from "@/features/resources/data";
import { formatDateLong } from "@/lib/time/format";
import { fromLocal } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Resurse Iași" };

export default function ResourcesPage() {
  const verified = formatDateLong(fromLocal(VERIFIED_AT, "12:00"));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Resurse Iași"
        description="Linkuri oficiale utile pentru viața de student: universități, cămine, biblioteci, transport și joburi."
      />

      <div className="flex flex-col gap-10">
        {RESOURCE_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={group.id}>
            <h2 id={group.id} className="mb-3 text-sm font-semibold text-ink">
              {group.title}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <li key={item.url} className="reveal">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lift group flex h-full items-start gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs active:scale-[0.99]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{item.title}</span>
                      <span className="mt-1 block text-[13px] leading-5 text-ink-muted">{item.description}</span>
                      <span className="mt-2 block truncate text-xs text-ink-faint">{new URL(item.url).hostname.replace(/^www\./, "")}</span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(se deschide într-o filă nouă)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="border-t border-line pt-6 text-[13px] leading-6 text-ink-muted">
        Linkuri verificate la {verified}. Informațiile aparțin instituțiilor respective; verifică mereu detaliile pe site-ul
        oficial.
      </p>
    </div>
  );
}
