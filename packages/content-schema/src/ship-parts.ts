import { Schema } from "effect";

import { TORPEDO_MOUNT_TYPE_VALUES } from "./design.js";
import { ProvenanceSchema } from "./provenance.js";
import {
  ARMOUR_REGION_IDS,
  DesignRequirementSchema,
  HullSpecSchema,
  MOUNT_SIDES,
} from "./reference-design.js";
import { SHIP_ZONE_IDS } from "./ship-component.js";

/**
 * The ship part model (ship-part-model spec SPM-R1–R7; proposal rev 4.1 §3, §8.1).
 * Ship parts are one catalogue of self-contained **part** records, each of one closed
 * **part family**, providing one **interface** from `interfaces/1`. **Platforms** declare
 * **slots** (directly or through shared **slot templates**); a design is a **loadout** of
 * entries that fill slots, each with an explicit `mountCount`.
 *
 * Every vocabulary here is closed and decoded strictly (`onExcessProperty: "error"`,
 * ADR-0105): an unknown interface, constraint key, application basis, legacy-exception
 * code or visual-trait field fails decoding instead of being dropped. Migration-only
 * aliases (`PER_FIT`, `PER_MOUNT`, `barrels`, `tubes`) are accepted by no schema here
 * (invariant I-20). Structural authority only: references, flattening of `extends`,
 * revision ordering and fit validation are compiler stages.
 *
 * The per-family `spec` shapes carry the fields that the read path (tickets 03–05) reads
 * from today's catalogues. A field gains a place here only when a reader needs it; adding
 * an optional field is additive, while the closed-vocabulary rules never loosen.
 */

/** `interfaces/1` (D15): exact, case-sensitive, no wildcard. Semantics in proposal §8.1. */
export const PART_INTERFACES = [
  "gun",
  "gun_mount",
  "ammunition",
  "torpedo",
  "torpedo_launcher",
  "propulsion_plant",
  "armour_material",
  "sensor",
  "magazine",
  "funnel",
  "electrical_plant",
  "accommodation",
  "damage_control",
  "ventilation",
] as const;

/** The closed part families; each fixes its `spec` shape. */
export const PART_FAMILIES = [
  "gun",
  "gun_mount",
  "ammunition",
  "torpedo_launcher",
  "torpedo",
  "propulsion_plant",
  "armour_material",
  "sensor",
  "fitting",
] as const;

/** How a quantity component scales (D3, §3.8). Closed at three values. */
export const APPLICATION_BASES = [
  "PER_LOADOUT_ENTRY",
  "PER_PART_UNIT",
  "PER_CONTAINED_UNIT",
] as const;

/**
 * The quantity kinds a part's accounting `quantities` may carry (SPM-R5). A kind names a
 * unit and a magnitude and nothing else; the field that holds the quantity gives it meaning.
 */
export const ACCOUNTING_QUANTITY_KINDS = [
  "massKg",
  "costMicro",
  "crew",
  "volumeLitre",
  "deckFootprintMm2",
] as const;

/**
 * Every reusable quantity kind (SPM-R5, extended by ticket 11b): the accounting kinds plus
 * `lengthMm` and `powerKw`. Length and power are not accounting lines: they live in the
 * `engineering` block, where the containing field says what they mean (a generation is not a
 * consumption). A new kind needs a quantity that more than one field reuses.
 */
export const QUANTITY_KINDS = [...ACCOUNTING_QUANTITY_KINDS, "lengthMm", "powerKw"] as const;

/** The unit each quantity kind is expressed in. Documentation and a test target, not logic. */
export const QUANTITY_KIND_UNITS = {
  massKg: "kg",
  costMicro: "micro-currency",
  crew: "persons",
  volumeLitre: "L",
  deckFootprintMm2: "mm2",
  lengthMm: "mm",
  powerKw: "kW",
} as const satisfies Record<(typeof QUANTITY_KINDS)[number], string>;

/** The closed set of migration-only data-quality waivers (§9.4, D14/D19). */
export const LEGACY_EXCEPTION_CODES = ["DQ-TORPEDO-001"] as const;

/** The one slot constraint a legacy exception may waive. */
export const WAIVABLE_CONSTRAINTS = ["diameterUmEqualsBore"] as const;

/** Gun mount installation types. The torpedo-tube values of the legacy enum are not mount types. */
export const GUN_MOUNT_TYPES = [
  "TURRET",
  "BARBETTE",
  "CASEMATE",
  "DECK_SHIELDED",
  "DECK_OPEN",
  "BROADSIDE_BATTERY",
] as const;

export type PartInterface = (typeof PART_INTERFACES)[number];
export type PartFamily = (typeof PART_FAMILIES)[number];
export type ApplicationBasis = (typeof APPLICATION_BASES)[number];
export type QuantityKind = (typeof QUANTITY_KINDS)[number];
export type LegacyExceptionCode = (typeof LEGACY_EXCEPTION_CODES)[number];

