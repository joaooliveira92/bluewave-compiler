import {
  defaultArchetypeSelection,
  serializeArchetypeSelection,
  type ArchetypeSelection,
} from "@bluewave/campaign-engine";
import { useCallback, useMemo, useState } from "react";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import type { NewGameOptions } from "../../shared/new-game-contract.js";
import {
  ADMIRAL_PRESET_VALUES,
  RECOMMENDED_FLEET_METHOD_ID,
  type AdmiralPresetValues,
} from "../screens/new-game/admiral-preset.js";
import type { FleetMethodDraft } from "../screens/new-game/new-game-fleet-method-screen-state.js";
import type { CampaignIdentityDraft } from "../screens/new-game/new-game-identity-screen-state.js";
import { buildCampaignConfiguration } from "../screens/new-game/new-game-nation-screen-state.js";
import type { DraftPreferences } from "../screens/new-game/new-game-preferences-screen-state.js";
import type { Screen } from "./campaign-screen-registry.js";

export interface NewGameDraft {
  readonly nationId: string;
  readonly preferences: DraftPreferences | null;
  readonly options: NewGameOptions | null;
  readonly archetype: ArchetypeSelection | null;
  readonly identity: CampaignIdentityDraft | null;
  readonly fleetMethod: FleetMethodDraft | null;
  readonly recommendedPreset: AdmiralPresetValues | null;
}

type NewGameBridge = Pick<BluewaveDesktopBridge, "campaign">;

export interface NewGameNavigation {
  readonly openCampaign: (sessionId: string) => Promise<void>;
  readonly selectScreen: (screen: Screen) => void;
}

export interface NewGameFlow {
  readonly state: {
    readonly draft: NewGameDraft | null;
    readonly status: "ready" | "launching";
    readonly error: string | null;
  };
  readonly actions: {
    readonly start: () => void;
    readonly cancel: () => void;
    readonly confirmNation: (nationId: string) => void;
    readonly applyRecommendedSetup: (nationId: string) => void;
    readonly backToNation: () => void;
    readonly acceptPreferences: (preferences: DraftPreferences, options: NewGameOptions) => void;
    readonly backToPreferences: () => void;
    readonly acceptArchetype: (archetype: ArchetypeSelection) => void;
    readonly backToArchetype: () => void;
    readonly acceptIdentity: (identity: CampaignIdentityDraft) => void;
    readonly backToIdentity: () => void;
    readonly launch: (fleetMethod: FleetMethodDraft) => Promise<void>;
  };
}

/** Carries a `NewGameDraft`'s other fields forward while swapping in `nationId`. */
function draftWithNation(current: NewGameDraft | null, nationId: string): NewGameDraft {
  return {
    nationId,
    preferences: current?.preferences ?? null,
    options: current?.options ?? null,
    archetype: current?.archetype ?? null,
    identity: current?.identity ?? null,
    fleetMethod: current?.fleetMethod ?? null,
    recommendedPreset: current?.recommendedPreset ?? null,
  };
}

/**
 * Owns the new-campaign workflow independently from the application shell UI.
 * The hook coordinates draft state and compilation, while navigation and the
 * desktop bridge remain dependency-injected at the boundary. Step order:
 * nation -> preferences (Rules of the Naval Age) -> archetype -> identity ->
 * fleet method -> launch. Nation is confirmed first, before any preference
 * exists, so it carries no scenario/options dependency of its own.
 */
export function useNewGameFlow(
  bridge: NewGameBridge | undefined,
  navigation: NewGameNavigation,
): NewGameFlow {
  const [draft, setDraft] = useState<NewGameDraft | null>(null);
  const [status, setStatus] = useState<"ready" | "launching">("ready");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    setDraft(null);
    setError(null);
    navigation.selectScreen("new-game-nation");
  }, [navigation]);

  const cancel = useCallback(() => {
    navigation.selectScreen("file");
  }, [navigation]);

  const confirmNation = useCallback(
    (nationId: string) => {
      setDraft((current) => draftWithNation(current, nationId));
      navigation.selectScreen("new-game-preferences");
    },
    [navigation],
  );

  /**
   * Nation confirmation's "Recommended Setup" control (spec §1) — pre-fills
   * the Admiral preset + default fleet method directly into the draft,
   * without navigating away, so downstream screens (not yet built) can start
   * from these values while staying fully editable.
   */
  const applyRecommendedSetup = useCallback((nationId: string) => {
    setDraft((current) => ({
      ...draftWithNation(current, nationId),
      fleetMethod: { legacyFleetModeId: RECOMMENDED_FLEET_METHOD_ID },
      recommendedPreset: ADMIRAL_PRESET_VALUES,
    }));
  }, []);

  const backToNation = useCallback(() => {
    navigation.selectScreen("new-game-nation");
  }, [navigation]);

  const acceptPreferences = useCallback(
    (preferences: DraftPreferences, options: NewGameOptions) => {
      setDraft((current) => (current === null ? null : { ...current, preferences, options }));
      navigation.selectScreen("new-game-archetype");
    },
    [navigation],
  );

  const backToPreferences = useCallback(() => {
    navigation.selectScreen("new-game-preferences");
  }, [navigation]);

  const acceptArchetype = useCallback(
    (archetype: ArchetypeSelection) => {
      setDraft((current) => (current === null ? null : { ...current, archetype }));
      navigation.selectScreen("new-game-identity");
    },
    [navigation],
  );

  const backToArchetype = useCallback(() => {
    navigation.selectScreen("new-game-archetype");
  }, [navigation]);

  const acceptIdentity = useCallback(
    (identity: CampaignIdentityDraft) => {
      setDraft((current) => (current === null ? null : { ...current, identity }));
      navigation.selectScreen("new-game-fleet-method");
    },
    [navigation],
  );

  const backToIdentity = useCallback(() => {
    navigation.selectScreen("new-game-identity");
  }, [navigation]);

  const launch = useCallback(
    async (fleetMethod: FleetMethodDraft) => {
      if (bridge === undefined || draft === null || draft.preferences === null) return;
      setDraft((current) => (current === null ? null : { ...current, fleetMethod }));
      setStatus("launching");
      setError(null);
      try {
        const archetypeToken = serializeArchetypeSelection(
          draft.archetype ?? defaultArchetypeSelection(),
        );
        const config = {
          ...buildCampaignConfiguration(
            draft.nationId,
            draft.preferences,
            fleetMethod.legacyFleetModeId,
          ),
          archetype: archetypeToken,
        };
        const result = await bridge.campaign.execute("compileCampaign", config);
        if (result.outcome !== "success") {
          const diagnostics =
            result.diagnostics.length > 0 ? ` ${result.diagnostics.join("; ")}` : "";
          setError(`${result.reason}.${diagnostics}`);
          return;
        }
        setDraft(null);
        await navigation.openCampaign(result.value.sessionId);
      } finally {
        setStatus("ready");
      }
    },
    [bridge, draft, navigation],
  );

  return useMemo(
    () => ({
      state: { draft, status, error },
      actions: {
        start,
        cancel,
        confirmNation,
        applyRecommendedSetup,
        backToNation,
        acceptPreferences,
        backToPreferences,
        acceptArchetype,
        backToArchetype,
        acceptIdentity,
        backToIdentity,
        launch,
      },
    }),
    [
      acceptArchetype,
      acceptIdentity,
      acceptPreferences,
      applyRecommendedSetup,
      backToArchetype,
      backToIdentity,
      backToNation,
      backToPreferences,
      cancel,
      confirmNation,
      draft,
      error,
      launch,
      start,
      status,
    ],
  );
}
