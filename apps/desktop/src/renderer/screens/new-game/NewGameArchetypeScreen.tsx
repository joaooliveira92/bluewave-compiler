import {
  ARCHETYPE_DIMENSION_MAX,
  ARCHETYPE_DIMENSION_MIN,
  ARCHETYPE_PRESETS,
  type ArchetypeDimension,
  type ArchetypeSelection,
} from "@bluewave/campaign-engine";
import { Compass, RotateCcw, Wand2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog.js";
import { GlassCard } from "../../components/ui/glass-card.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { usePrimaryAction } from "../../shell/usePrimaryAction.js";
import { buildArchetypeConsequence } from "./archetype-consequence.js";
import { ArchetypeConsequencePanel } from "./ArchetypeConsequencePanel.js";
import {
  ArchetypeAllocationEditor,
  ArchetypeCustomCard,
  ArchetypeEmptyPreview,
  ArchetypePresetCard,
} from "./components/archetype/index.js";
import { ScreenHeader } from "./components/ScreenHeader.js";
import { NewGameScreenLayout } from "./components/NewGameScreenLayout.js";
import {
  type ArchetypeEditorState,
  allocationErrors,
  createCustomArchetype,
  editorToSelection,
  isAllocationValid,
  resetCustomAllocation,
  restoreArchetypeEditorState,
  selectPreset,
  setDimension,
  usedPoints,
} from "./new-game-archetype-screen-state.js";

export interface NewGameArchetypeScreenProps {
  readonly initialArchetype: ArchetypeSelection | null;
  readonly onBack: () => void;
  readonly onNext: (selection: ArchetypeSelection) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

export function NewGameArchetypeScreen({
  initialArchetype,
  onBack,
  onNext,
  onPrimaryActionChange,
}: NewGameArchetypeScreenProps) {
  const [state, setState] = useState<ArchetypeEditorState>(() =>
    restoreArchetypeEditorState(initialArchetype),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ArchetypeEditorState>(() => createCustomArchetype());

  const consequence = useMemo(
    () => buildArchetypeConsequence(state.allocation),
    [state.allocation],
  );
  const draftConsequence = useMemo(
    () => buildArchetypeConsequence(draft.allocation),
    [draft.allocation],
  );

  const hasSelection = state.mode === "preset" ? state.selectedPresetId !== null : true;

  const stateRef = useRef(state);
  const onNextRef = useRef(onNext);

  stateRef.current = state;
  onNextRef.current = onNext;

  const handleChooseNation = useCallback(() => {
    const currentState = stateRef.current;
    if (!isAllocationValid(currentState)) return;
    onNextRef.current(editorToSelection(currentState));
  }, []);

  const primaryAction = useMemo(
    () => ({ label: "Choose Nation", disabled: !hasSelection, onTrigger: handleChooseNation }),
    [hasSelection, handleChooseNation],
  );
  usePrimaryAction(primaryAction, onPrimaryActionChange);

  const handlePresetClick = useCallback((id: string) => {
    setState((current) => selectPreset(current, id));
  }, []);

  const openCustomEditor = useCallback(() => {
    setDraft(
      state.mode === "custom"
        ? {
            mode: "custom",
            selectedPresetId: null,
            allocation: { ...state.allocation },
          }
        : createCustomArchetype(),
    );
    setModalOpen(true);
  }, [state.mode, state.allocation]);

  const commitCustom = useCallback(() => {
    setState({
      mode: "custom",
      selectedPresetId: null,
      allocation: { ...draft.allocation },
    });
    setModalOpen(false);
  }, [draft.allocation]);

  const handleReset = useCallback(() => {
    setDraft((current) => resetCustomAllocation(current));
  }, []);

  const handleDimensionChange = useCallback((dimension: ArchetypeDimension, value: number) => {
    const clamped = clampDimensionValue(value);
    setDraft((current) => setDimension(current, dimension, clamped));
  }, []);

  const draftValid = isAllocationValid(draft);

  return (
    <NewGameScreenLayout>
      <ScreenHeader
        icon={<Compass className="h-5 w-5" />}
        title="Choose your archetype"
        description="Pick a playstyle, or build your own with 20 points across three engine-backed attributes."
      />

      <section aria-label="Archetype choices">
        <GlassCard glassVariant="liquid-refract">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Archetypes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ARCHETYPE_PRESETS.map((preset) => (
                <ArchetypePresetCard
                  key={preset.id}
                  preset={preset}
                  active={state.mode === "preset" && state.selectedPresetId === preset.id}
                  onSelect={() => handlePresetClick(preset.id)}
                />
              ))}
              <ArchetypeCustomCard
                selected={state.mode === "custom"}
                allocation={state.mode === "custom" ? state.allocation : null}
                onSelect={openCustomEditor}
              />
            </div>
          </CardContent>
        </GlassCard>
      </section>

      <section aria-label="Consequence preview">
        {hasSelection ? (
          <ArchetypeConsequencePanel consequence={consequence} />
        ) : (
          <ArchetypeEmptyPreview />
        )}
      </section>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Preferences
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto pb-0">
          <DialogHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle>Create your own archetype</DialogTitle>
                <DialogDescription>
                  Distribute exactly 20 points across economy, industry, and combat.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <ArchetypeAllocationEditor
                allocation={draft.allocation}
                points={usedPoints(draft)}
                errors={allocationErrors(draft)}
                onDimensionChange={handleDimensionChange}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Live preview
              </p>
              <ArchetypeConsequencePanel consequence={draftConsequence} compact />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 flex-row border-t bg-background px-6 py-4 sm:justify-end sm:space-x-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={commitCustom} disabled={!draftValid}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NewGameScreenLayout>
  );
}

function clampDimensionValue(value: number): number {
  return Math.max(ARCHETYPE_DIMENSION_MIN, Math.min(ARCHETYPE_DIMENSION_MAX, value));
}
