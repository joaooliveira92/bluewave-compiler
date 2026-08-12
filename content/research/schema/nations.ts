import { z } from "zod";
import {
  AiArchetypeSchema,
  AiRoleSchema,
  ArmyNavyBalanceSchema,
  CoreAnxietySchema,
  GameplayFeelSchema,
  GdpTierSchema,
  IndustrialBaseSchema,
  IndustrializationLevelSchema,
  NationIdSchema,
  NavalBudgetLevelSchema,
  NavalPurposeSchema,
  PoliticalSystemSchema,
  RegimeTypeSchema,
  SenioritySchema,
  StabilityLevelSchema,
} from "./nations.ids.ts";

// ══════════════════════════════════════════════════════════════════════
// Primitives
// ══════════════════════════════════════════════════════════════════════

const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .describe("CSS hex color, e.g. #C8102E");

// ══════════════════════════════════════════════════════════════════════
// Sub-objects
// ══════════════════════════════════════════════════════════════════════

export const PresentationSchema = z
  .object({
    colorBg: HexColorSchema,
    colorFg: HexColorSchema,
  })
  .strict()
  .describe("Nation flag/presentation colors");

export const NationSlotSchema = z
  .object({
    id: z.string(),
    order: z.number(),
    participation: z.enum(["active", "inactive", "conditional"]),
  })
  .strict();

export const StabilityProfileSchema = z
  .object({
    level: StabilityLevelSchema,
    factors: z.array(z.string()),
  })
  .strict()
  .describe("Domestic stability level and contributing factors");

