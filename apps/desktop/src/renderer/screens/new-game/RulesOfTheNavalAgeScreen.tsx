import { Anchor } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import { Button } from "../../components/ui/button.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { usePrimaryAction } from "../../shell/usePrimaryAction.js";
import type { AdmiralPresetValues } from "./admiral-preset.js";
import { EraScaleSection } from "./components/EraScaleSection.js";
import { ErrorState } from "./components/ErrorState.js";
import { HistoricalUncertaintySection } from "./components/HistoricalUncertaintySection.js";
import { LoadingState } from "./components/LoadingState.js";
import { PresetPickerSection } from "./components/PresetPickerSection.js";
import { NewGameScreenLayout } from "./components/NewGameScreenLayout.js";
import { ScreenHeader } from "./components/ScreenHeader.js";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";
import type { PresetId } from "./rules-of-the-naval-age-presets.js";
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
  const {
    state,
    options,
    preferences,
    scenario,
    ready,
    activePreset,
    setPreference,
    selectPreset,
  } = useNavalAgePreferences(recommendedPreset);

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

  const onSelectPreset = useCallback(
    (presetId: PresetId) => selectPreset(presetId),
    [selectPreset],
  );

  const handleNext = useCallback(() => {
    if (options !== null && ready) onNext(preferences, options);
  }, [options, ready, preferences, onNext]);

  const primaryAction = useMemo(
    () => ({ label: "Next: Choose Archetype", disabled: !ready, onTrigger: handleNext }),
    [ready, handleNext],
  );
  usePrimaryAction(primaryAction, onPrimaryActionChange);

  return (
    <NewGameScreenLayout>
      <ScreenHeader
        icon={<Anchor className="h-5 w-5" />}
        title="Rules of the Naval Age"
        description="Set the era, scale, and historical uncertainty for this campaign."
      />

      {state.loading && <LoadingState message="Loading campaign options…" />}

      {state.error !== null && (
        <ErrorState message={`Failed to load campaign options: ${state.error}`} />
      )}

      {options !== null && (
        <>
          <PresetPickerSection activePreset={activePreset} onSelectPreset={onSelectPreset} />

          <EraScaleSection
            scenarioId={preferences.scenarioId}
            campaignSeed={preferences.campaignSeed}
            fleetSize={preferences.fleetSize}
            scenarios={options.scenarios}
            selectedScenario={scenario}
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
        </>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    </NewGameScreenLayout>
  );
}
