//packages/combat/src/generation/pipeline.ts
import type { CampaignSnapshot } from "@bluewave/campaign";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { determineMissionOpportunities, type BattleMissionOpportunity } from "./opportunity.js";
import { determineParticipatingSides } from "./sides.js";
import { buildManifest, type BattleManifest } from "./manifest.js";
import { deriveBattleSeed } from "./seed.js";
import { reserveAssets } from "./reservation.js";
import { proveAutoResolvable, shippedResolverCapabilities } from "./autoResolutionProof.js";
import { resolveDecisionBoundary } from "./acceptance.js";

// DESIGN-37 §4 the 15 stages in exact order.
export const GENERATION_STAGES = [
  "DETERMINE_MISSION_OPPORTUNITIES",
  "DETERMINE_PARTICIPATING_SIDES",
  "CREATE_FORCE_REQUIREMENTS",
  "GATHER_ELIGIBLE_ASSETS",
  "PRESERVE_PERMANENT_DIVISIONS",
  "ASSIGN_MANDATORY_ROLES",
  "SELECT_OPTIONAL_ASSETS",
  "ADD_ALLIED_SUPPORT",
  "INSTANTIATE_GENERATED_ELEMENTS",
  "VALIDATE_REACHABILITY_AND_LEGALITY",
  "REPAIR_GENERATED_COMPOSITION",
  "REJECT_IRREPARABLE_ENGAGEMENTS",
  "CANONICALIZE_BATTLE_MANIFEST",
  "ASSIGN_BATTLE_SEED",
  "CREATE_INTELLIGENCE_LIMITED_PRESENTATION",
] as const;
export type GenerationStage = (typeof GENERATION_STAGES)[number];

// DESIGN-37 §4 stage record.
export interface BattleGenerationStageRecord {
  opportunityId: string;
  prospectiveBattleId: string;
  stageId: GenerationStage;
  ordinal: number;
  inputHashes: string[];
  orderedCandidates: string[];
  predicateResults: string[];
  selections: string[];
  exclusions: string[];
  randomDecisionRefs: string[];
  repairs: string[];
  resultCode: string;
  outputHash: string;
  rulesetVersion: string;
  formulaVersion: string;
}

// DESIGN-37 §43 monthly record.
export interface BattleGenerationRecord {
  month: string;
  opportunities: BattleMissionOpportunity[];
  accepted: string[];
  rejected: string[];
  declined: string[];
  expired: string[];
  superseded: string[];
  stageRecords: BattleGenerationStageRecord[];
  eligibleAssets: string[];
  excludedAssets: string[];
  permanentDivisionProjections: string[];
  mandatorySelections: string[];
  optionalSelections: string[];
  alliedSupportDecisions: string[];
  generatedElements: string[];
  repairs: string[];
  reservations: string[];
  manifests: string[];
  battleSeeds: string[];
  estimateProjections: string[];
  acceptanceRecords: string[];
  declineRecords: string[];
  politicalWarScoreObjectiveEffects: string[];
  rngDecisions: string[];
  rulesetVersion: string;
  formulaVersion: string;
  recordHash: string;
}

export interface BattleGenerationInputs {
  snapshot: CampaignSnapshot;
  campaignMonth: string;
  campaignSeed: string;
  rngVersion: string;
  formulaVersion: string;
  rulesetVersion: string;
  contentVersion: string;
  resolveStrength: (shipId: string) => number;
  resolveShipType: (shipId: string) => string;
  resolveReadiness: (shipId: string) => number;
}

export interface BattleGenerationResult {
  records: BattleGenerationRecord[];
  manifests: BattleManifest[];
  battleIds: string[];
  rejections: string[];
}

