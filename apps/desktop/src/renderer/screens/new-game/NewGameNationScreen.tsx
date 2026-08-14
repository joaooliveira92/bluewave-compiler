import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import {
  defaultArchetypeSelection,
  serializeArchetypeSelection,
  type ArchetypeSelection,
} from "@bluewave/campaign-engine";
import type { PlayableSlotCountryId } from "../../content/nationAssetManifest.js";
import type { NewGameOptions } from "../../../shared/new-game-contract.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { nationArchetypeSynergy } from "./nation-selection/archetypeNationSynergy.js";
import { NationSelectionScreen } from "./nation-selection/NationSelectionScreen.js";
import {
  countryIdToNationId,
  nationIdToCountryId,
} from "./nation-selection/slotBridge.js";
import type { DraftPreferences } from "./new-game-preferences-screen-state.js";
import { selectableNations } from "./new-game-nation-screen-state.js";

export interface NewGameNationScreenProps {
  readonly preferences: DraftPreferences;
  readonly options: NewGameOptions;
  readonly archetype: ArchetypeSelection | null;
  readonly status: "ready" | "launching";
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onStart: (config: CampaignConfiguration) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

export function NewGameNationScreen({
  preferences,
  options,
  archetype,
  status,
  error,
  onBack,
  onStart,
  onPrimaryActionChange,
}: NewGameNationScreenProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const launching = status === "launching";

  const nations = selectableNations({
    preferences,
    options,
    selectedNationId: null,
  });
  const slots = useMemo<PlayableSlotCountryId[]>(
    () =>
      nations
        .map((nation) => nationIdToCountryId(nation.id))
        .filter(
          (countryId): countryId is PlayableSlotCountryId => countryId !== null,
        ),
    [nations],
  );

  const archetypeToken = useMemo(
    () =>
      archetype === null
        ? serializeArchetypeSelection(defaultArchetypeSelection())
        : serializeArchetypeSelection(archetype),
    [archetype],
  );

  const buildConfigFor = useCallback(
    (countryId: PlayableSlotCountryId): CampaignConfiguration | null => {
      const nationId = countryIdToNationId(countryId);
      if (nationId === null) return null;
      return {
        scenarioId: preferences.scenarioId as CampaignConfiguration["scenarioId"],
        playerSlotId: nationId,
        continuityModeId:
          preferences.continuityMode as CampaignConfiguration["continuityModeId"],
        fleetSizeSettingId:
          preferences.fleetSize as CampaignConfiguration["fleetSizeSettingId"],
        researchSpeedSettingId:
          preferences.researchSpeed as CampaignConfiguration["researchSpeedSettingId"],
        technologyVariationSettingId:
          preferences.technologyVariation as CampaignConfiguration["technologyVariationSettingId"],
        historicalBudgetOptionId: preferences.historicalBudget,
        legacyFleetModeId: preferences.legacyFleetMode,
        tacticalRealismModeId: preferences.tacticalRealism,
        difficultyProfileId: preferences.difficulty,
        campaignSeed: preferences.campaignSeed,
        configurationSchemaVersion: preferences.version,
        archetype: archetypeToken,
      };
    },
    [preferences, archetypeToken],
  );

  const focusedSynergy = useMemo(() => {
    const countryId = slots[focusedIndex];
    const nationId =
      countryId === undefined ? null : countryIdToNationId(countryId);
    if (nationId === null || archetype === null) return null;
    return {
      nationId,
      synergy: nationArchetypeSynergy(nationId, archetype.allocation),
    };
  }, [slots, focusedIndex, archetype]);

  // The shell's primary action (the header's continue/"advance turn" button)
  // confirms the selection and starts the campaign.
  const latestConfigRef = useRef<CampaignConfiguration | null>(null);
  const latestStartRef = useRef(onStart);
  latestStartRef.current = onStart;

  const triggerStart = useCallback(() => {
    const config = latestConfigRef.current;
    if (config !== null) latestStartRef.current(config);
  }, []);

  useEffect(() => {
    const countryId = slots[focusedIndex];
    const config = countryId === undefined ? null : buildConfigFor(countryId);
    latestConfigRef.current = config;
    onPrimaryActionChange({
      label: launching ? "Starting…" : "Start Campaign",
      disabled: launching || config === null,
      onTrigger: triggerStart,
    });
  }, [
    focusedIndex,
    slots,
    launching,
    buildConfigFor,
    onPrimaryActionChange,
    triggerStart,
  ]);

  useEffect(() => () => onPrimaryActionChange(null), [onPrimaryActionChange]);

  const handleConfirm = useCallback(
    (countryId: string) => {
      if (launching) return;
      const config = buildConfigFor(countryId as PlayableSlotCountryId);
      if (config !== null) onStart(config);
    },
    [launching, buildConfigFor, onStart],
  );

  return (
    <div className="relative h-full flex flex-col">
      <ArchetypeSummaryBanner
        archetype={archetype}
        focusedSynergy={focusedSynergy}
      />
      <div className="min-h-0 flex-1">
        <NationSelectionScreen
          slots={slots}
          onConfirm={handleConfirm}
          onCancel={onBack}
          focusedIndex={focusedIndex}
          onFocusChange={setFocusedIndex}
          failure={error}
        />
      </div>
    </div>
  );
}

function ArchetypeSummaryBanner({
  archetype,
  focusedSynergy,
}: {
  archetype: ArchetypeSelection | null;
  focusedSynergy: {
    nationId: string;
    synergy: ReturnType<typeof nationArchetypeSynergy>;
  } | null;
}) {
  if (archetype === null) return null;
  const { economy, industry, combat } = archetype.allocation;
  const label =
    archetype.kind === "preset"
      ? `Archetype: ${archetype.id}`
      : "Archetype: Custom";
  const synergy = focusedSynergy?.synergy ?? null;
  const synergyClass =
    synergy?.affinity === "strong"
      ? "text-emerald-600"
      : synergy?.affinity === "weak"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-6 py-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">
        E {economy} / I {industry} / C {combat}
      </span>
      {synergy !== null ? (
        <span className={`ml-auto flex items-center gap-2 ${synergyClass}`}>
          {synergy.note}
        </span>
      ) : null}
    </div>
  );
}
