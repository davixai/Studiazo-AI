import { describe, expect, it } from "vitest";
import { extractPdf } from "./pdf";

/** Un PDF minimal, valid, cu câte o pagină pentru fiecare text (null = pagină fără text, ca o scanare). */
function makePdf(pages: Array<string | null>) {
  const objects: string[] = [];
  const add = (body: string) => objects.push(body);
  const pageIds = pages.map((_, i) => 3 + i * 2);
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  const fontId = 3 + pages.length * 2;
  pages.forEach((text, i) => {
    const contentId = pageIds[i] + 1;
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = text ? `BT /F1 14 Tf 72 760 Td (${text}) Tj ET` : "0 0 1 rg 72 72 200 200 re f";
    add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(out);
}

describe("extractPdf (unpdf, PDF-uri generate)", () => {
  it("PDF cu text → procesat, textul pe pagini", async () => {
    const r = await extractPdf(
      makePdf(["Introducere in teoria grafurilor si reprezentari", "Parcurgerea in latime BFS foloseste o coada"]),
    );
    expect(r.status).toBe("procesat");
    expect(r.pageCount).toBe(2);
    expect(r.pages[1]).toEqual({ page: 2, text: expect.stringContaining("BFS") });
  });

  it("PDF fără text (scanat) → fara_text", async () => {
    const r = await extractPdf(makePdf([null, null]));
    expect(r.status).toBe("fara_text");
    expect(r.pageCount).toBe(2);
  });

  it("fișier care nu e PDF sau PDF deteriorat → esuat, fără excepție", async () => {
    expect((await extractPdf(new TextEncoder().encode("<html>nu</html>"))).status).toBe("esuat");
    const broken = makePdf(["text"]).slice(0, 60);
    const r = await extractPdf(broken);
    expect(r.status).toBe("esuat");
    expect(r.message).toMatch(/Nu am putut citi/);
  });
});
