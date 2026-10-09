import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SEED, test, expect, copyFixturePackage } from "./fixtures.js";
import { advanceMonths, dismissTour, startNewCampaign } from "./flows.js";

// Serial create-side narrative (matrix rows 1-6). One compiled campaign is
// shared across the specs IN THIS FILE via `sharedSaveDir`; strict per-test
// isolation applies across files (workers: 1).
test.describe.configure({ mode: "serial" });

let sharedSaveDir = "";

const ARCHETYPE = "Shipyard Baron";
const NATION = "United Kingdom";

// The Overview screen also renders its own "Construction"/"Fleet" quick-nav
// buttons, so plain getByRole("button", { name }) is ambiguous -- scope to
// the bottom bar. Its buttons carry the full screen name as title/aria-label.
function navigateTo(page: import("@playwright/test").Page, label: string) {
  return page.getByTestId("bottom-nav").getByRole("button", { name: label, exact: true }).click();
}

async function openCampaignMenuItem(page: import("@playwright/test").Page, name: string | RegExp) {
  await page.getByRole("button", { name: "Campaign menu" }).click();
  await page.getByRole("button", { name }).click();
}

test("row 1: New Game compiles a fresh campaign onto Overview", async ({ e2e }) => {
  // File-scoped shared save: the compile's stubbed save dialog returns here.
  sharedSaveDir = join(await mkdtemp(join(tmpdir(), "bluewave-shared-")), "save");
  await e2e.retargetDialog(sharedSaveDir);

  await startNewCampaign(e2e.page, { seed: SEED, archetype: ARCHETYPE, nation: NATION });

  // Compiled -> shell moves into the active campaign, always on Overview.
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  // User-visible proof of the fresh compile: the campaign starts in January
  // 1880 (turn 0) and carries the production scenario's fixed identity.
  // (Revision numbers and session ids are debug-build detail, not shown to players.)
  await expect(e2e.page.getByText("Bluewave — January 1880")).toBeVisible();
  await expect(
    e2e.page.getByText("campaign-bluewave-1880-production", { exact: true }),
  ).toBeVisible();

  // The world map is the home screen's primary panel (spec M-1): live, lazy-loaded
  // and keyboard-reachable without opening anything.
  await expect(e2e.page.getByRole("application", { name: /World map/ })).toBeVisible({
    timeout: 15_000,
  });
});

test("row 2: Advance Month moves the calendar into the following month", async ({ e2e }) => {
  // Boot #2 opens the file-scoped shared save row 1 compiled (same fixed
  // seed => the same deterministic month outcomes).
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();

  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  // Committed start-of-campaign state: turn 0, January 1880 in the header.
  await expect(e2e.page.getByText("Bluewave — January 1880")).toBeVisible();

  // Header's advance action drives the month forward (deterministic seed).
  await dismissTour(e2e.page);
  await advanceMonths(e2e.page, 1);

  // User-visible advancement past the starting month, with an honest notice.
  await expect(e2e.page.getByText("Bluewave — February 1880")).toBeVisible();
  await expect(e2e.page.getByText("Month advanced to February 1880.")).toBeVisible();
  await expect(e2e.page.getByText(/Could not advance month/)).not.toBeVisible();
});

test("row 3: Construction submit lands a design order in the command table", async ({ e2e }) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  await navigateTo(e2e.page, "Construction");
  await expect(e2e.page.getByRole("heading", { name: "Construction Commands" })).toBeVisible();

  // Design Catalog: pick the (Austria-Hungary's) approved design.
  await e2e.page.getByRole("tab", { name: "Design Catalog" }).click();
  await e2e.page.getByRole("radio").first().click();
  await e2e.page.getByRole("button", { name: "Submit Construction Command" }).click();
  // Select-design -> review -> confirm: submit opens a review panel first.
  await e2e.page.getByRole("button", { name: "Confirm order" }).click();

  // User-visible acceptance notice, then the Command Ledger reflects the
  // snapshot's new construction command (screen renders `submitted`).
  await expect(e2e.page.getByText(/Command \S+ is submitted/)).toBeVisible();
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();
  await expect(e2e.page.getByRole("row").filter({ hasText: "submitted" })).toBeVisible();
});

