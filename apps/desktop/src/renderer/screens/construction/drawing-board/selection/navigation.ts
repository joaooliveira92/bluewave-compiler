import type { SectionId } from "../panels/hull-plan/sections.js";
import { fittingFacts, machineryRooms, type EntityContext } from "./facts.js";
import type { ShipEntity } from "./store.js";

/** The Drawing Board's tabs. The single list of tab values; the board renders its strip from it. */
export const BOARD_TABS = ["hull", "arrangement", "analysis", "build", "tools"] as const;
export type BoardTab = (typeof BOARD_TABS)[number];

/** Panel titles a destination can name; each is the panel's `role="region"` accessible name. */
const PANEL = {
  machinery: "Machinery, fuel and range",
  batteries: "Batteries",
  placements: "Components and arrangement",
  protection: "Protection",
} as const;
type PanelKey = keyof typeof PANEL;

/** Which tab holds each panel. */
const PANEL_TAB: { readonly [K in PanelKey]: BoardTab } = {
  machinery: "hull",
  batteries: "arrangement",
  placements: "arrangement",
  protection: "arrangement",
};

/** A place in the forms: a whole panel, one battery card, or one placement row. */
export type FormTarget =
  | { readonly kind: "panel"; readonly panel: PanelKey }
  | { readonly kind: "battery"; readonly key: string }
  | { readonly kind: "placement"; readonly instanceId: string };

export interface Destination {
  readonly tab: BoardTab;
  readonly target: FormTarget;
  /** Button text, e.g. "Go to machinery settings". */
  readonly label: string;
}

/** Where each section's settings live. Exhaustive over the sections. */
const SECTION_DESTINATION: { readonly [K in SectionId]: PanelKey } = {
  forecastle: "placements",
  "forward-magazine": "protection",
  "forward-service": "placements",
  "central-machinery": "machinery",
  superstructure: "placements",
  "aft-service": "placements",
  "aft-magazine": "protection",
  quarterdeck: "placements",
};

const PANEL_LABEL: { readonly [K in PanelKey]: string } = {
  machinery: "Go to machinery settings",
  batteries: "Go to battery settings",
  placements: "Go to arrangement settings",
  protection: "Go to protection settings",
};

const panel = (key: PanelKey): Destination => ({
  tab: PANEL_TAB[key],
  target: { kind: "panel", panel: key },
  label: PANEL_LABEL[key],
});

/**
 * The form that configures an entity: guns and tubes go to their battery, other fittings (magazines included)
 * to their own row in the arrangement table, machinery rooms to the machinery settings, sections per the table
 * above. Null when the entity is gone.
 */
export function destinationFor(entity: ShipEntity, ctx: EntityContext): Destination | null {
  switch (entity.kind) {
    case "section":
      return panel(SECTION_DESTINATION[entity.id]);
    case "machinery-room":
      return entity.index < machineryRooms(ctx.draft).length ? panel("machinery") : null;
    case "fitting": {
      const f = fittingFacts(entity.instanceId, ctx);
      if (!f) return null;
      if (f.battery)
        return {
          tab: PANEL_TAB.batteries,
          target: { kind: "battery", key: f.battery.key },
          label: "Go to battery settings",
        };
      return {
        tab: PANEL_TAB.placements,
        target: { kind: "placement", instanceId: entity.instanceId },
        label: "Go to fitting settings",
      };
    }
  }
}

/** Attribute naming the battery card a form element belongs to. */
export const BATTERY_ATTR = "data-battery";
/** Attribute naming the placement row a form element belongs to. */
export const PLACEMENT_ATTR = "data-placement";
/** Attribute listing the ship entities a form group is about (see `shipLinkValue`). */
export const SHIP_LINK_ATTR = "data-ship-link";

/** The one place that turns a form target into an element. */
export function findTarget(root: ParentNode, target: FormTarget): HTMLElement | null {
  const all = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
  switch (target.kind) {
    case "panel":
      return (
        all('[role="region"]').find(
          (el) => el.getAttribute("aria-label") === PANEL[target.panel],
        ) ?? null
      );
    case "battery":
      return (
        all(`[${BATTERY_ATTR}]`).find((el) => el.getAttribute(BATTERY_ATTR) === target.key) ?? null
      );
    case "placement":
      return (
        all(`[${PLACEMENT_ATTR}]`).find(
          (el) => el.getAttribute(PLACEMENT_ATTR) === target.instanceId,
        ) ?? null
      );
  }
}

/** Encodes the entities a form group is about, for `SHIP_LINK_ATTR`. */
export function shipLinkValue(entities: readonly ShipEntity[]): string {
  return JSON.stringify(entities);
}

const isEntity = (v: unknown): v is ShipEntity => {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    (e["kind"] === "section" && typeof e["id"] === "string") ||
    (e["kind"] === "fitting" && typeof e["instanceId"] === "string") ||
    (e["kind"] === "machinery-room" && typeof e["index"] === "number")
  );
};

/**
 * The entities the focused form element is about: its nearest `SHIP_LINK_ATTR` group, else the panel it sits
 * in when that panel describes ship elements (the machinery settings light the machinery rooms).
 */
export function linkedEntities(el: Element | null, ctx: EntityContext): ShipEntity[] {
  const group = el?.closest(`[${SHIP_LINK_ATTR}]`);
  if (group) {
    try {
      const parsed: unknown = JSON.parse(group.getAttribute(SHIP_LINK_ATTR) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter(isEntity) : [];
    } catch {
      return [];
    }
  }
  const region = el?.closest('[role="region"]')?.getAttribute("aria-label");
  if (region === PANEL.machinery)
    return machineryRooms(ctx.draft).map((_, index) => ({ kind: "machinery-room", index }));
  return [];
}

/** Attributes for a placement row: a navigation target that also lights its fitting while focused. */
export function placementAttrs(instanceId: string): Record<string, string> {
  return {
    [PLACEMENT_ATTR]: instanceId,
    [SHIP_LINK_ATTR]: shipLinkValue([{ kind: "fitting", instanceId }]),
  };
}

/** Attributes for a battery card: a navigation target that lights all its mounts while focused. */
export function batteryAttrs(key: string, instanceIds: readonly string[]): Record<string, string> {
  return {
    [BATTERY_ATTR]: key,
    [SHIP_LINK_ATTR]: shipLinkValue(
      instanceIds.map((instanceId) => ({ kind: "fitting", instanceId })),
    ),
  };
}

/** The drawing control for an entity (section label or fitting target), to return focus to it. */
export function findDrawingControl(
  root: ParentNode,
  entity: ShipEntity,
): HTMLElement | SVGElement | null {
  const match = (sel: string, attr: string, value: string) =>
    [...root.querySelectorAll<HTMLElement | SVGElement>(sel)].find(
      (el) => el.getAttribute(attr) === value,
    ) ?? null;
  switch (entity.kind) {
    case "section":
      return match("button[data-section]", "data-section", entity.id);
    case "fitting":
      return match("[data-target]", "data-target", entity.instanceId);
    case "machinery-room":
      return null;
  }
}
