//packages/content-compiler/src/stages/validate.ts

import {
  AmmunitionPatternSchema,
  AreaSchema,
  GunFamilySchema,
  GunModelSchema,
  GunMountSchema,
  NationNavalProfileSchema,
  NationSchema,
  PackManifestSchema,
  PortSchema,
  PossessionSchema,
  PropulsionPlantSchema,
  RouteEdgeSchema,
  RulesetManifestSchema,
  ShipComponentSchema,
  ShipHullFormSchema,
  TechnologyPrerequisiteChainSchema,
  validateAgainstSchema,
  type ContentSchema,
} from "@bluewave/content-schema";
import type { DiagnosticCollector } from "@bluewave/diagnostics";

import type { CompilerStage } from "../index.js";
import type { ParseOutput } from "./parse.js";

export interface ValidateOutput {
  manifest: unknown;
  rulesets: unknown[];
  countries: unknown[];
  areas: unknown[];
  routes: unknown[];
  possessions: unknown[];
  ports: unknown[];
  technologies: unknown[];
  shipComponents?: unknown[];
  propulsionPlants?: unknown[];
  shipHullForms?: unknown[];
  shipBalance?: unknown;
  gunFamilies?: unknown[];
  gunModels?: unknown[];
  gunMounts?: unknown[];
  ammunition?: unknown[];
  navalProfiles?: unknown[];
  referenceDesigns?: unknown[];
}

const COLLECTION_KEYS = [
  "rulesets",
  "countries",
  "areas",
  "routes",
  "possessions",
  "ports",
  "technologies",
] as const;

interface ShipBuildingCollection {
  key: keyof ValidateOutput;
  schema?: ContentSchema;
  label: string;
  idField: string;
}

/** The fully-populated ship-building catalogue section of a validated build. */
interface ValidatedCatalogue {
  shipComponents: unknown[];
  propulsionPlants: unknown[];
  shipHullForms: unknown[];
  shipBalance: unknown;
  gunFamilies: unknown[];
  gunModels: unknown[];
  gunMounts: unknown[];
  ammunition: unknown[];
  navalProfiles: unknown[];
  referenceDesigns: unknown[];
}

/**
 * The ship-building catalogue collections and their structural schemas, in the
 * order they are validated. `referenceDesigns` has no content schema yet (its
 * draft is the drawing board's domain shape); it is still duplicate-ID checked
 * and cross-referenced, and its full invariant validation is owned by ticket 06.
 */
const SHIP_BUILDING_COLLECTIONS: readonly ShipBuildingCollection[] = [
  { key: "shipComponents", schema: ShipComponentSchema, label: "ShipComponent", idField: "id" },
  {
    key: "propulsionPlants",
    schema: PropulsionPlantSchema,
    label: "PropulsionPlant",
    idField: "id",
  },
  { key: "shipHullForms", schema: ShipHullFormSchema, label: "ShipHullForm", idField: "id" },
  { key: "gunFamilies", schema: GunFamilySchema, label: "GunFamily", idField: "id" },
  { key: "gunModels", schema: GunModelSchema, label: "GunModel", idField: "id" },
  { key: "gunMounts", schema: GunMountSchema, label: "GunMount", idField: "id" },
  { key: "ammunition", schema: AmmunitionPatternSchema, label: "AmmunitionPattern", idField: "id" },
  {
    key: "navalProfiles",
    schema: NationNavalProfileSchema,
    label: "NationNavalProfile",
    idField: "nationId",
  },
  { key: "referenceDesigns", label: "ReferenceDesign", idField: "id" },
];

export class ValidateStage implements CompilerStage<ParseOutput, ValidateOutput> {
  readonly name = "validate";

