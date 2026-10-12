import { memo, type ReactNode, useCallback, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card.js";
import { getPreferenceArtwork } from "@/content/preferenceArtworkManifest.js";
import { CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { cn } from "../../../lib/utils.js";
import {
  PRESET_DEFINITIONS,
  type ActivePresetId,
  type PresetId,
} from "../rules-of-the-naval-age-presets.js";
import {
  BounceCards,
  NEW_GAME_BOUNCE_CARDS_PROPS,
  type BounceCardImage,
} from "./bounce-cards/index.js";

export interface PresetPickerSectionProps {
  readonly activePreset: ActivePresetId;
  readonly onSelectPreset: (presetId: PresetId) => void;
}

/**
 * The preset picker (spec §2). Three layers of "know the option before you
 * click it", mirroring the Fleet Dispatch / Starting-fleet method pickers:
 * every card carries its own name shelf, an always-visible comparison list
 * spells out each preset's tagline, and hovering or focusing a card previews
 * it in the caption without committing the selection.
 */
export const PresetPickerSection = memo(function PresetPickerSection({
  activePreset,
  onSelectPreset,
}: PresetPickerSectionProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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
  const previewDefinition =
    previewIndex === null ? null : (PRESET_DEFINITIONS[previewIndex] ?? null);
  const displayed = previewDefinition ?? activeDefinition;

  const cardOverlays = useMemo<ReadonlyArray<ReactNode>>(
    () =>
      PRESET_DEFINITIONS.map((preset) => {
        const active = preset.id === activePreset;
        return (
          <div className="flex h-full flex-col justify-end">
            <div className="flex items-center justify-between gap-2 border-t border-white/15 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pb-2 pt-8 text-white">
              <span className="truncate text-sm font-semibold">{preset.name}</span>
              <span className="shrink-0 rounded-sm bg-white/20 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide">
                {active ? "Active" : "Select"}
              </span>
            </div>
          </div>
        );
      }),
    [activePreset],
  );

  const handleCardClick = useCallback(
    (index: number) => {
      const preset = PRESET_DEFINITIONS[index];
      if (preset) onSelectPreset(preset.id);
    },
    [onSelectPreset],
  );

  const handleCardHover = useCallback((index: number | null) => {
    setPreviewIndex(index);
  }, []);

  return (
    <GlassCard glassVariant="liquid-refract">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Rules of the Naval Age</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-0">
        <BounceCards
          images={images}
          activeIndex={activeIndex}
          activeOnTop
          cardOverlays={cardOverlays}
          onCardClick={handleCardClick}
          onCardHover={handleCardHover}
          {...NEW_GAME_BOUNCE_CARDS_PROPS}
        />

        <div role="status" className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold">{displayed?.name ?? "Custom"}</p>
          <p className="text-xs text-muted-foreground">
            {displayed?.tagline ?? "Your current settings"}
          </p>
        </div>

        <ul aria-label="Preset comparison" className="flex w-full max-w-md flex-col gap-1">
          {PRESET_DEFINITIONS.map((preset, index) => {
            const active = preset.id === activePreset;
            const previewed = !active && index === previewIndex;
            return (
              <li
                key={preset.id}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-baseline justify-between gap-3 rounded-md px-2 py-1 text-left transition-colors",
                  active ? "bg-muted" : previewed ? "bg-muted/50" : "opacity-70",
                )}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">{preset.tagline}</span>
              </li>
            );
          })}
        </ul>

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
