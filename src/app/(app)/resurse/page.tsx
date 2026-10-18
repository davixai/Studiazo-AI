import { ArrowRight, ArrowUpRight, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfile } from "@/features/profile/queries";
import { CITY_RESOURCES, VERIFIED_AT, resourcesFor, type Resource } from "@/features/resources/data";
import { formatDateLong } from "@/lib/time/format";
import { fromLocal } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Resurse Iași" };

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export default async function ResourcesPage() {
  const profile = await getProfile();
  const { university, faculty } = resourcesFor(profile);
  const verified = formatDateLong(fromLocal(VERIFIED_AT, "12:00"));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Resurse Iași"
        description={
          university
            ? `Linkurile oficiale de care ai nevoie ca student ${university.short}${faculty ? ", plus facultatea ta" : ""}, și ce e util în tot orașul.`
            : "Linkurile oficiale de care ai nevoie ca student, după universitatea și facultatea ta."
        }
      />

      {university ? (
        <>
          {faculty ? (
            <a
              href={faculty.url}
              target="_blank"
              rel="noopener noreferrer"
              className="lift group stagger flex items-center gap-4 rounded-lg border border-accent-line bg-accent-soft p-4 shadow-sm active:scale-[0.99] sm:p-5"
            >
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface text-accent-ink">
                <GraduationCap className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold tracking-wide text-accent-ink uppercase">Facultatea ta</span>
                <span className="mt-0.5 block text-[15px] leading-5 font-bold text-ink">{faculty.name}</span>
                <span className="mt-1 block truncate text-xs text-ink-muted">{hostOf(faculty.url)} · orar, anunțuri, secretariat</span>
              </span>
              <ArrowUpRight
                className="size-5 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(se deschide într-o filă nouă)</span>
            </a>
          ) : null}

          <section aria-labelledby="universitatea-ta">
            <h2 id="universitatea-ta" className="mb-3 text-sm font-semibold text-ink">
              {university.name}
            </h2>
            <ResourceGrid
              items={[{ title: "Site-ul universității", description: "Anunțuri, facultăți și contact.", url: university.site }, ...university.items]}
            />
            {!faculty ? (
              <p className="mt-3 text-[13px] text-ink-muted">
                Scrie-ți facultatea în{" "}
                <Link href="/profil" className="font-medium text-accent hover:underline">
                  profil
                </Link>{" "}
                ca să apară aici și site-ul ei.
              </p>
            ) : null}
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface">
          <EmptyState
            icon={<GraduationCap />}
            title="Spune-ne unde studiezi"
            description="Alege universitatea și facultatea în profil, iar aici apar burse, cazare, cantină, note și site-ul facultății tale."
            action={
              <ButtonLink href="/profil">
                Completează profilul <ArrowRight aria-hidden="true" />
              </ButtonLink>
            }
          />
        </div>
      )}

      <section aria-labelledby="pentru-toti">
        <h2 id="pentru-toti" className="mb-3 text-sm font-semibold text-ink">
          Pentru toți studenții din Iași
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CITY_RESOURCES.map((item) => (
            <li key={item.url} className="reveal">
              <ResourceLink item={item} />
            </li>
          ))}
          <li className="reveal">
            <Link
              href="/joburi"
              className="lift group flex h-full items-start gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">Joburi pentru studenți</span>
                <span className="mt-1 block text-[13px] leading-5 text-ink-muted">Anunțuri reale din Iași: internshipuri și part-time.</span>
                <span className="mt-2 block text-xs text-ink-faint">în aplicație</span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden="true"
              />
            </Link>
          </li>
        </ul>
      </section>

      <p className="border-t border-line pt-6 text-[13px] leading-6 text-ink-muted">
        Linkuri verificate la {verified}. Informațiile aparțin instituțiilor respective; verifică mereu detaliile pe site-ul oficial.
        {university ? (
          <>
            {" "}
            Nu e universitatea ta?{" "}
            <Link href="/profil" className="font-medium text-accent hover:underline">
              Schimb-o în profil
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}

function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.url} className="reveal">
          <ResourceLink item={item} />
        </li>
      ))}
    </ul>
  );
}

function ResourceLink({ item }: { item: Resource }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="lift group flex h-full items-start gap-4 rounded-lg border border-line bg-surface p-4 shadow-xs active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{item.title}</span>
        <span className="mt-1 block text-[13px] leading-5 text-ink-muted">{item.description}</span>
        <span className="mt-2 block truncate text-xs text-ink-faint">{hostOf(item.url)}</span>
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
        aria-hidden="true"
      />
      <span className="sr-only">(se deschide într-o filă nouă)</span>
    </a>
  );
}
