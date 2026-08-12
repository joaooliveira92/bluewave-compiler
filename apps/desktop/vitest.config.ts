import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
  },
});
