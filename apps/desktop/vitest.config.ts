import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
  },
  resolve: {
    conditions: ["node"],
  },
});