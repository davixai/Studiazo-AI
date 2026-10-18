import "server-only";
import { inflateRawSync } from "node:zlib";
import { classifyExtraction, type ExtractionOutcome } from "./extraction";
import { extractPdf } from "./pdf";
import { hasSignatureFor, KIND_LABEL, type DocumentKind } from "./schemas";

// Textul din Word (.docx), PowerPoint (.pptx) și fișiere text, pe „pagini” pentru citări:
// un slide = o pagină; la Word și text, paragrafele se grupează în secțiuni de ~3.000 de caractere.
// .docx și .pptx sunt arhive ZIP cu XML; le citim direct, fără dependențe noi.

/** Cât text intră într-o „pagină” de Word sau text (cam o pagină tipărită). */
const SECTION_CHARS = 3_000;
/** Limita pentru un fișier dezarhivat (protecție la arhive „bombă”). */
const MAX_UNZIPPED_BYTES = 60 * 1024 * 1024;

/** Fișierele dintr-o arhivă ZIP, după nume (citite din directorul central). */
export function readZip(bytes: Uint8Array): Map<string, () => Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("zip");

  const entries = new Map<string, () => Uint8Array>();
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("zip");
    const method = view.getUint16(at + 10, true);
    const compressed = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;

    entries.set(name, () => {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + compressed);
      if (method === 0) return data;
      if (method === 8) return new Uint8Array(inflateRawSync(data, { maxOutputLength: MAX_UNZIPPED_BYTES }));
      throw new Error("zip");
    });
  }
  return entries;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    }
    return ENTITIES[code] ?? match;
  });
}

/** Paragrafele dintr-un XML Office: textul din <w:t>/<a:t>, tab-urile și rupturile de rând păstrate. */
export function xmlParagraphs(xml: string, paragraphTag: "w:p" | "a:p", textTag: "w:t" | "a:t") {
  const paragraphs = xml.split(new RegExp(`</${paragraphTag}>`));
  return paragraphs
    .map((p) =>
      decodeXml(
        p
          .replace(/<(w:tab|a:tab)\b[^>]*\/>/g, `<${textTag}>\t</${textTag}>`)
          .replace(/<(w:br|a:br)\b[^>]*\/>/g, `<${textTag}>\n</${textTag}>`)
          .match(new RegExp(`<${textTag}(?:\\s[^>]*)?>[^<]*</${textTag}>`, "g"))
          ?.map((t) => t.replace(/<[^>]+>/g, ""))
          .join("") ?? "",
      ).trim(),
    )
    .filter(Boolean);
}

/** Grupează paragrafele în secțiuni de cel mult ~SECTION_CHARS caractere (un paragraf uriaș se taie). */
export function groupSections(paragraphs: string[], size = SECTION_CHARS) {
  const sections: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    for (let i = 0; i < paragraph.length; i += size) {
      const piece = paragraph.slice(i, i + size);
      if (current && current.length + piece.length + 2 > size) {
        sections.push(current);
        current = "";
      }
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function docxPages(bytes: Uint8Array) {
  const body = readZip(bytes).get("word/document.xml");
  if (!body) throw new Error("docx");
  return groupSections(xmlParagraphs(new TextDecoder().decode(body()), "w:p", "w:t"));
}

function pptxPages(bytes: Uint8Array) {
  const zip = readZip(bytes);
  const slides = [...zip.keys()]
    .map((name) => /^ppt\/slides\/slide(\d+)\.xml$/.exec(name))
    .filter((m): m is RegExpExecArray => m !== null)
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  if (slides.length === 0) throw new Error("pptx");
  return slides.map((m) => xmlParagraphs(new TextDecoder().decode(zip.get(m[0])!()), "a:p", "a:t").join("\n"));
}

function textPages(bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes).replace(/^﻿/, "");
  return groupSections(text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean));
}

/** Extrage textul pe pagini și decide starea, pentru orice document. Nu aruncă: problemele devin `esuat`. */
export async function extractDocument(kind: DocumentKind, bytes: Uint8Array): Promise<ExtractionOutcome> {
  if (kind === "pdf") return extractPdf(bytes);
  const label = KIND_LABEL[kind];
  const failed = (message: string): ExtractionOutcome => ({ status: "esuat", message, pageCount: 0, pages: [] });
  if (!hasSignatureFor(kind, bytes)) return failed(`Fișierul nu este un document ${label} valid.`);

  let raw: string[];
  try {
    raw = kind === "docx" ? docxPages(bytes) : kind === "pptx" ? pptxPages(bytes) : textPages(bytes);
  } catch {
    return failed(`Nu am putut citi acest fișier ${label}. Salvează-l din nou (sau ca PDF) și încarcă-l iar.`);
  }
  if (raw.length === 0) return { status: "fara_text", message: "Documentul nu conține text pe care să-l poată citi asistentul.", pageCount: 0, pages: [] };

  const outcome = classifyExtraction(raw);
  if (outcome.status === "fara_text") return { ...outcome, message: "Documentul nu conține text pe care să-l poată citi asistentul." };
  // Mesajul despre pagini scanate are sens doar la PDF; la slide-uri goale (doar imagini) e o informație utilă.
  if (outcome.message && kind !== "pptx") return { ...outcome, message: null };
  if (outcome.message) {
    const empty = outcome.pageCount - outcome.pages.length;
    return { ...outcome, message: `${empty} din ${outcome.pageCount} slide-uri nu au text (doar imagini).` };
  }
  return outcome;
}
