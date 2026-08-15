import {
  CANONICAL_SCENARIOS,
  FLEET_SIZE_IDS,
  RESEARCH_IDS,
  VARIATION_IDS,
} from "@bluewave/campaign";
import { supportedPlayerSlotIds } from "@bluewave/campaign-engine";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  NewGameNation,
  NewGameOptions,
  NewGameScenario,
} from "../../shared/new-game-contract.js";
import { compileProductionCampaign } from "../compiler.js";
import { resolveProductionPackDir } from "../contentPack.js";

/**
 * `content/production/1880` is the only pack this MVP compiles against, and
 * it's authored for a single January-1880 start — so the only scenario that
 * actually has compiled content behind it is `scen_1880` (one of
 * `@bluewave/campaign`'s five canonical scenario ids). Listing the other
 * four canonical ids here would advertise scenarios with no backing content.
 * Revisit if a later ticket adds more content packs.
 */
const CONTENT_PACK_SCENARIO_ID = "scen_1880";

function humanizePoliticalSystem(id: string): string {
  return id
    .split("_")
    .map((word) => (word.length > 0 ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export async function listNewGameOptions(
  contentDir: string = resolveProductionPackDir(),
): Promise<BridgeResult<NewGameOptions>> {
  const signal = new AbortController().signal;
  const collector = new DiagnosticCollector();

  let output: ReturnType<typeof compileProductionCampaign>;
  try {
    output = compileProductionCampaign(contentDir, signal, collector);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "error", reason: "COMPILE_FAILED", diagnostics: [message] };
  }

  if (!output || collector.hasErrors) {
    return {
      outcome: "error",
      reason: "COMPILE_FAILED",
      diagnostics: collector.all.map((d) => d.message),
    };
  }

  const scenarioDefinition = CANONICAL_SCENARIOS.find(
    (s) => s.scenarioId === CONTENT_PACK_SCENARIO_ID,
  );
  if (!scenarioDefinition) {
    return {
      outcome: "error",
      reason: "SCENARIO_NOT_FOUND",
      diagnostics: [`Canonical scenario ${CONTENT_PACK_SCENARIO_ID} is missing.`],
    };
  }

  const regimeById = new Map<string, { regimeName: string; regimeType: string }>();
  for (const nation of output.pack.nations ?? []) {
    const politicalSystem = (nation as { regime?: { politicalSystem?: string } }).regime
      ?.politicalSystem;
    if (typeof politicalSystem === "string") {
      regimeById.set(nation.id, {
        regimeType: politicalSystem,
        regimeName: humanizePoliticalSystem(politicalSystem),
      });
    }
  }

  const nationIds = [...output.state.snapshot.nations.keys()].sort((a, b) => a.localeCompare(b));
  const nations: NewGameNation[] = nationIds.map((id) => {
    const nation = output.state.snapshot.nations.get(id)!;
    const regime = regimeById.get(id);
    return {
      id,
      name: nation.name,
      regimeName: regime?.regimeName ?? nation.name,
      regimeType: regime?.regimeType ?? "unknown",
    };
  });

  const playableNationIds = nationIds.filter(
    (id) => output.state.snapshot.nations.get(id)!.isPlayable,
  );

  const scenario: NewGameScenario = {
    id: scenarioDefinition.scenarioId,
    name: `${scenarioDefinition.startYear} Campaign`,
    startYear: scenarioDefinition.startYear,
    startMonth: scenarioDefinition.startMonth,
    participantNationIds: nationIds,
    playableNationIds,
  };

  const options: NewGameOptions = {
    scenarios: [scenario],
    nations,
    supportedValues: {
      scenarioId: [scenarioDefinition.scenarioId],
      continuityMode: ["historical", "alternate_continuity_v1"],
      fleetSize: [...FLEET_SIZE_IDS],
      researchSpeed: [...RESEARCH_IDS],
      technologyVariation: [...VARIATION_IDS],
      historicalBudget: scenarioDefinition.supportedHistoricalBudgetOptionIds,
      legacyFleetMode: scenarioDefinition.supportedLegacyFleetModeIds,
      tacticalRealism: scenarioDefinition.supportedTacticalRealismModeIds,
      difficulty: scenarioDefinition.supportedDifficultyProfileIds,
      playerSlotId: supportedPlayerSlotIds(output.state.snapshot),
    },
  };

  return { outcome: "success", value: options, diagnostics: [] };
}