const int = Schema.Finite.check(Schema.isInt());
const nonNegativeInt = Schema.Finite.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
const positiveInt = Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0));
const bp = Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_000 }));
const permille = Schema.Finite.check(
  Schema.isInt(),
  Schema.isBetween({ minimum: 0, maximum: 1000 }),
);
const degrees = Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 360 }));
const signedDegrees = Schema.Finite.check(
  Schema.isInt(),
  Schema.isBetween({ minimum: -90, maximum: 90 }),
);
const month = Schema.String.check(
  Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "must be YYYY-MM" }),
);
const stableId = Schema.String.check(
  Schema.isPattern(/^[a-z][a-z0-9_]*$/, { message: "must be lower snake_case" }),
);
/** Slot ids may be dotted (`armour.belt_main`, `magazine.fwd`). */
const slotId = Schema.String.check(
  Schema.isPattern(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, {
    message: "must be lower snake_case, optionally dotted",
  }),
);
/** Parameter names are unit-suffixed field names (`installedKw`, `thicknessUm`). */
const parameterName = Schema.String.check(
  Schema.isPattern(/^[a-z][A-Za-z0-9_]*$/, { message: "must be a lowerCamel field name" }),
);
const nonEmptyArray = <S extends Schema.Top>(item: S) =>
  Schema.Array(item).check(Schema.isMinLength(1));

const InterfaceSchema = Schema.Literals(PART_INTERFACES);

const RangeSchema = Schema.Struct({ min: nonNegativeInt, max: nonNegativeInt }).check(
  Schema.makeFilter((r) => (r.min <= r.max ? undefined : "min must be <= max")),
);

/** An installable unit range: positive counts, stepped (ticket 11b). */
const UnitRangeSchema = Schema.Struct({
  min: positiveInt,
  max: positiveInt,
  step: positiveInt,
}).check(Schema.makeFilter((r) => (r.min <= r.max ? undefined : "min must be <= max")));

const ParameterRangeSchema = Schema.Struct({
  min: int,
  max: int,
  step: int.check(Schema.isGreaterThanOrEqualTo(1)),
}).check(Schema.makeFilter((r) => (r.min <= r.max ? undefined : "min must be <= max")));

// ---------------------------------------------------------------------------
// Lifecycle, quantities, legacy exceptions, visual block
// ---------------------------------------------------------------------------

/** One way to write time and technology for every family (story 7, §5). */
export const PartLifecycleSchema = Schema.Struct({
  /** Inclusive. */
  availableFrom: month,
  /** Exclusive; `null` or absent = still available. */
  availableUntil: Schema.optional(Schema.NullOr(month)),
  /** Technology ids. */
  requires: Schema.optional(Schema.Array(stableId)),
  /** Part ids this part succeeds. Informational: never implies refit compatibility (I-7). */
  supersedes: Schema.optional(Schema.Array(stableId)),
}).check(
  Schema.makeFilter((l) =>
    l.availableUntil === undefined ||
    l.availableUntil === null ||
    l.availableUntil > l.availableFrom
      ? undefined
      : "availableUntil must be after availableFrom",
  ),
);

/** A quantity component with its required application basis (S1, S6, I-18). */
export const QuantityComponentSchema = Schema.Struct({
  id: stableId,
  kind: Schema.Literals(ACCOUNTING_QUANTITY_KINDS),
  value: nonNegativeInt,
  basis: Schema.Literals(APPLICATION_BASES),
});

/** A whole millimetre length: the `lengthMm` quantity kind as a scalar (ticket 11b). */
export const LengthMmSchema = nonNegativeInt;

/**
 * A power component: the `powerKw` quantity kind with its application basis. It says how much
 * power, not whether the part makes or uses it; `engineering.power.generation`,
 * `engineering.power.consumption` and `engineering.cooling.*` give it that meaning.
 */
export const PowerComponentSchema = Schema.Struct({
  id: stableId,
  kind: Schema.Literal("powerKw"),
  value: nonNegativeInt,
  basis: Schema.Literals(APPLICATION_BASES),
});

const uniqueIds = (list: ReadonlyArray<{ readonly id: string }>) =>
  new Set(list.map((c) => c.id)).size === list.length ? undefined : "component ids must be unique";

const PowerComponentList = nonEmptyArray(PowerComponentSchema).check(
  Schema.makeFilter((list) => uniqueIds(list)),
);

/**
 * The part-local reference datums for a centre of gravity. `PART_BASE` is the only one:
 * +z is up; zero is the plane the part stands on (its mounting face), at the part's own
 * installed position; `zMm` is the height of the centre of gravity above it. The loadout
 * stage owns the transformation to ship coordinates (height above the keel baseline): ship z
 * is the mounting-plane height of the entry's slot plus `zMm`. No slot declares a mounting
 * plane yet, so the plane is the keel baseline and the transformation is the identity
 * (ADR-0154 §19).
 */
export const PART_LOCAL_DATUMS = ["PART_BASE"] as const;

/** Physical extent and mass distribution of one installed unit (ticket 11b). */
export const PhysicalEngineeringSchema = Schema.Struct({
  /** Height of the unit's envelope above the `PART_BASE` plane, mm. */
  envelopeHeightMm: LengthMmSchema,
  centreOfGravity: Schema.Struct({
    zMm: LengthMmSchema,
    datum: Schema.Literals(PART_LOCAL_DATUMS),
  }),
});

/**
 * Electrical power, with the direction in the field name: a part that generates lists its
 * output under `generation`, one that draws lists its draw under `consumption`. Values are
 * non-negative; direction is never a sign. A part with no electrical effect declares neither.
 */
export const PowerEngineeringSchema = Schema.Struct({
  generation: Schema.optional(PowerComponentList),
  consumption: Schema.optional(PowerComponentList),
}).check(
  Schema.makeFilter((p) =>
    p.generation !== undefined || p.consumption !== undefined
      ? undefined
      : "declare generation or consumption, or omit power",
  ),
);

