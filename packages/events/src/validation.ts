import type { SafeInt } from "@bluewave/contracts";
import { z } from "zod";
import type { DomainEventBody, DomainEventEnvelope } from "./envelope.js";

const nonEmptyString = z.string().trim().min(1);
const safeInt = z
  .number()
  .int()
  .min(Number.MIN_SAFE_INTEGER)
  .max(Number.MAX_SAFE_INTEGER)
  .transform((value) => value as SafeInt);
const nonNegativeSafeInt = safeInt.refine((value) => value >= 0, {
  message: "Expected a non-negative safe integer",
});

export const NationBudgetChangedSchema = z
  .object({
    kind: z.literal("NationBudgetChanged"),
    nationId: nonEmptyString,
    previousTreasury: safeInt,
    newTreasury: safeInt,
    delta: safeInt,
    reason: nonEmptyString,
  })
  .strict();

export const ConstructionProgressedSchema = z
  .object({
    kind: z.literal("ConstructionProgressed"),
    projectId: nonEmptyString,
    nationId: nonEmptyString,
    previousWork: nonNegativeSafeInt,
    newWork: nonNegativeSafeInt,
    workAdded: nonNegativeSafeInt,
  })
  .strict();

export const ShipRebuiltSchema = z
  .object({
    kind: z.literal("ShipRebuilt"),
    projectId: nonEmptyString,
    nationId: nonEmptyString,
    shipId: nonEmptyString,
    fromDesignVersionId: nonEmptyString,
    toDesignVersionId: nonEmptyString,
  })
  .strict();

export const ResearchProgressedSchema = z
  .object({
    kind: z.literal("ResearchProgressed"),
    nationId: nonEmptyString,
    techId: nonEmptyString,
    previousPoints: nonNegativeSafeInt,
    newPoints: nonNegativeSafeInt,
  })
  .strict();

export const BattleInitiatedSchema = z
  .object({
    kind: z.literal("BattleInitiated"),
    battleId: nonEmptyString,
    attackerId: nonEmptyString,
    defenderId: nonEmptyString,
    areaId: nonEmptyString,
  })
  .strict();

export const BattleResolvedSchema = z
  .object({
    kind: z.literal("BattleResolved"),
    battleId: nonEmptyString,
    winnerId: nonEmptyString,
    loserId: nonEmptyString,
  })
  .strict();

export const TechnologyDiscoveredSchema = z
  .object({
    kind: z.literal("TechnologyDiscovered"),
    nationId: nonEmptyString,
    techId: nonEmptyString,
    researchFieldId: nonEmptyString,
    discoveryMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM"),
    cost: nonNegativeSafeInt,
  })
  .strict();

export const DomainEventBodySchema = z.discriminatedUnion("kind", [
  NationBudgetChangedSchema,
  ConstructionProgressedSchema,
  ShipRebuiltSchema,
  ResearchProgressedSchema,
  BattleInitiatedSchema,
  BattleResolvedSchema,
  TechnologyDiscoveredSchema,
]);

export const DomainEventEnvelopeSchema = z
  .object({
    eventId: nonEmptyString,
    version: nonEmptyString,
    aggregateType: nonEmptyString,
    aggregateId: nonEmptyString,
    eventType: nonEmptyString,
    timestamp: z.string().datetime({ offset: true }),
    body: DomainEventBodySchema,
    sequenceNumber: nonNegativeSafeInt,
  })
  .strict()
  .superRefine((event, context) => {
    if (event.eventType !== event.body.kind) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventType"],
        message: `eventType must match body.kind (${event.body.kind})`,
      });
    }
  });

export function parseDomainEventBody(input: unknown): DomainEventBody {
  return DomainEventBodySchema.parse(input) as DomainEventBody;
}

export function parseDomainEventEnvelope<TBody extends DomainEventBody = DomainEventBody>(
  input: unknown,
): DomainEventEnvelope<TBody> {
  return DomainEventEnvelopeSchema.parse(input) as DomainEventEnvelope<TBody>;
}
