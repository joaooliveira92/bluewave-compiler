import { useCallback, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import type { FleetMethodDraft } from "./new-game-fleet-method-screen-state.js";
import { ScreenHeader } from "./components/ScreenHeader.js";

export interface NewGameFleetMethodScreenProps {
  readonly initialFleetMethod: FleetMethodDraft;
  readonly status: "ready" | "launching";
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onNext: (fleetMethod: FleetMethodDraft) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

/**
 * Minimal pass-through stub (INC-1): carries the default fleet method
 * (`generated`) forward with no card selection UI or per-mode copy — that's
 * INC-5's job. This step is also today's terminal action (compiles and
 * launches the campaign) since Commissioning Review doesn't exist yet.
 */
export function NewGameFleetMethodScreen({
  initialFleetMethod,
  status,
  error,
  onBack,
  onNext,
  onPrimaryActionChange,
}: NewGameFleetMethodScreenProps) {
  const launching = status === "launching";

  const fleetMethodRef = useRef(initialFleetMethod);
  fleetMethodRef.current = initialFleetMethod;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const triggerNext = useCallback(() => {
    onNextRef.current(fleetMethodRef.current);
  }, []);

  useEffect(() => {
    onPrimaryActionChange({
      label: launching ? "Starting…" : "Start Campaign",
      disabled: launching,
      onTrigger: triggerNext,
    });
    return () => onPrimaryActionChange(null);
  }, [launching, triggerNext, onPrimaryActionChange]);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 overflow-y-auto p-8">
      <ScreenHeader
        icon={<span>⚓</span>}
        title="Starting-fleet method"
        description={`Default: ${initialFleetMethod.legacyFleetModeId}.`}
      />

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={launching}>
          Back to Identity
        </Button>
      </div>
    </div>
  );
}