/** Heat removal: what a part adds to the cooling load, and what a part supplies (kW of duty). */
export const CoolingEngineeringSchema = Schema.Struct({
  demand: Schema.optional(PowerComponentList),
  supply: Schema.optional(PowerComponentList),
}).check(
  Schema.makeFilter((c) =>
    c.demand !== undefined || c.supply !== undefined
      ? undefined
      : "declare demand or supply, or omit cooling",
  ),
);

/** Monthly upkeep as basis points of the part's cost. */
export const MaintenanceEngineeringSchema = Schema.Struct({ monthlyBpOfCost: bp });

/** Typed engineering data of one part. Every sub-block is optional and means one thing. */
export const EngineeringSchema = Schema.Struct({
  physical: Schema.optional(PhysicalEngineeringSchema),
  power: Schema.optional(PowerEngineeringSchema),
  cooling: Schema.optional(CoolingEngineeringSchema),
  maintenance: Schema.optional(MaintenanceEngineeringSchema),
});

// ---------------------------------------------------------------------------
// Capabilities and metadata (ticket 11b)
// ---------------------------------------------------------------------------

/** Fire-control classes a weapon needs and a director or rangefinder supports. */
export const FIRE_CONTROL_CLASSES = ["heavy", "medium", "light"] as const;

/** The closed capability kinds; each fixes its payload. One entry per kind unless stated. */
export const CAPABILITY_KINDS = [
  "ammunition_feed",
  "arc_obstruction",
  "damage_control",
  "fire_control_class",
  "fire_control_support",
] as const;

const FireControlClass = Schema.Literals(FIRE_CONTROL_CLASSES);

/**
 * Behaviour-bearing properties, as a discriminated union on `kind`. A capability is added
 * only for a property that real source data carries and an inverse reader consumes. Each kind
 * may appear once per part (no capability has a defined multiplicity).
 */
export const CapabilitySchema = Schema.Union([
  /** The fire-control class a weapon requires. */
  Schema.Struct({ kind: Schema.Literal("fire_control_class"), class: FireControlClass }),
  /** The fire-control classes a director or rangefinder can serve. */
  Schema.Struct({
    kind: Schema.Literal("fire_control_support"),
    classes: nonEmptyArray(FireControlClass).check(
      Schema.makeFilter((c) => (new Set(c).size === c.length ? undefined : "classes must differ")),
    ),
  }),
  /** The share of the magazine's feed a weapon can draw at once. */
  Schema.Struct({ kind: Schema.Literal("ammunition_feed"), maxFeedPermille: permille }),
  /** A structure that blocks arcs of fire: the blocked sector and how far its shadow reaches. */
  Schema.Struct({
    kind: Schema.Literal("arc_obstruction"),
    blockedDeg: Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 360 })),
    reachPermille: permille,
  }),
  /** Damage-control effect, basis points. */
  Schema.Struct({ kind: Schema.Literal("damage_control"), effectBp: bp }),
]);

/** The capabilities of one part: kinds are unique, and sorted so the record is canonical. */
export const CapabilitiesSchema = Schema.Array(CapabilitySchema).check(
  Schema.isMinLength(1),
  Schema.makeFilter((list) => {
    const kinds = list.map((c) => c.kind);
    if (new Set(kinds).size !== kinds.length) return "capability kinds must be unique";
    const sorted = [...kinds].sort();
    return kinds.every((k, i) => k === sorted[i])
      ? undefined
      : "capabilities must be sorted by kind";
  }),
);

/**
 * The closed tag vocabulary: discovery, grouping and presentation only. No fit rule, derived
 * metric, cost rule or combat behaviour branches on a tag; behaviour is an interface, a spec
 * field or a capability. Sorted codepoint order, the canonical serialization.
 */
export const PART_TAGS = [
  "accommodation",
  "damage_control",
  "electrical",
  "fire_control",
  "funnel",
  "gun",
  "heavy",
  "light",
  "magazine",
  "medium",
  "smoothbore",
  "torpedo",
  "ventilation",
] as const;

export type PartTag = (typeof PART_TAGS)[number];

/** Presentation data. `displayName` is the catalogue label; `name` stays the designation. */
export const PartMetadataSchema = Schema.Struct({
  displayName: Schema.optional(Schema.NonEmptyString),
  tags: Schema.optional(
    Schema.Array(Schema.Literals(PART_TAGS)).check(
      Schema.isMinLength(1),
      Schema.makeFilter((tags) => {
        for (let i = 1; i < tags.length; i++) {
          const a = tags[i - 1]!;
          const b = tags[i]!;
          if (a === b) return `duplicate tag '${b}'`;
          if (a > b) return "tags must be sorted in codepoint order";
        }
        return undefined;
      }),
    ),
  ),
});

/** A record-scoped data-quality waiver: one constraint, one counterpart part (I-22). */
export const LegacyExceptionSchema = Schema.Struct({
  code: Schema.Literals(LEGACY_EXCEPTION_CODES),
  waives: Schema.Literals(WAIVABLE_CONSTRAINTS),
  forPart: stableId,
  note: Schema.NonEmptyString,
});

/**
 * Rendering-only metadata (I-14). `visual-traits/1` (D16) is not approved, so `traits`
 * admits no key yet: any trait field fails decoding rather than being dropped. The
 * approved trait set is added here by ship-part-model ticket 16.
 */
export const PartVisualSchema = Schema.Struct({
  // An empty `Struct({})` would accept and keep any key even under strict decode, so
  // the empty vocabulary is a record whose every value fails, reported at its path.
  traits: Schema.optional(Schema.Record(Schema.String, Schema.Never)),
  override: Schema.optional(stableId),
});

