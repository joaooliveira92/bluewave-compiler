import { Plus } from "lucide-react";
import type { ArchetypeAllocation } from "@bluewave/campaign-engine";

export interface ArchetypeCustomCardProps {
  readonly selected: boolean;
  readonly allocation: ArchetypeAllocation | null;
  readonly onSelect: () => void;
}

export function ArchetypeCustomCard({ selected, allocation, onSelect }: ArchetypeCustomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <Plus className="h-6 w-6 text-muted-foreground" />
      <span className="font-semibold">Create Your Own</span>
      {allocation !== null ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {allocation.economy} / {allocation.industry} / {allocation.combat}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Build a custom split</span>
      )}
    </button>
  );
}