  run(
    input: ParseOutput,
    _signal: AbortSignal,
    collector: DiagnosticCollector,
  ): ValidateOutput | undefined {
    const { manifest: rawManifest } = input;

    const manifest = rawManifest
      ? validateAgainstSchema(
          rawManifest,
          PackManifestSchema,
          "PackManifest",
          "pack.json",
          collector,
        )
      : (collector.addError("MISSING-MANIFEST", "No manifest document found", {
          stage: "validate",
        }),
        undefined);

    if (!manifest) return undefined;

    const schemas: Record<string, { schema: ContentSchema; label: string }> = {
      rulesets: { schema: RulesetManifestSchema, label: "RulesetManifest" },
      countries: { schema: NationSchema, label: "Nation" },
      areas: { schema: AreaSchema, label: "Area" },
      routes: { schema: RouteEdgeSchema, label: "RouteEdge" },
      possessions: { schema: PossessionSchema, label: "Possession" },
      ports: { schema: PortSchema, label: "Port" },
      technologies: {
        schema: TechnologyPrerequisiteChainSchema,
        label: "TechnologyPrerequisiteChain",
      },
    };

    const validated: Record<string, unknown[]> = {
      rulesets: [],
      countries: [],
      areas: [],
      routes: [],
      possessions: [],
      ports: [],
      technologies: [],
    };

    for (const key of COLLECTION_KEYS) {
      const entry = schemas[key];
      if (!entry) continue;
      const { schema, label } = entry;
      const items = input.collectionDocs.get(key) ?? [];
      for (const item of items) {
        const result = validateAgainstSchema(item, schema, label, `${key}.yaml`, collector);
        if (result !== undefined) {
          const arr = validated[key];
          if (arr) arr.push(result);
        }
      }
    }

    validateDuplicateIds(validated, collector);
    validateMissingReferences(validated, collector);
    validateTechnologyAcyclic(validated, collector);

    const catalogue = validateShipBuildingCatalogue(input, collector);
    validateShipBuildingDuplicates(catalogue, input, collector);
    validateShipBuildingReferences(validated, catalogue, input, collector);

    if (collector.hasErrors) return undefined;

    return {
      manifest,
      rulesets: validated["rulesets"] ?? [],
      countries: validated["countries"] ?? [],
      areas: validated["areas"] ?? [],
      routes: validated["routes"] ?? [],
      possessions: validated["possessions"] ?? [],
      ports: validated["ports"] ?? [],
      technologies: validated["technologies"] ?? [],
      ...catalogue,
    };
  }
}

/**
 * Structurally validates each ship-building catalogue collection that the input
 * actually carries. A content-pack-only input (no ship-building files) yields
 * empty collections, so the pack boundary is untouched.
 */
function validateShipBuildingCatalogue(
  input: ParseOutput,
  collector: DiagnosticCollector,
): ValidatedCatalogue {
  const out: Record<string, unknown[]> = {};
  for (const spec of SHIP_BUILDING_COLLECTIONS) {
    const raw = input.collectionDocs.get(spec.key) ?? [];
    const sources = input.sourcePaths.get(spec.key) ?? [];
    if (spec.schema === undefined) {
      out[spec.key] = raw;
      continue;
    }
    const items: unknown[] = [];
    raw.forEach((item, index) => {
      const sourcePath = sources[index] ?? `${spec.key}.yaml`;
      const result = validateAgainstSchema(item, spec.schema!, spec.label, sourcePath, collector);
      if (result !== undefined) items.push(result);
    });
    out[spec.key] = items;
  }
  return {
    shipComponents: out["shipComponents"] ?? [],
    propulsionPlants: out["propulsionPlants"] ?? [],
    shipHullForms: out["shipHullForms"] ?? [],
    shipBalance: input.objectDocs.get("shipBalance"),
    gunFamilies: out["gunFamilies"] ?? [],
    gunModels: out["gunModels"] ?? [],
    gunMounts: out["gunMounts"] ?? [],
    ammunition: out["ammunition"] ?? [],
    navalProfiles: out["navalProfiles"] ?? [],
    referenceDesigns: out["referenceDesigns"] ?? [],
  };
}

/**
 * Projects the validated ship-building collections onto a keyed map so the
 * generic duplicate/reference passes can iterate the collection specs without an
 * untyped cast.
 */
function catalogueArrays(catalogue: ValidatedCatalogue): Record<string, unknown[]> {
  return {
    shipComponents: catalogue.shipComponents,
    propulsionPlants: catalogue.propulsionPlants,
    shipHullForms: catalogue.shipHullForms,
    gunFamilies: catalogue.gunFamilies,
    gunModels: catalogue.gunModels,
    gunMounts: catalogue.gunMounts,
    ammunition: catalogue.ammunition,
    navalProfiles: catalogue.navalProfiles,
    referenceDesigns: catalogue.referenceDesigns,
  };
}

function validateShipBuildingDuplicates(
  catalogue: ValidatedCatalogue,
  input: ParseOutput,
  collector: DiagnosticCollector,
): void {
  const arrays = catalogueArrays(catalogue);
  for (const spec of SHIP_BUILDING_COLLECTIONS) {
    const items = arrays[spec.key] ?? [];
    const sources = input.sourcePaths.get(spec.key) ?? [];
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const id = (item as Record<string, unknown>)[spec.idField];
      if (typeof id !== "string") return;
      if (seen.has(id)) {
        collector.addError("DUP-ID", `Duplicate ${spec.label} id '${id}'`, {
          stage: "validate",
          sourceLocation: { path: sources[index] ?? `${spec.key}.yaml`, line: 1 },
          entityId: id,
          remediation: `Give each ${spec.label} a unique '${spec.idField}'`,
        });
      }
      seen.add(id);
    });
  }
}

