import { defineConfig } from "@playwright/test";

const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 2 : 0,
  outputDir: "test-results",
  reporter: CI ? "github" : "list",
  use: {
    trace: CI ? "on-first-retry" : "off",
    screenshot: "only-on-failure",
  },
});