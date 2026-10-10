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
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  await expect(board.getByRole("tab", { name: /Hull and machinery/ })).toBeVisible();

  // Hull plan: move a fitting with the keyboard-reachable buttons, then place one by clicking the real drawing.
  await board.getByRole("button", { name: "Move on plan", exact: true }).click();
  await e2e.page.getByLabel("Fitting to move").click();
  await e2e.page.getByRole("option").nth(1).click();
  await board.getByRole("button", { name: /Move 10 permille toward the stern/ }).click();
  await expect(board.getByRole("status").filter({ hasText: /toward the stern/ })).toBeVisible();
  await board.getByRole("button", { name: "Place on plan", exact: true }).click();
  await e2e.page.getByLabel("Component to place").click();
  await e2e.page.getByRole("option").nth(1).click();
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

test("row 6g: the Drawing Board keeps the ship view in sight on every tab, wide and narrow", async ({
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
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  const ship = board.getByRole("region", { name: "Ship view" });
  const plan = ship.getByRole("img", { name: /Top-down plan/ });
  await expect(plan).toBeInViewport();

  // Mark the drawing's DOM node: a remount on tab switch would drop the mark.
  await plan.evaluate((el) => el.setAttribute("data-e2e-mark", "kept"));
  for (const tab of [
    "Arrangement",
    "Analysis",
    "Build",
    "History and files",
    "Hull and machinery",
  ]) {
    await board.getByRole("tab", { name: new RegExp(tab) }).click();
    await expect(plan).toBeInViewport();
    await expect(plan).toHaveAttribute("data-e2e-mark", "kept");
  }

  // The tab pane scrolls on its own; the ship view stays put.
  await board.getByRole("tab", { name: /Arrangement/ }).click();
  const pane = board.getByTestId("tab-pane");
  const scrolled = await pane.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    return el.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(0);
  await expect(plan).toBeInViewport();
  await expect(board.getByRole("region", { name: "Protection" })).toBeInViewport();

  // The divider is a keyboard-operable splitter that widens the ship view.
  const divider = board.getByRole("separator", { name: "Resize ship view" });
  await divider.focus();
  // From the left limit, two steps right: a fixed target that does not track the stored default.
  await e2e.page.keyboard.press("Home");
  const before = (await ship.boundingBox())!.width;
  await e2e.page.keyboard.press("ArrowRight");
  await e2e.page.keyboard.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "34");
  expect((await ship.boundingBox())!.width).toBeGreaterThan(before);

  // Narrow window: the panes stack, the splitter goes, and the ship view folds without unmounting.
  await e2e.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.setSize(960, 760),
  );
  await expect(divider).toBeHidden();
  const toggle = board.getByRole("button", { name: "Hide ship view" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(plan).toBeHidden();
  await board.getByRole("button", { name: "Show ship view" }).click();
  await expect(plan).toBeVisible();
  await expect(plan).toHaveAttribute("data-e2e-mark", "kept");
});

test("row 6h: hull-section labels open a detailed hover card without flicker or clipping", async ({
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
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  const strip = board.getByRole("group", { name: "Hull sections" });
  await expect(strip.getByRole("button")).toHaveCount(8);
  const card = e2e.page.getByTestId("section-card");
  const highlight = board.getByTestId("section-highlight");

  // Hover opens the card after a short delay; the plan highlights the same section.
  await strip.getByRole("button", { name: "Forecastle" }).hover();
  await expect(card).toHaveAttribute("data-section", "forecastle");
  await expect(card.getByRole("img", { name: /Detailed drawing of the forecastle/ })).toBeVisible();
  await expect(highlight).toHaveAttribute("data-zone", "FORECASTLE");

  // Moving to the neighbouring label swaps the content inside the same popup: no close/re-open flicker.
  await e2e.page.evaluate(() =>
    document
      .querySelector("[data-testid='section-card']")
      ?.parentElement?.setAttribute("data-e2e-mark", "same"),
  );
  await strip.getByRole("button", { name: "Forward magazine" }).hover();
  await expect(card).toHaveAttribute("data-section", "forward-magazine");
  const samePopup = await e2e.page.evaluate(() =>
    Boolean(document.querySelector("[data-e2e-mark='same'] [data-section='forward-magazine']")),
  );
  expect(samePopup).toBe(true);
  await expect(highlight).toHaveAttribute("data-zone", "FWD_MAGAZINE");

  // The pointer can travel from a label into the card (beside the drawing) without it closing.
  await strip.getByRole("button", { name: "Quarterdeck" }).hover();
  await expect(card).toHaveAttribute("data-section", "quarterdeck");
  const box = (await card.boundingBox())!;
  await e2e.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await e2e.page.waitForTimeout(600);
  await expect(card).toHaveAttribute("data-section", "quarterdeck");

  // The card fits the window and is not clipped by the dialog or the ship pane: its centre is its own pixel.
  const viewport = await e2e.page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.w);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.h);
  const ownsCentre = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(ownsCentre).toBe(true);

  // Leaving both closes the card and clears the highlight.
  await e2e.page.mouse.move(5, 5, { steps: 6 });
  await expect(card).toBeHidden();
  await expect(highlight).toHaveCount(0);

  // The wider ship view still leaves the tab pane its minimum, even at the widest stored share.
  await e2e.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.setSize(1100, 800),
  );
  const divider = board.getByRole("separator", { name: "Resize ship view" });
  await divider.focus();
  await e2e.page.keyboard.press("End");
  const tabPane = (await board.getByTestId("tab-pane").boundingBox())!;
  expect(tabPane.width).toBeGreaterThanOrEqual(34 * 16 - 1);
  const overflow = await board.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("row 6i: the ship drawing selects sections and fittings and links them to the forms", async ({
  e2e,
}) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Drawing Board" }).click();
  await e2e.page.getByRole("button", { name: "Open Drawing Board" }).click();
  // By name: the first-month guided tour is also a dialog and can appear while the board is open.
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  const strip = board.getByRole("group", { name: "Hull sections" });
  const inspector = board.getByTestId("selection-inspector");
  const card = e2e.page.getByTestId("section-card");

  // Keyboard: Enter on a focused label pins the section; the pin outlives the preview card.
  await strip.getByRole("button", { name: "Central machinery" }).focus();
  await e2e.page.keyboard.press("Enter");
  await expect(strip.getByRole("button", { name: "Central machinery" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(inspector.getByRole("heading", { name: "Central machinery" })).toBeVisible();
  await expect(card).toBeHidden();
  await expect(board.getByTestId("section-selected")).toHaveAttribute(
    "data-zone",
    "CENTRAL_MACHINERY",
  );

  // A mouse click pins too, and the pending hover preview does not reappear over the inspector.
  await strip.getByRole("button", { name: "Aft service" }).click();
  await e2e.page.waitForTimeout(600);
  await expect(card).toBeHidden();
  await expect(inspector.getByRole("heading", { name: "Aft service" })).toBeVisible();
  await strip.getByRole("button", { name: "Central machinery" }).click();
  await expect(inspector.getByRole("heading", { name: "Central machinery" })).toBeVisible();

  // Hover elsewhere previews without moving the pin.
  await strip.getByRole("button", { name: "Quarterdeck" }).hover();
  await expect(card).toHaveAttribute("data-section", "quarterdeck");
  await e2e.page.mouse.move(5, 5);
  await expect(card).toBeHidden();
  await expect(inspector.getByRole("heading", { name: "Central machinery" })).toBeVisible();

  // Escape clears the pin but leaves the dialog open; the next Escape closes the dialog as before.
  await strip.getByRole("button", { name: "Forward service" }).focus();
  await e2e.page.keyboard.press("Tab");
  await expect(strip.getByRole("button", { name: "Central machinery" })).toBeFocused();
  await expect(card).toBeVisible();
  await e2e.page.keyboard.press("Escape");
  await expect(card).toBeHidden();
  await e2e.page.keyboard.press("Escape");
  await expect(inspector).toHaveCount(0);
  await expect(board).toBeVisible();

  // A fitting's hit target sits exactly on its drawn marker, and a click selects it. The campaign's starting
  // design depends on the date, so the gun (a fitting with a mount name) and a second fitting are looked up.
  const ids = await board.evaluate((root) =>
    [...root.querySelectorAll('[role="toolbar"] [data-target]')].map((el) => [
      el.getAttribute("data-target")!,
      el.getAttribute("aria-label")!,
    ]),
  );
  const gunId = ids.find(([, name]) => name.includes("(mount "))![0];
  const otherId = ids.find(([id, name]) => id !== gunId && !name.includes("(mount "))![0];
  const gunTarget = board.locator(`[data-target="${gunId}"]`);
  const gunDot = board.locator(`[data-fitting="${gunId}"]`);
  const [t, d] = [(await gunTarget.boundingBox())!, (await gunDot.boundingBox())!];
  expect(Math.abs(t.x + t.width / 2 - (d.x + d.width / 2))).toBeLessThan(1.5);
  expect(Math.abs(t.y + t.height / 2 - (d.y + d.height / 2))).toBeLessThan(1.5);
  await gunTarget.click();
  await expect(gunTarget).toHaveAttribute("aria-pressed", "true");
  await expect(inspector.getByText("Selected fitting")).toBeVisible();

  // Go to settings: the battery card opens on its tab, scrolled into view, focused and outlined.
  await inspector.getByRole("button", { name: "Go to battery settings" }).click();
  await expect(board.getByRole("tab", { name: /Arrangement/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const focused = e2e.page.locator(":focus");
  await expect(focused).toHaveAttribute("aria-label", /^Rounds per gun, /);
  await expect(focused).toBeInViewport();
  await expect(board.locator("[data-battery][data-nav-flash]")).toHaveCount(1);
  await expect(gunTarget).toHaveAttribute("aria-pressed", "true");

  // Form to drawing: focus in another fitting's row lights it; leaving the form clears that, not the pin.
  await board.getByLabel(new RegExp(`^Station of ${otherId} `)).focus();
  await expect(board.locator(`[data-target="${otherId}"]`)).toHaveAttribute("data-state", "linked");
  await expect(gunTarget).toHaveAttribute("data-state", "selected");
  await strip.getByRole("button", { name: "Forecastle" }).focus();
  await expect(board.locator(`[data-target="${otherId}"]`)).toHaveAttribute(
    "data-state",
    "default",
  );

  // Narrow window: the stacked layout keeps the selection and its inspector.
  await e2e.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.setSize(960, 760),
  );
  await expect(board.getByRole("button", { name: "Hide ship view" })).toBeVisible();
  await expect(gunTarget).toHaveAttribute("aria-pressed", "true");
  await expect(inspector.getByText("Selected fitting")).toBeAttached();
});

test("row 6j: a finding on the ship leads to its fix, and the fix clears it", async ({ e2e }) => {
  await e2e.retargetDialog(sharedSaveDir);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Drawing Board" }).click();
  await e2e.page.getByRole("button", { name: "Open Drawing Board" }).click();
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  const inspector = board.getByTestId("selection-inspector");

  // The bow-most gun (fittings are listed bow to stern) and its station, read from the design's own form.
  const gunId = await board.evaluate((root) =>
    [...root.querySelectorAll('[role="toolbar"][aria-label="Fittings on the plan"] [data-target]')]
      .find((el) => el.getAttribute("aria-label")!.includes("(mount "))!
      .getAttribute("data-target")!,
  );
  await board.getByRole("tab", { name: /Arrangement/ }).click();
  const station = board.getByLabel(new RegExp(`^Station of ${gunId} `));
  const original = await station.inputValue();

  // A known finding: the gun's station moved outside its zone (blocking).
  await station.fill("500");
  await station.press("Enter");
  const marker = board.locator(`[data-marker="f:${gunId}"]`);
  await expect(marker).toHaveAttribute("data-severity", "BLOCKING");
  await expect(marker).toHaveAttribute("aria-label", /^Blocking: .*outside zone/);

  // Activate the marker: the gun is pinned and the finding opens in the inspector.
  await board.getByRole("tab", { name: /Build/ }).click();
  await marker.click();
  await expect(board.locator(`[data-target="${gunId}"]`)).toHaveAttribute("aria-pressed", "true");
  const entry = inspector.locator('[data-inspector-finding^="ARR-STATION-OUT-OF-ZONE|"]');
  await expect(entry).toHaveAttribute("aria-current", "true");
  await expect(entry).toContainText("BLOCKING");

  // Go to fix: the Arrangement tab opens with the gun's station field focused.
  await entry.getByRole("button", { name: "Go to fix" }).click();
  await expect(board.getByRole("tab", { name: /Arrangement/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(station).toBeFocused();
  await expect(station).toBeInViewport();

  // Correct it: the blocking marker goes, the gun stays pinned, and the fix is noted.
  await station.fill(original);
  await station.press("Enter");
  await expect(marker).not.toHaveAttribute("data-severity", "BLOCKING");
  await expect(board.locator('[data-marker^="s:"]')).toHaveCount(0);
  await expect(board.locator(`[data-target="${gunId}"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(board.getByTestId("resolved-note")).toContainText("Resolved:");
});

// Rows 6k-6l share one copy of the campaign: 6k submits a design and closes the app, 6l is a fresh app instance on the
// same package, so the queued design must have survived the restart (ADR-0082) before the month builds it.
let designCopy = "";

test("row 6k: a valid design is submitted from the Drawing Board and queued", async ({ e2e }) => {
  // Not e2e.scratch: that is removed when this test's app closes, and 6l needs the package after the restart.
  designCopy = await copyFixturePackage(
    sharedSaveDir,
    await mkdtemp(join(tmpdir(), "bluewave-design-")),
  );
  await e2e.retargetDialog(designCopy);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Drawing Board" }).click();
  await e2e.page.getByRole("button", { name: "Open Drawing Board" }).click();
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  // Earlier rows edited the shared campaign's board; start from the clean reference design.
  const startOver = board.getByRole("button", { name: "Start over" });
  if (await startOver.isVisible().catch(() => false)) await startOver.click();
  await expect(board.getByText("Can be submitted")).toBeVisible();
  await board.getByRole("tab", { name: /Build/ }).click();
  await board.getByLabel("Class name").fill("Arethusa E2E");
  await board.getByRole("button", { name: "Submit design" }).click();
  await expect(board.getByText(/Design queued\. "Arethusa E2E"/)).toBeVisible({ timeout: 15_000 });
  await expect(board.getByRole("button", { name: "Queued" })).toBeDisabled();
});

test("row 6l: after a restart the queued design is still there, and the month adds it to the catalog", async ({
  e2e,
}) => {
  expect(designCopy).not.toBe("");
  await e2e.retargetDialog(designCopy);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);
  await advanceMonths(e2e.page, 1);
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: /Design Catalog/ }).click();
  await expect(e2e.page.getByText("Arethusa E2E").first()).toBeVisible({ timeout: 15_000 });
});

test("row 6m: the designed class is ordered, then revised from the Drawing Board while it is building", async ({
  e2e,
}) => {
  expect(designCopy).not.toBe("");
  await e2e.retargetDialog(designCopy);
  await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30_000,
  });
  await dismissTour(e2e.page);
  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: /Design Catalog/ }).click();
  await e2e.page.getByRole("radio", { name: /Arethusa E2E/ }).click();
  await e2e.page.getByRole("button", { name: "Submit Construction Command" }).click();
  await e2e.page.getByRole("button", { name: "Confirm order" }).click();
  await expect(e2e.page.getByText(/Command \S+ is submitted/)).toBeVisible();
  await advanceMonths(e2e.page, 1);

  await navigateTo(e2e.page, "Construction");
  await e2e.page.getByRole("tab", { name: "Drawing Board" }).click();
  await e2e.page.getByRole("button", { name: "Open Drawing Board" }).click();
  const board = e2e.page.getByRole("dialog", { name: "Drawing Board" });
  await board.getByRole("tab", { name: /Build/ }).click();
  await board.getByLabel("If applied to project").click();
  await e2e.page.getByRole("option", { name: /Arethusa E2E/ }).click();
  await board.getByRole("button", { name: "Load this ship's design into the board" }).click();
  const replace = e2e.page.getByRole("button", { name: "Replace my design" });
  if (await replace.isVisible().catch(() => false)) await replace.click();
  // A small change: a little more installed power.
  await board.getByRole("tab", { name: /Hull and machinery/ }).click();
  const power = board.getByLabel(/Installed power/);
  const kw = Number(await power.inputValue());
  await power.fill(String(kw + 100));
  await power.press("Enter");
  await board.getByRole("tab", { name: /Build/ }).click();
  await board.getByRole("button", { name: "Apply revision to this ship" }).click();
  await e2e.page.getByRole("button", { name: "Queue the revision" }).click();
  await expect(board.getByText(/Revision queued/)).toBeVisible({ timeout: 15_000 });
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
