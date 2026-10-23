// vitest.config.ts
// Tests unitaires des fonctions pures du site (formatage des offres, liens,
// alertes, imports...). Lancer : npm test
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
