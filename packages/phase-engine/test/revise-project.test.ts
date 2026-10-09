// ADR-0070: ReviseProject - revision tiers applied to a real construction project.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignSnapshot, NationState } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import type { CommandBody, CommandEnvelope } from "@bluewave/commands";
import { CommandLifecycle } from "@bluewave/commands";
import {
  PropulsionPlantCatalogueSchema,
  ShipComponentCatalogueSchema,
  ShipHullFormCatalogueSchema,
} from "@bluewave/content-schema";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import {
  buildShipBuildingContent,
  type ComponentDef,
  type HullFormRecord,
  type PropulsionPlant,
  type ShipBuildingData,
} from "@bluewave/ship-design";
import { parse } from "yaml";
import { describe, expect, it } from "vite-plus/test";
import { EventLedger } from "@bluewave/events";
import { applyBudgetProject } from "../src/commands.js";
import { FinancialLedger } from "../src/financial-ledger.js";
import { addMonths } from "../src/reviseProject.js";
import { MonthExecutor } from "../src/index.js";
import { ATTACKER_NATION, makeBattleSnapshot } from "./battle-fixtures.js";

const root = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "content",
  "production",
  "1880",
);
const load = (rel: string) =>
  parse(readFileSync(join(root, rel), "utf8")) as Record<string, unknown>;
const data: ShipBuildingData = {
  components: ShipComponentCatalogueSchema.parse(load("ship-building/components.yaml"))
    .components as ComponentDef[],
  plants: PropulsionPlantCatalogueSchema.parse(load("ship-building/plants.yaml"))
    .plants as unknown as PropulsionPlant[],
  hullForms: ShipHullFormCatalogueSchema.parse(load("ship-building/hull-forms.yaml"))
    .hullForms as HullFormRecord[],
  balance: load("ship-building/balance.yaml") as unknown as ShipBuildingData["balance"],
  technologies: parse(readFileSync(join(root, "technologies.yaml"), "utf8")) as {
    id: string;
    year: number;
  }[],
};
const content = buildShipBuildingContent(data);
const reference = (
  parse(readFileSync(join(root, "ship-building", "reference-designs.yaml"), "utf8")) as {
    designs: { id: string; draft: Record<string, unknown> }[];
  }
).designs;

// A cruiser, so project work (cost units, displacement / 100,000 kg) is large enough for meaningful percentages.
const baseDraft: Record<string, unknown> = {
  ...reference.find((d) => d.id === "torpedo_cruiser_1880")!.draft,
  nationId: ATTACKER_NATION,
};
const base = (): CampaignSnapshot => ({
  ...makeBattleSnapshot({ areas: ["a-1"], wars: [] }),
  startYear: 1880,
  startMonth: 1,
});

const envelope = (
  snapshot: CampaignSnapshot,
  body: CommandBody,
  id: string,
): CommandEnvelope<CommandBody> => ({
  commandId: `c-${id}`,
  version: "0.1.0",
  expectedSnapshotHash: sha256Hex(canonicalSerialize(snapshot)),
  idempotencyKey: `ik-${id}`,
  timestamp: "test",
  body,
});

function execute(
  snapshot: CampaignSnapshot,
  commands: CommandEnvelope<CommandBody>[],
  withContent = true,
) {
  const collector = new DiagnosticCollector();
  const result = new MonthExecutor().execute(
    snapshot,
    commands,
    "revise-seed",
    collector,
    undefined,
    withContent ? { shipBuilding: content } : undefined,
  );
  return { snapshot: result.finalSnapshot, collector };
}

/** A snapshot holding a submitted design and a construction project on it with `done` work units complete. */
function withProject(done: number): CampaignSnapshot {
  const start = base();
  const submit = envelope(
    start,
    {
      type: "SubmitDesign",
      nationId: ATTACKER_NATION,
      designVersionId: "des_rev_base",
      designFamilyId: "fam_rev",
      className: "Rev class",
      hullType: "destroyer",
      machineryType: "locomotive_boiler",
      draft: baseDraft,
    },
    "base",
  );
  const { snapshot, collector } = execute(start, [submit]);
  expect(collector.all.filter((x) => x.code === "DESIGN_REJECTED")).toEqual([]);
  const nation = snapshot.nations.get(ATTACKER_NATION)!;
  const total = Math.round(
    Number(snapshot.designs.get("des_rev_base")!.normalizedDisplacementKg) / 100_000,
  );
  const project = {
    id: "con_rev",
    type: "ship",
    projectType: "NEW_CONSTRUCTION",
    targetId: "ship_rev",
    designVersionId: "des_rev_base",
    totalWork: SafeInt(total),
    completedWork: SafeInt(done),
    paidWork: SafeInt(done),
    status: "ACTIVE",
    startedAt: "1895-06",
  } as unknown as NationState["constructionProjects"][number];
  return {
    ...snapshot,
    nations: new Map([
      ...snapshot.nations,
      [ATTACKER_NATION, { ...nation, constructionProjects: [project] }],
    ]),
  };
}