// ---------------------------------------------------------------------------
// Slots, slot templates, platforms
// ---------------------------------------------------------------------------

/** The closed slot-constraint vocabulary (I-9). Calibre is whole inches. */
export const SlotConstraintsSchema = Schema.Struct({
  calibreInchesMin: Schema.optional(nonNegativeInt),
  calibreInchesMax: Schema.optional(nonNegativeInt),
  mountTypes: Schema.optional(nonEmptyArray(Schema.Literals(GUN_MOUNT_TYPES))),
  gunsPerMount: Schema.optional(nonEmptyArray(positiveInt)),
  diameterUmMin: Schema.optional(nonNegativeInt),
  diameterUmMax: Schema.optional(nonNegativeInt),
  diameterUmEqualsBore: Schema.optional(Schema.Literal(true)),
  launchTypes: Schema.optional(nonEmptyArray(Schema.Literals(TORPEDO_MOUNT_TYPE_VALUES))),
  massKgMax: Schema.optional(nonNegativeInt),
});

/**
 * A named mount point or armour region. Either a full definition (`accepts` …) or a
 * mirror of a sibling slot (`{ id, mirrors }` and nothing else). A part's own slot with
 * no `mountCount` takes its count from the part (a gun mount's `guns` slot holds
 * `gunsPerMount`).
 */
export const SlotSchema = Schema.Struct({
  id: slotId,
  accepts: Schema.optional(nonEmptyArray(InterfaceSchema)),
  mountCount: Schema.optional(RangeSchema),
  zone: Schema.optional(Schema.Literals(SHIP_ZONE_IDS)),
  region: Schema.optional(Schema.Literals(ARMOUR_REGION_IDS)),
  stationPermille: Schema.optional(
    Schema.Struct({ from: permille, to: permille }).check(
      Schema.makeFilter((r) => (r.from <= r.to ? undefined : "from must be <= to")),
    ),
  ),
  side: Schema.optional(Schema.Literals(MOUNT_SIDES)),
  arcDeg: Schema.optional(Schema.Struct({ centre: degrees, width: degrees })),
  constraints: Schema.optional(SlotConstraintsSchema),
  sameParts: Schema.optional(Schema.Boolean),
  mirrors: Schema.optional(slotId),
}).check(
  Schema.makeFilter((s) => {
    if (s.mirrors === undefined) {
      return s.accepts === undefined ? "a slot must declare accepts or mirrors" : undefined;
    }
    return Object.keys(s).every((key) => key === "id" || key === "mirrors")
      ? undefined
      : "a mirroring slot declares only id and mirrors";
  }),
);

/** A shared, named set of slots that platforms reuse. */
export const SlotTemplateSchema = Schema.Struct({
  id: stableId,
  slots: nonEmptyArray(SlotSchema),
  provenance: Schema.optional(ProvenanceSchema),
});

/**
 * When a platform may be built (ship-part-model ticket 11a). `availableFrom` is inclusive,
 * `availableUntil` exclusive and nullable, like a part's lifecycle. An absent window means
 * always available, which keeps every platform written before the window existed valid.
 */
export const PlatformLifecycleSchema = Schema.Struct({
  availableFrom: month,
  availableUntil: Schema.optional(Schema.NullOr(month)),
}).check(
  Schema.makeFilter((l) =>
    l.availableUntil === undefined ||
    l.availableUntil === null ||
    l.availableUntil > l.availableFrom
      ? undefined
      : "availableUntil must be after availableFrom",
  ),
);

/** A hull form as the root assembly: its slots come from templates plus its own. */
export const PlatformSchema = Schema.Struct({
  id: stableId,
  hullForm: stableId,
  lifecycle: Schema.optional(PlatformLifecycleSchema),
  slotTemplates: Schema.Array(stableId),
  slots: Schema.optional(Schema.Array(SlotSchema)),
  provenance: Schema.optional(ProvenanceSchema),
}).check(
  Schema.makeFilter((p) =>
    p.slotTemplates.length > 0 || (p.slots?.length ?? 0) > 0
      ? undefined
      : "a platform declares at least one slot template or slot",
  ),
);

// ---------------------------------------------------------------------------
// Family specs
// ---------------------------------------------------------------------------

/** The legacy weapon categories a gun family is filed under (ticket 11b). */
export const GUN_WEAPON_CATEGORIES = [
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "AA_WEAPON",
] as const;

const GunSpecFields = {
  /**
   * The shared gun family this model belongs to: the id a design placement and an ammunition
   * pattern's compatibility list name. Every model of one family states the same id.
   */
  gunFamily: Schema.optional(stableId),
  /** The family's weapon category. Stated by the family's standard model. */
  weaponCategory: Schema.optional(Schema.Literals(GUN_WEAPON_CATEGORIES)),
  /**
   * The mount types this model may be installed in, in preference order: the first is the type
   * a design gets (the mount type is never chosen). Codepoint-unique.
   */
  supportedMountTypes: Schema.optional(
    nonEmptyArray(Schema.Literals(GUN_MOUNT_TYPES)).check(
      Schema.makeFilter((t) =>
        new Set(t).size === t.length ? undefined : "mount types must differ",
      ),
    ),
  ),
  /**
   * True when this model is first-class armament content: its nation resolves weapons through
   * the armament resolver. Absent: a catalogue model that supplies a national label and
   * compatibility values only.
   */
  firstClassArmament: Schema.optional(Schema.Literal(true)),
  /** Nominal horizontal firing arc when installed in the family's standard mount, degrees. */
  beamArcDeg: Schema.optional(degrees),
  calibreUm: positiveInt,
  barrelLengthCalibers: Schema.optional(Schema.Finite.check(Schema.isGreaterThan(0))),
  gunMassKg: Schema.optional(nonNegativeInt),
  loadingSystem: Schema.optional(Schema.NonEmptyString),
  nominalMuzzleVelocityUmPerSec: Schema.optional(positiveInt),
  mechanicalRateOfFireRoundsPerMinuteX100: Schema.optional(positiveInt),
  propellantChargeBp: Schema.optional(nonNegativeInt),
  shellMassG: Schema.optional(nonNegativeInt),
  roundVolumeMl: Schema.optional(nonNegativeInt),
  reliabilityBp: Schema.optional(bp),
};