test("row 4: Construction replace supersedes the in-flight command atomically", async ({ e2e }) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();

  // The submitted row from row 3 persisted to the shared save; wait for it.
  const submittedRow = e2e.page.getByRole("row").filter({ hasText: "submitted" });
  await expect(submittedRow).toBeVisible({ timeout: 15_000 });
  await submittedRow.getByRole("button", { name: "Replace" }).click();

  // Failure-atomic replace: the old command supersedes (no duplicate
  // in-flight row), a single new "submitted" row takes its place. Austria-
  // Hungary's content pack carries exactly one approved design (des_aut_
  // tegetthoff), so the replacement command reissues the same design — the
  // atomic-replace mechanics are the same regardless of which design.
  await expect(e2e.page.getByRole("row").filter({ hasText: "superseded" })).toBeVisible();
  await expect(e2e.page.getByRole("row").filter({ hasText: "submitted" })).toHaveCount(1);
});

test("row 5: Construction cancel removes the command from the live table", async ({ e2e }) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();

  const submittedRow = e2e.page.getByRole("row").filter({ hasText: "submitted" });
  await expect(submittedRow).toBeVisible({ timeout: 15_000 });
  await submittedRow.getByRole("button", { name: "Cancel" }).click();

  // The command leaves the live (actionable) table: no "submitted" row
  // remains, and the snapshot reflects the cancel via an honest "cancelled"
  // row (never silently dropped from the ledger).
  await expect(e2e.page.getByRole("row").filter({ hasText: "cancelled" })).toBeVisible();
  await expect(e2e.page.getByRole("row").filter({ hasText: "submitted" })).toHaveCount(0);
});

test("row 6: Fleet renders the honest compiled state", async ({ e2e }) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  await navigateTo(e2e.page, "Fleet");
  await expect(e2e.page.getByRole("heading", { name: "Fleet", exact: true })).toBeVisible();

  // Honest divisions state: this campaign's compiled United Kingdom fleets
  // (fleet_gbr_*) render as the real compiled state -- never an
  // error card. (The matrix's "compiler emits no divisions" assumption does
  // not hold for the production scenario; the UK has three authored starting
  // fleets.)
  await expect(e2e.page.getByRole("heading", { name: "Divisions" })).toBeVisible();
  await expect(e2e.page.getByRole("radio", { name: /Home Fleet/ })).toBeVisible();

  // Movement orders are real (ADR-0062): the form is offered, with nothing queued yet.
  await expect(e2e.page.getByRole("button", { name: "Submit movement command" })).toBeVisible();
  await expect(e2e.page.getByText("No movement commands")).toBeVisible();
});

test("row 6f: the Drawing Board edits the hull plan, batteries and armour in the real app", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Drawing Board" }).click();
  await e2e.page.getByRole("button", { name: "Open Drawing Board" }).click();
  const board = e2e.page.getByRole("dialog");
  await expect(board.getByRole("tab", { name: /Hull and machinery/ })).toBeVisible();

  // Hull plan: move a fitting with the keyboard-reachable buttons, then place one by clicking the real drawing.
  await board.getByRole("button", { name: "Move on plan" }).click();
  await board.getByLabel("Fitting to move").selectOption({ index: 1 });
  await board.getByRole("button", { name: /Move 10 permille toward the stern/ }).click();
  await expect(board.getByRole("status").filter({ hasText: /toward the stern/ })).toBeVisible();
  await board.getByRole("button", { name: "Place on plan" }).click();
  await board.getByLabel("Component to place").selectOption({ index: 1 });
  await board.getByTestId("plan-click-layer").click();
  await expect(board.getByRole("status").filter({ hasText: /^Placed / })).toBeVisible();

  // Arrangement: the batteries panel and the armour panel are present and editable.
  await board.getByRole("tab", { name: /Arrangement/ }).click();
  await expect(board.getByRole("region", { name: "Batteries" })).toBeVisible();
  await expect(board.getByRole("region", { name: "Protection" })).toBeVisible();

  // History records both plan edits as separate, undoable steps.
  await board.getByRole("tab", { name: /History and files/ }).click();
  const history = board.getByRole("region", { name: "Edit history" });
  await expect(history.getByText(/Move /)).toBeVisible();
  await expect(history.getByText(/Add /)).toBeVisible();
});

