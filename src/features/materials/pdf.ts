import "server-only";
import { extractText } from "unpdf";
import { classifyExtraction, type ExtractionOutcome } from "./extraction";
import { hasPdfSignature } from "./schemas";

/** Extrage textul pe pagini și decide starea. Nu aruncă: orice problemă devine `esuat`, cu mesaj clar. */
export async function extractPdf(bytes: Uint8Array): Promise<ExtractionOutcome> {
  if (!hasPdfSignature(bytes)) {
    return { status: "esuat", message: "Fișierul nu este un PDF valid.", pageCount: 0, pages: [] };
  }
  try {
    // pdf.js preia bufferul; îi dăm o copie ca apelantul să-și păstreze datele.
    const { text } = await extractText(bytes.slice(), { mergePages: false });
    return classifyExtraction(text);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message =
      name === "PasswordException"
        ? "PDF-ul este protejat cu parolă. Salvează-l fără parolă și încarcă-l din nou."
        : "Nu am putut citi acest PDF. Poate fi deteriorat; încearcă să-l exporți din nou.";
    return { status: "esuat", message, pageCount: 0, pages: [] };
  }
}
