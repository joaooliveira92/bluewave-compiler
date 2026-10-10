import type { LucideIcon } from "lucide-react";
import { Anchor, Plane, Sailboat, Ship, Waves } from "lucide-react";

const SHIP_TYPE_ICONS: Record<string, LucideIcon> = {
  battleship: Anchor,
  battlecruiser: Anchor,
  cruiser: Ship,
  destroyer: Sailboat,
  submarine: Waves,
  carrier: Plane,
  // The early-band class codes (DESIGN-22 `EarlyShipType`), so the design brief shows the same vocabulary.
  BB: Anchor,
  B: Anchor,
  CA: Ship,
  CL: Ship,
  DD: Sailboat,
};

/** The catalog icon for a ship type, defaulting to a generic ship. */
export function shipTypeIcon(shipType: string): LucideIcon {
  return SHIP_TYPE_ICONS[shipType] ?? Ship;
}
