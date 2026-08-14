import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer"),
    },
  },
  test: {
    globals: true,
    testTimeout: 30000,
    environment: "jsdom",
    // e2e/ holds Playwright specs (run via `playwright test`, not vitest) —
    // excluded explicitly since Playwright's own test() throws when picked
    // up by another runner.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
