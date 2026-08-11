// content/shipbuilding/pipeline.ts - Wires M1 -> M2 -> M3
// Design -> Validate -> Study -> Buildable -> Lay Down

import type { ConstructionProject, ShipConstructionOrder } from "./construction.ts";
import { type ShipDesignStudy, createStudy, isBuildable } from "./designStudy.ts";
import { type ValidateDesignInput, validateDesign } from "./validateDesign.ts";

export interface PipelineState {
  validationStatus: string;
  study?: ShipDesignStudy | null;
  isBuildable: boolean;
  project?: ConstructionProject | null;
}

export const runDesignToStudy = (
  input: ValidateDesignInput & {
    baseDesignId?: string | null;
    complexity?: number;
    baseCost?: number;
  },
): PipelineState => {
  const validation = validateDesign(input);
  if (validation.validationStatus === "illegal") {
    return { validationStatus: validation.validationStatus, study: null, isBuildable: false };
  }
  const study = createStudy({
    campaignId: input.campaignId,
    nationId: input.nationId,
    designId: input.shipClassDesignId,
    baseDesignId: input.baseDesignId ?? null,
    complexity: input.complexity ?? 50,
    baseCost: input.baseCost ?? 500,
    discountPercent: input.baseDesignId ? 20 : 0, // derived = discount per manual
  });
  // Simulate study in_progress -> completed
  study.studyStatus = "in_progress";
  return { validationStatus: validation.validationStatus, study, isBuildable: false };
};

export const completeStudy = (study: ShipDesignStudy): ShipDesignStudy => ({
  ...study,
  studyStatus: "completed",
  remainingMonths: 0,
  completed: true,
  completionTurnId: "next_turn",
});

export const layDownShip = (params: {
  campaignId: string;
  nationId: string;
  shipClassDesignId: string;
  validationStatus: string;
  study: ShipDesignStudy | null;
  isLegacy?: boolean;
  shipName?: string;
  builderNationId?: string | null;
  dockSizeRequired: number;
  totalCost: number;
  totalMonths: number;
}): { order: ShipConstructionOrder; project: ConstructionProject } | { error: string } => {
  if (!isBuildable(params.validationStatus, params.study, !!params.isLegacy)) {
    return {
      error: `Not buildable - validation=${params.validationStatus} study=${params.study?.studyStatus} - complete study first`,
    };
  }
  const orderId = `order_${params.shipClassDesignId}_${Date.now()}`;
  const projectId = `proj_${orderId}`;
  const order: ShipConstructionOrder = {
    id: orderId,
    campaignId: params.campaignId,
    nationId: params.nationId as any,
    shipClassDesignId: params.shipClassDesignId,
    hullNumber: 1,
    shipName: params.shipName ?? null,
    builderNationId: params.builderNationId ?? null,
    status: "active",
    createdTurnId: "current_turn",
  };
  const project: ConstructionProject = {
    id: projectId,
    orderId,
    campaignId: params.campaignId,
    nationId: params.nationId as any,
    shipClassDesignId: params.shipClassDesignId,
    builderNationId: params.builderNationId ?? null,
    status: "active",
    totalCost: params.totalCost,
    monthlyCost: Math.round(params.totalCost / params.totalMonths),
    totalMonths: params.totalMonths,
    remainingMonths: params.totalMonths,
    isHalted: false,
    isAccelerated: false,
    isDelayedThisMonth: false,
    dockSizeRequired: params.dockSizeRequired,
    createdTurnId: "current_turn",
  };
  return { order, project };
};

// End-to-end example: M1 -> M2 -> M3 -> M4
export const exampleEndToEnd = () => {
  const input: ValidateDesignInput = {
    campaignId: "camp_1880",
    nationId: "uk",
    shipClassDesignId: "bb_1880_a",
    campaignTurnId: "1880_01",
    design: {
      designDisplacement: 10000,
      speed: 16,
      armor: { belt: 300 },
      mainGuns: [{ calibre: 12, count: 4 }],
      features: [],
      inferredType: "battleship",
    },
    context: {
      dockSize: 12000,
      researchedTechs: [],
      activeTreaties: [],
      governmentCompliance: "strict",
      requiredTechsForFeatures: {},
    },
  };
  const s1 = runDesignToStudy({ ...input, complexity: 60, baseCost: 800 });
  // s1.validationStatus === "legal", s1.study.status === "in_progress", s1.isBuildable === false -> cannot lay down yet
  const completed = completeStudy(s1.study!);
  const s2 = layDownShip({
    campaignId: input.campaignId,
    nationId: input.nationId,
    shipClassDesignId: input.shipClassDesignId,
    validationStatus: s1.validationStatus,
    study: completed,
    dockSizeRequired: 10000,
    totalCost: 1200,
    totalMonths: 18,
    shipName: "HMS Example",
  });
  // s2 has order + project -> monthlyProcessor will now charge monthlyCost and reduce remainingMonths
  return s2;
};
