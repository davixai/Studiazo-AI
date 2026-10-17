import { describe, expect, it } from "vitest";
import { countLabel, subjectContentSummary } from "./format";

describe("countLabel", () => {
  it("acordă numeralul corect în română", () => {
    expect(countLabel(1, "material", "materiale")).toBe("1 material");
    expect(countLabel(2, "material", "materiale")).toBe("2 materiale");
    expect(countLabel(19, "notiță", "notițe")).toBe("19 notițe");
    expect(countLabel(20, "notiță", "notițe")).toBe("20 de notițe");
    expect(countLabel(100, "material", "materiale")).toBe("100 de materiale");
    expect(countLabel(101, "material", "materiale")).toBe("101 materiale");
    expect(countLabel(119, "material", "materiale")).toBe("119 materiale");
    expect(countLabel(120, "material", "materiale")).toBe("120 de materiale");
  });
});

describe("subjectContentSummary", () => {
  it("arată doar ce există, iar fără conținut invită la primul pas", () => {
    expect(subjectContentSummary(0, 0)).toBe("Niciun material încă");
    expect(subjectContentSummary(3, 0)).toBe("3 materiale");
    expect(subjectContentSummary(0, 1)).toBe("1 notiță");
    expect(subjectContentSummary(2, 21)).toBe("2 materiale · 21 de notițe");
  });
});
