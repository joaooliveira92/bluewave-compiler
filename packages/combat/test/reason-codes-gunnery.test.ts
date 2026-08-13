import { describe, it, expect } from "vite-plus/test";
import { readFileSync, globSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GUNNERY_REASON_CODES } from "../src/gunnery/reasonCodes.js";
import { REASON_CODES } from "../src/reasonCodes.js";

// DESIGN-39 §32 authoritative reason-code set for the gunnery subsystem, verbatim
// per spec §1.4 / docs/rules/gunnery.md §32 (INC-5). This is the exhaustive
// authoritative catalog for this subsystem.
const DESIGN39_S32: readonly string[] = [
  "INVALID_GUNNERY_STATE",
  "GUNNERY_ACCURACY_FACTOR_MISSING",
  "GUNNERY_RATE_FACTOR_MISSING",
  "GUN_QUALITY_OUT_OF_RANGE",
  "AUTOLOADER_TECHNOLOGY_UNAVAILABLE",
  "AUTOLOADER_MOUNT_INELIGIBLE",
  "AUTOLOADER_FEED_JAMMED",
  "DUAL_PURPOSE_GUN_CONTRACT_MISSING",
  "DUAL_PURPOSE_ROLE_SWITCHING",
  "DUAL_PURPOSE_AA_INELIGIBLE",
  "ARMOR_ZONE_MAXIMUM_MISSING",
  "ARMOR_THICKNESS_LIMIT_EXCEEDED",
  "ARMOR_MANUFACTURING_POLICY_MISSING",
  "SPLINTER_PROTECTION_NOT_QUALIFIED",
  "GUNNERY_TARGET_ILLEGAL",
  "GUNNERY_AMMUNITION_UNAVAILABLE",
  "GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT",
  "GUNNERY_STRADDLE_INVALID",
  "GUNNERY_STATE_INVARIANT_FAILED",
] as const;

// The in-slice gunnery catalog (spec §1.4, reasonCodes.ts). Asserted to EXACTLY
// equal Object.values(GUNNERY_REASON_CODES) so a silent addition or removal forces
// review (AC-10).
const IN_SLICE: readonly string[] = [
  "INVALID_GUNNERY_STATE",
  "GUNNERY_STATE_INVARIANT_FAILED",
  "GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT",
  "GUNNERY_ACCURACY_FACTOR_MISSING",
  "GUNNERY_RATE_FACTOR_MISSING",
  "GUN_QUALITY_OUT_OF_RANGE",
  "GUNNERY_AMMUNITION_UNAVAILABLE",
  "GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED",
] as const;

// A genuine new code recorded in ADR-0020 (B-3): RAPID/AA eligibility predicates
// are deferred to a later slice, so a firing guard reports this deferred predicate
// rather than fabricating one (AC-2). It is NOT in DESIGN-39 §32 because §32 was
// written assuming those predicates resolve here.
const ADR_RECORDED_EXTRA = "GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED" as const;

// Reused existing combat catalog codes (spec §1.4) — no new record needed. They
// pre-exist in the top-level @bluewave/combat reason-code catalog.
const REUSED: readonly string[] = [
  "TACTICAL_STATE_INVARIANT_FAILED",
  "TACTICAL_FOG_OF_WAR_VIOLATION",
  "INVALID_TACTICAL_CLOCK",
  "INVALID_TACTICAL_TIME_CONTRACT",
] as const;

// Deferred §32 codes (spec §1.4): owned by later slices/tracks, recorded here and
// never shipped in the in-slice gunnery catalog.
const DEFERRED: readonly string[] = [
  "AUTOLOADER_TECHNOLOGY_UNAVAILABLE",
  "AUTOLOADER_MOUNT_INELIGIBLE",
  "AUTOLOADER_FEED_JAMMED",
  "DUAL_PURPOSE_GUN_CONTRACT_MISSING",
  "DUAL_PURPOSE_ROLE_SWITCHING",
  "DUAL_PURPOSE_AA_INELIGIBLE",
  "ARMOR_ZONE_MAXIMUM_MISSING",
  "ARMOR_THICKNESS_LIMIT_EXCEEDED",
  "ARMOR_MANUFACTURING_POLICY_MISSING",
  "SPLINTER_PROTECTION_NOT_QUALIFIED",
  "GUNNERY_TARGET_ILLEGAL",
  "GUNNERY_STRADDLE_INVALID",
] as const;

describe("AC-10 gunnery reason-code surface (DESIGN-39 §32 + catalog)", () => {
  it("IN_SLICE is EXACTLY the shipped in-slice catalog (no silent addition/removal)", () => {
    expect(Object.values(GUNNERY_REASON_CODES).sort()).toEqual([...IN_SLICE].sort());
  });

  it("every in-slice code is a DESIGN-39 §32 code OR the ADR-recorded extra", () => {
    for (const code of Object.values(GUNNERY_REASON_CODES)) {
      const known = DESIGN39_S32.includes(code) || code === ADR_RECORDED_EXTRA;
      expect(known).toBe(true);
    }
  });

  it("the ADR-recorded extra is not silently claimed as a DESIGN-39 §32 code", () => {
    expect(DESIGN39_S32.includes(ADR_RECORDED_EXTRA)).toBe(false);
  });

  it("the 12 deferred §32 codes are recorded but NOT shipped in the in-slice catalog", () => {
    expect(DEFERRED.length).toBe(12);
    const shipped = new Set<string>(Object.values(GUNNERY_REASON_CODES));
    // partition check: every §32 code is either in-slice, deferred, or both-known.
    for (const code of DEFERRED) {
      expect(DESIGN39_S32).toContain(code);
      expect(shipped.has(code)).toBe(false);
    }
    // the deferred codes plus the in-slice §32 codes equal the full §32 set.
    const inSliceS32 = IN_SLICE.filter((c) => c !== ADR_RECORDED_EXTRA);
    expect([...inSliceS32, ...DEFERRED].sort()).toEqual([...DESIGN39_S32].sort());
  });

  it("the 4 reused existing combat codes are present in the existing catalog", () => {
    const top = Object.values(REASON_CODES);
    for (const code of REUSED) {
      expect(top).toContain(code);
    }
  });

  it("gunnery modules throw no reason code outside the approved surface (identifier scan)", () => {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const srcDir = resolve(thisDir, "..", "src");
    const files = globSync("gunnery/**/*.ts", { cwd: srcDir });
    expect(files.length).toBeGreaterThan(0);
    const captured: string[] = [];
    for (const rel of files) {
      const content = readFileSync(resolve(srcDir, rel), "utf8");
      // gunnery throws use IMPORTED uppercase identifiers, e.g.
      // BluewaveError(GUNNERY_ACCURACY_FACTOR_MISSING, ...), not inline literals.
      for (const g of content.matchAll(/BluewaveError\(([A-Z][A-Z0-9_]+)/g)) {
        captured.push(g[1] as string);
      }
    }
    const known: string[] = [...IN_SLICE, ...REUSED];
    for (const id of new Set(captured)) {
      expect(known).toContain(id);
    }
  });
});
