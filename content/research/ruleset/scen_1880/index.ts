import type { RulesetPack } from "../../schema/ruleset.ts";

export const SCEN_1880_RULESET: RulesetPack = {
  id: "ruleset_1880_v1",
  version: "1.0.0",
  contentHash: "pending",
  formulaVersion: "1.0.0",
  rngAlgorithmVersion: "1.0.0",
  aiPolicyVersion: "1.0.0",
  provenance: "RULESET_CONSTANT",
  balanceConstants: {
    openingTreasury: 12480,
    monthlyAppropriation: 2100,
    shipyardTotalCapacity: 42000,
    shipyardReservedCapacity: 36800,
    shipyardAvailableCapacity: 4000,
    constructionTotalWork: 24000,
    constructionMonthlyRate: 1200,
    constructionMonthlyCost: 210,
    institutionalConfidence: 65,
    politicalCapital: 18,
    optional: {
      researchMaxPercent: 12,
      researchDiminishingThreshold: 10,
      foreignStationObligationPercent: 10,
      blockadeThreshold: 1.1,
      canalBlockTension: 7,
    },
  },
};
