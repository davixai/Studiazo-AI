"use client";

import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";

export type SubjectTab = "materiale" | "notite";

const OPTIONS: { value: SubjectTab; label: string }[] = [
  { value: "materiale", label: "Materiale" },
  { value: "notite", label: "Notițe" },
];

/**
 * Tab-urile Materiale / Notițe. Ambele panouri vin randate de pe server, deci comutarea e instantă;
 * `?tab=` rămâne în URL ca linkul și reîncărcarea să păstreze tab-ul.
 */
export function SubjectTabs({ initial, materials, notes }: { initial: SubjectTab; materials: ReactNode; notes: ReactNode }) {
  const [tab, setTab] = useState(initial);

  function change(next: SubjectTab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "materiale") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="flex flex-col gap-5">
      <Segmented label="Secțiunile materiei" options={OPTIONS} value={tab} onChange={change} className="w-full sm:w-auto sm:self-start" />
      <div key={tab} className="animate-fade-in">
        {tab === "materiale" ? materials : notes}
      </div>
    </div>
  );
}
