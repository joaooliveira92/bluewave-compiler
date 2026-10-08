// packages/campaign/src/designCompilation.ts
// Campaign-compile stage: materialize authored design templates into canonical
// CompiledDesignVersion records and their design families. Design YAML authors
// human-friendly units (knots, mm); this stage normalizes to canonical engine
// units (µm/s, µm) per ADR-0037 and hashes each immutable compiled version.
import { SafeInt } from "@bluewave/contracts";
import {
  type DesignTemplate,
  DesignTemplateSchema,
  validateAgainstSchema,
} from "@bluewave/content-schema";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { toSafeIntOpt, toStr } from "./campaignInput.js";
import { knotsToUms, mmToUm } from "./designUnits.js";
import type {
  CompiledDesignVersion,
  CompiledTorpedoMount,
  DesignFamily,
  NationState,
} from "./state.js";

/**
 * Validate every fleet ship's `designVersionId` resolves to a compiled design.
 * No-op when no designs were authored (pre-design content packs).
 */
export function assertFleetDesignLinks(
  nations: Map<string, NationState>,
  designs: Map<string, CompiledDesignVersion>,
  collector: DiagnosticCollector,
): boolean {
  if (designs.size === 0) return true;
  for (const [, nation] of nations) {
    for (const fleet of nation.fleets) {
      for (const ship of fleet.ships) {
        if (ship.designVersionId && !designs.has(ship.designVersionId)) {
          collector.addError(
            "CAMPAIGN-DESIGN",
            `Ship ${ship.id} references unknown designVersionId ${ship.designVersionId}`,
            { stage: "campaign-compile" },
          );
        }
      }
    }
  }
  return !collector.hasErrors;
}

function mapTorpedoArmament(validated: DesignTemplate): CompiledTorpedoMount[] | undefined {
  const armament = validated["torpedoArmament"] as
    | { mountType: string; tubeCount: number; torpedoModelId: string }[]
    | undefined;
  return armament?.map((m) => ({
    mountType: m.mountType,
    tubeCount: SafeInt(m.tubeCount),
    torpedoModelId: m.torpedoModelId,
  }));
}

function buildRawDesignRecord(
  rec: Record<string, unknown>,
  designVersionId: string,
): Record<string, unknown> {
  return {
    designId: designVersionId,
    designFamilyId: rec["designFamilyId"],
    nationId: rec["nationId"],
    className: rec["className"],
    hullType: rec["hullType"],
    displacementKg: rec["displacementKg"],
    speedUms: rec["speedUms"],
    armorBeltUm: rec["armorBeltUm"],
    mainGuns: rec["mainGuns"],
    machineryType: rec["machineryType"],
    hitPoints: rec["hitPoints"],
    crewComplement: rec["crewComplement"],
    contentVersion: rec["contentVersion"],
    ...(rec["torpedoArmament"] !== undefined ? { torpedoArmament: rec["torpedoArmament"] } : {}),
  };
}

function computeCompiledDesignHash(
  designVersionId: string,
  validated: DesignTemplate,
  torpedoArmament: CompiledTorpedoMount[] | undefined,
): string {
  return sha256Hex(
    canonicalSerialize({
      designVersionId,
      className: validated["className"],
      nationId: validated["nationId"],
      hullType: validated["hullType"],
      displacementKg: validated["displacementKg"],
      speedUms: validated["speedUms"],
      armorBeltUm: validated["armorBeltUm"],
      mainGuns: validated["mainGuns"],
      machineryType: validated["machineryType"],
      hitPoints: validated["hitPoints"],
      crewComplement: validated["crewComplement"],
      // P-1 AC-2: only hashed when present, so unarmed designs keep their hash.
      ...(torpedoArmament ? { torpedoArmament } : {}),
    }),
  );
}

