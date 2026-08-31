// packages/combat/test/air-defense/air-defense-attack.test.ts
// Tests for the AirDefenseAttack descriptor (DESIGN-45 §4) — schema validation,
// fail-closed constructor, mediumAaEligible computation.

import { describe, it, expect } from "vite-plus/test";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import {
  createAirDefenseAttack,
  validateAirDefenseAttack,
  isMediumAaEligible,
  AttackType,
  TerminalProfile,
  INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
} from "../../src/air-defense/index.js";

function validParams() {
  return {
    attackId: "atk_001",
    attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
    releaseRangeM: SafeInt(5_000),
    releaseAltitudeM: SafeInt(3_000),
    terminalProfile: TerminalProfile.LEVEL,
    speedKnots: SafeInt(250),
    formationSize: SafeInt(3),
    cohesionBp: SafeInt(8_000),
    defensiveSusceptibilityBp: SafeInt(5_000),
    targetId: "ship_001",
  };
}

describe("AirDefenseAttack descriptor (§4)", () => {
  describe("valid attack creation", () => {
    it("should create a valid attack with all §4 required fields", () => {
      const attack = createAirDefenseAttack(validParams());

      expect(attack.attackId).toBe("atk_001");
      expect(attack.attackType).toBe("AIRCRAFT_LEVEL_BOMBING");
      expect(Number(attack.releaseRangeM)).toBe(5_000);
      expect(Number(attack.releaseAltitudeM)).toBe(3_000);
      expect(attack.terminalProfile).toBe("LEVEL");
      expect(Number(attack.speedKnots)).toBe(250);
      expect(Number(attack.formationSize)).toBe(3);
      expect(Number(attack.cohesionBp)).toBe(8_000);
      expect(Number(attack.defensiveSusceptibilityBp)).toBe(5_000);
      expect(attack.targetId).toBe("ship_001");
    });
  });

  describe("terminalProfile (§4 line 84)", () => {
    it("should reject a missing terminalProfile", () => {
      const { terminalProfile: _tp, ...withoutProfile } = validParams();
      expect(() => {
        // Cast to unknown to exercise the fail-closed Zod path for a missing
        // required field (a compile-time TS error otherwise).
        createAirDefenseAttack(
          withoutProfile as unknown as Parameters<typeof createAirDefenseAttack>[0],
        );
      }).toThrow("AirDefenseAttack validation failed");
    });

    it("should accept each valid terminal profile literal", () => {
      const profiles = [
        TerminalProfile.IMPACTING,
        TerminalProfile.LEVEL,
        TerminalProfile.DIVE,
        TerminalProfile.SKIP,
        TerminalProfile.GUIDED,
        TerminalProfile.TORPEDO,
        TerminalProfile.CRUISE,
      ];
      for (const terminalProfile of profiles) {
        const attack = createAirDefenseAttack({ ...validParams(), terminalProfile });
        expect(attack.terminalProfile).toBe(terminalProfile);
      }
    });

    it("should reject an invalid terminalProfile value", () => {
      expect(() => {
        createAirDefenseAttack({
          ...validParams(),
          // @ts-expect-error testing invalid terminal profile
          terminalProfile: "INVALID_PROFILE",
        });
      }).toThrow();
    });
  });

  describe("mediumAaEligible computation (§8/§18)", () => {
    it("should set mediumAaEligible = true for aircraft delivery profiles", () => {
      const eligibleTypes = [
        AttackType.AIRCRAFT_LEVEL_BOMBING,
        AttackType.AIRCRAFT_DIVE_BOMBING,
        AttackType.AIRCRAFT_SKIP_BOMBING,
        AttackType.AIRCRAFT_TORPEDO_ATTACK,
        AttackType.AIRCRAFT_ROCKET_ATTACK,
        AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
      ];

      for (const attackType of eligibleTypes) {
        expect(isMediumAaEligible(attackType)).toBe(true);
      }
    });

    it("should set mediumAaEligible = false for ASM/other profiles", () => {
      const ineligibleTypes = [
        AttackType.HEAVY_ASM,
        AttackType.MEDIUM_ASM,
        AttackType.LIGHT_ASM,
        AttackType.ANTI_RADIATION_WEAPON,
        AttackType.SPECIAL_EXPLICIT_ATTACK,
      ];

      for (const attackType of ineligibleTypes) {
        expect(isMediumAaEligible(attackType)).toBe(false);
      }
    });

    it("should override caller-provided mediumAaEligible with computed value", () => {
      // Pass mediumAaEligible: true but attackType is HEAVY_ASM (not eligible)
      const attack = createAirDefenseAttack({
        ...validParams(),
        attackType: AttackType.HEAVY_ASM,
        mediumAaEligible: true,
      });

      // The constructor computes from attackType, overriding the caller's value
      expect(attack.mediumAaEligible).toBe(false);
    });
  });

  describe("fail-closed validation", () => {
    it("should reject unknown fields", () => {
      expect(() => {
        createAirDefenseAttack({
          ...validParams(),
          unknownField: "should fail",
        } as unknown as Parameters<typeof createAirDefenseAttack>[0]);
      }).toThrow("AirDefenseAttack validation failed");
    });

    it("should reject empty attackId", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), attackId: "" });
      }).toThrow("attackId must be a non-empty string");
    });

    it("should reject negative releaseRangeM", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), releaseRangeM: SafeInt(-1) });
      }).toThrow("releaseRangeM must be a non-negative integer");
    });

    it("should reject invalid attackType", () => {
      expect(() => {
        createAirDefenseAttack({
          ...validParams(),
          // @ts-expect-error testing invalid attack type
          attackType: "INVALID_TYPE",
        });
      }).toThrow();
    });

    it("should reject non-positive speedKnots", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), speedKnots: SafeInt(0) });
      }).toThrow("speedKnots must be a positive integer");
    });

    it("should reject formationSize of zero", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), formationSize: SafeInt(0) });
      }).toThrow("formationSize must be a positive integer");
    });

    it("should reject cohesionBp above 10_000", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), cohesionBp: SafeInt(10_001) });
      }).toThrow("cohesionBp must be in range 0..10_000");
    });

    it("should reject defensiveSusceptibilityBp above 10_000", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), defensiveSusceptibilityBp: SafeInt(10_001) });
      }).toThrow("defensiveSusceptibilityBp must be in range 0..10_000");
    });

    it("should reject empty targetId", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), targetId: "" });
      }).toThrow("targetId must be a non-empty string");
    });
  });

  describe("safe-integer validation", () => {
    const UNSAFE = Number.MAX_SAFE_INTEGER + 1; // 2^53, not a safe integer

    it("should reject an unsafe integer for releaseRangeM", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), releaseRangeM: UNSAFE as unknown as SafeInt });
      }).toThrow("releaseRangeM must be a non-negative integer");
    });

    it("should reject an unsafe integer for speedKnots", () => {
      expect(() => {
        createAirDefenseAttack({ ...validParams(), speedKnots: UNSAFE as unknown as SafeInt });
      }).toThrow("speedKnots must be a positive integer");
    });
  });

  describe("validateAirDefenseAttack raw validation", () => {
    it("should validate a correctly-typed raw object", () => {
      const raw = {
        attackId: "atk_001",
        attackType: "AIRCRAFT_LEVEL_BOMBING",
        releaseRangeM: 5_000,
        releaseAltitudeM: 3_000,
        terminalProfile: "LEVEL",
        speedKnots: 250,
        formationSize: 3,
        cohesionBp: 8_000,
        defensiveSusceptibilityBp: 5_000,
        targetId: "ship_001",
        mediumAaEligible: true,
      };

      const result = validateAirDefenseAttack(raw);
      expect(result.attackId).toBe("atk_001");
      expect(result.mediumAaEligible).toBe(true);
    });

    it("should throw for invalid raw object", () => {
      expect(() => {
        validateAirDefenseAttack({ attackId: 123, attackType: "bad" } as unknown);
      }).toThrow("AirDefenseAttack validation failed");
    });
  });

  describe("BluewaveError reason code", () => {
    it("createAirDefenseAttack should throw BluewaveError with INVALID_AIR_DEFENSE_SYSTEM_DEFINITION", () => {
      let caught: unknown;
      try {
        createAirDefenseAttack({ ...validParams(), attackId: "" });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(BluewaveError);
      expect((caught as BluewaveError).context.code).toBe(INVALID_AIR_DEFENSE_SYSTEM_DEFINITION);
    });

    it("validateAirDefenseAttack should throw BluewaveError with INVALID_AIR_DEFENSE_SYSTEM_DEFINITION", () => {
      let caught: unknown;
      try {
        validateAirDefenseAttack({ attackId: 123 });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(BluewaveError);
      expect((caught as BluewaveError).context.code).toBe(INVALID_AIR_DEFENSE_SYSTEM_DEFINITION);
    });
  });
});
