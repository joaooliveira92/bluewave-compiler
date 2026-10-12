import { Anchor } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import { Button } from "../../components/ui/button.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { usePrimaryAction } from "../../shell/usePrimaryAction.js";
import type { AdmiralPresetValues } from "./admiral-preset.js";
import { EraScaleSection } from "./components/EraScaleSection.js";
import { ErrorState } from "./components/ErrorState.js";
import { HistoricalUncertaintySection } from "./components/HistoricalUncertaintySection.js";
import { LoadingState } from "./components/LoadingState.js";
import { NewGameScreenLayout } from "./components/NewGameScreenLayout.js";
import {
  PresetDeckPane,
  PresetDetailPanel,
  PresetGlobeBand,
} from "./components/preset-deck/index.js";
import { ScreenHeader } from "./components/ScreenHeader.js";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";
import { PRESET_DEFINITIONS } from "./rules-of-the-naval-age-presets.js";
import { useNavalAgePreferences } from "./useNavalAgePreferences.js";

export interface RulesOfTheNavalAgeScreenProps {
  readonly recommendedPreset: AdmiralPresetValues | null;
  readonly onCancel: () => void;
  readonly onNext: (preferences: DraftPreferences, options: NewGameOptions) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

export function RulesOfTheNavalAgeScreen({
  recommendedPreset,
  onCancel,
  onNext,
  onPrimaryActionChange,
}: RulesOfTheNavalAgeScreenProps) {
  const { state, options, preferences, ready, activePreset, setPreference, selectPreset } =
    useNavalAgePreferences(recommendedPreset);

  const handlePreferenceChange = useCallback(
    (field: keyof DraftPreferences, value: string) => {
      setPreference(field, value);
    },
    [setPreference],
  );

  const onScenarioChange = useCallback(
    (value: string) => setPreference("scenarioId", value),
    [setPreference],
  );

  const onFleetSizeChange = useCallback(
    (value: string) => setPreference("fleetSize", value),
    [setPreference],
  );

  const onSeedChange = useCallback(
    (value: string) => setPreference("campaignSeed", value),
    [setPreference],
  );

  // Which deck card is previewed. Presentation state only: it follows the
  // applied preset when one is applied, and never touches the draft by itself.
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(
      0,
      PRESET_DEFINITIONS.findIndex((preset) => preset.id === activePreset),
    ),
  );
  useEffect(() => {
    const appliedIndex = PRESET_DEFINITIONS.findIndex((preset) => preset.id === activePreset);
    if (appliedIndex >= 0) setFocusedIndex(appliedIndex);
  }, [activePreset]);

  const focusedPreset = PRESET_DEFINITIONS[focusedIndex] ?? PRESET_DEFINITIONS[0];
  const appliedPresetName =
    PRESET_DEFINITIONS.find((preset) => preset.id === activePreset)?.name ?? "Custom";

  const onSelectFocusedPreset = useCallback(() => {
    if (focusedPreset !== undefined) selectPreset(focusedPreset.id);
  }, [focusedPreset, selectPreset]);

  const handleNext = useCallback(() => {
    if (options !== null && ready) onNext(preferences, options);
  }, [options, ready, preferences, onNext]);

  const primaryAction = useMemo(
    () => ({ label: "Next: Choose Archetype", disabled: !ready, onTrigger: handleNext }),
    [ready, handleNext],
  );
  usePrimaryAction(primaryAction, onPrimaryActionChange);

  return (
    <NewGameScreenLayout fullBleed>
      <div className="flex flex-none flex-wrap items-center justify-between gap-4 px-8 pb-5 pt-8">
        <ScreenHeader
          icon={<Anchor className="h-5 w-5" />}
          title="Rules of the Naval Age"
          description="Set the era, scale, and historical uncertainty for this campaign."
        />
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>

      {state.loading && (
        <div className="px-8">
          <LoadingState message="Loading campaign options…" />
        </div>
      )}

      {state.error !== null && (
        <div className="px-8">
          <ErrorState message={`Failed to load campaign options: ${state.error}`} />
        </div>
      )}

      {options !== null && focusedPreset !== undefined && (
        <div className="flex min-h-0 flex-1 flex-col border-t border-admiralty-border bg-admiralty-surface lg:flex-row lg:overflow-hidden">
          <PresetDeckPane
            activePreset={activePreset}
            focusedIndex={focusedIndex}
            onFocusIndex={setFocusedIndex}
            onSelectPreset={selectPreset}
          />

          <section
            aria-label="Preset details"
            className="themed-scrollbar relative z-10 min-w-0 flex-1 lg:h-full lg:overflow-y-auto"
          >
            <PresetGlobeBand />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
              <p role="status" className="text-sm text-muted-foreground">
                Current setup:{" "}
                <span className="font-medium text-foreground">{appliedPresetName}</span>
              </p>

              <PresetDetailPanel
                key={focusedPreset.id}
                preset={focusedPreset}
                applied={focusedPreset.id === activePreset}
                onSelect={onSelectFocusedPreset}
              />

              <EraScaleSection
                scenarioId={preferences.scenarioId}
                campaignSeed={preferences.campaignSeed}
                fleetSize={preferences.fleetSize}
                scenarios={options.scenarios}
                fleetSizeOptions={options.supportedValues.fleetSize ?? []}
                onScenarioChange={onScenarioChange}
                onFleetSizeChange={onFleetSizeChange}
                onSeedChange={onSeedChange}
              />

              <HistoricalUncertaintySection
                preferences={preferences}
                supportedValues={options.supportedValues}
                onPreferenceChange={handlePreferenceChange}
              />
            </div>
          </section>
        </div>
      )}
    </NewGameScreenLayout>
  );
}
