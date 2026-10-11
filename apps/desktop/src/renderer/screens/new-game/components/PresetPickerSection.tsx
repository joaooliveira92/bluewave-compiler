import { memo, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card.js";
import { getPreferenceArtwork } from "@/content/preferenceArtworkManifest.js";
import { CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { cn } from "../../../lib/utils.js";
import {
  PRESET_DEFINITIONS,
  type ActivePresetId,
  type PresetId,
} from "../rules-of-the-naval-age-presets.js";
import { BounceCards, type BounceCardImage } from "./bounce-cards/index.js";

export interface PresetPickerSectionProps {
  readonly activePreset: ActivePresetId;
  readonly onSelectPreset: (presetId: PresetId) => void;
}

export const PresetPickerSection = memo(function PresetPickerSection({
  activePreset,
  onSelectPreset,
}: PresetPickerSectionProps) {
  const images = useMemo<ReadonlyArray<BounceCardImage>>(
    () =>
      PRESET_DEFINITIONS.map((preset) => ({
        src: getPreferenceArtwork(preset.id),
        alt: preset.name,
      })),
    [],
  );

  const activeIndex = useMemo(
    () => PRESET_DEFINITIONS.findIndex((preset) => preset.id === activePreset),
    [activePreset],
  );

  const activeDefinition = PRESET_DEFINITIONS.find((preset) => preset.id === activePreset) ?? null;

  const handleCardClick = useCallback(
    (index: number) => {
      const preset = PRESET_DEFINITIONS[index];
      if (preset) onSelectPreset(preset.id);
    },
    [onSelectPreset],
  );

  return (
    <GlassCard glassVariant="liquid-refract">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Rules of the Naval Age</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-0">
        <BounceCards
          images={images}
          containerWidth={520}
          containerHeight={290}
          cardSize={188}
          spread={118}
          rotation={12}
          arc={14}
          pushDistance={150}
          hoverScale={1.08}
          bounciness={0.6}
          animationDelay={0.15}
          animationStagger={0.07}
          borderWidth={4}
          borderColor="#ffffff"
          radius={22}
          activeIndex={activeIndex}
          onCardClick={handleCardClick}
        />

        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold">{activeDefinition?.name ?? "Custom"}</p>
          <p className="text-xs text-muted-foreground">
            {activeDefinition?.tagline ?? "Your current settings"}
          </p>
        </div>

        <button
          type="button"
          disabled
          aria-pressed={activePreset === "custom"}
          className={cn(
            "rounded-lg border border-dashed px-3 py-1.5 text-xs transition-colors disabled:cursor-default",
            activePreset === "custom"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          Custom
        </button>
      </CardContent>
    </GlassCard>
  );
});