const revised = (patch: (d: Record<string, any>) => void): Record<string, unknown> => {
  const d = structuredClone(baseDraft) as Record<string, any>;
  patch(d);
  return d;
};
const fittingsChange = revised((d) => (d.hull.designMarginBp += 100));
const machineryChange = revised((d) => (d.machinery.installedKw += 100));
const structureChange = revised((d) => (d.hull.beam += 60));

const revise = (snapshot: CampaignSnapshot, draft: unknown, id = "des_rev_2") =>
  execute(snapshot, [
    envelope(
      snapshot,
      {
        type: "ReviseProject",
        nationId: ATTACKER_NATION,
        projectId: "con_rev",
        newDesignVersionId: id,
        draft,
      },
      id,
    ),
  ]);
const projectOf = (s: CampaignSnapshot) =>
  s.nations.get(ATTACKER_NATION)!.constructionProjects.find((p) => p.id === "con_rev")!;
const codes = (c: DiagnosticCollector) => c.all.map((x) => x.code);

describe("ReviseProject through the month", () => {
  it("free change (T0, 0% built): swaps the design, grows the family, keeps history", () => {
    const before = withProject(0);
    const { snapshot, collector } = revise(before, fittingsChange);
    expect(codes(collector)).not.toContain("REVISION_REJECTED");
    const p = projectOf(snapshot);
    expect(p.designVersionId).toBe("des_rev_2");
    expect(Number(p.completedWork)).toBe(0);
    expect(snapshot.designs.get("des_rev_2")!.sourceDraft).toEqual(fittingsChange);
    expect(snapshot.designFamilies.get("fam_rev")!.memberDesignVersionIds).toEqual([
      "des_rev_base",
      "des_rev_2",
    ]);
    expect(snapshot.designs.get("des_rev_base")).toEqual(before.designs.get("des_rev_base"));
  });

  it("revision (T1, 20% built): keeps the work and adds rework to what is owed", () => {
    const before = withProject(4);
    const { snapshot, collector } = revise(before, fittingsChange);
    expect(codes(collector)).not.toContain("REVISION_REJECTED");
    const p = projectOf(snapshot);
    const newCost = Math.round(
      Number(snapshot.designs.get("des_rev_2")!.normalizedDisplacementKg) / 100_000,
    );
    expect(Number(p.totalWork)).toBe(
      newCost + Math.floor((4 * content.revision!.reworkBp) / 10_000),
    );
    expect(Number(p.completedWork)).toBe(4);
  });

  it("redesign (T2, 40% built): loses the hull work the rules do not keep", () => {
    const { snapshot, collector } = revise(withProject(8), machineryChange);
    expect(codes(collector)).not.toContain("REVISION_REJECTED");
    const kept = Math.floor((8 * content.revision!.redesignKeptBp) / 10_000);
    expect(Number(projectOf(snapshot).completedWork)).toBe(kept);
    expect(projectOf(snapshot).designVersionId).toBe("des_rev_2");
  });

  it("a structural change is a redesign even on a barely started hull", () => {
    const { snapshot, collector } = revise(withProject(2), structureChange);
    expect(codes(collector)).not.toContain("REVISION_REJECTED");
    expect(Number(projectOf(snapshot).completedWork)).toBe(
      Math.floor((2 * content.revision!.redesignKeptBp) / 10_000),
    );
  });

  it("reconstruction (T3, 60% built): refused, snapshot untouched", () => {
    const before = withProject(12);
    const { snapshot, collector } = revise(before, fittingsChange);
    expect(codes(collector)).toContain("REVISION_REQUIRES_REBUILD");
    expect(snapshot.designs.has("des_rev_2")).toBe(false);
    expect(projectOf(snapshot)).toEqual(projectOf(before));
  });

  it("refuses a revision that changes nothing", () => {
    const { snapshot, collector } = revise(withProject(0), baseDraft);
    expect(codes(collector)).toContain("REVISION_REJECTED");
    expect(snapshot.designs.has("des_rev_2")).toBe(false);
  });

  it("refuses an invalid revised design, naming the blocking findings", () => {
    const heavy = revised((d) => (d.machinery.fuelCapacityKg = 400_000));
    const { snapshot, collector } = revise(withProject(0), heavy);
    expect(snapshot.designs.has("des_rev_2")).toBe(false);
    expect(collector.all.find((x) => x.code === "REVISION_REJECTED")?.message).toMatch(
      /cannot be built: [A-Z_]+/,
    );
  });

  it("is skipped with a diagnostic when the engine has no ship-building content", () => {
    const before = withProject(0);
    const out = execute(
      before,
      [
        envelope(
          before,
          {
            type: "ReviseProject",
            nationId: ATTACKER_NATION,
            projectId: "con_rev",
            newDesignVersionId: "des_rev_2",
            draft: fittingsChange,
          },
          "nocontent",
        ),
      ],
      false,
    );
    expect(codes(out.collector)).toContain("SHIP_BUILDING_CONTENT_MISSING");
  });

  it("is deterministic", () => {
    const before = withProject(4);
    const a = revise(before, fittingsChange).snapshot;
    const b = revise(before, fittingsChange).snapshot;
    expect(sha256Hex(canonicalSerialize(a))).toBe(sha256Hex(canonicalSerialize(b)));
  });
});

