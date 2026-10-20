import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RoutePlanner } from "@/features/directions/components/route-planner";

export const metadata: Metadata = { title: "Trasee" };

export default function DirectionsPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Trasee"
        description="Cum ajungi de la o facultate la alta, la bibliotecă sau oriunde în Iași: pe jos, cu mașina sau cu bicicleta."
      />
      <RoutePlanner />
    </div>
  );
}