function buildCompiledDesign(
  designVersionId: string,
  rec: Record<string, unknown>,
  validated: DesignTemplate,
): CompiledDesignVersion {
  const torpedoArmament = mapTorpedoArmament(validated);
  return {
    designVersionId,
    designFamilyId: toStr(validated["designFamilyId"], ""),
    className: validated["className"],
    nationId: validated["nationId"],
    hullType: validated["hullType"],
    normalizedDisplacementKg: toSafeIntOpt(
      rec["normalizedDisplacementKg"] ?? validated["displacementKg"],
      SafeInt(0),
    ),
    // ADR-0037: design YAML authors speed in knots and armor/caliber in
    // millimetres (human-friendly, matches DESIGN-22 §1's authored style);
    // the compiled design carries canonical engine units (µm/s, µm) that
    // the tactical classifier and combat layer consume (DESIGN-22 §2).
    normalizedSpeedUms: toSafeIntOpt(
      rec["normalizedSpeedUms"] ?? knotsToUms(validated["speedUms"] as number),
      SafeInt(0),
    ),
    normalizedArmorUm: toSafeIntOpt(
      rec["normalizedArmorUm"] ?? mmToUm(validated["armorBeltUm"] as number),
      SafeInt(0),
    ),
    hitPoints: toSafeIntOpt(validated["hitPoints"], SafeInt(100)),
    mainGunsCaliber: toSafeIntOpt(
      validated["mainGuns"]?.["caliber"] === undefined
        ? undefined
        : mmToUm(validated["mainGuns"]?.["caliber"] as number),
      SafeInt(0),
    ),
    mainGunsCount: toSafeIntOpt(validated["mainGuns"]?.["count"], SafeInt(0)),
    machineryType: validated["machineryType"],
    crewComplement: toSafeIntOpt(validated["crewComplement"], SafeInt(0)),
    contentVersion: toStr(validated["contentVersion"], "0.1.0"),
    compiledHash: computeCompiledDesignHash(designVersionId, validated, torpedoArmament),
    ...(torpedoArmament ? { torpedoArmament } : {}),
  };
}

export function buildDesignsFromData(
  designsData: unknown[],
  collector: DiagnosticCollector,
): Map<string, CompiledDesignVersion> {
  const designs = new Map<string, CompiledDesignVersion>();

  if (!Array.isArray(designsData)) return designs;

  for (const d of designsData) {
    const rec = d as Record<string, unknown>;
    const designVersionId = toStr(rec["designVersionId"], toStr(rec["designId"]));

    const validated = validateAgainstSchema(
      buildRawDesignRecord(rec, designVersionId),
      DesignTemplateSchema,
      "DesignTemplate",
      "designs.yaml",
      collector,
    );
    if (!validated) continue;

    designs.set(designVersionId, buildCompiledDesign(designVersionId, rec, validated));
  }

  return designs;
}

export function buildDesignFamiliesFromData(designsData: unknown[]): Map<string, DesignFamily> {
  const families = new Map<string, DesignFamily>();

  if (!Array.isArray(designsData)) return families;

  // Group by designFamilyId
  const familyMap = new Map<string, { rec: Record<string, unknown>; members: string[] }>();
  for (const d of designsData) {
    const rec = d as Record<string, unknown>;
    const familyId = toStr(rec["designFamilyId"], "");
    if (!familyId) continue;
    const designVersionId = toStr(rec["designVersionId"], toStr(rec["designId"]));

    if (!familyMap.has(familyId)) {
      familyMap.set(familyId, { rec, members: [] });
    }
    if (designVersionId) {
      familyMap.get(familyId)!.members.push(designVersionId);
    }
  }

  for (const [familyId, data] of familyMap) {
    data.members.sort((a, b) => a.localeCompare(b));
    families.set(familyId, {
      designFamilyId: familyId,
      nationId: toStr(data.rec["nationId"], ""),
      rootDesignVersionId: data.members[0] ?? "",
      memberDesignVersionIds: data.members,
      familyCreationMonth: toStr(data.rec["familyCreationMonth"], "1880-01"),
    });
  }

  return families;
}
