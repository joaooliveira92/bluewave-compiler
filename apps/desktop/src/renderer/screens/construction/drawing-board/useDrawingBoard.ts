import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildWorkshopView,
  canRedo,
  canUndo,
  currentDraft,
  EditError,
  newLog,
  pushEdit,
  redo,
  undo,
  type DraftEdit,
  type DesignDraft,
  type EditLog,
  type WorkshopView,
} from "@bluewave/ship-design";
import {
  loadDrawingBoardContent,
  type DrawingBoardContent,
  type ReferenceDesign,
} from "./content.js";

export interface DrawingBoardState {
  readonly content: DrawingBoardContent;
  readonly preset: ReferenceDesign;
  readonly month: string;
  readonly draft: DesignDraft;
  readonly view: WorkshopView;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Last rejected edit, shown to the player instead of failing silently. */
  readonly editError: string | null;
  readonly editCount: number;
}

export interface DrawingBoardActions {
  readonly edit: (e: DraftEdit) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly loadPreset: (id: string) => void;
  readonly setMonth: (month: string) => void;
}

/** Local-only designer state: an undoable edit log over a draft, recompiled for display after every change. */
export function useDrawingBoard(): { state: DrawingBoardState; actions: DrawingBoardActions } {
  const content = useMemo(() => loadDrawingBoardContent(), []);
  const [preset, setPreset] = useState<ReferenceDesign>(content.references[0]!);
  const [log, setLog] = useState<EditLog>(() => newLog(content.references[0]!.draft));
  const [month, setMonthState] = useState(content.references[0]!.month);
  const [editError, setEditError] = useState<string | null>(null);

  const logRef = useRef(log);
  const commit = useCallback((next: EditLog) => {
    logRef.current = next;
    setLog(next);
  }, []);

  const draft = useMemo(() => currentDraft(log), [log]);
  const env = useMemo(() => content.environmentFor(month), [content, month]);
  const view = useMemo(() => buildWorkshopView(draft, env), [draft, env]);

  const edit = useCallback(
    (e: DraftEdit) => {
      try {
        commit(pushEdit(logRef.current, e));
        setEditError(null);
      } catch (err) {
        setEditError(err instanceof EditError ? err.message : String(err));
      }
    },
    [commit],
  );

  return {
    state: {
      content,
      preset,
      month,
      draft,
      view,
      canUndo: canUndo(log),
      canRedo: canRedo(log),
      editError,
      editCount: log.cursor,
    },
    actions: {
      edit,
      undo: () => commit(undo(logRef.current)),
      redo: () => commit(redo(logRef.current)),
      loadPreset: (id) => {
        const p = content.references.find((r) => r.id === id);
        if (!p) return;
        setPreset(p);
        commit(newLog(p.draft));
        setMonthState(p.month);
        setEditError(null);
      },
      setMonth: setMonthState,
    },
  };
}
