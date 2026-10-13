import type { DiagnosticCode, DiagnosticCollector } from "@bluewave/diagnostics";
import { COMPATIBILITY_MISMATCH_CODE, PersistenceCompatibilityMismatchError } from "./errors.js";

export { COMPATIBILITY_MISMATCH_CODE } from "./errors.js";

// B-6/ADR-0025: bumped 1.0.0 -> 1.1.0 because the campaign snapshot schema
// gains authoritative startYear/startMonth + the per-area strategicWeather
// collection.
// SB-3/INC-2 (ADR-0129): bumped 1.1.0 -> 1.2.0 because the dockyard-project
// status vocabulary widens to the DESIGN-23 section 2 set (HALTED, DELAYED,
// ACCELERATED, AWAITING_CAPACITY, IMPOUNDED). Pre-change saves are REJECTED
// with PERSISTENCE_COMPATIBILITY_MISMATCH (no released save exists, so no
// migration engine ships; ADR-0113 section 5 documented rejection).
export const CURRENT_COMPATIBILITY_VERSION = "1.2.0";

export class CompatibilityChecker {
  static check(saveVersion: string, diagnostics: DiagnosticCollector): boolean {
    if (saveVersion !== CURRENT_COMPATIBILITY_VERSION) {
      // The tagged error is the typed vocabulary; `toDiagnostic()` projects it
      // onto the identical `Diagnostic` the collector already accepted, so the
      // collector-based public surface and its output are unchanged.
      diagnostics.add(
        new PersistenceCompatibilityMismatchError({
          message: `Save compatibility version "${saveVersion}" does not match current engine version "${CURRENT_COMPATIBILITY_VERSION}"`,
          stage: "persistence.load",
          remediation: "Use a compatible save file or migrate the save data.",
        }).toDiagnostic(),
      );
      return false;
    }
    return true;
  }
}

export class CompatibilityError extends Error {
  /** Stable discriminator (RULES.md "Errors"): recover by `_tag`, not `instanceof`. */
  readonly _tag = "CompatibilityError";
  readonly code: DiagnosticCode = COMPATIBILITY_MISMATCH_CODE;
  readonly severity = "error" as const;
  readonly stage = "persistence.load";
  constructor(
    message: string,
    public readonly saveVersion: string,
    public readonly currentVersion: string,
  ) {
    super(message);
    this.name = "CompatibilityError";
  }
}
