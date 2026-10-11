import { SEED, expect, test } from "./fixtures.js";
import { reachFleetMethodScreen } from "./flows.js";

// Focused pass over the Starting-fleet method screen (spec §5b): the deck is the
// selector, a comparison legend lists all three methods, and selecting a card
// updates the described-by caption. `startNewCampaign` already passes through
// this screen; this is the only spec that asserts it directly.
test("Starting-fleet method: three cards, a comparison legend, and a caption that follows selection", async ({
  e2e,
}) => {
  await reachFleetMethodScreen(e2e.page, { seed: SEED });

  const inherit = e2e.page.getByRole("button", { name: "Inherit an Existing Navy" });
  const manual = e2e.page.getByRole("button", { name: "Build the Legacy Fleet Manually" });
  const curated = e2e.page.getByRole("button", { name: "Curated Historical-Inspired Fleet" });

  // All three methods are presented, none gated.
  await expect(inherit).toBeVisible();
  await expect(manual).toBeVisible();
  await expect(curated).toBeVisible();

  // The always-visible comparison legend carries all three titles + taglines.
  const legend = e2e.page.getByRole("list", { name: "Starting-fleet method comparison" });
  await expect(legend).toContainText("Inherit an Existing Navy");
  await expect(legend).toContainText("Build the Legacy Fleet Manually");
  await expect(legend).toContainText("Curated Historical-Inspired Fleet");

  // Default selection is `generated` (Inherit) with its caption and no manual note.
  await expect(inherit).toHaveAttribute("aria-pressed", "true");
  await expect(e2e.page.getByText(/operational-but-aging navy/)).toBeVisible();
  await expect(e2e.page.getByText(/Detailed fleet construction isn't available yet/)).toHaveCount(
    0,
  );

  // Selecting the manual-build card is allowed and updates the caption + note.
  await manual.click();
  await expect(manual).toHaveAttribute("aria-pressed", "true");
  await expect(inherit).toHaveAttribute("aria-pressed", "false");
  await expect(e2e.page.getByText(/Automatic generation is switched off/)).toBeVisible();
  await expect(e2e.page.getByText(/operational-but-aging navy/)).toHaveCount(0);
  await expect(e2e.page.getByText(/Detailed fleet construction isn't available yet/)).toBeVisible();

  // The selected card points at the caption so a screen reader announces it.
  const describedBy = await manual.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(e2e.page.locator(`[id="${describedBy}"]`)).toContainText(
    /Detailed fleet construction isn't available yet/,
  );
});
