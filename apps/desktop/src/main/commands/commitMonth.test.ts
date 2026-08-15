import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignSlot, CampaignSnapshot, CampaignState } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  clearCampaignSessionsForTest,
  getCampaignSession,
  registerCampaignSession,
} from "../campaignSessions.js";
import { compileProductionCampaign } from "../compiler.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

describe("commitMonth", () => {
  let saveRoot: string;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-commit-month-"));
  });

  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
  });

  it("returns SESSION_NOT_FOUND for an unregistered session", async () => {
    const result = await commitMonth({
      sessionId: "no-such-session",
      expectedRevision: 0,
      transportRequestId: "req-0",
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  describe("against the real production pack", () => {
    function registerProductionSession(sessionId: string, saveDir: string): CampaignState {
      const signal = new AbortController().signal;
      const collector = new DiagnosticCollector();
      const output = compileProductionCampaign(PRODUCTION_PACK, signal, collector);
      expect(collector.hasErrors).toBe(false);
      if (!output) throw new Error("production pack failed to compile");

      const state = toSaveableState(output.state);
      new SaveStore().save(state, saveDir);
      registerCampaignSession({
        sessionId,
        saveDir,
        playerSlotId: "uk",
        campaignSeed: "a".repeat(32),
        month: { month: 1, year: 1880 },
        state,
      });
      return state;
    }

    it("produces a real MonthReport (opening/closing treasury, maintenance, construction spending) — not placeholder data", async () => {
      const saveDir = resolve(saveRoot, "save-1");
      const initialState = registerProductionSession("session-report", saveDir);
      const ukBefore = initialState.snapshot.nations.get("uk")!;

      const result = await commitMonth({
        sessionId: "session-report",
        expectedRevision: 0,
        transportRequestId: "req-1",
      });
      expect(result.outcome).toBe("success");
      if (result.outcome !== "success") return;

      const { report, financialLedger } = result.value;
      expect(report.month).toEqual({ month: 1, year: 1880 });
      expect(report.openingTreasury).toBe(Number(ukBefore.treasury));
      // uk has real ships in the production pack, so real maintenance is owed.
      expect(report.maintenanceCost).toBeGreaterThan(0);
      expect(report.closingTreasury).not.toBe(report.openingTreasury);

      expect(financialLedger.length).toBeGreaterThan(0);
      expect(financialLedger.some((e) => e.phase === "maintenance")).toBe(true);
      // Cross-check the report figure against the raw ledger it was
      // derived from, rather than a hardcoded placeholder number.
      const maintenanceFromLedger = financialLedger
        .filter((e) => e.phase === "maintenance")
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      expect(report.maintenanceCost).toBe(maintenanceFromLedger);
    });

    it("reflects the post-commit turn number and month in closingSnapshot and the session registry", async () => {
      const saveDir = resolve(saveRoot, "save-2");
      registerProductionSession("session-revision", saveDir);

      const result = await commitMonth({
        sessionId: "session-revision",
        expectedRevision: 0,
        transportRequestId: "req-1",
      });
      expect(result.outcome).toBe("success");
      if (result.outcome !== "success") return;

      expect(result.value.closingSnapshot.revision).toBe(1);
      expect(result.value.closingSnapshot.month).toEqual({ month: 2, year: 1880 });

      const updated = getCampaignSession("session-revision");
      expect(updated).toBeDefined();
      expect(Number(updated!.state.snapshot.turnNumber)).toBe(1);
      expect(updated!.month).toEqual({ month: 2, year: 1880 });
      expect(Number(updated!.state.snapshot.nations.get("uk")!.treasury)).toBe(
        result.value.report.closingTreasury,
      );
    });

    it("persists the updated state — round-trips through save/load", async () => {
      const saveDir = resolve(saveRoot, "save-3");
      registerProductionSession("session-persist", saveDir);

      const result = await commitMonth({
        sessionId: "session-persist",
        expectedRevision: 0,
        transportRequestId: "req-1",
      });
      expect(result.outcome).toBe("success");
      if (result.outcome !== "success") return;

      const diagnostics = new DiagnosticCollector();
      const loaded = new SaveStore().load(saveDir, diagnostics);
      expect(diagnostics.hasErrors).toBe(false);
      expect(loaded).not.toBeNull();
      if (!loaded) return;

      expect(Number(loaded.snapshot.turnNumber)).toBe(1);
      const ukLoaded = loaded.snapshot.nations.get("uk")!;
      expect(Number(ukLoaded.treasury)).toBe(result.value.report.closingTreasury);
    });

    it("rejects a stale expectedRevision without mutating the session or writing a new save", async () => {
      const saveDir = resolve(saveRoot, "save-4");
      registerProductionSession("session-stale", saveDir);

      const result = await commitMonth({
        sessionId: "session-stale",
        expectedRevision: 5,
        transportRequestId: "req-1",
      });
      expect(result.outcome).toBe("rejected");
      if (result.outcome !== "rejected") return;
      expect(result.reason).toBe("REVISION_MISMATCH");
      expect(result.currentRevision).toBe(0);

      const stillThere = getCampaignSession("session-stale");
      expect(Number(stillThere!.state.snapshot.turnNumber)).toBe(0);
    });

    it("advancing twice keeps expectedRevision correct and advances the turn/month monotonically", async () => {
      const saveDir = resolve(saveRoot, "save-5");
      registerProductionSession("session-twice", saveDir);

      const first = await commitMonth({
        sessionId: "session-twice",
        expectedRevision: 0,
        transportRequestId: "req-1",
      });
      expect(first.outcome).toBe("success");

      const second = await commitMonth({
        sessionId: "session-twice",
        expectedRevision: 1,
        transportRequestId: "req-2",
      });
      expect(second.outcome).toBe("success");
      if (second.outcome !== "success") return;
      expect(second.value.closingSnapshot.revision).toBe(2);
      expect(second.value.closingSnapshot.month).toEqual({ month: 3, year: 1880 });
      expect(second.value.report.month).toEqual({ month: 2, year: 1880 });
    });
  });

  describe("battle auto-resolution (synthetic fixture)", () => {
    // The production pack's `buildWarState()` always compiles with zero
    // active wars at turn 0 (`packages/campaign/src/compiler.ts:565`), so a
    // real compile->commitMonth loop never exercises `MonthExecutor`'s
    // battle-generation/resolution phases. This mirrors
    // `packages/phase-engine/test/battle-generation-phase.test.ts`'s
    // hand-authored two-nation, co-located, at-war fixture to prove the
    // integration for real rather than leaving it merely plumbed.
    function makeNation(
      id: string,
      isPlayable: boolean,
      ships: Array<{ id: string; loc: string }>,
    ) {
      return {
        id,
        name: id,
        tag: id,
        treasury: SafeInt(10000),
        income: SafeInt(0),
        expenses: SafeInt(0),
        baseResources: SafeInt(0),
        navalAppropriationRateBp: SafeInt(2000),
        maintenanceCost: SafeInt(0),
        fleets: [
          {
            id: `fleet-${id}`,
            nationId: id,
            name: `${id} Fleet`,
            locationAreaId: ships[0]!.loc,
            ships: ships.map((s) => ({
              id: s.id,
              name: s.id,
              classId: "battleship",
              nationId: id,
              locationAreaId: s.loc,
              designVersionId: "",
              hitPoints: SafeInt(100),
              maxHitPoints: SafeInt(100),
              speed: SafeInt(10),
              firepower: SafeInt(200),
              armor: SafeInt(10),
              isUnderConstruction: false,
              constructionProgress: SafeInt(0),
              constructionTotalWork: SafeInt(0),
            })),
          },
        ],
        divisions: [],
        research: {
          nationId: id,
          technologies: [],
          fieldPriorities: {},
          researchBudget: SafeInt(0),
          activeCandidates: new Map(),
          discoveredTechs: [],
        },
        constructionProjects: [],
        isPlayable,
        isAI: !isPlayable,
      };
    }

    function makeWarSnapshot(): CampaignSnapshot {
      const nations = new Map();
      nations.set(
        "GBR",
        makeNation("GBR", true, [
          { id: "g1", loc: "a-1" },
          { id: "g2", loc: "a-1" },
        ]),
      );
      nations.set(
        "FRA",
        makeNation("FRA", false, [
          { id: "f1", loc: "a-1" },
          { id: "f2", loc: "a-1" },
        ]),
      );
      const slot: CampaignSlot = { nationId: "GBR", type: "playable" };
      return {
        version: "0.1.0",
        turnNumber: SafeInt(0),
        campaignId: "commit-month-battle-fixture",
        slots: [slot],
        world: { areas: [], routes: [], ports: [] },
        nations,
        wars: {
          wars: [
            {
              id: "war_1",
              attackerSideId: "side_a",
              defenderSideId: "side_d",
              attackerSideMembers: ["GBR"],
              defenderSideMembers: ["FRA"],
              attackerWarScore: 0,
              defenderWarScore: 0,
              attackerId: "GBR",
              defenderId: "FRA",
              startDate: "1880-01",
              status: "ACTIVE",
            },
          ],
          battles: [],
          participantMemberships: [],
          blockadeState: [],
          battleManifests: [],
        },
        politics: { relations: [], shells: {} },
        intelligence: { shells: {} },
        designs: new Map(),
        designFamilies: new Map(),
        rulesetVersion: "1.0",
        compatibilityVersion: "1.0.0",
      };
    }

    function registerWarSession(sessionId: string, saveDir: string): void {
      const snapshot = makeWarSnapshot();
      const envelope = createEnvelope("campaign-snapshot", snapshot.compatibilityVersion, snapshot);
      const state = toSaveableState({ snapshot, envelope, rawHash: "" });
      new SaveStore().save(state, saveDir);
      registerCampaignSession({
        sessionId,
        saveDir,
        playerSlotId: "GBR",
        campaignSeed: "b".repeat(32),
        month: { month: 1, year: 1880 },
        state,
      });
    }

    it("auto-resolves a triggered battle inline — the month completes without any pending-battle state", async () => {
      const saveDir = resolve(saveRoot, "save-war");
      registerWarSession("session-war", saveDir);

      const result = await commitMonth({
        sessionId: "session-war",
        expectedRevision: 0,
        transportRequestId: "req-1",
      });

      expect(result.outcome).toBe("success");
      if (result.outcome !== "success") return;

      // The war is still reported (not silently dropped) and the month
      // completed in one shot — nothing here waits for a separate
      // generateBattle/resolveBattle/resolveTacticalBattle round-trip.
      expect(result.value.closingSnapshot.activeWars.length).toBeGreaterThan(0);

      const updated = getCampaignSession("session-war");
      expect(updated).toBeDefined();
      const battles = updated!.state.snapshot.wars.battles;
      expect(battles.length).toBeGreaterThan(0);
      // No battle is left "pending"/"resolving" — every generated battle was
      // resolved within this single commitMonth call.
      expect(battles.every((b) => b.phase === "resolved")).toBe(true);

      // The resolution actually changed something authoritative: war score
      // moved and/or a ship took damage/was lost — not a no-op stub.
      const war = updated!.state.snapshot.wars.wars.find((w) => w.id === "war_1")!;
      const scoreChanged = war.attackerWarScore !== 0 || war.defenderWarScore !== 0;
      expect(scoreChanged).toBe(true);
    });
  });
});
