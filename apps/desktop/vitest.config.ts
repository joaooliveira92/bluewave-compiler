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
  },
});