test("row 6e: a fleet ordered to sail moves one hop when the month advances", async ({ e2e }) => {
  const copy = await copyFixturePackage(sharedSaveDir, e2e.scratch);
  await e2e.retargetDialog(copy);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);

  await navigateTo(e2e.page, "Fleet");
  await e2e.page.getByRole("radio", { name: /Home Fleet/ }).click();
  await e2e.page.getByRole("button", { name: "Submit movement command" }).click();
  await expect(e2e.page.getByText("Order queued")).toBeVisible();
  await expect(e2e.page.getByRole("row", { name: /Home Fleet.*submitted/ })).toBeVisible();

  await advanceMonths(e2e.page, 1);
  await navigateTo(e2e.page, "Fleet");
  await expect(e2e.page.getByRole("radio", { name: /Home Fleet.*English Channel/ })).toBeVisible({
    timeout: 15_000,
  });
  await expect(e2e.page.getByText("No movement commands")).toBeVisible();
});

test("row 6b: Diplomacy & War shows real relations, battle history and honest deferrals", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });

  await navigateTo(e2e.page, "Diplomacy & War");
  await expect(e2e.page.getByRole("heading", { name: "Diplomacy & War" })).toBeVisible();

  // The read-only battle-history command answers over the real IPC bridge: a fresh
  // campaign has fought nothing, which is shown as such (not as an error).
  await expect(e2e.page.getByText("No battles fought yet")).toBeVisible({ timeout: 15_000 });
  await expect(e2e.page.getByText(/Battle history unavailable/)).not.toBeVisible();

  // War-panel items the engine cannot supply are stated, never faked.
  await expect(e2e.page.getByText("Not yet modelled by the engine", { exact: true })).toBeVisible();
  await expect(e2e.page.getByText(/Trade protection/)).toBeVisible();
});

test("row 6c: Fleet organization founds a division through the real engine and applies it next month", async ({
  e2e,
}) => {
  // A disposable copy of the compiled save: advancing the month must not touch the shared one.
  const copy = await copyFixturePackage(sharedSaveDir, e2e.scratch);
  await e2e.retargetDialog(copy);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);

  await navigateTo(e2e.page, "Fleet");
  const organization = e2e.page.getByTestId("fleet-organization");
  await expect(organization.getByText("No divisions yet")).toBeVisible({ timeout: 15_000 });

  await organization.getByRole("button", { name: "Create division" }).click();
  // Queued, not applied: the engine only acts when the month is committed.
  await expect(organization.getByRole("status")).toContainText("Create division queued");
  await expect(organization.getByText("No divisions yet")).toBeVisible();

  await advanceMonths(e2e.page, 1);
  await navigateTo(e2e.page, "Fleet");
  await expect(organization.getByRole("heading", { name: /division — HMS / })).toBeVisible({
    timeout: 15_000,
  });
  await expect(organization.getByText("Commander vacant")).toBeVisible();
  await expect(organization.getByText("No divisions yet")).not.toBeVisible();
});

test("row 6d: the Campaign menu can save, copy, and close the campaign", async ({ e2e }) => {
  const working = await copyFixturePackage(sharedSaveDir, e2e.scratch);
  await e2e.retargetDialog(working);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);

  // Save used to answer NOT_IMPLEMENTED; it now confirms the revision on disk. (Earlier rows advance
  // the shared save, so the turn is whatever it is now — assert the shape, not a fixed number.)
  await openCampaignMenuItem(e2e.page, "Save");
  await expect(e2e.page.getByText(/Campaign saved — revision \d+/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(e2e.page.getByText(/NOT_IMPLEMENTED/)).not.toBeVisible();

  // Save a copy: the (stubbed) dialog returns a new folder; the copy is a real package.
  const copyDir = join(e2e.scratch, "the-copy");
  await e2e.retargetDialog(copyDir);
  await openCampaignMenuItem(e2e.page, /Copy game/);
  await expect(e2e.page.getByText(/Copy saved to/)).toBeVisible({ timeout: 15_000 });

  // Close returns to the campaign file screen.
  await openCampaignMenuItem(e2e.page, "Close campaign…");
  await e2e.page.getByRole("button", { name: "Close campaign", exact: true }).click();
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
