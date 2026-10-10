import type { EarlyShipType } from "@bluewave/ship-design";

/** Display names only: DESIGN-22 defines the codes, not the names. */
export const SHIP_TYPE_NAME: Record<EarlyShipType, string> = {
  BB: "Battleship",
  B: "Pre-dreadnought battleship",
  CA: "Armoured cruiser",
  CL: "Light cruiser",
  DD: "Destroyer",
};

/** One-line role of each type. General naval usage, not design data. */
export const SHIP_TYPE_ROLE: Record<EarlyShipType, string> = {
  BB: "The capital ship of the line: the heaviest guns and armour, and the fleet's centre of gravity.",
  B: "An early battleship: a mixed heavy and secondary battery, built for the battle line.",
  CA: "An armoured cruiser: fast and protected enough for the line, and a raider hunter on distant stations.",
  CL: "A light cruiser: a fast, lightly armoured scout and trade-protection cruiser.",
  DD: "A destroyer: a fast, lightly built torpedo craft and fleet screening vessel.",
};

/** The one-line role of a ship-type code, when the code is one of the early-band types. */
export function shipTypeRole(category: string): string | undefined {
  return (SHIP_TYPE_ROLE as Record<string, string>)[category];
}
