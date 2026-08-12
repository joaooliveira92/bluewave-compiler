// content/shipbuilding/construction.ts - One Hull, One Order + Monthly Processor
// RTW3: up to 12 per class, each hull independent - halt/accelerate/delay/cancel individually

export type ProjectStatus =
  | "planned"
  | "active"
  | "halted"
  | "accelerated"
  | "delayed"
  | "completed"
  | "cancelled"
  | "scrapped_treaty"
  | "impounded";
export type BatchStatus = "ordering" | "laying_down" | "in_progress" | "completed" | "cancelled";

export interface ShipConstructionOrderBatch {
  id: string;
  campaignId: string;
  nationId: string;
  shipClassDesignId: string;
  quantity: number; // 1-12 RTW3 dialog
  status: BatchStatus;
  createdTurnId: string;
  orderIds: string[]; // has many orders
}

export interface ShipConstructionOrder {
  id: string;
  batchId?: string | null;
  campaignId: string;
  nationId: string;
  shipClassDesignId: string;
  hullNumber: number; // 1..quantity
  shipName?: string | null; // individually named
  builderNationId?: string | null; // null = domestic, else foreign yard
  status: ProjectStatus;
  createdTurnId: string;
}

export interface ConstructionProject {
  id: string;
  orderId: string; // one-to-one with order
  campaignId: string;
  nationId: string;
  shipClassDesignId: string;
  builderNationId?: string | null;
  status: ProjectStatus;
  totalCost: number;
  monthlyCost: number; // total / buildTime
  acceleratedMonthlyCost?: number; // higher if accelerated
  totalMonths: number;
  remainingMonths: number;
  isHalted: boolean;
  isAccelerated: boolean;
  isDelayedThisMonth: boolean;
  shipyardId?: string | null;
  dockSizeRequired: number; // displacement
  createdTurnId: string;
  completionTurnId?: string | null;
}

export interface MonthlyConstructionProgress {
  id: string;
  campaignId: string;
  campaignTurnId: string;
  projectId: string;
  nationId: string;
  monthCharged: number; // 0 if delayed
  remainingMonthsAfter: number;
  delayEventId?: string | null;
  paymentLinkId?: string | null;
}

export interface ConstructionCompletionEvent {
  id: string;
  campaignId: string;
  campaignTurnId: string;
  projectId: string;
  orderId: string;
  shipId: string; // created ship
  shipName: string;
  shipClassDesignId: string;
  nationId: string;
}

export interface ConstructionDelayEvent {
  id: string;
  campaignId: string;
  campaignTurnId: string;
  projectId: string;
  reason:
    | "yard_overload"
    | "funds_shortage"
    | "accelerated_elsewhere"
    | "random"
    | "foreign_tension";
  monthsAdded: number;
  costSkippedThisMonth: boolean; // RTW3: delayed ships do not deduct cost that month
}

// One hull = one order = one project = one ship
export const isOneHullOneOrder = (order: ShipConstructionOrder, project: ConstructionProject) =>
  order.id === project.orderId;
