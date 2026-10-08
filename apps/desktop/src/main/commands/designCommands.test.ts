import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { dispatchCampaignCommand } from "../campaignBridge.js";
import {
  clearCampaignSessionsForTest,
  getCampaignSession,
  registerCampaignSession,
} from "../campaignSessions.js";
import { compileProductionCampaign } from "../compiler.js";
import { clearPendingWorkspacesForTest } from "../pendingCommands.js";
import { toSaveableState } from "../saveHelpers.js";
import { SafeInt } from "@bluewave/contracts";
import { commitMonth } from "./commitMonth.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

/**
 * An 1880-era torpedo cruiser (class CL, about 2,200 t): compound plant, machine guns and four above-water 14-inch tubes.
 * In January 1880 only machine guns and torpedoes exist, and DESIGN-22 gives no destroyer class below 19 knots.
 */
const cruiser = {
  nationId: "uk",
  requirement: {
    category: "CL",
    requiredSpeedMilliKnots: 16_000,
    cruiseSpeedMilliKnots: 10_000,
    requiredRangeNm: 1_500,
    designThreatId: "qf_12pdr",
    modernizationExpectation: "NONE",
    crewQualityBp: 10_000,
    accommodationStandard: "SPARTAN",
    protectionGoal: "NONE",
  },
  hull: {
    hullFormId: "protected_cruiser_form",
    lengthWl: 85_000,
    beam: 12_000,
    draught: 4_200,
    depthToMainDeck: 7_000,
    blockCoeffBp: 5_000,
    materialId: "mild_steel",
    structuralSchemeId: "mixed",
    subdivisionGrade: 2,
    targetDisplacementKg: 2_200_000,
    limitDisplacementKg: null,
    designMarginBp: 300,
    growthReserveBp: 0,
  },
  machinery: {
    plantId: "compound_cylindrical",
    installedKw: 2_300,
    zoneId: "CENTRAL_MACHINERY",
    stationPermille: 400,
    fuelCapacityKg: 800_000,
    fuelZoneId: "CENTRAL_MACHINERY",
    fuelStationPermille: 450,
    foulingBp: 0,
    rooms: [
      { zoneId: "CENTRAL_MACHINERY", stationPermille: 400, shareBp: 6_000 },
      { zoneId: "AFT_SERVICE", stationPermille: 680, shareBp: 4_000 },
    ],
  },
  armour: { regions: [], citadelLengthMm: 0, torpedoWarheadKg: 12, bunkerProtectionBp: 0 },
  placements: [
    {
      instanceId: "mg_fwd",
      componentId: "gun_nordenfelt_1in",
      zoneId: "FORECASTLE",
      stationPermille: 40,
      params: { barrels: 1, rounds: 1_000 },
      magazineRef: "mag_fwd",
    },
    {
      instanceId: "mg_aft",
      componentId: "gun_nordenfelt_1in",
      zoneId: "QUARTERDECK",
      stationPermille: 950,
      params: { barrels: 1, rounds: 1_000 },
      magazineRef: "mag_aft",
    },
    {
      instanceId: "tubes",
      componentId: "tube_14in_above_water",
      zoneId: "SUPERSTRUCTURE",
      stationPermille: 580,
      params: { tubes: 4 },
    },
    {
      instanceId: "mag_fwd",
      componentId: "magazine_small",
      zoneId: "FWD_MAGAZINE",
      stationPermille: 130,
    },
    {
      instanceId: "mag_aft",
      componentId: "magazine_small",
      zoneId: "AFT_MAGAZINE",
      stationPermille: 830,
    },
    { instanceId: "dyn", componentId: "dynamo_small", zoneId: "FWD_SERVICE", stationPermille: 200 },
    {
      instanceId: "vent",
      componentId: "ventilation_plant",
      zoneId: "FWD_SERVICE",
      stationPermille: 210,
    },
    {
      instanceId: "quarters",
      componentId: "quarters_crew",
      zoneId: "FWD_SERVICE",
      stationPermille: 230,
      params: { blocks: 12 },
    },
    {
      instanceId: "funnel",
      componentId: "funnel_single",
      zoneId: "SUPERSTRUCTURE",
      stationPermille: 600,
    },
  ],
};

