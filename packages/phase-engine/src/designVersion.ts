import type { CompiledDesignVersion } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import {
  toEngineDesign,
  type CompiledDesign,
  type DesignDraft,
  type EngineAdapterOptions,
} from "@bluewave/ship-design";

/**
 * Projects a compiled, valid design into the engine's immutable `CompiledDesignVersion` (ADR-0066) and keeps the
 * draft it came from (ADR-0070) so the design can later be revised. Shared by SubmitDesign and ReviseProject.
 */
export function buildDesignVersion(
  compiled: CompiledDesign,
  draft: DesignDraft,
  options: EngineAdapterOptions,
): CompiledDesignVersion {
  const e = toEngineDesign(compiled, draft, options);
  return {
    designVersionId: e.designVersionId,
    designFamilyId: e.designFamilyId,
    className: e.className,
    nationId: e.nationId,
    hullType: e.hullType,
    normalizedDisplacementKg: SafeInt(e.normalizedDisplacementKg),
    normalizedSpeedUms: SafeInt(e.normalizedSpeedUms),
    normalizedArmorUm: SafeInt(e.normalizedArmorUm),
    hitPoints: SafeInt(e.hitPoints),
    mainGunsCaliber: SafeInt(e.mainGunsCaliber),
    mainGunsCount: SafeInt(e.mainGunsCount),
    machineryType: e.machineryType,
    crewComplement: SafeInt(e.crewComplement),
    contentVersion: e.contentVersion,
    compiledHash: e.compiledHash,
    // A copy: the snapshot must not alias the command body (plain JSON, so structuredClone is exact).
    sourceDraft: structuredClone(draft) as unknown as Readonly<Record<string, unknown>>,
    ...(e.torpedoArmament
      ? {
          torpedoArmament: e.torpedoArmament.map((m) => ({
            mountType: m.mountType,
            tubeCount: SafeInt(m.tubeCount),
            torpedoModelId: m.torpedoModelId,
          })),
        }
      : {}),
  };
}
