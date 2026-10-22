import "server-only";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Citirea textului din poza orarului cu OCR (tesseract.js, gratuit, rulează pe server), pentru când nu avem
// un AI care vede poze. Păstrăm poziția fiecărui fragment, ca AI-ul de text să poată reface tabelul.

export type OcrWord = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };
export type OcrLine = { words: OcrWord[] };

/** Un fragment de text dintr-o celulă: cuvintele apropiate de pe același rând. */
export type OcrFragment = { text: string; x: number; y: number; w: number; h: number };

/** Sub atâtea fragmente, poza nu e un orar (sau OCR-ul n-a reușit să citească nimic util). */
export const OCR_MIN_FRAGMENTS = 3;

/**
 * Împarte rândurile citite de OCR în fragmente: un spațiu mare între cuvinte înseamnă altă celulă.
 * Aruncă zgomotul (liniile tabelului citite ca „|”, „]” etc.).
 */
export function ocrFragments(lines: OcrLine[]): OcrFragment[] {
  const fragments: OcrFragment[] = [];
  for (const line of lines) {
    const words = line.words.filter((w) => /[\p{L}\p{N}]/u.test(w.text) && !(w.confidence < 30 && w.text.length <= 2));
    let current: OcrWord[] = [];
    const flush = () => {
      if (current.length === 0) return;
      const x0 = Math.min(...current.map((w) => w.bbox.x0));
      const y0 = Math.min(...current.map((w) => w.bbox.y0));
      const x1 = Math.max(...current.map((w) => w.bbox.x1));
      const y1 = Math.max(...current.map((w) => w.bbox.y1));
      fragments.push({ text: current.map((w) => w.text.trim()).join(" "), x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      current = [];
    };
    for (const word of words) {
      const last = current.at(-1);
      const height = Math.max(word.bbox.y1 - word.bbox.y0, 8);
      if (last && word.bbox.x0 - last.bbox.x1 > height * 1.5) flush();
      current.push(word);
    }
    flush();
  }
  return fragments.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Textul trimis AI-ului: dimensiunea pozei și fragmentele, de sus în jos, cu poziția lor. */
export function describeLayout(fragments: OcrFragment[], size: { width: number; height: number }) {
  const rows = fragments.map((f) => `[x=${f.x} y=${f.y} l=${f.w} h=${f.h}] ${f.text}`);
  return `Poza are ${size.width}×${size.height} px. Fragmentele citite (x, y = colțul din stânga sus; l, h = lățimea și înălțimea):\n${rows.join("\n")}`;
}

/** Lățimea și înălțimea din antetul PNG/JPEG/WebP (fără o bibliotecă de imagini). */
export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes.length > 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = bytes.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let i = 2; i + 9 < bytes.length; ) {
      if (bytes[i] !== 0xff) return null;
      const marker = bytes[i + 1];
      // SOF0–SOF15, fără DHT (C4), JPG (C8) și DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** OCR pe poza trimisă ca data URL. Limbile (română + engleză) se descarcă o dată și rămân în folderul temporar. */
export async function readScheduleLayout(image: string) {
  const bytes = Buffer.from(image.slice(image.indexOf(",") + 1), "base64");
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker(["ron", "eng"], 1, { cachePath: join(tmpdir(), "studiazo-tesseract") });
  try {
    // „Text răsfirat”: fiecare celulă din tabel e citită separat, iar liniile chenarului nu mai încurcă citirea.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const { data } = await worker.recognize(bytes, {}, { blocks: true });
    const lines = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
    const fragments = ocrFragments(lines);
    const size = imageSize(bytes) ?? { width: Math.max(0, ...fragments.map((f) => f.x + f.w)), height: Math.max(0, ...fragments.map((f) => f.y + f.h)) };
    return { fragments, layout: describeLayout(fragments, size) };
  } finally {
    await worker.terminate();
  }
}
