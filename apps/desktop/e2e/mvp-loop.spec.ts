import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SEED, test, expect } from "./fixtures.js";

// Serial create-side narrative (matrix rows 1-6). One compiled campaign is
// shared across the specs IN THIS FILE via `sharedSaveDir`; strict per-test
// isolation applies across files (workers: 1).
test.describe.configure({ mode: "serial" });

let sharedSaveDir = "";

const ARCHETYPE = "Shipyard Baron";
const NATION = "Austro-Hungarian Empire";

test("row 1: New Game compiles a fresh campaign onto Overview", async ({ e2e }) => {
  // File-scoped shared save: the compile's stubbed save dialog returns here.
  sharedSaveDir = join(await mkdtemp(join(tmpdir(), "bluewave-shared-")), "save");
  await e2e.retargetDialog(sharedSaveDir);

  // Landing -> New Campaign -> preferences (step 1: fill seed)
  await e2e.page.getByRole("button", { name: "New Campaign" }).click();
  await e2e.page.getByLabel("Campaign Seed").fill(SEED);
  await e2e.page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 2 (Ruleset) -> proceed to archetype.
  await e2e.page.getByRole("button", { name: "Next: Choose Nation" }).click();

  // Archetype: pick an engine-backed preset via the header primary action.
  await e2e.page.getByRole("heading", { name: "Choose your archetype" }).waitFor();
  await e2e.page
    .getByRole("button", { name: new RegExp(ARCHETYPE), exact: false })
    .click();
  await e2e.page.getByRole("button", { name: "Choose Nation" }).click();

  // Nation: pick the slot.
  await e2e.page.getByRole("option", { name: NATION }).click();
  await e2e.page.getByRole("button", { name: "Start Campaign" }).click();

  // Compiled -> shell moves into the active campaign, always on Overview.
  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  // User-visible proof of the fresh compile: Revision 0 (turn number 0) and
  // the production scenario's fixed campaign identity + a non-empty hash.
  await expect(e2e.page.getByText("Revision 0")).toBeVisible();
  await expect(
    e2e.page.getByText("campaign-bluewave-1880-production"),
  ).toBeVisible();
});

test("row 2: Advance Month moves the calendar into the following month", async ({ e2e }) => {
  // Boot #2 opens the file-scoped shared save row 1 compiled (same fixed
  // seed => the same deterministic month outcomes).
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();

  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  // Committed start-of-campaign state: turn 0, January 1880 in the header.
  await expect(e2e.page.getByText("Revision 0")).toBeVisible();
  await expect(e2e.page.getByText("Bluewave — January 1880")).toBeVisible();

  // Header's advance action drives the month forward (deterministic seed).
  await e2e.page.getByRole("button", { name: "Advance Month" }).click();

  // User-visible advancement past the starting month, with an honest notice.
  await expect(e2e.page.getByText("Bluewave — February 1880")).toBeVisible();
  await expect(e2e.page.getByText("Month advanced to February 1880.")).toBeVisible();
  await expect(e2e.page.getByText(/Could not advance month/)).not.toBeVisible();
});