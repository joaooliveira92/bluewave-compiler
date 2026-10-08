import { describe, expect, it } from "vite-plus/test";
import { loadDrawingBoardContent } from "./content.js";
import {
  changeKinds,
  previewRevision,
  revisableProjects,
  type RevisionProject,
} from "./revisionPreview.js";

const content = loadDrawingBoardContent();
const start = content.references[0]!.draft;
const cat = (id: string) => content.components.find((c) => c.id === id)?.category;
const project = (donePct: number, status = "ACTIVE"): RevisionProject => ({
  projectId: "p1",
  className: "Test",
  status,
  totalWork: 1_000_000,
  completedWork: donePct * 10_000,
});

describe("revision preview", () => {
  it("loads the revision balance from content", () => {
    expect(content.revision!).toMatchObject({
      freeBelowBp: 500,
      revisionBelowBp: 2500,
      redesignBelowBp: 5000,
    });
  });
  it("no edits means no preview", () => {
    expect(changeKinds([], start, start, cat)).toEqual([]);
    expect(previewRevision([], project(10), content.revision!)).toBeNull();
  });
  it("classifies hull geometry edits as structure and fittings as fittings", () => {
    const hull = { kind: "set_hull", patch: { beam: 13000 } } as never;
    const placement = start.placements[0]!;
    const move = {
      kind: "move_placement",
      instanceId: placement.instanceId,
      zoneId: placement.zoneId,
      stationPermille: 100,
    } as never;
    expect(changeKinds([hull], start, start, cat)).toEqual(["STRUCTURE"]);
    expect(changeKinds([move], start, start, cat)).toContain(
      cat(placement.componentId) === "MAIN_GUN" ? "MAIN_ARMAMENT" : "FITTINGS",
    );
  });
  it("tier rises with progress for the same fittings change", () => {
    const tiers = [2, 10, 30, 60].map(
      (p) => previewRevision(["FITTINGS"], project(p), content.revision!)!.tier,
    );
    expect(tiers).toEqual(["T0_FREE", "T1_REVISION", "T2_REDESIGN", "T3_RECONSTRUCTION"]);
  });
  it("T3 asks for a rebuild project; T1 has the spec's minimum delay of one month", () => {
    expect(
      previewRevision(["FITTINGS"], project(60), content.revision!)!.requiresRebuildProject,
    ).toBe(true);
    expect(
      previewRevision(["FITTINGS"], project(10), content.revision!)!.delayMonths,
    ).toBeGreaterThanOrEqual(1);
  });
  it("a project with zero total work is treated as fully progressed, not a divide-by-zero", () => {
    const d = previewRevision(
      ["FITTINGS"],
      { ...project(0), totalWork: 0, completedWork: 0 },
      content.revision!,
    )!;
    expect(d.progressBp).toBe(10_000);
  });
  it("completed projects cannot be revised", () => {
    expect(
      revisableProjects([project(10), project(100, "COMPLETED")]).map((p) => p.status),
    ).toEqual(["ACTIVE"]);
  });
});