const GunMountSpecFields = {
  mountType: Schema.Literals(GUN_MOUNT_TYPES),
  /** Guns in one mount. Total guns = `mountCount × gunsPerMount` (D2). */
  gunsPerMount: positiveInt,
  /** The gun families this mount takes. Absent: the mount names no family. */
  compatibleGunFamilies: Schema.optional(nonEmptyArray(stableId)),
  /**
   * The mount identity the compiled weapon contract reports when it is not the part id: parts
   * that differ only in `gunsPerMount` share one contract identity (ticket 11b, ADR-0154 §19).
   */
  compiledMountId: Schema.optional(stableId),
  hullSpaceUsageLitre: Schema.optional(nonNegativeInt),
  topWeightKg: Schema.optional(nonNegativeInt),
  supportedArmorMm: Schema.optional(nonNegativeInt),
  traverseDeg: Schema.optional(degrees),
  elevationMinDeg: Schema.optional(signedDegrees),
  elevationMaxDeg: Schema.optional(signedDegrees),
  firingArcDeg: Schema.optional(degrees),
  rateOfFireModifierBp: Schema.optional(nonNegativeInt),
  ammunitionHandlingModifierBp: Schema.optional(nonNegativeInt),
  crewProtection: Schema.optional(Schema.NonEmptyString),
  stabilityContributionKgM: Schema.optional(int),
  vulnerability: Schema.optional(Schema.NonEmptyString),
};

const AmmunitionSpecFields = {
  shellType: Schema.Literals(["AP", "APC", "CPC", "SAP", "HE", "MELINITE"]),
  /** Gun families and gun models this pattern fits; absent on both: no stated compatibility. */
  compatibleGunFamilies: Schema.optional(nonEmptyArray(stableId)),
  compatibleGunModels: Schema.optional(nonEmptyArray(stableId)),
  shellMassG: Schema.optional(nonNegativeInt),
  propellantInteractionBp: Schema.optional(nonNegativeInt),
  penetrationBiasBp: Schema.optional(bp),
  explosiveFillerG: Schema.optional(nonNegativeInt),
  burstingEffectBp: Schema.optional(nonNegativeInt),
  fireEffectBp: Schema.optional(nonNegativeInt),
  storageHazard: Schema.optional(Schema.NonEmptyString),
  rateOfFireModifierBp: Schema.optional(nonNegativeInt),
};

const TorpedoSpecFields = {
  diameterUm: positiveInt,
  massKg: positiveInt,
  warheadKg: nonNegativeInt,
  speedSettingsMilliKnots: nonEmptyArray(positiveInt),
  reliabilityBp: Schema.optional(bp),
};

const TorpedoLauncherSpecFields = {
  launchType: Schema.Literals(TORPEDO_MOUNT_TYPE_VALUES),
  /** The torpedo model the launcher is built to fire (combat's torpedo model id). */
  loadsTorpedo: Schema.optional(stableId),
  /** Structured bore; never derived from a display label (I-25). */
  boreDiameterUm: positiveInt,
  reloadsPerTube: Schema.optional(nonNegativeInt),
};

const PropulsionPlantSpecFields = {
  fuelType: Schema.Literals(["COAL", "OIL", "MIXED"]),
  weightMilliKgPerKw: positiveInt,
  volumeLitrePerKw: positiveInt,
  sfcGramPerKwh: Schema.Struct({
    points: Schema.Array(Schema.Tuple([int, int])).check(Schema.isMinLength(1)),
  }),
  reliabilityBp: bp,
};

const ArmourMaterialSpecFields = {
  efficiencyBp: positiveInt,
};

const SensorSpecFields = {
  accuracyBonusBp: Schema.optional(bp),
  gunCapacity: Schema.optional(positiveInt),
};

const FittingSpecFields = {
  magazineLitre: Schema.optional(nonNegativeInt),
  flashProtectionBp: Schema.optional(bp),
  critical: Schema.optional(Schema.Boolean),
};

/** Which interfaces each family may provide; `fitting` covers the ship-system interfaces. */
const FAMILY_INTERFACES = {
  gun: ["gun"],
  gun_mount: ["gun_mount"],
  ammunition: ["ammunition"],
  torpedo_launcher: ["torpedo_launcher"],
  torpedo: ["torpedo"],
  propulsion_plant: ["propulsion_plant"],
  armour_material: ["armour_material"],
  sensor: ["sensor"],
  fitting: [
    "magazine",
    "funnel",
    "electrical_plant",
    "accommodation",
    "damage_control",
    "ventilation",
  ],
} as const satisfies Record<PartFamily, readonly PartInterface[]>;

type OptionalFields<F extends Schema.Struct.Fields> = {
  readonly [K in keyof F]: Schema.optionalKey<F[K]>;
};

