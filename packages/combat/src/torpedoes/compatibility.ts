//packages/combat/src/torpedoes/compatibility.ts
// DESIGN-40 §4 platform compatibility: a torpedo model may be installed only when
// diameter fits, mass is within launcher + handling limits, propulsion/safety is
// supported, fire control supports the model, platform technology/adoption
// passes, inventory is available, and treaty/scenario restrictions permit. A
// supply or administrative action MUST NOT bypass mechanical compatibility
// (assertMechanicalCompatibility / administrativeInstall fail closed). A newer
// model that exceeds mount mass or handling limits requires a validated refit
// under DESIGN-23 — the refit mechanic is DEFERRED to the supply/DESIGN-23
// track (recorded, not implemented here); the verdict surfaces requiresRefit.
// Pure/deterministic: fixed predicate evaluation, no ambient I/O/clock/random.
import { BluewaveError } from "@bluewave/contracts";
import type { TorpedoLauncherDefinition } from "./launcher.js";
import type { TorpedoModelDefinition } from "./model.js";
import { TORPEDO_MODEL_INCOMPATIBLE } from "./reasonCodes.js";

// The seven §4 compatibility predicates, in DESIGN-40 §4 declaration order.
export type TorpedoCompatibilityPredicate =
  | "diameter"
  | "mass"
  | "propulsionAndSafety"
  | "fireControl"
  | "platformTechnologyAndAdoption"
  | "inventoryAvailable"
  | "treatyOrScenario";

// The mechanical predicates a supply/administrative action can never bypass.
export const MECHANICAL_COMPATIBILITY_PREDICATES: readonly TorpedoCompatibilityPredicate[] = [
  "diameter",
  "mass",
  "propulsionAndSafety",
  "fireControl",
  "platformTechnologyAndAdoption",
];

// Platform-side capability/inventory/adoption surface consulted by §4.
export interface TorpedoPlatformCapabilities {
  technologyPrerequisiteIds: readonly string[]; // technology prerequisites the platform satisfies
  adoptedModelIds: readonly string[]; // torpedo models the platform has adopted
  treatyOrScenarioRestrictedModelIds: readonly string[]; // models restricted by treaty/scenario
  availableInventoryModelIds: readonly string[]; // inventory available for install/load
}

export interface TorpedoCompatibilityVerdict {
  compatible: boolean;
  predicateResults: Record<TorpedoCompatibilityPredicate, boolean>;
  /** DESIGN-23 refit required: a newer/heavier model exceeds mount mass or
   *  handling limits. The refit mechanic is deferred to the supply/DESIGN-23
   *  track (recorded, never fabricated here). */
  requiresRefit: boolean;
}

export function diameterFitsLauncher(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
): boolean {
  return model.diameterMm <= launcher.boreDiameterMm;
}

export function massWithinLimits(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
): boolean {
  return model.massKg <= launcher.handlingMassLimitKg;
}

export function propulsionAndSafetySupported(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
): boolean {
  return (launcher.supportedPropulsionTypes as readonly string[]).includes(model.propulsionType);
}

export function fireControlSupportsModel(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
): boolean {
  return (launcher.fireControlSupportedGuidance as readonly string[]).includes(
    model.guidanceCapability,
  );
}

export function platformTechnologyAndAdoption(
  model: TorpedoModelDefinition,
  platform: TorpedoPlatformCapabilities,
): boolean {
  const techSupported = model.technologyPrerequisiteIds.every((prereq) =>
    (platform.technologyPrerequisiteIds as readonly string[]).includes(prereq),
  );
  const adopted = (platform.adoptedModelIds as readonly string[]).includes(model.torpedoModelId);
  return techSupported && adopted;
}

export function inventoryAvailable(
  model: TorpedoModelDefinition,
  platform: TorpedoPlatformCapabilities,
): boolean {
  return (platform.availableInventoryModelIds as readonly string[]).includes(model.torpedoModelId);
}

