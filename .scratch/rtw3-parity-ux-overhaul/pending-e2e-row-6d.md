# Pending e2e: row 6d (Options: Save / Save a Copy / Close)

Parked 2026-10-07 because e2e runs were paused by the owner. The last run failed at the
"Campaign saved — revision 0" assertion; a direct run of the built app showed the message does
appear (clicking the exact "Save" button), so the likely cause is in the test (selector or timing).
Restore into `apps/desktop/e2e/mvp-loop.spec.ts` after debugging with e2e allowed.

```ts
test("row 6d: Options can save, save a copy, and close the campaign", async ({ e2e }) => {
  const working = await copyFixturePackage(sharedSaveDir, e2e.scratch);
  await e2e.retargetDialog(working);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);

  await navigateTo(e2e.page, "Options");
  await expect(e2e.page.getByRole("heading", { name: "Options" })).toBeVisible();

  // Save used to answer NOT_IMPLEMENTED; it now confirms the revision on disk.
  await e2e.page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(e2e.page.getByText(/Campaign saved — revision 0/)).toBeVisible({ timeout: 15_000 });
  await expect(e2e.page.getByText(/NOT_IMPLEMENTED/)).not.toBeVisible();

  // Save a copy: the (stubbed) dialog returns a new folder; the copy is a real package.
  const copyDir = join(e2e.scratch, "the-copy");
  await e2e.retargetDialog(copyDir);
  await e2e.page.getByRole("button", { name: /Save a Copy/ }).click();
  await expect(e2e.page.getByText(/Copy saved to/)).toBeVisible({ timeout: 15_000 });

  // Close returns to the campaign file screen.
  await e2e.page.getByRole("button", { name: "Close Campaign" }).click();
  await e2e.page.getByRole("button", { name: "Close Campaign" }).last().click();
  await expect(e2e.page.getByRole("button", { name: "Open Campaign" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).not.toBeVisible();

  // The copy opens like any other campaign.
  await e2e.retargetDialog(copyDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
});
```