function validateShipBuildingReferences(
  core: Record<string, unknown[]>,
  catalogue: ValidatedCatalogue,
  input: ParseOutput,
  collector: DiagnosticCollector,
): void {
  const arrays = catalogueArrays(catalogue);
  const idFieldByKey = new Map<string, string>(
    SHIP_BUILDING_COLLECTIONS.map((spec) => [spec.key, spec.idField]),
  );
  const ids = (key: keyof ValidateOutput, field = "id"): Set<string> => {
    const items = arrays[key] ?? [];
    return new Set(
      items
        .map((item) => (item as Record<string, unknown>)[field])
        .filter((v): v is string => typeof v === "string"),
    );
  };
  const coreIds = (key: string): Set<string> => {
    const items = core[key] ?? [];
    return new Set(
      items
        .map((item) => (item as Record<string, unknown>)["id"])
        .filter((v): v is string => typeof v === "string"),
    );
  };
  const sourceFor = (key: keyof ValidateOutput, id: string): string => {
    const items = arrays[key] ?? [];
    const sources = input.sourcePaths.get(key) ?? [];
    const field = idFieldByKey.get(key) ?? "id";
    const index = items.findIndex((item) => (item as Record<string, unknown>)[field] === id);
    return sources[index] ?? `${String(key)}.yaml`;
  };

  const componentIds = ids("shipComponents");
  const plantIds = ids("propulsionPlants");
  const hullFormIds = ids("shipHullForms");
  const familyIds = ids("gunFamilies");
  const gunModelIds = ids("gunModels");
  const techIds = coreIds("technologies");

  const ref = (
    sourceKey: keyof ValidateOutput,
    entityId: string,
    fieldPath: string,
    message: string,
  ) => {
    collector.addError("REF", message, {
      stage: "validate",
      sourceLocation: { path: sourceFor(sourceKey, entityId), line: 1 },
      entityId,
      remediation: `Add the missing reference or fix '${fieldPath}'`,
    });
  };

  for (const item of catalogue.gunModels) {
    const rec = item as Record<string, unknown>;
    const id = String(rec["id"]);
    const familyId = rec["familyId"];
    if (typeof familyId === "string" && !familyIds.has(familyId)) {
      ref(
        "gunModels",
        id,
        "familyId",
        `Gun model '${id}' references unknown gun family '${familyId}'`,
      );
    }
    for (const techId of stringArray(rec["requiredTechnologyIds"])) {
      if (!techIds.has(techId)) {
        ref(
          "gunModels",
          id,
          "requiredTechnologyIds",
          `Gun model '${id}' references unknown technology '${techId}'`,
        );
      }
    }
  }

  for (const item of catalogue.gunMounts) {
    const rec = item as Record<string, unknown>;
    const id = String(rec["id"]);
    for (const familyId of stringArray(rec["compatibleGunFamilies"])) {
      if (!familyIds.has(familyId)) {
        ref(
          "gunMounts",
          id,
          "compatibleGunFamilies",
          `Gun mount '${id}' references unknown gun family '${familyId}'`,
        );
      }
    }
  }

  for (const item of catalogue.ammunition) {
    const rec = item as Record<string, unknown>;
    const id = String(rec["id"]);
    for (const familyId of stringArray(rec["compatibleGunFamilies"])) {
      if (!familyIds.has(familyId)) {
        ref(
          "ammunition",
          id,
          "compatibleGunFamilies",
          `Ammunition '${id}' references unknown gun family '${familyId}'`,
        );
      }
    }
    for (const modelId of stringArray(rec["compatibleGunModelIds"])) {
      if (!gunModelIds.has(modelId)) {
        ref(
          "ammunition",
          id,
          "compatibleGunModelIds",
          `Ammunition '${id}' references unknown gun model '${modelId}'`,
        );
      }
    }
  }

  for (const item of catalogue.shipComponents) {
    const rec = item as Record<string, unknown>;
    const id = String(rec["id"]);
    for (const required of stringArray(rec["requires"])) {
      if (!techIds.has(required)) {
        ref(
          "shipComponents",
          id,
          "requires",
          `Component '${id}' requires unknown technology '${required}'`,
        );
      }
    }
    for (const upgrade of stringArray(rec["upgradePath"])) {
      if (!componentIds.has(upgrade)) {
        ref(
          "shipComponents",
          id,
          "upgradePath",
          `Component '${id}' upgradePath references unknown component '${upgrade}'`,
        );
      }
    }
  }

  for (const item of catalogue.navalProfiles) {
    const rec = item as Record<string, unknown>;
    const nationId = String(rec["nationId"]);
    const hard = rec["hardCapabilities"] as Record<string, unknown> | undefined;
    if (hard) {
      for (const hullFormId of stringArray(hard["hullForms"])) {
        if (!hullFormIds.has(hullFormId)) {
          ref(
            "navalProfiles",
            nationId,
            "hardCapabilities.hullForms",
            `Naval profile '${nationId}' references unknown hull form '${hullFormId}'`,
          );
        }
      }
      for (const plantId of stringArray(hard["domesticPlants"])) {
        if (!plantIds.has(plantId)) {
          ref(
            "navalProfiles",
            nationId,
            "hardCapabilities.domesticPlants",
            `Naval profile '${nationId}' references unknown propulsion plant '${plantId}'`,
          );
        }
      }
    }
    const componentAccess = rec["componentAccess"];
    if (componentAccess && typeof componentAccess === "object") {
      for (const componentId of Object.keys(componentAccess)) {
        if (!componentIds.has(componentId)) {
          ref(
            "navalProfiles",
            nationId,
            "componentAccess",
            `Naval profile '${nationId}' references unknown component '${componentId}'`,
          );
        }
      }
    }
  }

  for (const item of catalogue.referenceDesigns) {
    const rec = item as Record<string, unknown>;
    const id = String(rec["id"]);
    const draft = rec["draft"] as Record<string, unknown> | undefined;
    const hull = draft?.["hull"] as Record<string, unknown> | undefined;
    const hullFormId = hull?.["hullFormId"];
    if (typeof hullFormId === "string" && !hullFormIds.has(hullFormId)) {
      ref(
        "referenceDesigns",
        id,
        "draft.hull.hullFormId",
        `Reference design '${id}' references unknown hull form '${hullFormId}'`,
      );
    }
    const machinery = draft?.["machinery"] as Record<string, unknown> | undefined;
    const plantId = machinery?.["plantId"];
    if (typeof plantId === "string" && !plantIds.has(plantId)) {
      ref(
        "referenceDesigns",
        id,
        "draft.machinery.plantId",
        `Reference design '${id}' references unknown propulsion plant '${plantId}'`,
      );
    }
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Validates that the technology prerequisite graph is acyclic (DESIGN-20 §16)
 * using Kahn's algorithm over canonical technology identifiers. A cycle fails
 * with TECHNOLOGY_PREREQUISITE_CYCLE.
 */
function validateTechnologyAcyclic(
  validated: Record<string, unknown[]>,
  collector: DiagnosticCollector,
): void {
  const techs = validated["technologies"] ?? [];
  if (techs.length === 0) return;

  const byId = new Map<string, Record<string, unknown>>();
  for (const t of techs) {
    const tRecord = t as Record<string, unknown>;
    const tId = tRecord["id"];
    if (typeof tId === "string") byId.set(tId, tRecord);
  }

  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const t of techs) {
    const tRecord = t as Record<string, unknown>;
    const tId = String(tRecord["id"]);
    adjacency.set(tId, []);
    inDegree.set(tId, 0);
  }

  for (const t of techs) {
    const tRecord = t as Record<string, unknown>;
    const tId = String(tRecord["id"]);
    const prereqs = tRecord["prerequisites"];
    if (Array.isArray(prereqs)) {
      for (const prereq of prereqs) {
        const prereqRecord = prereq as Record<string, unknown>;
        const techId = prereqRecord["techId"];
        if (typeof techId === "string" && techId !== tId && adjacency.has(techId)) {
          adjacency.get(techId)!.push(tId);
          inDegree.set(tId, (inDegree.get(tId) ?? 0) + 1);
        }
      }
    }
  }

  const resolved: string[] = [];
  const ready = [...inDegree.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id)
    .sort();
  while (ready.length > 0) {
    const id = ready.shift()!;
    resolved.push(id);
    const next = adjacency.get(id) ?? [];
    const newlyReady: string[] = [];
    for (const dep of next) {
      const deg = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, deg);
      if (deg === 0) newlyReady.push(dep);
    }
    newlyReady.sort();
    ready.push(...newlyReady);
  }

  if (resolved.length !== byId.size) {
    const remaining = [...inDegree.entries()]
      .filter(([, d]) => d > 0)
      .map(([id]) => id)
      .sort();
    collector.addError(
      "TECHNOLOGY_PREREQUISITE_CYCLE",
      `Technology prerequisite cycle detected among: ${remaining.join(", ")}`,
      {
        stage: "validate",
        entityId: remaining[0],
      },
    );
  }
}

