import { fileURLToPath, URL } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    // Browser tests live in e2e/ and are run by Playwright, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**", "e2e-artifacts/**"],
  },
});
