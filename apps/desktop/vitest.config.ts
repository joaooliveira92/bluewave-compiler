import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer"),
      "@content": resolve(__dirname, "../../content/production/1880"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/renderer/test-setup.ts"],
    testTimeout: 60000,
    environment: "jsdom",
    // Debug-only sidebar screens (Simulation, Tactical Sandbox, Debugging)
    // are gated by VITE_BLUEWAVE_DEBUG, not by dev-mode — set it so their
    // routes are still exercised by campaign-screen-registry.test.tsx.
    env: { VITE_BLUEWAVE_DEBUG: "true" },
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