export function treatyOrScenarioPermits(
  model: TorpedoModelDefinition,
  platform: TorpedoPlatformCapabilities,
): boolean {
  return !(platform.treatyOrScenarioRestrictedModelIds as readonly string[]).includes(
    model.torpedoModelId,
  );
}

// AC-4: full §4 verdict — every predicate evaluated, compatible = AND of all
// seven; requiresRefit surfaces when the model exceeds mass/handling limits
// (DESIGN-23 refit recorded as deferred).
export function evaluateInstallCompatibility(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
  platform: TorpedoPlatformCapabilities,
): TorpedoCompatibilityVerdict {
  const predicateResults: Record<TorpedoCompatibilityPredicate, boolean> = {
    diameter: diameterFitsLauncher(model, launcher),
    mass: massWithinLimits(model, launcher),
    propulsionAndSafety: propulsionAndSafetySupported(model, launcher),
    fireControl: fireControlSupportsModel(model, launcher),
    platformTechnologyAndAdoption: platformTechnologyAndAdoption(model, platform),
    inventoryAvailable: inventoryAvailable(model, platform),
    treatyOrScenario: treatyOrScenarioPermits(model, platform),
  };
  const compatible = (Object.keys(predicateResults) as TorpedoCompatibilityPredicate[]).every(
    (p) => predicateResults[p],
  );
  return {
    compatible,
    predicateResults,
    requiresRefit: !predicateResults.mass,
  };
}

// AC-4: install-only-when-every-predicate-passes boolean.
export function canInstallTorpedo(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
  platform: TorpedoPlatformCapabilities,
): boolean {
  return evaluateInstallCompatibility(model, launcher, platform).compatible;
}

function incompatible(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
  failing: readonly TorpedoCompatibilityPredicate[],
): never {
  throw new BluewaveError(TORPEDO_MODEL_INCOMPATIBLE, {
    code: TORPEDO_MODEL_INCOMPATIBLE,
    reason: "torpedo model is not mechanically compatible with this launcher",
    modelId: model.torpedoModelId,
    launcherFamilyId: launcher.launcherFamilyId,
    failingPredicates: [...failing],
  });
}

// AC-4: the mechanical-compatibility guard a supply/administrative action MUST
// pass. Mechanical predicates (diameter/mass/propulsion+fire-control/platform
// tech) are never bypassable — inventory and treaty clearance are the only
// predicates a supply/administrative action may legitimately waive. Fails
// closed with TORPEDO_MODEL_INCOMPATIBLE + the failing predicates.
export function assertMechanicalCompatibility(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
  platform: TorpedoPlatformCapabilities,
): void {
  const verdict = evaluateInstallCompatibility(model, launcher, platform);
  const failing = MECHANICAL_COMPATIBILITY_PREDICATES.filter(
    (p) => !verdict.predicateResults[p],
  );
  if (failing.length > 0) incompatible(model, launcher, failing);
}

// AC-4: a supply/administrative action installs a torpedo into a launcher. By
// its nature the action carries inventory + treaty clearance, but it MUST NOT
// bypass mechanical compatibility — the mechanical guard runs first and fails
// closed. Returns the mechanical verdict on success.
export function administrativeInstall(
  model: TorpedoModelDefinition,
  launcher: TorpedoLauncherDefinition,
  platform: TorpedoPlatformCapabilities,
): TorpedoCompatibilityVerdict {
  assertMechanicalCompatibility(model, launcher, platform);
  const mechanical = evaluateInstallCompatibility(model, launcher, platform).predicateResults;
  return {
    compatible: true,
    predicateResults: {
      diameter: mechanical.diameter,
      mass: mechanical.mass,
      propulsionAndSafety: mechanical.propulsionAndSafety,
      fireControl: mechanical.fireControl,
      platformTechnologyAndAdoption: mechanical.platformTechnologyAndAdoption,
      // inventory + treaty are guaranteed by the supply/administrative action;
      // mechanical compatibility is enforced above and never bypassed.
      inventoryAvailable: true,
      treatyOrScenario: true,
    },
    requiresRefit: false,
  };
}