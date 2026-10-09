import type { SectionId } from "../panels/hull-plan/sections.js";

/** A thing on the ship drawing the player can point at. Presentation only: never part of the design. */
export type ShipEntity =
  | { readonly kind: "section"; readonly id: SectionId }
  | { readonly kind: "fitting"; readonly instanceId: string }
  /** Machinery rooms carry no id in the design model; `index` is their position in `machinery.rooms`. */
  | { readonly kind: "machinery-room"; readonly index: number };

export interface SelectionState {
  /** Pinned by a click, tap or Enter/Space; stays until cleared or replaced. */
  readonly selected: ShipEntity | null;
  /** Temporarily lit while the focus is in a form group about these entities. Never replaces `selected`. */
  readonly linked: readonly ShipEntity[];
  /** The section whose hover card is open (hover, focus or tap preview). */
  readonly preview: SectionId | null;
}

export const EMPTY_SELECTION: SelectionState = { selected: null, linked: [], preview: null };

export function sameEntity(a: ShipEntity | null, b: ShipEntity | null): boolean {
  if (a === null || b === null) return a === b;
  switch (a.kind) {
    case "section":
      return b.kind === "section" && a.id === b.id;
    case "fitting":
      return b.kind === "fitting" && a.instanceId === b.instanceId;
    case "machinery-room":
      return b.kind === "machinery-room" && a.index === b.index;
  }
}

export interface SelectionStore {
  readonly get: () => SelectionState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly select: (entity: ShipEntity) => void;
  readonly clear: () => void;
  readonly setLinked: (entities: readonly ShipEntity[]) => void;
  readonly setPreview: (id: SectionId | null) => void;
  /** Drops any selection or link the current design no longer contains (a removed fitting, a missing zone). */
  readonly prune: (exists: (entity: ShipEntity) => boolean) => void;
}

/**
 * The one owner of Drawing Board selection: a tiny external store, so the drawing, the hover card and the
 * inspector each subscribe to just the slice they draw and pointer or focus churn never re-renders the board.
 */
export function createSelectionStore(initial: SelectionState = EMPTY_SELECTION): SelectionStore {
  let state = initial;
  const listeners = new Set<() => void>();
  const set = (next: SelectionState) => {
    if (next === state) return;
    state = next;
    for (const l of listeners) l();
  };
  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    select: (entity) => {
      if (!sameEntity(state.selected, entity)) set({ ...state, selected: entity });
    },
    clear: () => {
      if (state.selected !== null) set({ ...state, selected: null });
    },
    setLinked: (entities) => {
      const same =
        entities.length === state.linked.length &&
        entities.every((e, i) => sameEntity(e, state.linked[i] ?? null));
      if (!same) set({ ...state, linked: entities });
    },
    setPreview: (id) => {
      if (id !== state.preview) set({ ...state, preview: id });
    },
    prune: (exists) => {
      const selected = state.selected && exists(state.selected) ? state.selected : null;
      const linked = state.linked.filter(exists);
      if (selected !== state.selected || linked.length !== state.linked.length)
        set({ ...state, selected, linked });
    },
  };
}
