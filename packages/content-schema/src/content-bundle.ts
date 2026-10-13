import { Schema } from "effect";

import {
  AmmunitionPatternSchema,
  GunFamilySchema,
  GunModelSchema,
  GunMountSchema,
} from "./armament.js";
import { AreaSchema } from "./area.js";
import {
  CampaignConstructionSchema,
  CampaignDesignSchema,
  CampaignDiplomacySchema,
  CampaignEconomySchema,
  CampaignFleetSchema,
  CampaignResearchSchema,
} from "./campaign.js";
import { PackManifestSchema, RulesetManifestSchema } from "./manifest.js";
import { NationNavalProfileSchema } from "./naval-profile.js";
import { NationSchema } from "./nation.js";
import { PortSchema } from "./port.js";
import { PossessionSchema } from "./possession.js";
import { ReferenceDesignSchema } from "./reference-design.js";
import { RouteEdgeSchema } from "./route.js";
import {
  PropulsionPlantSchema,
  ShipComponentSchema,
  ShipHullFormSchema,
} from "./ship-component.js";
import { TechnologyPrerequisiteChainSchema } from "./technology.js";

/**
 * The compiled content bundle's own schema (CAH-SCH-3). The artifact boundary
 * decodes a hash-verified bundle through this schema instead of asserting its
 * shape, so the boundary's type is earned and schema/artifact drift fails
 * closed. Each collection reuses the same strict schema the compiler validated
 * it with; the ship-building `balance` mapping is opaque authored data.
 */
const ShipBuildingCatalogueSchema = Schema.Struct({
  components: Schema.Array(ShipComponentSchema),
  plants: Schema.Array(PropulsionPlantSchema),
  hullForms: Schema.Array(ShipHullFormSchema),
  balance: Schema.Unknown,
  navalProfiles: Schema.Array(NationNavalProfileSchema),
  armament: Schema.Struct({
    gunFamilies: Schema.Array(GunFamilySchema),
    gunModels: Schema.Array(GunModelSchema),
    gunMounts: Schema.Array(GunMountSchema),
    ammunition: Schema.Array(AmmunitionPatternSchema),
  }),
  referenceDesigns: Schema.Array(ReferenceDesignSchema),
});

const CampaignCollectionsSchema = Schema.Struct({
  fleets: Schema.Array(CampaignFleetSchema),
  economies: Schema.Array(CampaignEconomySchema),
  constructions: Schema.Array(CampaignConstructionSchema),
  diplomacy: Schema.Array(CampaignDiplomacySchema),
  research: Schema.Array(CampaignResearchSchema),
  designs: Schema.Array(CampaignDesignSchema),
});

export const ContentBundleSchema = Schema.Struct({
  generatedBy: Schema.String,
  manifest: PackManifestSchema,
  rulesets: Schema.Array(RulesetManifestSchema),
  nations: Schema.Array(NationSchema),
  areas: Schema.Array(AreaSchema),
  routes: Schema.Array(RouteEdgeSchema),
  possessions: Schema.Array(PossessionSchema),
  ports: Schema.Array(PortSchema),
  technologies: Schema.Array(TechnologyPrerequisiteChainSchema),
  shipBuilding: Schema.optional(ShipBuildingCatalogueSchema),
  campaign: Schema.optional(CampaignCollectionsSchema),
});

export type CompiledContentBundle = typeof ContentBundleSchema.Type;