/** Every field optional, for a revision's spec delta (no `Struct` import: runtime-free). */
function optionalFields<F extends Schema.Struct.Fields>(fields: F): OptionalFields<F> {
  const out: Partial<Record<keyof F, Schema.Top>> = {};
  for (const key of Object.keys(fields) as Array<keyof F>) {
    out[key] = Schema.optionalKey(fields[key]);
  }
  return out as OptionalFields<F>;
}

/** A dated re-rating of the same part: a `spec` delta with its own provenance (D-R4). */
function revisionSchema<S extends Schema.Top>(specDelta: S) {
  return Schema.Struct({
    from: month,
    spec: specDelta,
    requires: Schema.optional(Schema.Array(stableId)),
    provenance: ProvenanceSchema,
  });
}

/** The spec fields a standalone part must write: every field not marked optional. */
function requiredKeys(fields: Schema.Struct.Fields): readonly string[] {
  return Object.keys(fields).filter((key) => fields[key]?.ast.context?.isOptional !== true);
}

/**
 * `DQ-TORPEDO-001` waives a launcher's `diameterUmEqualsBore`, so a legacy exception is
 * admissible on a `torpedo_launcher` record only (SPM-R7, ADR-0154 §10). On any other
 * family it fails decoding at `legacyExceptions`.
 */
function legacyExceptionsOnLauncherOnly(part: {
  readonly family: PartFamily;
  readonly legacyExceptions?: ReadonlyArray<unknown> | undefined;
}) {
  return part.legacyExceptions === undefined || part.family === "torpedo_launcher"
    ? undefined
    : {
        path: ["legacyExceptions"],
        issue: "a legacy exception is admissible on a torpedo_launcher record only",
      };
}

/** The envelope fields shared by the authored and the flattened part of one family. */
function envelopeFields<const F extends PartFamily>(family: F) {
  return {
    id: stableId,
    family: Schema.Literal(family),
    provides: Schema.Literals(FAMILY_INTERFACES[family]),
    name: Schema.NonEmptyString,
    nation: Schema.optional(stableId),
    lifecycle: PartLifecycleSchema,
    parameters: Schema.optional(Schema.Record(parameterName, ParameterRangeSchema)),
    slots: Schema.optional(Schema.Array(SlotSchema)),
    legacyExceptions: Schema.optional(Schema.Array(LegacyExceptionSchema)),
    visual: Schema.optional(PartVisualSchema),
    /** Units one loadout entry of this part may install (a gun's barrels, a launcher's tubes). */
    entryUnits: Schema.optional(UnitRangeSchema),
    engineering: Schema.optional(EngineeringSchema),
    capabilities: Schema.optional(CapabilitiesSchema),
    metadata: Schema.optional(PartMetadataSchema),
    provenance: ProvenanceSchema,
  };
}

/**
 * One family member of the part union. The envelope is shared; `family`, the allowed
 * `provides` values, `spec` and the revision delta (every spec field optional) vary.
 *
 * A **variant** (`extends` present) writes `spec` as a delta over its prototype, so
 * every spec field is optional at decode. A standalone part must write every required
 * spec field; a missing one is reported at `spec.<field>`. The flatten stage decodes
 * the merged result through `FlattenedPartSchema`, which requires the full spec.
 */
function partMember<const F extends PartFamily, const SpecFields extends Schema.Struct.Fields>(
  family: F,
  specFields: SpecFields,
) {
  const delta = Schema.Struct(optionalFields(specFields));
  const required = requiredKeys(specFields);
  return Schema.Struct({
    ...envelopeFields(family),
    extends: Schema.optional(stableId),
    spec: delta,
    quantities: Schema.optional(Schema.Array(QuantityComponentSchema)),
    revisions: Schema.optional(Schema.Array(revisionSchema(delta))),
  }).check(
    Schema.makeFilter((part) => {
      const misplaced = legacyExceptionsOnLauncherOnly(part);
      if (part.extends !== undefined) return misplaced;
      const missing = required.filter((key) => !Object.hasOwn(part.spec, key));
      return [
        ...missing.map((key) => ({ path: ["spec", key], issue: "Missing key" })),
        ...(misplaced === undefined ? [] : [misplaced]),
      ];
    }),
  );
}

/**
 * A ship part (SPM-R1): a discriminated union on `family`. An unknown family, an
 * interface outside `interfaces/1` or one the family may not provide, and any unknown
 * field fail decoding.
 */
export const PartSchema = Schema.Union([
  partMember("gun", GunSpecFields),
  partMember("gun_mount", GunMountSpecFields),
  partMember("ammunition", AmmunitionSpecFields),
  partMember("torpedo_launcher", TorpedoLauncherSpecFields),
  partMember("torpedo", TorpedoSpecFields),
  partMember("propulsion_plant", PropulsionPlantSpecFields),
  partMember("armour_material", ArmourMaterialSpecFields),
  partMember("sensor", SensorSpecFields),
  partMember("fitting", FittingSpecFields),
]).annotate({
  // A union failure with no matching member is reported at the record root: a pre-union
  // `family` gate would need SchemaTransformation, which this runtime-free package may not import.
  message: `expected a part record whose family is one of ${PART_FAMILIES.join(", ")}`,
});

// ---------------------------------------------------------------------------
// Flattened parts and the part index (SPM-R10, SPM-R11, SPM-R14)
// ---------------------------------------------------------------------------

/**
 * Where a flattened part's values came from (ADR-0147, I-12): the file that declares
 * it and, for a variant, the prototype it inherits from with the spec fields and
 * quantity components it took unchanged from the prototype's **base** spec (the
 * prototype's revisions are never inherited; ADR-0154 §14).
 */