describe("submitDesignCommand (ADR-0066)", () => {
  let saveRoot: string;
  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-design-"));
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(
      PRODUCTION_PACK,
      new AbortController().signal,
      collector,
    );
    if (!output) throw new Error("production pack failed to compile");
    const state = toSaveableState(output.state);
    new SaveStore().save(state, saveRoot);
    registerCampaignSession({
      sessionId: "ds",
      saveDir: saveRoot,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state,
    });
  });
  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
  });

  const submit = (over: Record<string, unknown> = {}) =>
    dispatchCampaignCommand("submitDesignCommand", {
      sessionId: "ds",
      expectedRevision: 0,
      transportRequestId: "tx-d1",
      className: "Test Cruiser",
      draft: cruiser,
      ...over,
    });

  it("queues a valid design, and committing the month adds it to the snapshot", async () => {
    const queued = await submit();
    expect(queued.outcome).toBe("success");
    if (queued.outcome !== "success") return;
    const { designVersionId } = queued.value as { designVersionId: string };
    expect(designVersionId).toMatch(/^des_uk_test_cruiser_t\d+$/);
    expect(getCampaignSession("ds")!.state.snapshot.designs.has(designVersionId)).toBe(false); // not before the month

    const committed = await commitMonth({
      sessionId: "ds",
      expectedRevision: 0,
      transportRequestId: "commit-ds",
    });
    expect(committed.outcome).toBe("success");
    const design = getCampaignSession("ds")!.state.snapshot.designs.get(designVersionId)!;
    expect(design).toBeDefined();
    expect(design.nationId).toBe("uk");
    expect(design.className).toBe("Test Cruiser");
    expect(design.torpedoArmament?.[0]?.tubeCount).toBe(4);
  });

  it("rejects an unbuildable design immediately with the blocking findings, queuing nothing", async () => {
    const heavy = { ...cruiser, machinery: { ...cruiser.machinery, fuelCapacityKg: 400_000 } };
    const r = await submit({ draft: heavy });
    expect(r).toMatchObject({ outcome: "rejected", reason: "DESIGN_REJECTED" });
    if (r.outcome === "rejected") expect(r.diagnostics.join(" ")).toContain("displacement");
  });

  it("rejects a design that needs technology the 1880 campaign does not have", async () => {
    const modern = {
      ...cruiser,
      machinery: { ...cruiser.machinery, plantId: "triple_expansion_watertube" },
    };
    const r = await submit({ draft: modern });
    expect(r).toMatchObject({ outcome: "rejected", reason: "DESIGN_REJECTED" });
    if (r.outcome === "rejected") expect(r.diagnostics.join(" ")).toMatch(/not available/i);
  });

  it("rejects malformed payloads at the boundary and bad drafts by shape", async () => {
    expect((await submit({ className: "" })).outcome).toBe("error");
    expect((await submit({ draft: { nationId: "uk" } })).outcome).toBe("rejected");
    expect((await submit({ draft: "nope" })).outcome).toBe("error");
  });

  it("is idempotent for the same transport request and rejects a stale revision", async () => {
    expect((await submit()).outcome).toBe("success");
    expect((await submit()).outcome).toBe("success");
    expect(await submit({ expectedRevision: 5, transportRequestId: "tx-stale" })).toMatchObject({
      outcome: "rejected",
      reason: "REVISION_MISMATCH",
    });
  });
});

