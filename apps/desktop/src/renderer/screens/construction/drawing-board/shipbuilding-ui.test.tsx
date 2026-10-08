import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { buildWorkshopView } from "@bluewave/ship-design";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { DrawingBoard } from "./DrawingBoard.js";
import { componentFacts, componentsByCategory } from "./componentFacts.js";
import { loadDrawingBoardContent } from "./content.js";
import { exportDesign } from "./designFile.js";
import { RequirementChip } from "./RequirementChip.js";

afterEach(cleanup);
const content = loadDrawingBoardContent();
const ref = content.references[0]!;
const region = (name: string) => screen.getByRole("region", { name });

describe("requirement chip", () => {
  it("shows the headline brief and opens every requirement in a popover", async () => {
    render(<RequirementChip requirement={ref.draft.requirement} />);
    const chip = screen.getByRole("button", { name: "Design requirement" });
    expect(chip.textContent).toMatch(/Requirement: .* kn · .* nm/);
    fireEvent.click(chip);
    const dialog = await screen.findByText("Design requirement", { selector: "div" });
    const body = dialog.parentElement!.textContent!;
    for (const label of ["Top speed", "Cruising speed", "Range", "Crew quality", "Protection goal"])
      expect(body).toContain(label);
  });
});

describe("componentFacts", () => {
  const view = buildWorkshopView(ref.draft, content.environmentFor(ref.month));
  const placed = ref.draft.placements[0]!;
  const def = content.components.find((c) => c.id === placed.componentId)!;

  it("reports the compiler's own weight and cost for a placed fitting", () => {
    const summary = view.compiled.components.find((c) => c.instanceId === placed.instanceId)!;
    const f = componentFacts(def, summary);
    expect(f.name).toBe(def.displayName);
    expect(f.placed).toEqual({
      weightT: summary.weightKg / 1000,
      costGbp: summary.costMicro / 1_000_000,
    });
  });
  it("has no weight or cost for a catalogue entry that is not placed", () => {
    expect(componentFacts(def, undefined).placed).toBeNull();
  });
  it("groups the catalogue by category without losing or duplicating a component", () => {
    const groups = componentsByCategory(content.components);
    expect(groups.flatMap((g) => g.items.map((i) => i.id)).sort()).toEqual(
      content.components.map((c) => c.id).sort(),
    );
    expect(new Set(groups.map((g) => g.category)).size).toBe(groups.length);
  });
});

describe("design file chip", () => {
  it("shows the opened file as an attachment, and a bad file as an error chip", async () => {
    render(<DrawingBoard />);
    const input = screen.getByLabelText("Design file", { selector: "input" }) as HTMLInputElement;
    const good = exportDesign(
      ref.draft,
      content.components,
      buildWorkshopView(ref.draft, content.environmentFor(ref.month)).compiled,
    );
    fireEvent.change(input, {
      target: { files: [new File([good], "my-ship.bwdesign", { type: "application/json" })] },
    });
    await waitFor(() =>
      expect(within(region("Design file")).getByLabelText("Last design file").textContent).toMatch(
        /my-ship\.bwdesign.*Opened/,
      ),
    );
    fireEvent.change(input, { target: { files: [new File(["nonsense"], "bad.bwdesign")] } });
    await waitFor(() => {
      const chip = within(region("Design file")).getByLabelText("Last design file");
      expect(chip.textContent).toMatch(/bad\.bwdesign.*Could not be opened/);
      expect(chip.getAttribute("data-state")).toBe("error");
    });
    expect(within(region("Design file")).getByRole("status").textContent).toMatch(
      /Cannot open design/,
    );
  });
});

describe("Checkbox", () => {
  it("toggles and exposes its state to assistive technology", () => {
    render(<Checkbox aria-label="Show it" />);
    const box = screen.getByRole("checkbox", { name: "Show it" });
    expect(box.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
  });
});

describe("revision tier badge", () => {
  it("labels the tier with a badge", async () => {
    const project = {
      projectId: "p",
      className: "Ship",
      status: "ACTIVE",
      totalWork: 20,
      completedWork: 4,
    };
    render(<DrawingBoard projects={[project]} />);
    const input = screen.getByLabelText(/installed power/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: String(Number(input.value) + 100) } });
    fireEvent.blur(input);
    const status = await within(region("Revision preview")).findByRole("status");
    expect(within(status).getByText(/^(Redesign|Revision)$/)).toBeTruthy();
    expect(within(region("Revision preview")).getByLabelText("Selected ship").textContent).toMatch(
      /authored design/,
    );
  });
});
