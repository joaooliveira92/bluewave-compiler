import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../components/design-workspace/content.js";

/**
 * The Machinery section's outcomes-first view model. Pure: the editable performance targets and propulsion
 * configuration on one side, and the calculated results they produce on the other. Nothing here edits the design,
 * and no value appears both as an input and an output.
 */

export interface PlantOption {
  readonly id: string;
  readonly label: string;
  readonly disabled: boolean;
  /** Why the plant cannot be chosen (introduction date or missing technology); null when it can. */
  readonly reason: string | null;
}

export interface MachineryInputs {
  /** Target speed, milli-knots (a design input). */
  readonly targetSpeedMilliKnots: number;
  /** Cruising speed, milli-knots (a design input). */
  readonly cruiseSpeedMilliKnots: number;
  /** Operational range, nautical miles (a design input). */
  readonly rangeNm: number;
  readonly plantId: string;
  readonly installedKw: number;
  readonly fuelCapacityKg: number;
  readonly plantOptions: readonly PlantOption[];
}

export interface MachineryOutput {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface MachineryModel {
  readonly inputs: MachineryInputs;
  readonly outputs: readonly MachineryOutput[];
  /** Things the model does not yet carry, said plainly rather than faked. */
  readonly notes: readonly string[];
}

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();
const kn = (milliKnots: number) => (milliKnots / 1000).toFixed(1);
const tonnes = (kg: number) => (kg / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 });

/**
 * The propulsion configuration and the calculated results for a draft. `month` and `unlockedTechs` gate the plant
 * choices; `view` supplies every calculated value (never recomputed here).
 */
export function machineryModel(
  draft: DesignDraft,
  view: WorkshopView,
  content: DrawingBoardContent,
  month: string,
  unlockedTechs: ReadonlySet<string>,
): MachineryModel {
  const plantOptions: PlantOption[] = content.plants.map((p) => {
    const tooEarly = p.introduction !== undefined && p.introduction.fromMonth > month;
    const missing = (p.requires ?? []).filter((t) => !unlockedTechs.has(t));
    const reason = tooEarly
      ? `unavailable until ${p.introduction!.fromMonth}`
      : missing.length > 0
        ? `needs ${missing.map(words).join(", ")}`
        : null;
    return {
      id: p.id,
      label: `${words(p.id)} (${words(p.fuelType)})`,
      disabled: reason !== null,
      reason,
    };
  });
  const plant = content.plants.find((p) => p.id === draft.machinery.plantId);
  const machinery = view.compiled.machinery;
  const fuelCost = view.forecast.costBreakdown.machinery;

  const outputs: MachineryOutput[] = [
    {
      id: "required-power",
      label: "Power required at target speed",
      value: machinery === null ? "n/a" : `${machinery.requiredKwAtMax.toLocaleString("en-US")} kW`,
    },
    {
      id: "max-speed",
      label: "Speed achieved",
      value: machinery === null ? "n/a" : `${kn(machinery.maxSpeedMilliKnots)} kn`,
    },
    {
      id: "machinery-weight",
      label: "Machinery weight",
      value: machinery === null ? "n/a" : `${tonnes(machinery.plantWeightKg)} t`,
    },
    {
      id: "fuel-use",
      label: "Fuel use at cruise",
      value:
        machinery === null ? "n/a" : `${machinery.cruiseKgPerHour.toLocaleString("en-US")} kg/h`,
    },
    {
      id: "range",
      label: "Range at cruise",
      value: machinery === null ? "n/a" : `${machinery.rangeNmAtCruise.toLocaleString("en-US")} nm`,
    },
    {
      id: "reliability",
      label: "Reliability",
      value: plant === undefined ? "n/a" : `${(plant.reliabilityBp / 100).toFixed(0)}%`,
    },
    {
      id: "cost",
      label: "Machinery cost",
      value: `£${Math.round(fuelCost / 1_000_000).toLocaleString("en-US")}`,
    },
  ];

  return {
    inputs: {
      targetSpeedMilliKnots: draft.requirement.requiredSpeedMilliKnots,
      cruiseSpeedMilliKnots: draft.requirement.cruiseSpeedMilliKnots,
      rangeNm: draft.requirement.requiredRangeNm,
      plantId: draft.machinery.plantId,
      installedKw: draft.machinery.installedKw,
      fuelCapacityKg: draft.machinery.fuelCapacityKg,
      plantOptions,
    },
    outputs,
    notes: ["Acceleration is not modelled yet, so no acceleration figure is shown."],
  };
}
