import { DiagnosticCollector, type DiagnosticCode } from "@bluewave/diagnostics";

export const CURRENT_COMPATIBILITY_VERSION = "1.0.0";

export const COMPATIBILITY_MISMATCH_CODE = "PERSISTENCE_COMPATIBILITY_MISMATCH" as DiagnosticCode;

export class CompatibilityChecker {
  static check(saveVersion: string, diagnostics: DiagnosticCollector): boolean {
    if (saveVersion !== CURRENT_COMPATIBILITY_VERSION) {
      diagnostics.addError(
        COMPATIBILITY_MISMATCH_CODE,
        `Save compatibility version "${saveVersion}" does not match current engine version "${CURRENT_COMPATIBILITY_VERSION}"`,
        {
          stage: "persistence.load",
          remediation: "Use a compatible save file or migrate the save data.",
        },
      );
      return false;
    }
    return true;
  }
}

export class CompatibilityError {
  readonly code: DiagnosticCode = COMPATIBILITY_MISMATCH_CODE;
  readonly severity = "error" as const;
  readonly stage = "persistence.load";
  constructor(
    public readonly message: string,
    public readonly saveVersion: string,
    public readonly currentVersion: string,
  ) {}
}
