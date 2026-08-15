import { Anchor, ArrowLeft, ArrowRight, Check, Globe, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Progress } from "../../components/ui/progress.js";
import { cn } from "../../lib/utils.js";
import { ErrorState } from "../new-game/components/ErrorState.js";
import { LoadingState } from "../new-game/components/LoadingState.js";
import { RulesetOptionsSection } from "../new-game/components/RulesetOptionsSection.js";
import { ScenarioSection } from "../new-game/components/ScenarioSection.js";
import { ScreenHeader } from "../new-game/components/ScreenHeader.js";
import type {
  DraftPreferences,
  NewGamePreferencesScreenState,
} from "../new-game/new-game-preferences-screen-state.js";
import {
  applyOptionsFailed,
  applyOptionsLoaded,
  initialNewGamePreferencesScreenState,
  isReadyToProceed,
  selectedScenario,
  updatePreference,
} from "../new-game/new-game-preferences-screen-state.js";
import { defaultCampaignSeed } from "../new-game/utils/campaign-seed.js";

const STEPS = [
  { id: 1, title: "Scenario", icon: Globe },
  { id: 2, title: "Ruleset", icon: SlidersHorizontal },
] as const;

export interface CampaignPreferencesOnboardingProps {
  readonly onCancel: () => void;
  readonly onNext: (preferences: DraftPreferences, options: NewGameOptions) => void;
}

export function CampaignPreferencesOnboarding({
  onCancel,
  onNext,
}: CampaignPreferencesOnboardingProps) {
  const bridge = window.bluewave;
  const [step, setStep] = useState<1 | 2>(1);
  const [state, setState] = useState<NewGamePreferencesScreenState>(
    initialNewGamePreferencesScreenState,
  );

  useEffect(() => {
    async function loadOptions(): Promise<void> {
      if (bridge === undefined) {
        setState((current) => applyOptionsFailed(current, "Bluewave bridge not available"));
        return;
      }
      const result = await bridge.campaign.execute("listNewGameOptions", undefined);
      if (result.outcome !== "success") {
        setState((current) => applyOptionsFailed(current, result.reason));
        return;
      }
      setState((current) => applyOptionsLoaded(current, result.value, defaultCampaignSeed()));
    }
    void loadOptions();
  }, [bridge]);

  const scenario = selectedScenario(state);
  const ready = isReadyToProceed(state);
  const options = state.options;
  const preferences = state.preferences;

  const handlePreferenceChange = useCallback((field: keyof DraftPreferences, value: string) => {
    setState((current) => updatePreference(current, field, value));
  }, []);

  const onScenarioChange = useCallback((value: string) => {
    setState((current) => updatePreference(current, "scenarioId", value));
  }, []);

  const onSeedChange = useCallback((value: string) => {
    setState((current) => updatePreference(current, "campaignSeed", value));
  }, []);

  const total = STEPS.length;
  const isLast = step === total;
  const progress = (step / total) * 100;

  const goToNextStep = useCallback(() => setStep(2), []);
  const goToPreviousStep = useCallback(() => setStep(1), []);

  const handleFinish = useCallback(() => {
    if (options !== null && ready) onNext(preferences, options);
  }, [options, ready, preferences, onNext]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <ScreenHeader
        icon={<Anchor className="h-5 w-5" />}
        title="Campaign Preferences"
        description="Set up how the campaign will run before choosing a nation."
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Progress value={progress} aria-label={`Step ${step} of ${total}`} className="flex-1" />
          <Badge variant="secondary" className="shrink-0">
            Step {step} of {total}
          </Badge>
        </div>
        <ol className="flex items-center justify-between">
          {STEPS.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  aria-current={active ? "step" : undefined}
                  className="group flex cursor-pointer flex-col items-center gap-1.5 text-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                      active && "border-primary bg-primary text-primary-foreground",
                      done && "border-primary/40 bg-primary/10 text-primary",
                      !active &&
                        !done &&
                        "border-border bg-background text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <Icon className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {state.loading && <LoadingState message="Loading campaign options…" />}

      {state.error !== null && (
        <ErrorState message={`Failed to load campaign options: ${state.error}`} />
      )}

      {options !== null && step === 1 && (
        <ScenarioSection
          scenarioId={preferences.scenarioId}
          campaignSeed={preferences.campaignSeed}
          scenarios={options.scenarios}
          selectedScenario={scenario}
          onScenarioChange={onScenarioChange}
          onSeedChange={onSeedChange}
        />
      )}

      {options !== null && step === 2 && (
        <RulesetOptionsSection
          preferences={preferences}
          supportedValues={options.supportedValues}
          onPreferenceChange={handlePreferenceChange}
        />
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={step === 1 ? onCancel : goToPreviousStep}>
          <ArrowLeft className="h-3.5 w-3.5" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {isLast ? (
          <Button type="button" onClick={handleFinish} disabled={!ready}>
            Next: Choose Nation
            <Check className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button type="button" onClick={goToNextStep} disabled={options === null}>
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
