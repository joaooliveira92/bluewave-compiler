import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // ADR-0053: auto-resolved battles run ~4x more minutes after the lethality
    // tuning; multi-seed/two-process tests need headroom under parallel load.
    testTimeout: 60_000,
  },
});
