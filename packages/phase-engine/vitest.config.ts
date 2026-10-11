import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // This package's suites (month loops, battle resolution, replay round-trips)
    // legitimately run a few seconds each; under the CI runner's parallel turbo
    // load the defaults tip past vitest's 5s default. Give the same headroom the
    // compiler-cli config already does rather than trimming real work.
    testTimeout: 30000,
  },
});
