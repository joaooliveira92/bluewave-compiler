import type { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

export interface FinancialEntry {
  nationId: string;
  phaseId: string;
  previousBalance: SafeInt;
  delta: SafeInt;
  newBalance: SafeInt;
  reason: string;
}

export class FinancialLedger {
  private entries: FinancialEntry[] = [];

  get all(): readonly FinancialEntry[] {
    return this.entries;
  }

  append(entry: FinancialEntry): void {
    this.entries.push(entry);
  }

  hash(): string {
    return sha256Hex(canonicalSerialize(this.entries));
  }

  toJSON(): string {
    return canonicalSerialize(this.entries);
  }
}