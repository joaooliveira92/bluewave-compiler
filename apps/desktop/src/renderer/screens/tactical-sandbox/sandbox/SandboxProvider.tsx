import { createContext, use, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { BridgeResult } from "../../../../shared/bridge-contract.js";
import type { BluewaveDesktopBridge } from "../../../../preload/index.js";
import {
  applyAutoResolution,
  applyBoundaryReplayed,
  applyBoundaryReplayFailed,
  applyGenerateFailed,
  applyManifestGenerated,
  applyResolveFailed,
  applyTacticalOutcome,
  beginRequest,
  initialTacticalSandboxScreenState,
  parseScriptedOrders,
  updateScriptedOrdersText,
  updateTurnCount,
  updateWarId,
  type TacticalSandboxScreenState,
} from "../tactical-sandbox-screen-state.js";

export interface SandboxContextValue {
  readonly state: TacticalSandboxScreenState;
  readonly actions: {
    readonly updateWarId: (warId: string) => void;
    readonly updateTurnCount: (turnCount: number) => void;
    readonly updateScriptedOrdersText: (text: string) => void;
    readonly generateBattle: () => void;
    readonly autoResolve: () => void;
    readonly tacticalResolve: () => void;
    readonly replayBoundary: () => void;
  };
}

/** The engine's stable reason code, followed by its diagnostics when it gave any. */
function describeFailure(result: {
  readonly reason: string;
  readonly diagnostics: readonly string[];
}): string {
  return result.diagnostics.length > 0
    ? `${result.reason} — ${result.diagnostics.join(" ")}`
    : result.reason;
}

const SandboxContext = createContext<SandboxContextValue | null>(null);

/** The narrow transport the sandbox needs; injectable so the provider is testable. */
export type SandboxBridge = Pick<BluewaveDesktopBridge, "campaign">;

export function SandboxProvider({
  sessionId,
  bridge: bridgeOption,
  children,
}: {
  readonly sessionId: string;
  readonly bridge?: SandboxBridge;
  readonly children: ReactNode;
}) {
  const bridge = bridgeOption ?? window.bluewave;
  const [state, setState] = useState(initialTacticalSandboxScreenState);

  /**
   * Runs one guarded sandbox command: marks the sandbox busy, dispatches the
   * success or failure fold, and normalizes a thrown transport error. New
   * sandbox commands compose this instead of repeating the sandwich.
   */
  const runCommand = useCallback(
    async <Value,>(
      run: () => Promise<BridgeResult<Value>>,
      applySuccess: (state: TacticalSandboxScreenState, value: Value) => TacticalSandboxScreenState,
      applyFailure: (
        state: TacticalSandboxScreenState,
        error: string,
      ) => TacticalSandboxScreenState,
    ): Promise<void> => {
      if (bridge === undefined) return;
      setState((current) => beginRequest(current));
      try {
        const result = await run();
        if (result.outcome === "success") {
          setState((current) => applySuccess(current, result.value));
        } else {
          setState((current) => applyFailure(current, describeFailure(result)));
        }
      } catch (error) {
        setState((current) =>
          applyFailure(current, error instanceof Error ? error.message : "unknown transport error"),
        );
      }
    },
    [bridge],
  );

  const generateBattle = useCallback(async () => {
    if (bridge === undefined) return;
    await runCommand(
      () => bridge.campaign.execute("generateBattle", { sessionId, warId: state.warId }),
      (current, value) => applyManifestGenerated(current, value.manifest),
      applyGenerateFailed,
    );
  }, [bridge, runCommand, sessionId, state.warId]);

  const autoResolve = useCallback(async () => {
    const manifest = state.manifest;
    if (bridge === undefined || manifest === null) return;
    await runCommand(
      () => bridge.campaign.execute("resolveBattle", { sessionId, battleId: manifest.battleId }),
      (current, value) => applyAutoResolution(current, value.resolution),
      applyResolveFailed,
    );
  }, [bridge, runCommand, sessionId, state.manifest]);

  const tacticalResolve = useCallback(async () => {
    const manifest = state.manifest;
    if (bridge === undefined || manifest === null) return;
    const parsed = parseScriptedOrders(state.scriptedOrdersText);
    if (!parsed.ok) {
      setState((current) => applyResolveFailed(current, parsed.error));
      return;
    }
    await runCommand(
      () =>
        bridge.campaign.execute("resolveTacticalBattle", {
          sessionId,
          battleId: manifest.battleId,
          turnCount: state.turnCount,
          scriptedOrders: parsed.orders,
        }),
      (current, value) => applyTacticalOutcome(current, value.outcome),
      applyResolveFailed,
    );
  }, [bridge, runCommand, sessionId, state.manifest, state.scriptedOrdersText, state.turnCount]);

  const replayBoundary = useCallback(async () => {
    const manifest = state.manifest;
    if (bridge === undefined || manifest === null) return;
    await runCommand(
      () =>
        bridge.campaign.execute("replayBattleBoundary", {
          sessionId,
          battleId: manifest.battleId,
        }),
      applyBoundaryReplayed,
      applyBoundaryReplayFailed,
    );
  }, [bridge, runCommand, sessionId, state.manifest]);

  const value = useMemo<SandboxContextValue>(
    () => ({
      state,
      actions: {
        updateWarId: (warId) => setState((current) => updateWarId(current, warId)),
        updateTurnCount: (turnCount) => setState((current) => updateTurnCount(current, turnCount)),
        updateScriptedOrdersText: (text) =>
          setState((current) => updateScriptedOrdersText(current, text)),
        generateBattle: () => void generateBattle(),
        autoResolve: () => void autoResolve(),
        tacticalResolve: () => void tacticalResolve(),
        replayBoundary: () => void replayBoundary(),
      },
    }),
    [state, generateBattle, autoResolve, tacticalResolve, replayBoundary],
  );

  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

export function useSandbox(): SandboxContextValue {
  const context = use(SandboxContext);
  if (context === null) {
    throw new Error("useSandbox must be used within SandboxProvider");
  }
  return context;
}
