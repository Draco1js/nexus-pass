import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      // all tests in convex/ will run in edge-runtime
      ["convex/**", "edge-runtime"],
      // all other tests use jsdom
      ["**", "jsdom"],
    ],
    server: { deps: { inline: ["convex-test"] } },
    // Exclude e2e tests (they're for Playwright)
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
  },
});