export const CanalDependencySchema = z
  .object({
    suez: z.string(),
    panama: z.string(),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Phase 1 additive fields — spec-driven
// ══════════════════════════════════════════════════════════════════════

export const StrategicObjectivesSchema = z
  .object({
    primary: z.string(),
    secondary: z.string(),
  })
  .strict()
  .describe("Primary and secondary strategic objectives per scenario era");

export const BaseResourcesSchema = z
  .object({
    gdpTier: GdpTierSchema,
    gdpDescription: z
      .string()
      .describe("Free-text elaboration on GDP tier, e.g. 'largest in Europe, #1 globally'"),
    population: z
      .string()
      .describe("Population as free-text string, e.g. '~35M (UK proper); ~300M (empire)'"),
    industrialization: IndustrializationLevelSchema,
    industrializationDescription: z.string().describe("Free-text elaboration on industrial level"),
  })
  .strict()
  .describe("Base resource indicators, January 1880");

export const NavalAppropriationSchema = z
  .object({
    budgetLevel: NavalBudgetLevelSchema,
    justification: z.string().describe("Narrative justification for the naval budget level"),
  })
  .strict()
  .describe("Naval budget appropriation for the scenario era");

// ══════════════════════════════════════════════════════════════════════
// Regime — 1880-accurate political system
// ══════════════════════════════════════════════════════════════════════

export const NationRegimeSchema = z
  .object({
    type: RegimeTypeSchema,
    politicalSystem: PoliticalSystemSchema.describe("Specific 1880 political system"),
    governmentForm: z.string().optional().describe("Deprecated — prefer politicalSystem"),
    headOfState: z.string(),
    headOfGovernment: z.string(),
    leaderTitle: z.string(),
    navalPolicyActors: z.array(z.string()),
    governmentModifiers: z
      .array(z.string())
      .describe("Tags e.g. federal_structure, fragmented_legislature"),
    navyMinister: z
      .object({
        name: z.string(),
        title: z.string(),
        traits: z.string().optional(),
      })
      .strict()
      .optional(),
    stabilityProfile: StabilityProfileSchema,
    description: z.string(),
  })
  .strict()
  .describe("Political regime, January 1880");

// ══════════════════════════════════════════════════════════════════════
// Domain sub-models
// ══════════════════════════════════════════════════════════════════════

export const IdentitySchema = z
  .object({
    oneSentence: z.string().describe("Phase 1 canonical one-sentence identity"),
    fullIdentity: z.string().describe("Phase 1 full national identity"),
    strategicProblem: z.string().describe("Core strategic problem the nation faces"),
  })
  .strict();

export const EconomySchema = z
  .object({
    description: z.string(),
    character: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    industrialBase: IndustrialBaseSchema,
  })
  .strict();

export const NavalInstitutionSchema = z
  .object({
    description: z.string(),
    character: z.array(z.string()),
    seniority: SenioritySchema,
    cruiserRole: z.string().optional(),
    formativeExperience: z.string().optional(),
  })
  .strict();

export const DoctrineSchema = z
  .object({
    summary: z.string(),
    schools: z.array(z.string()),
    isFragmented: z.boolean().optional(),
    isTheaterSpecific: z.boolean().optional(),
  })
  .strict();

export const ShipDesignSchema = z
  .object({
    summary: z.string(),
    principles: z.array(z.string()),
    favoredTypes: z.array(z.string()),
    tradeOffs: z.string().optional(),
    exemplarClass: z.string().optional(),
  })
  .strict();

export const AiSchema = z
  .object({
    archetype: AiArchetypeSchema,
    behavior: z.array(z.string()),
    aiRole: AiRoleSchema.optional(),
    triggers: z.array(z.string()).optional(),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Military — Phase 1 Nations
// ══════════════════════════════════════════════════════════════════════

export const MilitarySchema = z
  .object({
    description: z.string().describe("Army/military profile overview"),
    size: z.string().optional().describe("Free-text army size, e.g. 'peacetime ~900,000'"),
    character: z.array(z.string()).optional(),
    armyNavyBalance: ArmyNavyBalanceSchema.optional(),
  })
  .strict()
  .describe("Army/military profile for the scenario era");

// ══════════════════════════════════════════════════════════════════════
// Nation entity — single source of truth for the canon
// ══════════════════════════════════════════════════════════════════════

export const NationSchema = z
  .object({
    id: NationIdSchema,
    tag: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .describe("Uppercase 3-letter code, e.g. GBR"),
    name: z.string(),
    displayNameKey: z.string(),
    isPlayable: z.boolean(),
    slot: z.nullable(NationSlotSchema),
    presentation: PresentationSchema,
    identity: IdentitySchema,
    regime: NationRegimeSchema,
    strategicObjectives: StrategicObjectivesSchema,
    baseResources: BaseResourcesSchema,
    navalAppropriation: NavalAppropriationSchema,
    economy: EconomySchema,
    navalInstitution: NavalInstitutionSchema,
    doctrine: DoctrineSchema,
    shipDesign: ShipDesignSchema,
    ai: AiSchema,
    military: MilitarySchema.optional(),
    navalPurpose: NavalPurposeSchema,
    coreAnxiety: CoreAnxietySchema,
    gameplayFeel: GameplayFeelSchema,
    historicalAssumptions: z.array(z.string()),
  })
  .strict()
  .describe("Canonical nation definition, January 1880");

// ══════════════════════════════════════════════════════════════════════
// Pack envelope
// ══════════════════════════════════════════════════════════════════════

export const ProvenanceSchema = z.enum([
  "CANONICAL_CONTENT",
  "MANUAL_EXPLICIT",
  "DESIGN_DECISION",
  "GENERATED_CANONICAL",
  "SCENARIO_OVERRIDE",
  "RULESET_CONSTANT",
  "DEPRECATED",
]);

export const NationsPackSchema = z
  .object({
    scenario: z.string(),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    nations: z.array(NationSchema),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Inferred types
// ══════════════════════════════════════════════════════════════════════

export type NationRegime = z.infer<typeof NationRegimeSchema>;
export type Nation = z.infer<typeof NationSchema>;
export type NationsPack = z.infer<typeof NationsPackSchema>;
export type NationSlot = z.infer<typeof NationSlotSchema>;
export type StabilityProfile = z.infer<typeof StabilityProfileSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type Economy = z.infer<typeof EconomySchema>;
export type NavalInstitution = z.infer<typeof NavalInstitutionSchema>;
export type Doctrine = z.infer<typeof DoctrineSchema>;
export type ShipDesign = z.infer<typeof ShipDesignSchema>;
export type Ai = z.infer<typeof AiSchema>;
export type Military = z.infer<typeof MilitarySchema>;
export type StrategicObjectives = z.infer<typeof StrategicObjectivesSchema>;
export type BaseResources = z.infer<typeof BaseResourcesSchema>;
export type NavalAppropriation = z.infer<typeof NavalAppropriationSchema>;
