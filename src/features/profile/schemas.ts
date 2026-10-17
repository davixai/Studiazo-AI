import { z } from "zod";
import { PREFERRED_TIMES, type AvailabilityWindow } from "@/lib/contracts/domain";
import { isTimeOfDay } from "@/lib/time/zone";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

export const ProfileFormSchema = z.object({
  fullName: z.string().trim().min(2, "Spune-ne cum te numești.").max(120),
  university: optionalText(160),
  faculty: optionalText(160),
  specialization: optionalText(160),
  studyYear: z
    .string()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().min(1).max(6).nullable()),
  preferredTime: z.enum(PREFERRED_TIMES),
  sessionMinutes: z.coerce.number().int().min(15, "Minimum 15 minute.").max(180, "Maximum 180 de minute."),
  dailyStudyLimitMinutes: z.coerce.number().int().min(30).max(720),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

/** Validează coloana `profiles.availability` (jsonb). */
export const AvailabilitySchema = z
  .array(
    z
      .object({
        weekday: z.number().int().min(1).max(7),
        start: z.string().refine(isTimeOfDay, "Oră invalidă."),
        end: z.string().refine((v) => v === "24:00" || isTimeOfDay(v), "Oră invalidă."),
      })
      .refine((w) => w.end === "24:00" || w.end > w.start, "Intervalul trebuie să se termine după ce începe."),
  )
  .max(28);

export const SESSION_LENGTH_OPTIONS = [25, 45, 50, 60, 90] as const;
export const DAILY_LIMIT_OPTIONS = [60, 120, 180, 240, 300] as const;

export const DELETE_CONFIRMATION = "ȘTERGE";

export const WEEKDAY_LABELS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"] as const;

/**
 * Citește formularul de disponibilitate: câte un interval pe zi (d1 … d7 = luni … duminică),
 * cu d{n}=on, d{n}_start și d{n}_end. Erorile sunt pe cheia zilei.
 */
export function availabilityFromForm(values: Record<string, string>):
  | { ok: true; windows: AvailabilityWindow[] }
  | { ok: false; fieldErrors: Record<string, string> } {
  const windows: AvailabilityWindow[] = [];
  const fieldErrors: Record<string, string> = {};

  for (let weekday = 1; weekday <= 7; weekday++) {
    if (values[`d${weekday}`] !== "on") continue;
    const start = values[`d${weekday}_start`] ?? "";
    const end = values[`d${weekday}_end`] ?? "";
    if (!isTimeOfDay(start) || !isTimeOfDay(end)) fieldErrors[`d${weekday}`] = "Alege ora de început și de sfârșit.";
    else if (end <= start) fieldErrors[`d${weekday}`] = "Intervalul trebuie să se termine după ce începe.";
    else windows.push({ weekday, start, end });
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  if (windows.length === 0) return { ok: false, fieldErrors: { form: "Alege cel puțin o zi în care poți învăța." } };
  const parsed = AvailabilitySchema.safeParse(windows);
  return parsed.success ? { ok: true, windows: parsed.data } : { ok: false, fieldErrors: { form: "Intervale invalide." } };
}
