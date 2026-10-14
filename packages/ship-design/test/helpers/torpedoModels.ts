/**
 * Authored torpedo model sources for the ship-part-model tests (ticket 13a).
 *
 * Each authoritative combat `TorpedoModelDefinition` becomes a `TorpedoModelSource` with the
 * content-side facts the engine model does not carry: availability, provenance, and the 1884
 * Whitehead Mk IV re-rating (1877 26 lb / 12 kg → the model's current charge). Availability is
 * the model's introduction year (`docs/research/ship-building-early-band-2.md` §2, `docs/research/
 * c1-m3-torpedoes.md` §3.1, and the model id); the 14-inch Whitehead is the 1880 pattern the
 * content's `torp_whitehead_torpedo` technology introduces, so it is 1880-01 despite its model id.
 */
import { SHIPPED_TORPEDO_MODELS } from "@bluewave/combat";
import type { Provenance } from "@bluewave/content-schema";
import type { TorpedoModelSource } from "../../src/index.js";

const TORPEDO_AVAILABLE_FROM: Readonly<Record<string, string>> = {
  whitehead_14in_1886: "1880-01",
  whitehead_18in_1894: "1894-01",
  rn_21in_mk_iv_1916: "1916-01",
  rn_21in_mk_viii_1927: "1927-01",
  usn_21in_mk14_1931: "1931-01",
  ger_533mm_g7a_1934: "1934-01",
  jpn_61cm_type93_1935: "1935-01",
  ger_533mm_g7e_1936: "1936-01",
};

export const TORPEDO_PROVENANCE: Provenance = {
  sourceStatus: "BALANCE_TARGET",
  confidence: "MEDIUM",
  kind: "game_conversion",
  sources: [
    {
      title: "Ship-building catalogue — EARLY band (1880–1899), second pass",
      section: "§2 14-inch Whitehead torpedo and its launching gear",
      archiveOrUrl: "docs/research/ship-building-early-band-2.md",
    },
    {
      title: "Torpedo model research (c1-m3)",
      section: "§3.1 Torpedo model table (1880–1945)",
      archiveOrUrl: "docs/research/c1-m3-torpedoes.md",
    },
  ],
  note: "Mirrors the shipped combat torpedo_models_v1 constants; values grounded in the cited research.",
};

export const WHITEHEAD_1884_RE_RATING: Provenance = {
  sourceStatus: "VERIFIED",
  confidence: "MEDIUM",
  kind: "historical_fact",
  sources: [
    {
      title: "Ship-building catalogue — EARLY band (1880–1899), second pass",
      section: "§2 (1877 14-in 26 lb → 1884 Mk IV 58–70 lb)",
      archiveOrUrl: "docs/research/ship-building-early-band-2.md",
    },
  ],
  note: "The 1877 14-inch Whitehead carried a 26 lb (12 kg) wet-guncotton charge; the 1884 Mk IV re-rated it to the 58–70 lb (26–27 kg) charge the shipped model carries.",
};

const toTorpedoSource = (model: (typeof SHIPPED_TORPEDO_MODELS)[number]): TorpedoModelSource => {
  const id = String(model.torpedoModelId);
  const availableFrom = TORPEDO_AVAILABLE_FROM[id];
  if (availableFrom === undefined) {
    throw new Error(`No authored availability for torpedo model '${id}'.`);
  }
  return {
    torpedoModelId: id,
    diameterMm: model.diameterMm,
    massKg: model.massKg,
    warheadType: model.warheadType,
    warheadExplosiveMassKg: model.warheadExplosiveMassKg,
    warheadExplosiveEquivalentMassKg: model.warheadExplosiveEquivalentMassKg,
    propulsionType: model.propulsionType,
    orderedSettings: model.orderedSettings.map((s) => ({
      settingId: s.settingId,
      speedKnotsBp: s.speedKnotsBp,
      rangeM: s.rangeM,
    })),
    minimumArmingDistanceM: model.minimumArmingDistanceM,
    reliabilityBp: model.reliabilityBp,
    guidanceCapability: model.guidanceCapability,
    compatibleLauncherFamilyIds: [...model.compatibleLauncherFamilyIds],
    tubeHitHazardPolicyId: model.tubeHitHazardPolicyId,
    oxygenState:
      model.oxygenState === null
        ? null
        : { wakeVisibilityModifierBp: model.oxygenState.wakeVisibilityModifierBp },
    availableFrom,
    provenance: TORPEDO_PROVENANCE,
    sourceFile: "ship-building/parts/torpedo.yaml",
    ...(id === "whitehead_14in_1886"
      ? {
          warheadFirstPattern: {
            explosiveMassKg: 12,
            explosiveEquivalentMassKg: 12,
            from: "1884-01",
            provenance: WHITEHEAD_1884_RE_RATING,
          },
        }
      : {}),
  };
};

/** Every torpedo model the buildable catalogue references. */
export const torpedoModels: readonly TorpedoModelSource[] = SHIPPED_TORPEDO_MODELS.map(
  toTorpedoSource,
).sort((a, b) =>
  a.torpedoModelId < b.torpedoModelId ? -1 : a.torpedoModelId > b.torpedoModelId ? 1 : 0,
);
