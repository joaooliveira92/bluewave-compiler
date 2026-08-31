// @ts-nocheck
// PROTOTYPE DRAFT — one serial narrative + a continuance skeleton, synced
// against the real implementation in apps/desktop/e2e/mvp-loop.spec.ts and
// continuance.spec.ts. Contract in README.md.

import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFixturePackage, expect, SEED, test } from "./fixtures.draft";

// ---------------------------------------------------------------------------
// Fresh-compile narrative: compile -> advance a month -> construction -> fleet
// File-scoped shared save dir; serial mode makes the share safe (workers: 1).
// ---------------------------------------------------------------------------
test.describe("MVP playable loop", () => {
  test.describe.configure({ mode: "serial" });

  let sharedSaveDir = "";

  const ARCHETYPE = "Shipyard Baron";
  const NATION = "Austro-Hungarian Empire";

  // The Overview screen also renders its own "Construction"/"Fleet" quick-nav
  // buttons, so plain getByRole("button", { name }) is ambiguous — scope to
  // the sidebar's nav buttons (data-sidebar="menu-button").
  function navigateTo(page: import("@playwright/test").Page, label: string) {
    return page.locator('[data-sidebar="menu-button"]').filter({ hasText: label }).click();
  }

  test("New Game compiles a fresh campaign onto Overview", async ({ e2e }) => {
    // module-scope scratch: keep one save for the sibling specs
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
    await e2e.page.getByRole("button", { name: new RegExp(ARCHETYPE), exact: false }).click();
    await e2e.page.getByRole("button", { name: "Choose Nation" }).click();

    // Nation: pick the slot.
    await e2e.page.getByRole("option", { name: NATION }).click();
    await e2e.page.getByRole("button", { name: "Start Campaign" }).click();

    // Compiled -> shell moves into the active campaign, always on Overview.
    await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
      timeout: 30000,
    });
    await expect(e2e.page.getByText("Revision 0")).toBeVisible();
    await expect(e2e.page.getByText("campaign-bluewave-1880-production")).toBeVisible();
  });

  test("Advance: commitMonth moves the calendar to a month view", async ({ e2e }) => {
    // give this boot the shared save as its dialog target; open it
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
    await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
      timeout: 30000,
    });

    // Header's advance action drives the month forward (deterministic seed).
    await e2e.page.getByRole("button", { name: "Advance Month" }).click();
    await expect(e2e.page.getByText("Bluewave — February 1880")).toBeVisible();
    await expect(e2e.page.getByText("Month advanced to February 1880.")).toBeVisible();
  });

  test("Construction: submit a design order and see it in the command table", async ({ e2e }) => {
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
    await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
      timeout: 30000,
    });

    await navigateTo(e2e.page, "Construction");
    await e2e.page.getByRole("tab", { name: "Design Catalog" }).click();
    await e2e.page.getByRole("radio").first().click();
    await e2e.page.getByRole("button", { name: "Submit Construction Command" }).click();

    await expect(e2e.page.getByText(/Command \S+ is submitted/)).toBeVisible();
    await e2e.page.getByRole("tab", { name: "Command Ledger" }).click();
    await expect(e2e.page.getByRole("row").filter({ hasText: "submitted" })).toBeVisible();
  });

  test("Fleet visibility: divisions render against compiled state", async ({ e2e }) => {
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: "Open Campaign" }).click();
    await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
      timeout: 30000,
    });

    await navigateTo(e2e.page, "Fleet");
    await expect(e2e.page.getByRole("heading", { name: "Fleet Movement" })).toBeVisible();
    // Austria-Hungary's compiled fleet (fleet_aut_adriatic) renders as the
    // real compiled state — never an error card.
    await expect(e2e.page.getByRole("heading", { name: "Divisions" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Continuance against a copy of a compiled master fixture package.
// The real suite (continuance.spec.ts) compiles its own master package in a
// setup test (the shipped content/production tree is untracked), then copies
// it fresh for every row — never mutating the source. copyFixturePackage now
// takes (sourceDir, scratchRoot).
// ---------------------------------------------------------------------------
let masterPackageDir = "";

test("setup: compile the master production package fixture", async ({ e2e }) => {
  masterPackageDir = join(await mkdtemp(join(tmpdir(), "bluewave-continuance-master-")), "package");
  await e2e.retargetDialog(masterPackageDir);

  await e2e.page.getByRole("button", { name: "New Campaign" }).click();
  await e2e.page.getByLabel("Campaign Seed").fill(SEED);
  await e2e.page.getByRole("button", { name: "Next", exact: true }).click();
  await e2e.page.getByRole("button", { name: "Next: Choose Nation" }).click();
  await e2e.page.getByRole("button", { name: /Shipyard Baron/, exact: false }).click();
  await e2e.page.getByRole("button", { name: "Choose Nation" }).click();
  await e2e.page.getByRole("option", { name: /Austro-Hungarian Empire/ }).click();
  await e2e.page.getByRole("button", { name: "Start Campaign" }).click();
  await expect(e2e.page.getByRole("heading", { name: "Campaign Overview" })).toBeVisible({
    timeout: 30000,
  });
});

test("Continuance: replay verifies the production save deterministically", async ({ e2e }) => {
  const pkg = await copyFixturePackage(masterPackageDir, e2e.scratch);
  await e2e.retargetDialog(pkg);

  await e2e.page.getByRole("button", { name: "Replay" }).click();
  await expect(e2e.page.getByText(/Replay complete/)).toBeVisible({
    timeout: 15000,
  });
});

// Again: getByTestId names above are placeholders — the implementer picks
// real selectors from the live screens (or adds data-testid, ticket 04).
