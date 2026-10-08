export type Severity = "BLOCKING" | "CRITICAL" | "WARNING" | "ADVISORY";

export const SEVERITY_ORDER: readonly Severity[] = ["BLOCKING", "CRITICAL", "WARNING", "ADVISORY"];

export interface Remedy {
  readonly id: string;
  readonly description: string;
  /** Optional machine-readable edit the UI can apply; opaque to this package. */
  readonly edit?: Readonly<Record<string, unknown>>;
}

export interface Finding {
  readonly id: string;
  readonly severity: Severity;
  /** What failed. */
  readonly what: string;
  /** Why: the computed values that caused it. */
  readonly why: string;
  /** Probable gameplay consequence. */
  readonly consequence: string;
  readonly remedies: readonly Remedy[];
  readonly evidence: {
    readonly formulaId: string;
    readonly inputs: Readonly<Record<string, number>>;
    readonly threshold: number;
    readonly value: number;
  };
}

const MIN_REMEDIES: Record<Severity, number> = {
  BLOCKING: 3,
  CRITICAL: 2,
  WARNING: 2,
  ADVISORY: 0,
};

/** Returns problems with a finding's shape (spec §14.1). Empty = well-formed. */
export function checkFindingShape(f: Finding): string[] {
  const problems: string[] = [];
  if (f.what.trim() === "") problems.push("what is empty");
  if (f.why.trim() === "") problems.push("why is empty");
  if (f.consequence.trim() === "") problems.push("consequence is empty");
  if (f.remedies.length < MIN_REMEDIES[f.severity]) {
    problems.push(`${f.severity} requires >= ${MIN_REMEDIES[f.severity]} remedies`);
  }
  return problems;
}

/** Deterministic order: severity, then id, then evidence formula id. */
export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) ||
      (a.evidence.formulaId < b.evidence.formulaId
        ? -1
        : a.evidence.formulaId > b.evidence.formulaId
          ? 1
          : 0),
  );
}

export const hasBlocking = (findings: readonly Finding[]): boolean =>
  findings.some((f) => f.severity === "BLOCKING");
