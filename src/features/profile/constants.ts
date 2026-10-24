// Fără zod: componentele de client importă de aici, ca biblioteca să nu ajungă în browser.

export const SESSION_LENGTH_OPTIONS = [25, 45, 50, 60, 90] as const;
export const DAILY_LIMIT_OPTIONS = [60, 120, 180, 240, 300] as const;

export const DELETE_CONFIRMATION = "ȘTERGE";

export const WEEKDAY_LABELS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"] as const;
