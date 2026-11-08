import "server-only";
import { PREVIEW_SUBJECTS } from "@/lib/preview/fixtures";
import { fromLocal, shiftDateKey, toDateKey } from "@/lib/time/zone";
import type { DailyResult } from "./actions";

// Doar pentru modul previzualizare (STUDIA_PREVIEW=1, fără Supabase și fără AI): cum arată mesajul zilei.

export function previewDailyMessage(now = new Date()): Extract<DailyResult, { ok: true }> {
  const tomorrow = shiftDateKey(toDateKey(now), 1);
  const poo = PREVIEW_SUBJECTS[1]!;
  return {
    ok: true,
    conversationId: "00000000-0000-4000-8000-000000000d01",
    message: {
      id: "00000000-0000-4000-8000-000000000d02",
      role: "assistant",
      content:
        "Salut, Andrei! Mâine ai laborator de POO, iar vineri e testul. Știu că termini sesiunile mai ales seara, așa că îți propun o recapitulare de 45 de minute mâine după laborator.",
      createdAt: now.toISOString(),
      proposalIds: ["00000000-0000-4000-8000-000000000d03"],
      hasImage: false,
      imageUrl: null,
      quizId: null,
      memory: [],
      daily: true,
    },
    proposals: [
      {
        id: "00000000-0000-4000-8000-000000000d03",
        conversationId: "00000000-0000-4000-8000-000000000d01",
        status: "pending",
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 86_400_000).toISOString(),
        payload: {
          version: 1,
          kind: "study_sessions",
          explanation: "Recapitulare înainte de test, seara, când înveți cel mai bine.",
          warnings: [],
          fitsAvailableTime: true,
          items: [
            {
              title: "POO · recapitulare",
              subjectId: poo.id,
              startsAt: fromLocal(tomorrow, "19:00").toISOString(),
              endsAt: fromLocal(tomorrow, "19:45").toISOString(),
              focus: "Moștenire, polimorfism și clase abstracte, cu 5 exerciții tipice",
            },
          ],
        },
      },
    ],
  };
}
