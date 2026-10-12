import { defineConfig } from "vite-plus";
import { sharedTestConfig } from "../../scripts/vitest-shared.mjs";

export default defineConfig({
  test: {
    ...sharedTestConfig,
    include: ["test/**/*.test.ts"],
    // The engine module graph (campaign/commands/phase-engine/content-schema)
    // is cold-loaded by test/main.test.ts; allow headroom under parallel suites.
    testTimeout: 15000,
  },
});
