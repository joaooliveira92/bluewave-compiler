import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import type { ArchetypeSelection } from "@bluewave/campaign-engine";
import { useCallback, useMemo, useState } from "react";
import type { BluewaveDesktopBridge } from "../../preload/index.js";
import type { NewGameOptions } from "../../shared/new-game-contract.js";
import type { DraftPreferences } from "../screens/new-game/new-game-preferences-screen-state.js";
import type { Screen } from "./campaign-screen-registry.js";

export interface NewGameDraft {
  readonly preferences: DraftPreferences;
  readonly options: NewGameOptions;
  readonly archetype: ArchetypeSelection | null;
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
    readonly acceptPreferences: (preferences: DraftPreferences, options: NewGameOptions) => void;
    readonly backToPreferences: () => void;
    readonly acceptArchetype: (archetype: ArchetypeSelection) => void;
    readonly backToArchetype: () => void;
    readonly launch: (config: CampaignConfiguration) => Promise<void>;
  };
}

/**
 * Owns the new-campaign workflow independently from the application shell UI.
 * The hook coordinates draft state and compilation, while navigation and the
 * desktop bridge remain dependency-injected at the boundary.
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
    navigation.selectScreen("new-game-preferences");
  }, [navigation]);

  const cancel = useCallback(() => {
    navigation.selectScreen("file");
  }, [navigation]);

  const acceptPreferences = useCallback(
    (preferences: DraftPreferences, options: NewGameOptions) => {
      setDraft((current) => ({
        preferences,
        options,
        archetype: current?.archetype ?? null,
      }));
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
      navigation.selectScreen("new-game-nation");
    },
    [navigation],
  );

  const backToArchetype = useCallback(() => {
    navigation.selectScreen("new-game-archetype");
  }, [navigation]);

  const launch = useCallback(
    async (config: CampaignConfiguration) => {
      if (bridge === undefined) return;
      setStatus("launching");
      setError(null);
      try {
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
    [bridge, navigation],
  );

  return useMemo(
    () => ({
      state: { draft, status, error },
      actions: {
        start,
        cancel,
        acceptPreferences,
        backToPreferences,
        acceptArchetype,
        backToArchetype,
        launch,
      },
    }),
    [
      acceptArchetype,
      acceptPreferences,
      backToArchetype,
      backToPreferences,
      cancel,
      draft,
      error,
      launch,
      start,
      status,
    ],
  );
}
