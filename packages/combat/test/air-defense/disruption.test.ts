// packages/combat/test/air-defense/disruption.test.ts
// AC-12: Disruption severity levels + stacking rules + mutually exclusive outcome table.
// Tests severity mapping, within-layer stacking, cross-layer multiplicative
// combination, and the §5 mutually exclusive outcome table.

import { describe, it, expect } from "vite-plus/test";
import {
  disruptionSeverityMultipliers,
  determineDisruptionSeverity,
  highestSeverityInLayer,
  combineCrossLayerDisruption,
  resolveEngagementOutcome,
  DISRUPTION_SEVERITY_MAP,
  DISRUPTION_SEVERITY_ORDINAL,
} from "../../src/air-defense/index.js";
import type { DisruptionSeverityType, LayerId } from "../../src/air-defense/index.js";

describe("Disruption model (§5/§6, AC-12)", () => {
  describe("disruption severity multipliers (§6 lines 118-123)", () => {
    it("LIGHT: accuracy 9_000, cohesion 9_500", () => {
      const m = disruptionSeverityMultipliers("LIGHT");
      expect(m.accuracyMultiplierBp).toBe(9_000);
      expect(m.cohesionMultiplierBp).toBe(9_500);
    });

    it("MODERATE: accuracy 7_500, cohesion 8_500", () => {
      const m = disruptionSeverityMultipliers("MODERATE");
      expect(m.accuracyMultiplierBp).toBe(7_500);
      expect(m.cohesionMultiplierBp).toBe(8_500);
    });

    it("SEVERE: accuracy 5_000, cohesion 6_500", () => {
      const m = disruptionSeverityMultipliers("SEVERE");
      expect(m.accuracyMultiplierBp).toBe(5_000);
      expect(m.cohesionMultiplierBp).toBe(6_500);
    });

    it("MISSION_ABORT: attack does not proceed (0, 0)", () => {
      const m = disruptionSeverityMultipliers("MISSION_ABORT");
      expect(m.accuracyMultiplierBp).toBe(0);
      expect(m.cohesionMultiplierBp).toBe(0);
    });

    it("should match the shipped DISRUPTION_SEVERITY_MAP", () => {
      expect(disruptionSeverityMultipliers("LIGHT")).toEqual(DISRUPTION_SEVERITY_MAP.LIGHT);
      expect(disruptionSeverityMultipliers("MODERATE")).toEqual(DISRUPTION_SEVERITY_MAP.MODERATE);
      expect(disruptionSeverityMultipliers("SEVERE")).toEqual(DISRUPTION_SEVERITY_MAP.SEVERE);
      expect(disruptionSeverityMultipliers("MISSION_ABORT")).toEqual(
        DISRUPTION_SEVERITY_MAP.MISSION_ABORT,
      );
    });
  });

  describe("severity ordinals (for stacking comparison)", () => {
    it("should have correct ordinal ordering: LIGHT < MODERATE < SEVERE < MISSION_ABORT", () => {
      expect(DISRUPTION_SEVERITY_ORDINAL.LIGHT).toBeLessThan(DISRUPTION_SEVERITY_ORDINAL.MODERATE);
      expect(DISRUPTION_SEVERITY_ORDINAL.MODERATE).toBeLessThan(DISRUPTION_SEVERITY_ORDINAL.SEVERE);
      expect(DISRUPTION_SEVERITY_ORDINAL.SEVERE).toBeLessThan(
        DISRUPTION_SEVERITY_ORDINAL.MISSION_ABORT,
      );
    });
  });

  describe("determineDisruptionSeverity", () => {
    it("should return null for disruptionBp <= 0", () => {
      expect(determineDisruptionSeverity(0)).toBeNull();
      expect(determineDisruptionSeverity(-1)).toBeNull();
    });

    it("should return LIGHT for low disruption bp", () => {
      expect(determineDisruptionSeverity(1)).toBe("LIGHT");
      expect(determineDisruptionSeverity(2_999)).toBe("LIGHT");
    });

    it("should return MODERATE for moderate disruption bp", () => {
      expect(determineDisruptionSeverity(3_000)).toBe("MODERATE");
      expect(determineDisruptionSeverity(7_999)).toBe("MODERATE");
    });

    it("should return SEVERE for high disruption bp", () => {
      expect(determineDisruptionSeverity(8_000)).toBe("SEVERE");
      expect(determineDisruptionSeverity(14_999)).toBe("SEVERE");
    });

    it("should return MISSION_ABORT for very high disruption bp", () => {
      expect(determineDisruptionSeverity(15_000)).toBe("MISSION_ABORT");
      expect(determineDisruptionSeverity(20_000)).toBe("MISSION_ABORT");
    });
  });

  describe("within-layer stacking: highestSeverityInLayer (§6 line 125)", () => {
    interface TestRecord {
      severity: DisruptionSeverityType;
      layer: LayerId;
      id: string;
    }

    it("should return null when no records match the layer", () => {
      const records: TestRecord[] = [{ severity: "LIGHT", layer: "HEAVY_AA", id: "r1" }];
      expect(highestSeverityInLayer(records, "LIGHT_AA")).toBeNull();
    });

    it("should return the single record when only one matches", () => {
      const records: TestRecord[] = [{ severity: "MODERATE", layer: "LIGHT_AA", id: "r1" }];
      const result = highestSeverityInLayer(records, "LIGHT_AA");
      expect(result?.id).toBe("r1");
      expect(result?.severity).toBe("MODERATE");
    });

    it("should return the highest severity among multiple records in same layer", () => {
      const records: TestRecord[] = [
        { severity: "LIGHT", layer: "LIGHT_AA", id: "r1" },
        { severity: "SEVERE", layer: "LIGHT_AA", id: "r2" },
        { severity: "MODERATE", layer: "LIGHT_AA", id: "r3" },
      ];
      const result = highestSeverityInLayer(records, "LIGHT_AA");
      expect(result?.id).toBe("r2");
      expect(result?.severity).toBe("SEVERE");
    });

    it("should ignore records from other layers", () => {
      const records: TestRecord[] = [
        { severity: "MISSION_ABORT", layer: "HEAVY_AA", id: "r1" },
        { severity: "LIGHT", layer: "LIGHT_AA", id: "r2" },
      ];
      const result = highestSeverityInLayer(records, "LIGHT_AA");
      expect(result?.id).toBe("r2");
      expect(result?.severity).toBe("LIGHT");
    });

    it("should prefer MISSION_ABORT as highest severity", () => {
      const records: TestRecord[] = [
        { severity: "LIGHT", layer: "CIWS_TERMINAL_DEFENSE", id: "r1" },
        { severity: "MISSION_ABORT", layer: "CIWS_TERMINAL_DEFENSE", id: "r2" },
        { severity: "SEVERE", layer: "CIWS_TERMINAL_DEFENSE", id: "r3" },
      ];
      const result = highestSeverityInLayer(records, "CIWS_TERMINAL_DEFENSE");
      expect(result?.id).toBe("r2");
      expect(result?.severity).toBe("MISSION_ABORT");
    });

    it("should return first encountered when severities are equal", () => {
      const records: TestRecord[] = [
        { severity: "LIGHT", layer: "MEDIUM_AA", id: "r_first" },
        { severity: "LIGHT", layer: "MEDIUM_AA", id: "r_second" },
      ];
      const result = highestSeverityInLayer(records, "MEDIUM_AA");
      expect(result?.id).toBe("r_first");
    });
  });

  describe("cross-layer stacking: combineCrossLayerDisruption (§6 line 125)", () => {
    it("should return neutral 10_000 when no layers have disruption", () => {
      const layers = new Map<LayerId, DisruptionSeverityType | null>([
        ["HEAVY_AA", null],
        ["MEDIUM_AA", null],
        ["LIGHT_AA", null],
        ["CIWS_TERMINAL_DEFENSE", null],
      ]);
      const result = combineCrossLayerDisruption(layers);
      expect(result.accuracyMultiplierBp).toBe(10_000);
      expect(result.cohesionMultiplierBp).toBe(10_000);
    });

    it("should apply single-layer LIGHT disruption", () => {
      const layers = new Map<LayerId, DisruptionSeverityType | null>([
        ["HEAVY_AA", null],
        ["MEDIUM_AA", null],
        ["LIGHT_AA", "LIGHT"],
        ["CIWS_TERMINAL_DEFENSE", null],
      ]);
      const result = combineCrossLayerDisruption(layers);
      // LIGHT: accuracy 9_000, cohesion 9_500
      // Only 1 layer with disruption, denominator = 10_000^1
      // accuracy = floor(10_000 × 9_000 / 10_000) = 9_000
      // cohesion = floor(10_000 × 9_500 / 10_000) = 9_500
      expect(result.accuracyMultiplierBp).toBe(9_000);
      expect(result.cohesionMultiplierBp).toBe(9_500);
    });

    it("should multiply two layers' disruptions", () => {
      const layers = new Map<LayerId, DisruptionSeverityType | null>([
        ["HEAVY_AA", null],
        ["MEDIUM_AA", "LIGHT"],
        ["LIGHT_AA", "MODERATE"],
        ["CIWS_TERMINAL_DEFENSE", null],
      ]);
      const result = combineCrossLayerDisruption(layers);
      // MEDIUM_AA LIGHT: accuracy 9_000, cohesion 9_500
      // LIGHT_AA MODERATE: accuracy 7_500, cohesion 8_500
      // accuracy = floor(10_000 × 9_000 × 7_500 / 10_000^2)
      //          = floor(675_000_000_000 / 100_000_000)
      //          = floor(6_750) = 6_750
      // cohesion = floor(10_000 × 9_500 × 8_500 / 10_000^2)
      //          = floor(807_500_000_000 / 100_000_000)
      //          = floor(8_075) = 8_075
      expect(result.accuracyMultiplierBp).toBe(6_750);
      expect(result.cohesionMultiplierBp).toBe(8_075);
    });

    it("should handle MISSION_ABORT across layers (accuracy → 0)", () => {
      const layers = new Map<LayerId, DisruptionSeverityType | null>([
        ["HEAVY_AA", "MISSION_ABORT"],
        ["MEDIUM_AA", null],
        ["LIGHT_AA", "LIGHT"],
        ["CIWS_TERMINAL_DEFENSE", null],
      ]);
      const result = combineCrossLayerDisruption(layers);
      // MISSION_ABORT: accuracy 0, cohesion 0
      // LIGHT: accuracy 9_000, cohesion 9_500
      // accuracy = floor(10_000 × 0 × 9_000 / 10_000^2) = 0
      // cohesion = floor(10_000 × 0 × 9_500 / 10_000^2) = 0
      expect(result.accuracyMultiplierBp).toBe(0);
      expect(result.cohesionMultiplierBp).toBe(0);
    });

    it("should floor the final cross-layer product once", () => {
      // Three layers: SEVERE × SEVERE × LIGHT
      const layers = new Map<LayerId, DisruptionSeverityType | null>([
        ["HEAVY_AA", "SEVERE"],
        ["MEDIUM_AA", "SEVERE"],
        ["LIGHT_AA", "LIGHT"],
        ["CIWS_TERMINAL_DEFENSE", null],
      ]);
      const result = combineCrossLayerDisruption(layers);
      // SEVERE: accuracy 5_000, cohesion 6_500
      // LIGHT: accuracy 9_000, cohesion 9_500
      // accuracy = floor(10_000 × 5_000 × 5_000 × 9_000 / 10_000^3)
      //          = floor(2_250_000_000_000_000 / 1_000_000_000_000)
      //          = floor(2_250) = 2_250
      // cohesion = floor(10_000 × 6_500 × 6_500 × 9_500 / 10_000^3)
      //          = floor(4_013_750_000_000_000 / 1_000_000_000_000)
      //          = floor(4_013.75) = 4_013
      expect(result.accuracyMultiplierBp).toBe(2_250);
      expect(result.cohesionMultiplierBp).toBe(4_013);
    });
  });

  describe("mutually exclusive outcome table (§5, §19 lines 328-330)", () => {
    describe("resolveEngagementOutcome", () => {
      const thresholds = {
        killBp: 100,
        damageBp: 200,
        abortBp: 150,
        disruptionBp: 50,
      };

      it("should return KILL for draw in [0, killBp)", () => {
        expect(resolveEngagementOutcome(thresholds, 0)).toBe("KILL");
        expect(resolveEngagementOutcome(thresholds, 50)).toBe("KILL");
        expect(resolveEngagementOutcome(thresholds, 99)).toBe("KILL");
      });

      it("should return DAMAGE for draw in [killBp, killBp + damageBp)", () => {
        expect(resolveEngagementOutcome(thresholds, 100)).toBe("DAMAGE");
        expect(resolveEngagementOutcome(thresholds, 150)).toBe("DAMAGE");
        expect(resolveEngagementOutcome(thresholds, 299)).toBe("DAMAGE");
      });

      it("should return ABORT for draw in [killBp + damageBp, killBp + damageBp + abortBp)", () => {
        expect(resolveEngagementOutcome(thresholds, 300)).toBe("ABORT");
        expect(resolveEngagementOutcome(thresholds, 375)).toBe("ABORT");
        expect(resolveEngagementOutcome(thresholds, 449)).toBe("ABORT");
      });

      it("should return DISRUPTION for draw in [cumulative - disruption, cumulative)", () => {
        expect(resolveEngagementOutcome(thresholds, 450)).toBe("DISRUPTION");
        expect(resolveEngagementOutcome(thresholds, 475)).toBe("DISRUPTION");
        expect(resolveEngagementOutcome(thresholds, 499)).toBe("DISRUPTION");
      });

      it("should return NO_EFFECT for draw >= cumulative sum", () => {
        expect(resolveEngagementOutcome(thresholds, 500)).toBe("NO_EFFECT");
        expect(resolveEngagementOutcome(thresholds, 9_999)).toBe("NO_EFFECT");
      });

      it("should return NO_EFFECT when all thresholds are 0", () => {
        const zeroThresholds = { killBp: 0, damageBp: 0, abortBp: 0, disruptionBp: 0 };
        expect(resolveEngagementOutcome(zeroThresholds, 0)).toBe("NO_EFFECT");
        expect(resolveEngagementOutcome(zeroThresholds, 5_000)).toBe("NO_EFFECT");
      });

      it("should return KILL for all draws when killBp = 10_000", () => {
        const allKill = { killBp: 10_000, damageBp: 0, abortBp: 0, disruptionBp: 0 };
        expect(resolveEngagementOutcome(allKill, 0)).toBe("KILL");
        expect(resolveEngagementOutcome(allKill, 9_999)).toBe("KILL");
      });

      it("should produce exactly one outcome per draw (exhaustive check)", () => {
        const outcomes = new Set<string>();
        for (let draw = 0; draw < 10_000; draw++) {
          const outcome = resolveEngagementOutcome(thresholds, draw);
          outcomes.add(outcome);
          // Verify each draw maps to exactly one outcome
          // (no draw can produce two outcomes — tested by function design)
        }
        // All possible outcomes should appear
        expect(outcomes.has("KILL")).toBe(true);
        expect(outcomes.has("DAMAGE")).toBe(true);
        expect(outcomes.has("ABORT")).toBe(true);
        expect(outcomes.has("DISRUPTION")).toBe(true);
        expect(outcomes.has("NO_EFFECT")).toBe(true);
      });

      it("should not allow cumulative thresholds > 10_000", () => {
        const overThresholds = {
          killBp: 5_000,
          damageBp: 5_000,
          abortBp: 5_000,
          disruptionBp: 0,
        };
        expect(() => resolveEngagementOutcome(overThresholds, 0)).toThrow(
          "cumulative outcome thresholds exceed 10_000 bp",
        );
      });

      it("should reject draw >= 10_000", () => {
        expect(() => resolveEngagementOutcome(thresholds, 10_000)).toThrow(
          "randomBp must be an integer in [0, 10000)",
        );
      });

      it("should reject negative draw", () => {
        expect(() => resolveEngagementOutcome(thresholds, -1)).toThrow(
          "randomBp must be an integer in [0, 10000)",
        );
      });

      it("should reject non-integer draw", () => {
        expect(() => resolveEngagementOutcome(thresholds, 1.5)).toThrow(
          "randomBp must be an integer in [0, 10000)",
        );
      });
    });

    describe("mutual exclusivity guarantee", () => {
      it("should produce disjoint outcome ranges for any threshold set", () => {
        const thresholds = { killBp: 300, damageBp: 200, abortBp: 100, disruptionBp: 50 };
        const counts: Record<string, number> = {};
        for (let draw = 0; draw < 10_000; draw++) {
          const outcome = resolveEngagementOutcome(thresholds, draw);
          counts[outcome] = (counts[outcome] ?? 0) + 1;
        }
        // KILL: 300 draws, DAMAGE: 200, ABORT: 100, DISRUPTION: 50, NO_EFFECT: 9_350
        expect(counts.KILL).toBe(300);
        expect(counts.DAMAGE).toBe(200);
        expect(counts.ABORT).toBe(100);
        expect(counts.DISRUPTION).toBe(50);
        expect(counts.NO_EFFECT).toBe(9_350);
        // Total must be exactly 10_000
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        expect(total).toBe(10_000);
      });
    });
  });
});
