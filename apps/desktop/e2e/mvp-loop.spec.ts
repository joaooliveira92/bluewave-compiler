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

// The Overview screen also renders its own "Construction"/"Fleet" quick-nav
// buttons, so plain getByRole("button", { name }) is ambiguous -- scope to
// the sidebar's nav buttons (data-sidebar="menu-button").
function navigateTo(page: import("@playwright/test").Page, label: string) {
  return page
    .locator('[data-sidebar="menu-button"]')
    .filter({ hasText: label })
    .click();
}

test("row 1: New Game compiles a fresh campaign onto Overview", async ({
  e2e,
}) => {
  // File-scoped shared save: the compile's stubbed save dialog returns here.
  sharedSaveDir = join(
    await mkdtemp(join(tmpdir(), "bluewave-shared-")),
    "save",
  );
  await e2e.retargetDialog(sharedSaveDir);

  // Landing -> New Campaign -> preferences (step 1: fill seed)
  await e2e.page.getByRole("button", { name: "New Campaign" }).click();
  await e2e.page.getByLabel("Campaign Seed").fill(SEED);
  await e2e.page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 2 (Ruleset) -> proceed to archetype.
  await e2e.page.getByRole("button", { name: "Next: Choose Nation" }).click();

  // Archetype: pick an engine-backed preset via the header primary action.
  await e2e.page
    .getByRole("heading", { name: "Choose your archetype" })
    .waitFor();
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

test("row 2: Advance Month moves the calendar into the following month", async ({
  e2e,
}) => {
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
  await expect(
    e2e.page.getByText("Month advanced to February 1880."),
  ).toBeVisible();
  await expect(e2e.page.getByText(/Could not advance month/)).not.toBeVisible();
});

test("row 3: Construction submit lands a design order in the command table", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  await navigateTo(e2e.page, "Construction");
  await expect(
    e2e.page.getByRole("heading", { name: "Construction Commands" }),
  ).toBeVisible();

  // Design Catalog: pick the (Austria-Hungary's) approved design.
  await e2e.page.getByRole("tab", { name: "Design Catalog" }).click();
  await e2e.page.getByRole("radio").first().click();
  await e2e.page
    .getByRole("button", { name: "Submit Construction Command" })
    .click();

  // User-visible acceptance notice, then the Command Ledger reflects the
  // snapshot's new construction command (screen renders `submitted`).
  await expect(e2e.page.getByText(/Command \S+ is submitted/)).toBeVisible();
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();
  await expect(
    e2e.page.getByRole("row").filter({ hasText: "submitted" }),
  ).toBeVisible();
});

test("row 4: Construction replace supersedes the in-flight command atomically", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();

  // The submitted row from row 3 persisted to the shared save; wait for it.
  const submittedRow = e2e.page
    .getByRole("row")
    .filter({ hasText: "submitted" });
  await expect(submittedRow).toBeVisible({ timeout: 15_000 });
  await submittedRow.getByRole("button", { name: "Replace" }).click();

  // Failure-atomic replace: the old command supersedes (no duplicate
  // in-flight row), a single new "submitted" row takes its place. Austria-
  // Hungary's content pack carries exactly one approved design (des_aut_
  // tegetthoff), so the replacement command reissues the same design — the
  // atomic-replace mechanics are the same regardless of which design.
  await expect(
    e2e.page.getByRole("row").filter({ hasText: "superseded" }),
  ).toBeVisible();
  await expect(
    e2e.page.getByRole("row").filter({ hasText: "submitted" }),
  ).toHaveCount(1);
});

test("row 5: Construction cancel removes the command from the live table", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();

  const submittedRow = e2e.page
    .getByRole("row")
    .filter({ hasText: "submitted" });
  await expect(submittedRow).toBeVisible({ timeout: 15_000 });
  await submittedRow.getByRole("button", { name: "Cancel" }).click();

  // The command leaves the live (actionable) table: no "submitted" row
  // remains, and the snapshot reflects the cancel via an honest "cancelled"
  // row (never silently dropped from the ledger).
  await expect(
    e2e.page.getByRole("row").filter({ hasText: "cancelled" }),
  ).toBeVisible();
  await expect(
    e2e.page.getByRole("row").filter({ hasText: "submitted" }),
  ).toHaveCount(0);
});

test("row 6: Fleet Movement renders the honest compiled state", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(
    e2e.page.getByRole("heading", { name: "Campaign Overview" }),
  ).toBeVisible({ timeout: 30_000 });

  await navigateTo(e2e.page, "Fleet");
  await expect(
    e2e.page.getByRole("heading", { name: "Fleet Movement" }),
  ).toBeVisible();

  // Honest divisions state: this campaign's compiled Austro-Hungarian fleet
  // (fleet_aut_adriatic) renders as the real compiled state -- never an
  // error card. (The matrix's "compiler emits no divisions" assumption does
  // not hold for the Austria-Hungary production scenario; this nation has
  // one authored starting division.)
  await expect(
    e2e.page.getByRole("heading", { name: "Divisions" }),
  ).toBeVisible();
  await expect(
    e2e.page.getByRole("radio", { name: /fleet_aut_adriatic/ }),
  ).toBeVisible();

  // Movement-order surface: honestly not-submittable. The bridge's movement
  // commands stay NOT_IMPLEMENTED -- submitting surfaces that as a notice,
  // never a fabricated success outcome.
  await e2e.page
    .getByRole("button", { name: "Submit movement command" })
    .click();
  await expect(e2e.page.getByText(/NOT_IMPLEMENTED/)).toBeVisible();
});
