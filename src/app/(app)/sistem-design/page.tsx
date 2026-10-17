import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { isPreviewMode } from "@/lib/env";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Sistem de design" };

// Referință vizuală pentru echipă. Nu apare în navigare și nu este disponibilă în producție.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && !isPreviewMode()) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Pentru echipă" title="Sistem de design" description="Componentele comune și stările lor. Detalii în docs/DESIGN_SYSTEM.md." />
      <Showcase />
    </div>
  );
}
