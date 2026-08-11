//packages/content-compiler/src/stages/validate.ts
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import type { ZodSchema } from "zod";
import {
  PackManifestSchema,
  RulesetManifestSchema,
  CountrySchema,
  AreaSchema,
  RouteEdgeSchema,
  PossessionSchema,
  PortSchema,
  TechnologyPrerequisiteChainSchema,
  validateAgainstSchema,
} from "@bluewave/content-schema";
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

    const schemas: Record<string, { schema: ZodSchema<unknown>; label: string }> = {
      rulesets: { schema: RulesetManifestSchema, label: "RulesetManifest" },
      countries: { schema: CountrySchema, label: "Country" },
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
    };
  }
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

  const countryIds = idMap.get("countries") ?? new Set();
  const areaIds = idMap.get("areas") ?? new Set();

  const possessions = validated["possessions"] ?? [];
  for (const p of possessions) {
    const pRecord = p as Record<string, unknown>;
    const pId = pRecord["id"];
    const countryId = pRecord["countryId"];
    const areaId = pRecord["areaId"];
    if (typeof countryId === "string" && !countryIds.has(countryId)) {
      collector.addError(
        "REF",
        `Possession '${String(pId)}' references unknown country '${countryId}'`,
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
    const countryId = pRecord["countryId"];
    if (typeof areaId === "string" && !areaIds.has(areaId)) {
      collector.addError("REF", `Port '${String(pId)}' references unknown area '${areaId}'`, {
        stage: "validate",
        entityId: typeof pId === "string" ? pId : undefined,
      });
    }
    if (typeof countryId === "string" && !countryIds.has(countryId)) {
      collector.addError("REF", `Port '${String(pId)}' references unknown country '${countryId}'`, {
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
