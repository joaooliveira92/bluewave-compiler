import { SafeInt } from "@bluewave/contracts";
import type { CampaignSnapshot } from "@bluewave/campaign";
import type { CommandEnvelope, CommandBody } from "@bluewave/commands";
import { CommandLedger } from "@bluewave/commands";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { EventLedger } from "@bluewave/events";
import { RandomEngine } from "@bluewave/random";
import {
  PhaseRegistry,
  type PhaseDefinition,
  type PhaseContext,
  type PhaseResult,
  type TurnResult,
  type NoOpEvidence,
} from "./registry.js";

export class PhaseEngine {
  private currentVersion = "0.1.0" as const;

  initializeTurn(snapshot: CampaignSnapshot): PhaseContext {
    const firstPhase = PhaseRegistry.getByOrder(0);
    if (!firstPhase) {
      throw new Error("Phase registry missing phase at order 0");
    }
    return {
      currentPhaseIndex: SafeInt(0),
      currentPhase: firstPhase,
      turnNumber: snapshot["turnNumber"],
      snapshot,
    };
  }

  executePhase(
    context: PhaseContext,
    phase: PhaseDefinition,
    randomEngine?: RandomEngine,
    collector?: DiagnosticCollector,
  ): PhaseResult {
    const isOpening = phase["id"] === "opening_validation";
    const isClosing = phase["id"] === "closing_validation";

    if (isOpening) {
      return this.runOpeningValidation(context["snapshot"], collector);
    }

    if (isClosing) {
      const result = this.runClosingValidation(context["snapshot"], collector);
      return {
        phaseId: "closing_validation",
        success: true,
        diagnostics: result["diagnostics"],
      };
    }

    const turnNumber = context["turnNumber"] as number;
    const evidence: NoOpEvidence = {
      version: this.currentVersion,
      phaseId: phase["id"],
      turnNumber,
    };

    return {
      phaseId: phase["id"],
      success: true,
      noOp: true,
      diagnostics: [],
      evidence,
    };
  }

  executeTurn(
    snapshot: CampaignSnapshot,
    commands: CommandEnvelope<CommandBody>[],
    randomSeed: string,
    collector: DiagnosticCollector,
  ): TurnResult {
    const ledger = new CommandLedger();
    const eventLedger = new EventLedger();
    const phaseResults: PhaseResult[] = [];

    const phases = PhaseRegistry.all;
    let currentSnapshot = snapshot;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]!;
      const ctx: PhaseContext = {
        currentPhaseIndex: SafeInt(i),
        currentPhase: phase,
        turnNumber: snapshot["turnNumber"],
        snapshot: currentSnapshot,
      };

      const randomEngine = phase["rngAllowed"] ? new RandomEngine(randomSeed) : undefined;
      const result = this.executePhase(ctx, phase, randomEngine, collector);
      phaseResults.push(result);

      if (result["stateChanges"]) {
        currentSnapshot = result["stateChanges"] as CampaignSnapshot;
      }

      if (result["events"]) {
        for (const event of result["events"]) {
          eventLedger.append(event);
        }
      }
    }

    return {
      finalSnapshot: currentSnapshot,
      ledger,
      eventLedger,
      phaseResults,
    };
  }

  private runOpeningValidation(
    snapshot: CampaignSnapshot,
    collector?: DiagnosticCollector,
  ): PhaseResult {
    const diagnostics: string[] = [];

    for (const [nationId, nation] of snapshot["nations"]) {
      if ((nation["treasury"] as number) < 0) {
        const msg = `Nation ${nationId} has negative treasury: ${String(nation["treasury"])}`;
        diagnostics.push(msg);
        collector?.addError("NEGATIVE_TREASURY", msg, { stage: "opening-validation" });
      }

      for (const ship of nation["fleets"].flatMap((f) => f["ships"])) {
        if ((ship["constructionProgress"] as number) > (ship["constructionTotalWork"] as number)) {
          const msg = `Ship ${ship["id"]} construction progress ${String(ship["constructionProgress"])} exceeds total work ${String(ship["constructionTotalWork"])}`;
          diagnostics.push(msg);
          collector?.addError("CONSTRUCTION_OVERFLOW", msg, { stage: "opening-validation" });
        }
      }
    }

    const shipBattleMap = new Map<string, string>();
    for (const battle of snapshot["wars"]["battles"]) {
      const battleFleetIds = [...battle["attackerFleetIds"], ...battle["defenderFleetIds"]];
      for (const fleetId of battleFleetIds) {
        for (const nation of snapshot["nations"].values()) {
          for (const fleet of nation["fleets"]) {
            if (fleet["id"] === fleetId) {
              for (const ship of fleet["ships"]) {
                if (ship["inBattleId"]) {
                  if (shipBattleMap.has(ship["id"])) {
                    const msg = `Ship ${ship["id"]} is assigned to multiple battles`;
                    diagnostics.push(msg);
                    collector?.addError("SHIP_IN_MULTIPLE_BATTLES", msg, {
                      stage: "opening-validation",
                    });
                  }
                  shipBattleMap.set(ship["id"], battle["id"]);
                }
              }
            }
          }
        }
      }
    }

    return {
      phaseId: "opening_validation",
      success: diagnostics.length === 0,
      diagnostics,
    };
  }

  private runClosingValidation(
    snapshot: CampaignSnapshot,
    collector?: DiagnosticCollector,
  ): PhaseResult {
    const diagnostics: string[] = [];

    for (const [nationId, nation] of snapshot["nations"]) {
      if ((nation["treasury"] as number) < 0) {
        const msg = `Nation ${nationId} has negative treasury at closing: ${String(nation["treasury"])}`;
        diagnostics.push(msg);
        collector?.addError("NEGATIVE_TREASURY", msg, { stage: "closing-validation" });
      }
    }

    const canonical = canonicalSerialize(snapshot);
    const _hash = sha256Hex(canonical);

    return {
      phaseId: "closing_validation",
      success: diagnostics.length === 0,
      diagnostics,
    };
  }
}
