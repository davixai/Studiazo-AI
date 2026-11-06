import type { ResponseInputItem } from "openai/resources/responses/responses";
import type { ProposalStatus } from "@/lib/contracts/proposals";

// Istoricul trimis modelului. Mesajele salvate au doar textul, nu și apelurile de instrumente; fără o notă,
// modelul vede „ți-am pregătit o propunere” fără nicio propunere și o reface la mesajul următor.

export type HistoryRow = { role: string; content: string; metadata: unknown };
export type ProposalNote = { status: ProposalStatus; kind: "task" | "study_sessions"; items: number };

const STATUS_TEXT: Record<ProposalStatus, string> = {
  pending: "încă așteaptă confirmarea studentului",
  confirmed: "studentul a salvat-o în calendar",
  rejected: "studentul a refuzat-o (a apăsat «Renunță»)",
  expired: "a expirat fără să fie salvată",
};

export function proposalIdsOf(metadata: unknown): string[] {
  const ids = (metadata as { proposalIds?: unknown } | null)?.proposalIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

/** Rândurile (în ordine cronologică) ca intrări pentru model, cu starea propunerilor din fiecare răspuns. */
export function toHistory(rows: HistoryRow[], notes: Map<string, ProposalNote>): ResponseInputItem[] {
  return rows.map((row) => {
    const role = row.role === "assistant" ? "assistant" : "user";
    const described = proposalIdsOf(row.metadata)
      .map((id) => notes.get(id))
      .filter((note): note is ProposalNote => note !== undefined)
      .map((note) => `${note.kind === "study_sessions" ? `${note.items} sesiuni de studiu` : `${note.items} teme/examene`}: ${STATUS_TEXT[note.status]}`);
    const content = described.length > 0 ? `${row.content}\n\n[Notă de la aplicație: în acest mesaj ai pregătit o propunere (${described.join("; ")}).]` : row.content;
    return { role, content };
  });
}