export const PartOriginSchema = Schema.Struct({
  sourceFile: Schema.NonEmptyString,
  prototype: Schema.optional(
    Schema.Struct({
      id: stableId,
      sourceFile: Schema.NonEmptyString,
      inheritedSpec: Schema.Array(Schema.NonEmptyString),
      inheritedQuantities: Schema.Array(stableId),
    }),
  ),
});

/**
 * One family member of the flattened union: no `extends` (I-3), the full spec, the
 * quantity components after inheritance, and the revisions sorted by `from`.
 */
function flattenedMember<const F extends PartFamily, const SpecFields extends Schema.Struct.Fields>(
  family: F,
  specFields: SpecFields,
) {
  return Schema.Struct({
    ...envelopeFields(family),
    spec: Schema.Struct(specFields),
    quantities: Schema.Array(QuantityComponentSchema),
    revisions: Schema.Array(revisionSchema(Schema.Struct(optionalFields(specFields)))),
    origin: PartOriginSchema,
  }).check(Schema.makeFilter(legacyExceptionsOnLauncherOnly));
}

/** A part after the flatten stage: what the content artifact carries. */
export const FlattenedPartSchema = Schema.Union([
  flattenedMember("gun", GunSpecFields),
  flattenedMember("gun_mount", GunMountSpecFields),
  flattenedMember("ammunition", AmmunitionSpecFields),
  flattenedMember("torpedo_launcher", TorpedoLauncherSpecFields),
  flattenedMember("torpedo", TorpedoSpecFields),
  flattenedMember("propulsion_plant", PropulsionPlantSpecFields),
  flattenedMember("armour_material", ArmourMaterialSpecFields),
  flattenedMember("sensor", SensorSpecFields),
  flattenedMember("fitting", FittingSpecFields),
]);

/** One part's place in the lineage graph; every list is id-ordered by codepoint. */
export const PartLineageSchema = Schema.Struct({
  prototype: Schema.optional(stableId),
  variants: Schema.Array(stableId),
  supersedes: Schema.Array(stableId),
  supersededBy: Schema.Array(stableId),
});

/**
 * The compiled part index (SPM-R11). Parts by id, part ids by interface and by family,
 * and the lineage graph. It is part of the content artifact, so the body hash and the
 * content lock cover it (ADR-0122/0123/0145). All id lists are codepoint-ordered
 * (ADR-0146); only non-empty interface and family groups are present.
 */
export const PartIndexSchema = Schema.Struct({
  byId: Schema.Record(stableId, FlattenedPartSchema),
  byInterface: Schema.Record(stableId, Schema.Array(stableId)),
  byFamily: Schema.Record(stableId, Schema.Array(stableId)),
  lineage: Schema.Record(stableId, PartLineageSchema),
});

/** The part-model section of the content artifact: the index plus slot sources. */
export const CompiledPartModelSchema = Schema.Struct({
  partIndex: PartIndexSchema,
  slotTemplates: Schema.Array(SlotTemplateSchema),
  platforms: Schema.Array(PlatformSchema),
});

export type FlattenedPart = typeof FlattenedPartSchema.Type;
export type PartIndex = typeof PartIndexSchema.Type;
export type CompiledPartModel = typeof CompiledPartModelSchema.Type;

/** A part's values at one month: the spec with every revision up to it applied. */
export interface ResolvedPartRevision {
  /** The `from` of the last revision applied, or `"base"` when none is (I-1). */
  readonly revision: string;
  readonly spec: Readonly<Record<string, unknown>>;
}

/**
 * Resolves a flattened part's spec at `month` (`YYYY-MM`). Revisions are cumulative
 * deltas: each one whose `from` is not after `month` applies in the flattened order
 * (ascending `from`, then declaration order; I-2), and the last one applied names the
 * effective revision. Availability and `requires` are not checked here; they are fit
 * findings (SPM-R12).
 */
export function resolvePartRevision(part: FlattenedPart, month: string): ResolvedPartRevision {
  let spec: Record<string, unknown> = { ...part.spec };
  let revision = "base";
  for (const entry of part.revisions) {
    if (entry.from > month) break;
    spec = { ...spec, ...entry.spec };
    revision = entry.from;
  }
  return { revision, spec };
}

// ---------------------------------------------------------------------------
// Loadouts
// ---------------------------------------------------------------------------

/** Where one unit of a multi-unit entry sits, when units are placed individually. */
const UnitPlacementSchema = Schema.Struct({
  stationPermille: permille,
  side: Schema.optional(Schema.Literals(MOUNT_SIDES)),
});

/** The plate geometry of an armour-region entry; material and region come from part and slot. */
const ArmourShapeSchema = Schema.Struct({
  thicknessUm: positiveInt,
  lengthMm: positiveInt,
  heightMm: positiveInt,
  cosObliquityBp: bp,
});

/**
 * The installed units of an entry whose `mountCount` is absent. Applied where entries
 * are compiled, not at decode: every Effect decode default takes an `Effect`, which
 * this runtime-free package may not import (ADR-0100 §2, ADR-0128).
 */
export const DEFAULT_MOUNT_COUNT = 1;

