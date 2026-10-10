import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // The national simulation suites compile hundreds of candidate designs; give them headroom under parallel load.
    testTimeout: 30000,
  },
});
