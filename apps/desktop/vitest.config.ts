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
    // up by another runner. dist/ is gitignored `tsc -b` output; its
    // `.test.jsx` emits reference sibling `.js` imports that don't exist
    // (tsconfig emits `.jsx` under `"jsx": "preserve"`, not `.js`), so
    // running `pnpm typecheck` before `pnpm test` in the same tree would
    // otherwise surface phantom import-resolution failures unrelated to
    // any real test.
    exclude: ["**/node_modules/**", "e2e/**", "dist/**"],
  },
});
