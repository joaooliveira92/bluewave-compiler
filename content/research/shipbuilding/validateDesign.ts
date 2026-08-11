// content/shipbuilding/validateDesign.ts - M1 Buildable Design Prototype
// Single entry point: design -> weight/cost/time -> type/tech/dock/treaty -> legal/illegal

import type { PlayableNationId } from "../nations/shared.ts";
import type { ShipArchetypeKey } from "../shipbuilding.ts";
import type { ValidatorOutput, ValidationError, ValidationWarning } from "./validator.ts";
import { calculateWeight } from "./calculator.ts";
import { checkTreatyLegality, type Treaty } from "./treaties.ts";

export interface ValidateDesignInput {
  campaignId: string;
  nationId: PlayableNationId;
  shipClassDesignId: string;
  campaignTurnId: string;
  design: {
    designDisplacement: number;
    speed: number;
    armor: Record<string, number>;
    mainGuns: { calibre: number; count: number }[];
    features: string[];
    inferredType: ShipArchetypeKey;
  };
  context: {
    dockSize: number; // national dock size
    researchedTechs: string[]; // e.g. ["triple_turret","oil_firing"]
    activeTreaties: Treaty[];
    governmentCompliance: "strict" | "cheating" | "openly_defiant";
    requiredTechsForFeatures: Record<string, string>; // feature -> tech
  };
}

export const validateDesign = (input: ValidateDesignInput): ValidatorOutput => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const notes: string[] = [];

  // 1. Weight / cost / time
  const weight = calculateWeight({
    designDisplacement: input.design.designDisplacement,
    speed: input.design.speed,
    armor: input.design.armor,
    mainGuns: input.design.mainGuns,
    features: input.design.features,
    nationId: input.nationId,
  });

  const remaining = weight.remainingDisplacement;
  const overweight = Math.max(0, -remaining);
  const isOverweight = remaining < 0;
  if (isOverweight) {
    errors.push({
      code: "OVERWEIGHT",
      message: `Overweight by ${overweight}t - reduce armor/guns/speed`,
      field: "displacement",
    });
  }

  // 2. Ship type legality - simplified: BB must have armor + main guns
  let inferredType: ShipArchetypeKey = input.design.inferredType;
  if (
    inferredType === "battleship" &&
    (weight.armorWeight === 0 || input.design.mainGuns.length === 0)
  ) {
    warnings.push({
      code: "TYPE_MISMATCH",
      message: "Battleship requires armor and main guns - would be reclassified",
      field: "shipType",
    });
    inferredType = "protected_cruiser";
  }

  // 3. Technology legality
  for (const feat of input.design.features) {
    const required = input.context.requiredTechsForFeatures[feat];
    if (required && !input.context.researchedTechs.includes(required)) {
      errors.push({
        code: "TECH_REQUIRED",
        message: `Feature ${feat} requires ${required}`,
        field: "features",
      });
    }
  }

  // 4. Dock legality
  if (input.design.designDisplacement > input.context.dockSize) {
    errors.push({
      code: "DOCK_TOO_SMALL",
      message: `Displacement ${input.design.designDisplacement} > dock size ${input.context.dockSize} - cannot build domestically, use foreign yard or enlarge dock`,
      field: "displacement",
    });
  }

  // 5. Treaty legality
  for (const treaty of input.context.activeTreaties) {
    const check = checkTreatyLegality(
      {
        displacement: input.design.designDisplacement,
        mainCalibre: Math.max(...input.design.mainGuns.map((g) => g.calibre), 0),
      },
      treaty,
      input.context.governmentCompliance,
    );
    if (!check.isCompliant) {
      errors.push({
        code: "TREATY_VIOLATION",
        message: `Treaty ${treaty.name}: ${check.violations.join(", ")}`,
        field: "treaty",
      });
      if (check.wouldBeScrappedIfUnderConstruction) {
        warnings.push({
          code: "TREATY_SCRAP_RISK",
          message: `Would be scrapped if under construction when treaty active`,
        });
      }
    }
  }

  // 6. Topside / stability stubs
  const topsideUsed = input.design.features.length * 10;
  const topsideLimit = 100;
  if (topsideUsed > topsideLimit) {
    errors.push({
      code: "TOPSIDE_EXCEEDED",
      message: `Topside ${topsideUsed} > limit ${topsideLimit}`,
      field: "topside",
    });
  }

  const stabilityScore = isOverweight ? 40 : 85;
  const flotationScore = isOverweight ? 50 : 90;
  if (stabilityScore < 60)
    warnings.push({ code: "LOW_STABILITY", message: `Stability ${stabilityScore} - risky` });
  if (flotationScore < 60)
    warnings.push({ code: "LOW_FLOTATION", message: `Flotation ${flotationScore} - risky` });

  // 7. Cost / time stubs - behavioral shape
  const estimatedCost = Math.round(
    input.design.designDisplacement * 0.8 + input.design.speed * 100 + weight.armorWeight * 0.5,
  );
  const estimatedBuildTime = Math.round(
    12 + input.design.designDisplacement / 2000 + (isOverweight ? 6 : 0),
  );

  if (isOverweight) notes.push("Design is overweight - reduce weight or increase displacement");
  if (warnings.length > 0) notes.push(`${warnings.length} warning(s) - buildable but risky`);
  if (errors.length === 0) notes.push("Design is legal and buildable after design study");

  const status =
    errors.length > 0 ? "illegal" : warnings.length > 0 ? "legal_with_warnings" : "legal";

  return {
    validationStatus: status,
    inferredShipType: inferredType,
    usedDisplacement: weight.totalWeight,
    designDisplacement: input.design.designDisplacement,
    remainingDisplacement: remaining,
    overweightAmount: overweight,
    stabilityScore,
    flotationScore,
    topsidePointsUsed: topsideUsed,
    topsidePointsLimit: topsideLimit,
    estimatedCost,
    estimatedBuildTime,
    errors,
    warnings,
    notes,
  };
};

// Example M1 test
export const exampleLegalBB = validateDesign({
  campaignId: "camp_1880",
  nationId: "uk",
  shipClassDesignId: "bb_1880_a",
  campaignTurnId: "1880_01",
  design: {
    designDisplacement: 10000,
    speed: 16,
    armor: { belt: 300, deck: 50 },
    mainGuns: [{ calibre: 12, count: 4 }],
    features: ["compound_armor"],
    inferredType: "battleship",
  },
  context: {
    dockSize: 12000,
    researchedTechs: ["compound_armor"],
    activeTreaties: [],
    governmentCompliance: "strict",
    requiredTechsForFeatures: { compound_armor: "compound_armor" },
  },
});
// exampleLegalBB.validationStatus === "legal"

export const exampleIllegalDD = validateDesign({
  campaignId: "camp_1880",
  nationId: "uk",
  shipClassDesignId: "dd_30000_fake",
  campaignTurnId: "1880_01",
  design: {
    designDisplacement: 30000,
    speed: 30,
    armor: {},
    mainGuns: [],
    features: [],
    inferredType: "torpedo_boat" as ShipArchetypeKey,
  },
  context: {
    dockSize: 12000,
    researchedTechs: [],
    activeTreaties: [],
    governmentCompliance: "strict",
    requiredTechsForFeatures: {},
  },
});
// exampleIllegalDD.validationStatus === "illegal" -> errors: OVERWEIGHT + DOCK_TOO_SMALL
