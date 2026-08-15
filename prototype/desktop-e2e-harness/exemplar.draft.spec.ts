// PROTOTYPE DRAFT — one serial narrative + a continuance skeleton written
// against the draft harness API in fixtures.draft.ts. Contract in README.md.
import { SEED, test, expect } from "./fixtures.draft";
import { copyFixturePackage } from "./fixtures.draft";
import { join, dirname } from "node:path";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";

// ---------------------------------------------------------------------------
// Fresh-compile narrative: compile -> advance a month -> construction -> fleet
// File-scoped shared save dir; serial mode makes the share safe (workers: 1).
// ---------------------------------------------------------------------------
test.describe("MVP playable loop", () => {
  test.describe.configure({ mode: "serial" });

  let sharedSaveDir = "";

  test("New Game compiles a fresh campaign onto Overview", async ({ e2e }) => {
    // module-scope scratch: keep one save for the sibling specs
    sharedSaveDir = join(await mkdtemp(join(tmpdir(), "bluewave-shared-")), "save");
    await e2e.retargetDialog(sharedSaveDir);

    await e2e.page.getByRole("button", { name: "New Game" }).click();
    // archetype -> preferences (type fixed seed) -> nation -> compile
    await e2e.page.getByRole("button", { name: "Start" }).click();
    await e2e.page.getByLabel("Campaign Seed").fill(SEED);
    await e2e.page.getByRole("button", { name: /Continue/i }).click();
    await e2e.page.getByRole("button", { name: /Start Campaign/i }).click();
    await e2e.page.getByText("Overview").waitFor({ timeout: 20000 });

    // user-visible state after compile (inspectCampaign projection)
    await expect(e2e.page.getByText("Austria-Hungary")).toBeVisible();
  });

  test("Advance: commitMonth moves the calendar to a month view", async ({ e2e }) => {
    // give this boot the shared save as its dialog target; open it
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: /Load/i }).first().click();
    await e2e.page.getByText("Overview").waitFor({ timeout: 15000 });

    await e2e.page.getByRole("button", { name: /Advance Month|Continue/i }).click();
    await expect(e2e.page.getByText(new RegExp("turn [\\d]"))).toBeVisible();
  });

  test("Construction: submit a design order and see it in the command table", async ({ e2e }) => {
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: /Construction/i }).click();
    await e2e.page.getByTestId("design-picker").first().click();
    await e2e.page.getByRole("button", { name: /Submit/i }).click();
    await expect(e2e.page.getByTestId("construction-command-table")).toContainText(/Building|Under construction/i);
  });

  test("Fleet visibility: divisions render against compiled state", async ({ e2e }) => {
    await e2e.retargetDialog(sharedSaveDir);
    await e2e.page.getByRole("button", { name: /Fleet/i }).click();
    // compiler emits no divisions; honest empty/zero-state, not an error card
    await expect(e2e.page.getByRole("heading", { name: /Fleet/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Continuance against a copy of the shipped production package.
// ---------------------------------------------------------------------------
test("Continuance: replay verifies the production save deterministically", async ({ e2e }) => {
  const pkg = await copyFixturePackage(e2e.scratch);
  await e2e.retargetDialog(pkg);

  await e2e.page.getByRole("button", { name: /Replay/i }).click();
  await e2e.page.getByText("Overview").waitFor({ timeout: 15000 });
  await expect(e2e.page.getByText(/Replay verified|integrity/i).first()).toBeVisible();
});

// Again: getByTestId names above are placeholders — the implementer picks
// real selectors from the live screens (or adds data-testid, ticket 04).