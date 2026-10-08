import type { ArchetypePreset } from "@bluewave/campaign-engine";
import { Badge } from "@/components/ui/badge.js";

export interface ArchetypePresetCardProps {
  readonly preset: ArchetypePreset;
  readonly active: boolean;
  readonly onSelect: () => void;
}

export function ArchetypePresetCard({ preset, active, onSelect }: ArchetypePresetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{preset.name}</span>
        <Badge variant="secondary">{preset.tagline}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{preset.description}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {preset.allocation.economy} / {preset.allocation.industry} / {preset.allocation.combat}
      </p>
    </button>
  );
}