// The month executor applies commands in the month after the snapshot's start month (1880-01).
const APPLIED_MONTH = "1880-02";

describe("revision hold", () => {
  const budget = (snapshot: CampaignSnapshot, month: string) => {
    const collector = new DiagnosticCollector();
    const next = applyBudgetProject(
      snapshot,
      {
        type: "budget_project",
        nationId: ATTACKER_NATION,
        projectId: "con_rev",
        budget: SafeInt(1),
      },
      month,
      SafeInt(0),
      (() => {
        let n = 0;
        return () => SafeInt(n++);
      })(),
      new FinancialLedger(),
      new EventLedger(),
      collector,
    );
    return { next, codes: collector.all.map((x) => x.code) };
  };

  it("adds months across a year boundary", () => {
    expect(addMonths("1880-11", 1)).toBe("1880-12");
    expect(addMonths("1880-12", 1)).toBe("1881-01");
    expect(addMonths("1880-01", 13)).toBe("1881-02");
  });

  it("a revision (T1) holds funding for its delay, then releases it", () => {
    const { snapshot } = revise(withProject(4), fittingsChange);
    const hold = projectOf(snapshot).holdUntilMonth;
    expect(hold).toBe(addMonths(APPLIED_MONTH, content.revision!.t1DelayMonths));
    const blocked = budget(snapshot, APPLIED_MONTH);
    expect(blocked.codes).toContain("PROJECT_ON_HOLD");
    expect(blocked.next).toBe(snapshot);
    expect(budget(snapshot, hold!).codes).not.toContain("PROJECT_ON_HOLD");
  });

  it("a free change (T0) does not hold the project", () => {
    const { snapshot } = revise(withProject(0), fittingsChange);
    expect(projectOf(snapshot).holdUntilMonth).toBeUndefined();
    expect(budget(snapshot, APPLIED_MONTH).codes).not.toContain("PROJECT_ON_HOLD");
  });

  it("a redesign (T2) holds funding for the longer redesign delay", () => {
    const { snapshot } = revise(withProject(8), machineryChange);
    expect(projectOf(snapshot).holdUntilMonth).toBe(
      addMonths(APPLIED_MONTH, content.revision!.t2DelayMonths),
    );
  });
});

describe("ReviseProject issue-time validation", () => {
  const lifecycle = (snapshot: CampaignSnapshot, body: Record<string, unknown>) =>
    new CommandLifecycle().validate(
      envelope(
        snapshot,
        {
          type: "ReviseProject",
          nationId: ATTACKER_NATION,
          projectId: "con_rev",
          newDesignVersionId: "des_rev_2",
          draft: fittingsChange,
          ...body,
        } as CommandBody,
        "v",
      ),
      snapshot,
    );
  it("accepts a well-formed revision", () => {
    expect(lifecycle(withProject(0), {}).ok).toBe(true);
  });
  it("rejects unknown project, reused id, bad id, foreign draft", () => {
    const s = withProject(0);
    for (const bad of [
      { projectId: "nope" },
      { newDesignVersionId: "des_rev_base" },
      { newDesignVersionId: "Bad Id" },
      { draft: { ...fittingsChange, nationId: "XXX" } },
      { draft: {} },
    ])
      expect(lifecycle(s, bad).ok).toBe(false);
  });
  it("rejects a project on an authored design that has no source draft", () => {
    const s = withProject(0);
    const { sourceDraft: _drop, ...bare } = s.designs.get("des_rev_base")!;
    const authored = { ...s, designs: new Map([...s.designs, ["des_rev_base", bare]]) };
    expect(lifecycle(authored as CampaignSnapshot, {}).ok).toBe(false);
  });
});
