// Fără zod: componentele de client importă de aici, ca biblioteca să nu ajungă în browser.
import type { SubjectColor } from "@/lib/contracts/domain";

export const SUBJECT_NAME_MAX = 120;

export const SUBJECT_COLOR_LABELS: Record<SubjectColor, string> = {
  blue: "Albastru",
  teal: "Turcoaz",
  green: "Verde",
  amber: "Chihlimbar",
  rose: "Roz",
  violet: "Violet",
  slate: "Gri",
};