function validateDuplicateIds(
  validated: Record<string, unknown[]>,
  collector: DiagnosticCollector,
): void {
  for (const key of COLLECTION_KEYS) {
    const items = validated[key] ?? [];
    const seen = new Set<string>();
    for (const item of items) {
      const id = (item as Record<string, unknown>)["id"];
      if (typeof id === "string") {
        if (seen.has(id)) {
          collector.addError("DUP-ID", `Duplicate ID '${id}' in ${key}`, {
            stage: "validate",
            entityId: id,
          });
        }
        seen.add(id);
      }
    }
  }
}

function collectIds(validated: Record<string, unknown[]>): Map<string, Set<string>> {
  const idMap = new Map<string, Set<string>>();
  for (const key of COLLECTION_KEYS) {
    const items = validated[key] ?? [];
    const ids = new Set<string>();
    for (const item of items) {
      const id = (item as Record<string, unknown>)["id"];
      if (typeof id === "string") {
        ids.add(id);
      }
    }
    idMap.set(key, ids);
  }
  return idMap;
}

function validateMissingReferences(
  validated: Record<string, unknown[]>,
  collector: DiagnosticCollector,
): void {
  const idMap = collectIds(validated);
  const allIds = new Set<string>();
  for (const ids of idMap.values()) {
    for (const id of ids) {
      allIds.add(id);
    }
  }

  const nationIds = idMap.get("countries") ?? new Set();
  const areaIds = idMap.get("areas") ?? new Set();

  const possessions = validated["possessions"] ?? [];
  for (const p of possessions) {
    const pRecord = p as Record<string, unknown>;
    const pId = pRecord["id"];
    const nationId = pRecord["nationId"];
    const areaId = pRecord["areaId"];
    if (typeof nationId === "string" && !nationIds.has(nationId)) {
      collector.addError(
        "REF",
        `Possession '${String(pId)}' references unknown nation '${nationId}'`,
        {
          stage: "validate",
          entityId: typeof pId === "string" ? pId : undefined,
        },
      );
    }
    if (typeof areaId === "string" && !areaIds.has(areaId)) {
      collector.addError("REF", `Possession '${String(pId)}' references unknown area '${areaId}'`, {
        stage: "validate",
        entityId: typeof pId === "string" ? pId : undefined,
      });
    }
  }

  const ports = validated["ports"] ?? [];
  for (const p of ports) {
    const pRecord = p as Record<string, unknown>;
    const pId = pRecord["id"];
    const areaId = pRecord["areaId"];
    const nationId = pRecord["nationId"];
    if (typeof areaId === "string" && !areaIds.has(areaId)) {
      collector.addError("REF", `Port '${String(pId)}' references unknown area '${areaId}'`, {
        stage: "validate",
        entityId: typeof pId === "string" ? pId : undefined,
      });
    }
    if (typeof nationId === "string" && !nationIds.has(nationId)) {
      collector.addError("REF", `Port '${String(pId)}' references unknown nation '${nationId}'`, {
        stage: "validate",
        entityId: typeof pId === "string" ? pId : undefined,
      });
    }
  }

  const routes = validated["routes"] ?? [];
  for (const r of routes) {
    const rRecord = r as Record<string, unknown>;
    const rId = rRecord["id"];
    const rFrom = rRecord["from"];
    const rTo = rRecord["to"];
    if (typeof rFrom === "string" && !areaIds.has(rFrom)) {
      collector.addError("REF", `Route '${String(rId)}' references unknown area '${rFrom}'`, {
        stage: "validate",
        entityId: typeof rId === "string" ? rId : undefined,
      });
    }
    if (typeof rTo === "string" && !areaIds.has(rTo)) {
      collector.addError("REF", `Route '${String(rId)}' references unknown area '${rTo}'`, {
        stage: "validate",
        entityId: typeof rId === "string" ? rId : undefined,
      });
    }
  }

  const techs = validated["technologies"] ?? [];
  for (const t of techs) {
    const tRecord = t as Record<string, unknown>;
    const tId = tRecord["id"];
    const prereqs = tRecord["prerequisites"];
    if (Array.isArray(prereqs)) {
      for (const prereq of prereqs) {
        const prereqRecord = prereq as Record<string, unknown>;
        const techId = prereqRecord["techId"];
        if (typeof techId === "string" && techId !== tId && !allIds.has(techId)) {
          collector.addError(
            "REF",
            `Technology '${String(tId)}' references unknown prerequisite '${techId}'`,
            {
              stage: "validate",
              entityId: typeof tId === "string" ? tId : undefined,
            },
          );
        }
      }
    }
  }
}
