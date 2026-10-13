import { useCallback, useEffect, useRef, useState } from "react";
import type { BluewaveDesktopBridge } from "../../../preload/index.js";
import { useBridge } from "../../lib/bridge-context.js";
import {
  DEFAULT_INSPECTOR_LAYOUT,
  clampInspectorWidth,
  normalizeInspectorLayout,
  type InspectorLayout,
} from "./inspector-layout.js";

/** How long a change waits before it is written, so a drag does not hammer the sidecar. */
const PERSIST_DEBOUNCE_MS = 300;

/** The stored inspector layout, or null when there is nothing (or no bridge) to read. */
async function readInspectorLayout(
  bridge: BluewaveDesktopBridge,
  sessionId: string,
): Promise<InspectorLayout | null> {
  const result = await bridge.campaign.execute("readUiState", sessionId);
  if (result.outcome !== "success") return null;
  const raw = result.value.uiState.inspector;
  return raw === undefined ? null : normalizeInspectorLayout(raw);
}

/**
 * Writes the layout through the shared `ui-state.json` sidecar. The bridge's write is a complete-set
 * replace for dismissals, so the current set is read back first and carried through — the same
 * read-before-write merge `useGuidedInspection` uses, so neither feature erases the other.
 */
async function writeInspectorLayout(
  bridge: BluewaveDesktopBridge,
  sessionId: string,
  layout: InspectorLayout,
): Promise<void> {
  const before = await bridge.campaign.execute("readUiState", sessionId);
  const dismissed =
    before.outcome === "success" ? [...before.value.uiState.dismissedFingerprints] : [];
  await bridge.campaign.execute("writeUiState", {
    sessionId,
    dismissedFingerprints: dismissed,
    inspector: layout,
  });
}

export interface UseInspectorLayoutResult {
  readonly layout: InspectorLayout;
  /** Sets the pane width, clamped to the supported range and remembered. */
  setWidth: (px: number) => void;
  /** Folds the pane away, or restores it, and remembers the choice. */
  toggleCollapsed: () => void;
}

/**
 * The shipbuilding inspector's width and collapsed state, remembered per campaign through the
 * renderer-owned `ui-state.json` sidecar (ADR-0038) — presentation only, never authoritative. Outside
 * a campaign session, or without a bridge, the choice still applies for the session but is not stored.
 */
export function useInspectorLayout(sessionId?: string): UseInspectorLayoutResult {
  const bridge = useBridge();
  const [layout, setLayout] = useState<InspectorLayout>(DEFAULT_INSPECTOR_LAYOUT);
  const latest = useRef(layout);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = layout;
  }, [layout]);

  useEffect(() => {
    if (bridge === undefined || sessionId === undefined) return;
    let cancelled = false;
    void (async () => {
      const stored = await readInspectorLayout(bridge, sessionId);
      if (!cancelled && stored !== null) setLayout(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [bridge, sessionId]);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const commit = useCallback(
    (next: InspectorLayout) => {
      setLayout(next);
      latest.current = next;
      if (bridge === undefined || sessionId === undefined) return;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void writeInspectorLayout(bridge, sessionId, next);
      }, PERSIST_DEBOUNCE_MS);
    },
    [bridge, sessionId],
  );

  const setWidth = useCallback(
    (px: number) => commit({ ...latest.current, widthPx: clampInspectorWidth(px) }),
    [commit],
  );
  const toggleCollapsed = useCallback(
    () => commit({ ...latest.current, collapsed: !latest.current.collapsed }),
    [commit],
  );

  return { layout, setWidth, toggleCollapsed };
}
