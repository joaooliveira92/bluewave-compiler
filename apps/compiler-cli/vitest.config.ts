import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // The engine module graph (campaign/commands/phase-engine/content-schema)
    // is cold-loaded by test/main.test.ts; allow headroom under parallel suites.
    testTimeout: 15000,
  },
});
