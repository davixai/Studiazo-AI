import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractDocument, groupSections, xmlParagraphs } from "./documents";
import { checkFile, documentKindOf } from "./schemas";

/** O arhivă ZIP minimală (comprimată), ca fișierele .docx/.pptx reale. */
function makeZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = new Uint8Array(deflateRawSync(encoder.encode(content)));
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, 8, true);
    lv.setUint32(18, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true);
    cv.setUint32(20, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const paragraph = (text: string) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const slide = (...lines: string[]) => `<p:sld><p:cSld><p:spTree>${lines.map((l) => `<a:p><a:r><a:t>${l}</a:t></a:r></a:p>`).join("")}</p:spTree></p:cSld></p:sld>`;

describe("extractDocument", () => {
  it("citește un Word: paragrafele, diacriticele și entitățile XML", async () => {
    const docx = makeZip({
      "[Content_Types].xml": "<Types/>",
      "word/document.xml": `<w:document><w:body>${paragraph("Curs 3 — Arbori binari de căutare")}${paragraph("Inserarea &amp; ștergerea păstrează ordinea &lt;cheilor&gt;; complexitatea e O(h) în cel mai rău caz.")}</w:body></w:document>`,
    });
    const outcome = await extractDocument("docx", docx);
    expect(outcome.status).toBe("procesat");
    expect(outcome.pages).toEqual([
      { page: 1, text: "Curs 3 — Arbori binari de căutare\n\nInserarea & ștergerea păstrează ordinea <cheilor>; complexitatea e O(h) în cel mai rău caz." },
    ]);
  });

  it("citește un PowerPoint: un slide = o pagină, în ordinea numerelor", async () => {
    const pptx = makeZip({
      "ppt/slides/slide10.xml": slide("Concluzii finale ale cursului de astăzi"),
      "ppt/slides/slide2.xml": slide("Definiția grafului orientat", "G = (V, E) cu muchii ordonate"),
      "ppt/slides/slide1.xml": slide("Introducere în teoria grafurilor"),
    });
    const outcome = await extractDocument("pptx", pptx);
    expect(outcome.status).toBe("procesat");
    expect(outcome.pages.map((p) => p.text)).toEqual([
      "Introducere în teoria grafurilor",
      "Definiția grafului orientat\nG = (V, E) cu muchii ordonate",
      "Concluzii finale ale cursului de astăzi",
    ]);
  });

  it("citește text simplu și respinge fișierele care nu sunt ce par", async () => {
    const text = new TextEncoder().encode("Notițe de la seminar despre derivate parțiale și gradient.\n\nExercițiul 2: calculează ∂f/∂x.");
    expect((await extractDocument("txt", text)).pages).toHaveLength(1);
    expect((await extractDocument("txt", new Uint8Array([0, 1, 2, 3]))).status).toBe("esuat");
    expect((await extractDocument("docx", text)).status).toBe("esuat");
    expect((await extractDocument("docx", makeZip({ "altceva.xml": "<x/>" }))).message).toMatch(/Nu am putut citi/);
  });
});

describe("xmlParagraphs și groupSections", () => {
  it("păstrează tab-urile și rândurile noi, ignoră etichetele asemănătoare", () => {
    expect(xmlParagraphs('<w:p><w:tabs/><w:r><w:t>a</w:t><w:tab/><w:t>b</w:t><w:br/><w:t>c</w:t></w:r></w:p>', "w:p", "w:t")).toEqual(["a\tb\nc"]);
  });

  it("grupează paragrafele în secțiuni și taie unul prea lung", () => {
    expect(groupSections(["aaaa", "bbbb", "cccc"], 10)).toEqual(["aaaa\n\nbbbb", "cccc"]);
    expect(groupSections(["x".repeat(25)], 10)).toEqual(["x".repeat(10), "x".repeat(10), "x".repeat(5)]);
  });
});

describe("documentKindOf și checkFile", () => {
  it("recunoaște documentele după tip sau extensie", () => {
    expect(documentKindOf({ name: "Curs.DOCX", type: "" })).toBe("docx");
    expect(documentKindOf({ name: "slides.pptx", type: "" })).toBe("pptx");
    expect(documentKindOf({ name: "notite.md", type: "" })).toBe("txt");
    expect(documentKindOf({ name: "vechi.doc", type: "application/msword" })).toBeNull();
    expect(checkFile({ name: "curs.docx", type: "", size: 10 }, "docx")).toBeNull();
    expect(checkFile({ name: "poza.png", type: "image/png", size: 10 }, "docx")).toMatch(/nu este un fișier Word/);
  });
});
