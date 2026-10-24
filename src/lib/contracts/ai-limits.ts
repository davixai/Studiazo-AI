// Fără zod: asistentul plutitor (prezent pe toate paginile) importă de aici, ca biblioteca să nu ajungă în browser.

export const AI_LIMITS = {
  /** Câte runde de instrumente poate face modelul într-un singur răspuns. */
  maxToolSteps: 4,
  /** Interval maxim citit dintr-o dată. */
  maxScheduleDays: 14,
  /** Câte mesaje anterioare din conversație se trimit modelului. */
  maxHistoryMessages: 12,
  /** Câte caractere de material se trimit într-o cerere (~6k tokeni). */
  maxMaterialChars: 24_000,
  maxUserMessageChars: 4_000,
} as const;
