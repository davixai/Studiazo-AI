import { describe, expect, it } from "vitest";
import { isPublicRoute, safeNextPath } from "./routes";

describe("rute", () => {
  it("acceptă doar redirecționări interne", () => {
    expect(safeNextPath("/calendar")).toBe("/calendar");
    expect(safeNextPath("//evil.example")).toBe("/azi");
    expect(safeNextPath("https://evil.example")).toBe("/azi");
    expect(safeNextPath("/\\evil.example")).toBe("/azi");
    expect(safeNextPath(null)).toBe("/azi");
  });

  it("paginile aplicației nu sunt publice", () => {
    expect(isPublicRoute("/autentificare")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/azi")).toBe(false);
    expect(isPublicRoute("/autentificare-falsa")).toBe(false);
  });
});
