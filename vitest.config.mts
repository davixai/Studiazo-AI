import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` aruncă eroare în afara Next; în teste îl înlocuim cu un modul gol.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    // Testele rulează mereu în același fus ca serverul de producție tipic (UTC), ca să prindă erorile de fus orar.
    env: { TZ: "UTC" },
  },
});