const entryFields = {
  /**
   * Identity of this entry within its loadout (ticket 11a). Optional; when present it is
   * unique across the whole loadout, nested entries included, which the fit stage checks.
   */
  id: Schema.optional(stableId),
  part: stableId,
  /** Installed units of the entry's part; the only quantity field (D2, I-15). Absent = 1. */
  mountCount: Schema.optional(positiveInt),
  stationPermille: Schema.optional(permille),
  side: Schema.optional(Schema.Literals(MOUNT_SIDES)),
  units: Schema.optional(nonEmptyArray(UnitPlacementSchema)),
  params: Schema.optional(Schema.Record(parameterName, int)),
  shape: Schema.optional(ArmourShapeSchema),
  feedsFrom: Schema.optional(slotId),
  /**
   * The `id` of the magazine entry that supplies this entry's ammunition (ticket 11b). It
   * names one entry of the same loadout, not a slot, so a feed distance can be measured.
   */
  magazineEntry: Schema.optional(stableId),
};

export interface NestedLoadoutEntryEncoded {
  readonly id?: string | undefined;
  readonly part: string;
  readonly mountCount?: number | undefined;
  readonly stationPermille?: number | undefined;
  readonly side?: (typeof MOUNT_SIDES)[number] | undefined;
  readonly units?: ReadonlyArray<typeof UnitPlacementSchema.Encoded> | undefined;
  readonly params?: { readonly [key: string]: number } | undefined;
  readonly shape?: typeof ArmourShapeSchema.Encoded | undefined;
  readonly feedsFrom?: string | undefined;
  readonly magazineEntry?: string | undefined;
  readonly entries?:
    | { readonly [childSlot: string]: ReadonlyArray<NestedLoadoutEntryEncoded> }
    | undefined;
}

export interface NestedLoadoutEntry {
  readonly id?: string | undefined;
  readonly part: string;
  readonly mountCount?: number | undefined;
  readonly stationPermille?: number | undefined;
  readonly side?: (typeof MOUNT_SIDES)[number] | undefined;
  readonly units?: ReadonlyArray<typeof UnitPlacementSchema.Type> | undefined;
  readonly params?: { readonly [key: string]: number } | undefined;
  readonly shape?: typeof ArmourShapeSchema.Type | undefined;
  readonly feedsFrom?: string | undefined;
  readonly magazineEntry?: string | undefined;
  readonly entries?:
    | { readonly [childSlot: string]: ReadonlyArray<NestedLoadoutEntry> }
    | undefined;
}

/** Child entries keyed by the child slot id, always as an array (one way to write it). */
const nestedEntries = Schema.optional(
  Schema.Record(
    slotId,
    Schema.Array(
      Schema.suspend(
        (): Schema.Codec<NestedLoadoutEntry, NestedLoadoutEntryEncoded> => NestedLoadoutEntrySchema,
      ),
    ),
  ),
);

/** An entry filling a part's own slot; its slot is the key it is filed under. */
export const NestedLoadoutEntrySchema = Schema.Struct({ ...entryFields, entries: nestedEntries });

/** One filled platform slot (SPM-R6). `barrels` and `tubes` do not exist (I-15). */
export const LoadoutEntrySchema = Schema.Struct({
  slot: slotId,
  ...entryFields,
  entries: nestedEntries,
});

/** A design's loadout: the platform it fits and its entries. */
export const LoadoutSchema = Schema.Struct({
  platform: stableId,
  entries: Schema.Array(LoadoutEntrySchema),
});

// ---------------------------------------------------------------------------
// The design header (ticket 11b)
// ---------------------------------------------------------------------------

/**
 * The design facts a loadout does not carry: who builds it, what it is for, the hull's
 * principal dimensions, and the machinery and protection figures that belong to the ship and
 * not to one part. A plant's power, zone and station are the plant entry; the plant's room
 * split, the fuel load and the protection figures are here, each in one place.
 */
export const DesignHeaderSchema = Schema.Struct({
  nation: stableId,
  requirement: DesignRequirementSchema,
  hull: HullSpecSchema,
  machinery: Schema.Struct({
    fuelCapacityKg: nonNegativeInt,
    fuelZoneId: Schema.Literals(SHIP_ZONE_IDS),
    fuelStationPermille: permille,
    foulingBp: int.check(Schema.isGreaterThanOrEqualTo(-10_000)),
    /** Optional split of the plant across zones; shares sum to 10000 (checked by the compile). */
    rooms: Schema.optional(
      Schema.Array(
        Schema.Struct({
          zoneId: Schema.Literals(SHIP_ZONE_IDS),
          stationPermille: permille,
          shareBp: bp,
        }),
      ),
    ),
  }),
  protection: Schema.Struct({
    citadelLengthMm: nonNegativeInt,
    torpedoWarheadKg: nonNegativeInt,
    bunkerProtectionBp: bp,
  }),
});

/** A design as parts: its header and the loadout that fills its platform. */
export const DesignLoadoutSchema = Schema.Struct({
  header: DesignHeaderSchema,
  loadout: LoadoutSchema,
});

export type DesignHeaderData = typeof DesignHeaderSchema.Type;
export type DesignLoadoutData = typeof DesignLoadoutSchema.Type;
export type CapabilityData = typeof CapabilitySchema.Type;
export type EngineeringData = typeof EngineeringSchema.Type;
export type PartData = typeof PartSchema.Type;
export type SlotData = typeof SlotSchema.Type;
export type SlotTemplateData = typeof SlotTemplateSchema.Type;
export type PlatformData = typeof PlatformSchema.Type;
export type LoadoutData = typeof LoadoutSchema.Type;
export type LoadoutEntryData = typeof LoadoutEntrySchema.Type;
export type QuantityComponentData = typeof QuantityComponentSchema.Type;