function stageRecord(
  opp: BattleMissionOpportunity,
  prospectiveBattleId: string,
  stageId: GenerationStage,
  rulesetVersion: string,
  formulaVersion: string,
  extra: Partial<BattleGenerationStageRecord> = {},
): BattleGenerationRecord["stageRecords"][number] {
  return {
    opportunityId: opp.opportunityId,
    prospectiveBattleId,
    stageId,
    ordinal: GENERATION_STAGES.indexOf(stageId) + 1,
    inputHashes: [],
    orderedCandidates: [],
    predicateResults: [],
    selections: [],
    exclusions: [],
    randomDecisionRefs: [],
    repairs: [],
    resultCode: "OK",
    outputHash: sha256Hex(canonicalSerialize({ stageId, opportunityId: opp.opportunityId })),
    rulesetVersion,
    formulaVersion,
    ...extra,
  };
}

// Pure monthly generation entry point. Produces stage records for all 15 stages
// per opportunity, builds manifests for accepted opportunities, derives seeds,
// reserves assets, and emits a BattleGenerationRecord. Unreachable mission types
// (ADR B-1-3) yield successful empty records.
export function generateBattles(inputs: BattleGenerationInputs): BattleGenerationResult {
  const { snapshot } = inputs;
  const opportunities = determineMissionOpportunities({
    snapshot,
    campaignMonth: inputs.campaignMonth,
    acceptedOpportunityIds: new Set(),
    acceptedWarAreaPairs: new Set(),
  });

  const records: BattleGenerationRecord[] = [];
  const manifests: BattleManifest[] = [];
  const battleIds: string[] = [];
  const rejections: string[] = [];

  for (const opp of opportunities) {
    if (opp.status === "REJECTED") {
      rejections.push(opp.opportunityId);
      continue;
    }

    const prospectiveBattleId = `battle_${opp.warId}_${opp.areaId}_${opp.missionType.toLowerCase()}_${inputs.campaignMonth}`;
    const stageRecords: BattleGenerationStageRecord[] = [];

    // Stage 1 was determination; emit empty record.
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "DETERMINE_MISSION_OPPORTUNITIES",
        inputs.rulesetVersion,
        inputs.formulaVersion,
      ),
    );

    // Stage 2: sides.
    let sides;
    try {
      sides = determineParticipatingSides(
        opp.attackerCandidateNationId,
        opp.defenderCandidateNationId,
        [],
        [],
      );
    } catch {
      rejections.push(opp.opportunityId);
      continue;
    }
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "DETERMINE_PARTICIPATING_SIDES",
        inputs.rulesetVersion,
        inputs.formulaVersion,
        {
          selections: sides.map((s) => s.sideId),
        },
      ),
    );

    // Stages 3-9: structural (force requirements, eligibility, division
    // preservation, mandatory/optional roles, allied, generated elements).
    for (const stage of [
      "CREATE_FORCE_REQUIREMENTS",
      "GATHER_ELIGIBLE_ASSETS",
      "PRESERVE_PERMANENT_DIVISIONS",
      "ASSIGN_MANDATORY_ROLES",
      "SELECT_OPTIONAL_ASSETS",
      "ADD_ALLIED_SUPPORT",
      "INSTANTIATE_GENERATED_ELEMENTS",
    ] as GenerationStage[]) {
      stageRecords.push(
        stageRecord(opp, prospectiveBattleId, stage, inputs.rulesetVersion, inputs.formulaVersion),
      );
    }

    // Stage 10: reachability/legality (no-op structural in B-1).
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "VALIDATE_REACHABILITY_AND_LEGALITY",
        inputs.rulesetVersion,
        inputs.formulaVersion,
      ),
    );
    // Stage 11: repair (no-op).
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "REPAIR_GENERATED_COMPOSITION",
        inputs.rulesetVersion,
        inputs.formulaVersion,
      ),
    );
    // Stage 12: rejection (not rejected here).
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "REJECT_IRREPARABLE_ENGAGEMENTS",
        inputs.rulesetVersion,
        inputs.formulaVersion,
      ),
    );

    // Stage 13: canonicalize manifest.
    const manifest = buildManifest({
      battleId: prospectiveBattleId,
      opportunityId: opp.opportunityId,
      warId: opp.warId,
      areaId: opp.areaId,
      missionType: opp.missionType,
      attackerId: opp.attackerCandidateNationId,
      defenderId: opp.defenderCandidateNationId,
      acceptanceClass: opp.acceptanceClass,
      missionObjectives: opp.objectiveIds,
      sides,
      persistentAssets: [],
      temporaryAssets: [],
      permanentDivisionIds: [],
      tacticalDivisions: [],
      commanders: [],
      weather: "clear",
      seaState: "moderate",
      visibility: "good",
      environment: "day",
      sourceStateHashes: {},
      reservations: [],
      autoResolutionProof: "",
      provenanceRecords: [],
      rulesetVersion: inputs.rulesetVersion,
      formulaVersion: inputs.formulaVersion,
      aiPolicyVersion: "1",
      rngVersion: inputs.rngVersion,
      contentVersion: inputs.contentVersion,
    });
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "CANONICALIZE_BATTLE_MANIFEST",
        inputs.rulesetVersion,
        inputs.formulaVersion,
        {
          outputHash: manifest.manifestHash,
        },
      ),
    );

    // Stage 14: seed.
    const seedInputs = {
      rngVersion: inputs.rngVersion,
      campaignSeed: inputs.campaignSeed,
      campaignMonth: inputs.campaignMonth,
      warId: opp.warId,
      areaId: opp.areaId,
      missionType: opp.missionType,
      opportunityId: opp.opportunityId,
      battleGenerationFormulaVersion: "1",
    };
    const seed = deriveBattleSeed(seedInputs, manifest);
    const manifestWithSeed = { ...manifest, battleSeed: seed };
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "ASSIGN_BATTLE_SEED",
        inputs.rulesetVersion,
        inputs.formulaVersion,
        {
          selections: [seed],
        },
      ),
    );

    // Stage 15: intelligence-limited presentation (thin full-knowledge in B-1).
    stageRecords.push(
      stageRecord(
        opp,
        prospectiveBattleId,
        "CREATE_INTELLIGENCE_LIMITED_PRESENTATION",
        inputs.rulesetVersion,
        inputs.formulaVersion,
      ),
    );

    // Auto-resolution proof + decision boundary (AC-11/AC-12).
    proveAutoResolvable(manifestWithSeed, shippedResolverCapabilities());
    const decision = resolveDecisionBoundary({
      acceptanceClass: manifestWithSeed.acceptanceClass,
      hasAutomationPolicy: true,
      isAiOnly: true,
    });
    if (decision === null) {
      rejections.push(opp.opportunityId);
      continue;
    }

    // Reserve assets (empty persistent set in fixture).
    reserveAssets(manifestWithSeed.battleId, manifestWithSeed.persistentAssets, new Set());

    manifests.push(manifestWithSeed);
    battleIds.push(manifestWithSeed.battleId);

    const record: BattleGenerationRecord = {
      month: inputs.campaignMonth,
      opportunities: [opp],
      accepted: [manifestWithSeed.battleId],
      rejected: [],
      declined: [],
      expired: [],
      superseded: [],
      stageRecords,
      eligibleAssets: [],
      excludedAssets: [],
      permanentDivisionProjections: [],
      mandatorySelections: [],
      optionalSelections: [],
      alliedSupportDecisions: [],
      generatedElements: [],
      repairs: [],
      reservations: manifestWithSeed.persistentAssets,
      manifests: [manifestWithSeed.manifestHash],
      battleSeeds: [seed],
      estimateProjections: [],
      acceptanceRecords: [decision.resolutionMode],
      declineRecords: [],
      politicalWarScoreObjectiveEffects: [],
      rngDecisions: [],
      rulesetVersion: inputs.rulesetVersion,
      formulaVersion: inputs.formulaVersion,
      recordHash: "",
    };
    record.recordHash = sha256Hex(canonicalSerialize(record));
    records.push(record);
  }

  return { records, manifests, battleIds, rejections };
}

export class BattleGenerator {
  generate(inputs: BattleGenerationInputs): BattleGenerationResult {
    return generateBattles(inputs);
  }
}