describe("reviseProjectCommand and loadProjectDraft (ADR-0070)", () => {
  let saveRoot: string;
  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-revise-"));
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(
      PRODUCTION_PACK,
      new AbortController().signal,
      collector,
    );
    if (!output) throw new Error("production pack failed to compile");
    const state = toSaveableState(output.state);
    new SaveStore().save(state, saveRoot);
    registerCampaignSession({
      sessionId: "rv",
      saveDir: saveRoot,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state,
    });
  });
  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
  });

  const revision = () => Number(getCampaignSession("rv")!.state.snapshot.turnNumber);

  /** Submits the cruiser, commits the month, and puts a project on it with `done` work complete. */
  async function projectOn(done: number): Promise<string> {
    const queued = await dispatchCampaignCommand("submitDesignCommand", {
      sessionId: "rv",
      expectedRevision: revision(),
      transportRequestId: "tx-base",
      className: "Rev Cruiser",
      draft: cruiser,
    });
    if (queued.outcome !== "success") throw new Error("submit failed");
    const designVersionId = (queued.value as { designVersionId: string }).designVersionId;
    const committed = await commitMonth({
      sessionId: "rv",
      expectedRevision: revision(),
      transportRequestId: "commit-rv",
    });
    if (committed.outcome !== "success") throw new Error("commit failed");
    const record = getCampaignSession("rv")!;
    const snapshot = record.state.snapshot;
    const nation = snapshot.nations.get("uk")!;
    const design = snapshot.designs.get(designVersionId)!;
    const total = Math.round(Number(design.normalizedDisplacementKg) / 100_000);
    const project = {
      id: "con_rv",
      type: "ship",
      projectType: "NEW_CONSTRUCTION",
      targetId: "ship_rv",
      designVersionId,
      totalWork: SafeInt(total),
      completedWork: SafeInt(done),
      paidWork: SafeInt(done),
      status: "ACTIVE",
      startedAt: "1880-02",
    } as unknown as (typeof nation.constructionProjects)[number];
    Object.assign(record.state, {
      snapshot: {
        ...snapshot,
        nations: new Map([
          ...snapshot.nations,
          ["uk", { ...nation, constructionProjects: [...nation.constructionProjects, project] }],
        ]),
      },
    });
    return designVersionId;
  }

  const tweaked = {
    ...cruiser,
    hull: {
      ...cruiser.hull,
      designMarginBp: (cruiser.hull as { designMarginBp: number }).designMarginBp + 100,
    },
  };
  const revise = (over: Record<string, unknown> = {}) =>
    dispatchCampaignCommand("reviseProjectCommand", {
      sessionId: "rv",
      expectedRevision: revision(),
      transportRequestId: `tx-rev-${Math.random()}`,
      projectId: "con_rv",
      draft: tweaked,
      ...over,
    });

  it("loads the real draft of a revisable project", async () => {
    await projectOn(0);
    const r = await dispatchCampaignCommand("loadProjectDraft", {
      sessionId: "rv",
      projectId: "con_rv",
    });
    expect(r.outcome).toBe("success");
    if (r.outcome === "success")
      expect((r.value as { draft: { hull: unknown } }).draft.hull).toEqual(cruiser.hull);
  });

  it("refuses to load an authored project that has no source draft", async () => {
    const snapshot = getCampaignSession("rv")!.state.snapshot;
    const authored = snapshot.nations.get("uk")!.constructionProjects[0];
    if (!authored) return; // pack with no authored project: nothing to refuse
    expect(
      await dispatchCampaignCommand("loadProjectDraft", {
        sessionId: "rv",
        projectId: authored.id,
      }),
    ).toMatchObject({ outcome: "rejected", reason: "PROJECT_NOT_REVISABLE" });
  });

  it("queues a free change, answers with its tier, and the month applies it", async () => {
    const oldDesign = await projectOn(0);
    const r = await revise();
    expect(r.outcome).toBe("success");
    if (r.outcome !== "success") return;
    const out = r.value as { tier: string; newDesignVersionId: string };
    expect(out.tier).toBe("T0_FREE");
    const committed = await commitMonth({
      sessionId: "rv",
      expectedRevision: revision(),
      transportRequestId: "commit-rv-2",
    });
    expect(committed.outcome).toBe("success");
    const snapshot = getCampaignSession("rv")!.state.snapshot;
    const project = snapshot.nations
      .get("uk")!
      .constructionProjects.find((p) => p.id === "con_rv")!;
    expect(project.designVersionId).toBe(out.newDesignVersionId);
    expect(project.designVersionId).not.toBe(oldDesign);
    expect(snapshot.designs.has(oldDesign)).toBe(true);
  });

  it("reports a revision tier from the project's real progress", async () => {
    await projectOn(4);
    const r = await revise();
    expect(r.outcome).toBe("success");
    if (r.outcome === "success") expect((r.value as { tier: string }).tier).toBe("T1_REVISION");
  });

  it("rejects a change on a mostly built ship, queuing nothing", async () => {
    await projectOn(12);
    expect(await revise()).toMatchObject({
      outcome: "rejected",
      reason: "REVISION_REQUIRES_REBUILD",
    });
  });

  it("rejects a revision that changes nothing and an unbuildable one", async () => {
    await projectOn(0);
    expect(await revise({ draft: cruiser })).toMatchObject({
      outcome: "rejected",
      reason: "REVISION_REJECTED",
    });
    const heavy = { ...cruiser, machinery: { ...cruiser.machinery, fuelCapacityKg: 400_000 } };
    expect(await revise({ draft: heavy })).toMatchObject({
      outcome: "rejected",
      reason: "REVISION_REJECTED",
    });
  });

  it("rejects an unknown project and malformed payloads", async () => {
    await projectOn(0);
    expect(await revise({ projectId: "nope" })).toMatchObject({
      outcome: "rejected",
      reason: "PROJECT_NOT_REVISABLE",
    });
    expect((await revise({ projectId: "" })).outcome).toBe("error");
  });
});
