import type { Page } from "@playwright/test";

export interface NewCampaignOptions {
  readonly nation?: string;
  readonly archetype?: string;
  readonly admiral?: string;
  readonly campaign?: string;
  /** Fixed campaign seed for deterministic outcomes (default: the app's own). */
  readonly seed?: string;
}

const click = (page: Page, name: string) => page.getByRole("button", { name }).first().click();

/**
 * Drives the new-game assistant from the landing screen through the opening
 * briefing's "Take command". Shared by `scripts/view.ts` (`--make-save`) and specs so the
 * flow lives in one place; when the assistant changes, fix it here.
 *
 * Returns once command is taken — the caller decides what to wait
 * for next (the compile writes the package to the stubbed save dialog path).
 */
export async function startNewCampaign(page: Page, opts: NewCampaignOptions = {}): Promise<void> {
  const { nation = "United Kingdom", archetype = "Shipyard Baron" } = opts;
  await click(page, "New Campaign");
  // Confirm through the console's own keyboard path ("Press Enter to confirm"): the dossier's
  // "Continue as <nation>" button is not always rendered.
  await page.getByRole("option", { name: nation }).click();
  await page.getByRole("listbox", { name: "Playable nations" }).press("Enter");
  if (opts.seed !== undefined) await page.getByLabel("Campaign Seed").fill(opts.seed);
  await click(page, "Next: Choose Archetype");
  await click(page, archetype);
  await click(page, "Choose Nation");
  await page.getByLabel("Admiral name").fill(opts.admiral ?? "John Fisher");
  await page.getByLabel("Campaign name").fill(opts.campaign ?? "Test Run");
  await click(page, "Next");
  await click(page, "Start Campaign");
  await click(page, "Begin Commission");

  // Five-page opening briefing: "Review Naval Estimates", "Next" x3, "Take command".
  await click(page, "Review Naval Estimates");
  for (let i = 0; i < 3; i++) await click(page, "Next");
  await click(page, "Take command");
}

/**
 * Advances the calendar `count` months: header "Advance Month", then the
 * "Pre-turn review" dialog's "Advance to <Mon YYYY>" confirmation.
 */
export async function advanceMonths(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.getByRole("button", { name: /^advance month$/i }).click();
    await page.getByRole("button", { name: /^advance to /i }).click();
    await page.getByRole("dialog", { name: "Pre-turn review" }).waitFor({ state: "hidden" });
    await page.waitForTimeout(500);
  }
}

/**
 * Dismisses the first-month guided tour overlay if it shows up within
 * `waitMs` (it mounts a beat after the Overview renders).
 */
export async function dismissTour(page: Page, waitMs = 1500): Promise<boolean> {
  const end = page.getByRole("button", { name: "End inspection" });
  const shown = await end
    .waitFor({ timeout: waitMs })
    .then(() => true)
    .catch(() => false);
  if (!shown) return false;
  await end.click();
  return true;
}
