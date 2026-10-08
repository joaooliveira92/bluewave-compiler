import type { DraftEdit } from "@bluewave/ship-design";

const words = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toLowerCase();

/** One-line, player-readable description of an edit for the history list. `nameOf` resolves a component id. */
export function describeEdit(e: DraftEdit, nameOf: (componentId: string) => string): string {
  switch (e.kind) {
    case "set_hull":
      return `Hull: ${Object.entries(e.patch)
        .map(([k, v]) => `${words(k)} → ${String(v)}`)
        .join(", ")}`;
    case "set_machinery":
      return `Machinery: ${Object.entries(e.patch)
        .map(([k, v]) => `${words(k)} → ${String(v)}`)
        .join(", ")}`;
    case "add_placement":
      return `Add ${nameOf(e.placement.componentId)} to ${words(e.placement.zoneId)}`;
    case "remove_placement":
      return `Remove ${e.instanceId}`;
    case "move_placement":
      return `Move ${e.instanceId} to ${words(e.zoneId)} at ${e.stationPermille}‰`;
    case "set_param":
      return `Set ${words(e.param)} of ${e.instanceId} to ${e.value}`;
    case "set_armour_region":
      return `Armour: set ${words(e.region.region)}`;
    case "remove_armour_region":
      return `Armour: remove ${words(e.region)}`;
  }
}
