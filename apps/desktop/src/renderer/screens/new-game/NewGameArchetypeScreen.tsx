import {
  ARCHETYPE_DIMENSION_MAX,
  ARCHETYPE_DIMENSION_MIN,
  ARCHETYPE_PRESETS,
  type ArchetypeDimension,
  type ArchetypeSelection,
} from "@bluewave/campaign-engine";
import { RotateCcw, Wand2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../../components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { usePrimaryAction } from "../../shell/usePrimaryAction.js";
import { buildArchetypeConsequence } from "./archetype-consequence.js";
import { ArchetypeConsequencePanel } from "./ArchetypeConsequencePanel.js";
import {
  ARCHETYPE_DECK_ENTRIES,
  ArchetypeAllocationEditor,
  ArchetypeDeckPane,
  ArchetypeDetailPanel,
  CUSTOM_ARCHETYPE_ID,
} from "./components/archetype/index.js";
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

/** The deck slot id an editor state has applied: a preset id, `custom`, or nothing yet. */
function appliedSlotId(state: ArchetypeEditorState): string | null {
  return state.mode === "custom" ? CUSTOM_ARCHETYPE_ID : state.selectedPresetId;
}

function slotIdAt(index: number): string | null {
  const entry = ARCHETYPE_DECK_ENTRIES[index];
  if (entry === undefined) return null;
  return entry.kind === "custom" ? CUSTOM_ARCHETYPE_ID : entry.id;
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
  const [draft, setDraft] = useState<ArchetypeEditorState>(() =>
    state.mode === "custom" ? state : createCustomArchetype(),
  );

  // The slot the player has previewed but not applied. The primary action
  // applies it. Presentation state only: never the selection, never persisted.
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);

  // Which deck card is previewed: until the player moves focus it is the
  // applied slot (or the first card while nothing is applied).
  const [focusOverride, setFocusOverride] = useState<number | null>(null);
  const appliedId = appliedSlotId(state);
  const appliedIndex = ARCHETYPE_DECK_ENTRIES.findIndex((entry) =>
    entry.kind === "custom" ? appliedId === CUSTOM_ARCHETYPE_ID : entry.id === appliedId,
  );
  const focusedIndex = focusOverride ?? Math.max(0, appliedIndex);
  const focusedEntry = ARCHETYPE_DECK_ENTRIES[focusedIndex] ?? ARCHETYPE_DECK_ENTRIES[0];
  const focusedPreset =
    focusedEntry?.kind === "preset"
      ? ARCHETYPE_PRESETS.find((preset) => preset.id === focusedEntry.id)
      : undefined;
  const focusedIsCustom = focusedEntry?.kind === "custom";
  const focusedSlotId = focusedIsCustom ? CUSTOM_ARCHETYPE_ID : (focusedPreset?.id ?? null);

  const hasSelection = appliedId !== null;
  const needsSelect = pendingSlotId !== null && pendingSlotId !== appliedId;
  const draftValid = isAllocationValid(draft);

  const appliedName =
    state.mode === "preset"
      ? (ARCHETYPE_PRESETS.find((preset) => preset.id === state.selectedPresetId)?.name ?? "Custom")
      : "Custom";

  const draftConsequence = useMemo(
    () => buildArchetypeConsequence(draft.allocation),
    [draft.allocation],
  );

  const onFocusIndex = useCallback((index: number) => {
    setFocusOverride(index);
    setPendingSlotId(slotIdAt(index));
  }, []);

  const openCustomEditor = useCallback(() => {
    setDraft((current) => (state.mode === "custom" ? state : current));
    setModalOpen(true);
  }, [state]);

  const onActivateIndex = useCallback(
    (index: number) => {
      const entry = ARCHETYPE_DECK_ENTRIES[index];
      if (entry === undefined) return;
      setFocusOverride(index);
      if (entry.kind === "custom") {
        setPendingSlotId(CUSTOM_ARCHETYPE_ID);
        openCustomEditor();
        return;
      }
      setPendingSlotId(null);
      setState((current) => selectPreset(current, entry.id));
    },
    [openCustomEditor],
  );

  const commitCustom = useCallback(() => {
    setState({ ...createCustomArchetype(), allocation: { ...draft.allocation } });
    setPendingSlotId(null);
    setModalOpen(false);
  }, [draft.allocation]);

  const handleNext = useCallback(() => {
    if (needsSelect && pendingSlotId !== null) {
      if (pendingSlotId === CUSTOM_ARCHETYPE_ID) {
        if (!draftValid) return;
        setState({ ...createCustomArchetype(), allocation: { ...draft.allocation } });
      } else {
        setState((current) => selectPreset(current, pendingSlotId));
      }
      setPendingSlotId(null);
      return;
    }
    if (!hasSelection || !isAllocationValid(state)) return;
    onNext(editorToSelection(state));
  }, [needsSelect, pendingSlotId, draftValid, draft.allocation, hasSelection, state, onNext]);

  const customBlocked = needsSelect && pendingSlotId === CUSTOM_ARCHETYPE_ID && !draftValid;
  const primaryAction = useMemo(
    () => ({
      label: needsSelect ? "Select" : "Choose Nation",
      disabled: (!hasSelection && !needsSelect) || customBlocked,
      onTrigger: handleNext,
    }),
    [needsSelect, hasSelection, customBlocked, handleNext],
  );
  usePrimaryAction(primaryAction, onPrimaryActionChange);

  const handleReset = useCallback(() => {
    setDraft((current) => resetCustomAllocation(current));
  }, []);

  const handleDimensionChange = useCallback((dimension: ArchetypeDimension, value: number) => {
    const clamped = clampDimensionValue(value);
    setDraft((current) => setDimension(current, dimension, clamped));
  }, []);

  const customApplied = state.mode === "custom";
  const customAllocation = customApplied ? state.allocation : null;
  const panelAllocation = focusedPreset?.allocation ?? customAllocation ?? draft.allocation;
  const panelApplied = focusedSlotId !== null && focusedSlotId === appliedId;

  return (
    <NewGameScreenLayout fullBleed>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <ArchetypeDeckPane
          focusedIndex={focusedIndex}
          onFocusIndex={onFocusIndex}
          onActivateIndex={onActivateIndex}
          appliedPresetId={state.mode === "preset" ? state.selectedPresetId : null}
          customApplied={customApplied}
          customAllocation={customAllocation}
        />

        <section
          aria-label="Archetype details"
          className="themed-scrollbar relative z-10 min-w-0 flex-1 lg:h-full lg:overflow-y-auto"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
            <p role="status" className="text-sm text-muted-foreground">
              Current archetype: <span className="font-medium text-foreground">{appliedName}</span>
            </p>

            <ArchetypeDetailPanel
              key={focusedSlotId ?? "none"}
              entry={focusedPreset === undefined ? {} : { preset: focusedPreset }}
              allocation={panelAllocation}
              applied={panelApplied}
              pending={
                focusedSlotId !== null && pendingSlotId === focusedSlotId && !panelApplied
              }
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack}>
                Back to Preferences
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex h-[96vh] w-[98vw] max-w-none flex-col gap-3 overflow-hidden p-4">
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

          <div className="themed-scrollbar grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-2">
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

          <DialogFooter className="-mx-4 -mb-4 flex-row border-t bg-background px-4 py-4 sm:justify-end sm:space-x-2">
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
