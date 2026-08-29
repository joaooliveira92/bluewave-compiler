import { test, expect } from "./fixtures.js";

test("Electron boots hermetically and the shell landing renders", async ({ e2e }) => {
  expect(e2e.page.url()).not.toContain("localhost");
  await expect(e2e.page.getByText("Bluewave Naval Staff")).toBeVisible();
  await expect(e2e.page.locator("body")).toContainText("Bluewave");
});
