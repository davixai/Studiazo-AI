import { describe, expect, it } from "vitest";
import { describeLayout, imageSize, ocrFragments, type OcrWord } from "./schedule-ocr";

// Ce trimitem AI-ului de text după OCR: fragmentele de celule, cu poziția lor.

const word = (text: string, x0: number, y0 = 70, confidence = 90): OcrWord => ({ text, confidence, bbox: { x0, y0, x1: x0 + text.length * 9, y1: y0 + 18 } });

describe("fragmentele OCR", () => {
  it("unește cuvintele apropiate și desparte celulele aflate la distanță", () => {
    const fragments = ocrFragments([{ words: [word("POO", 354), word("(L)", 386), word("C412", 416), word("FIZ2", 524), word("(S)", 562)] }]);
    expect(fragments.map((f) => f.text)).toEqual(["POO (L) C412", "FIZ2 (S)"]);
    expect(fragments[0]).toMatchObject({ x: 354, y: 70, h: 18 });
  });

  it("aruncă liniile tabelului citite ca text și le ordonează de sus în jos", () => {
    const fragments = ocrFragments([{ words: [word("SO", 184, 234)] }, { words: [word("|]", 172, 154, 20), word("|", 300, 154), word("BD", 184, 74)] }]);
    expect(fragments.map((f) => f.text)).toEqual(["BD", "SO"]);
  });

  it("descrie poza și fiecare fragment cu poziția lui", () => {
    const text = describeLayout([{ text: "Luni", x: 184, y: 14, w: 40, h: 18 }], { width: 700, height: 300 });
    expect(text).toContain("700×300");
    expect(text).toContain("[x=184 y=14 l=40 h=18] Luni");
  });
});

describe("dimensiunea pozei", () => {
  it("citește PNG și JPEG din antet", () => {
    const png = Buffer.alloc(32);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(700, 16);
    png.writeUInt32BE(300, 20);
    expect(imageSize(png)).toEqual({ width: 700, height: 300 });

    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x02, 0xbc, 0x03, 0, 0, 0, 0]);
    expect(imageSize(jpeg)).toEqual({ width: 700, height: 300 });
  });

  it("întoarce null pentru altceva", () => {
    expect(imageSize(Buffer.from("nu e poza, doar text"))).toBeNull();
  });
});
