import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RoutePlanner } from "@/features/directions/components/route-planner";
import type { TravelMode } from "@/features/directions/osm";
import { PLACES, placeFromParam } from "@/features/directions/places";
import { getProfile } from "@/features/profile/queries";
import { resourcesFor } from "@/features/resources/data";

export const metadata: Metadata = { title: "Trasee" };

const MODES: TravelMode[] = ["foot", "car", "bike"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DirectionsPage({ searchParams }: PageProps<"/trasee">) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  // Facultatea din profil (aceleași nume ca în Resurse), pentru scurtătura „Facultatea ta”.
  const faculty = resourcesFor(profile).faculty;
  const homePlace = faculty ? (PLACES.find((p) => p.name === faculty.name) ?? null) : null;
  const mode = one(params.mod);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Trasee"
        description="Cum ajungi de la o facultate la alta, la bibliotecă, la cămin sau oriunde în Iași: pe jos, cu mașina sau cu bicicleta."
      />
      <RoutePlanner
        initialFrom={placeFromParam(one(params.de))}
        initialTo={placeFromParam(one(params.la))}
        initialMode={MODES.includes(mode as TravelMode) ? (mode as TravelMode) : "foot"}
        homePlace={homePlace}
      />
    </div>
  );
}
