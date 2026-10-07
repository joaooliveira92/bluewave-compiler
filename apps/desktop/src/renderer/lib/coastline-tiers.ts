/**
 * Coastline level-of-detail tiers for the Canvas map (ADR-0055). Tier 0 is the
 * coarsest, used when zoomed out; the last tier is the unsimplified 1:10m data.
 */

import { simplifyPolygons, type FlatPolygon } from "./simplify-geometry.js";

/** Douglas–Peucker tolerance in degrees; 0 means "use the source as is". */
export const COASTLINE_TIER_TOLERANCES: readonly number[] = [0.1, 0.02, 0];
export type CoastlineTier = 0 | 1 | 2;

const TIER_MIN_SCALE = [0, 3, 8] as const;

export function coastlineTierFor(scale: number): CoastlineTier {
  if (scale >= TIER_MIN_SCALE[2]) return 2;
  if (scale >= TIER_MIN_SCALE[1]) return 1;
  return 0;
}

const cache = new WeakMap<readonly FlatPolygon[], Map<number, readonly FlatPolygon[]>>();

/** Memoised per source array + tier, so each tier is simplified at most once. */
export function coastlineForTier(
  source: readonly FlatPolygon[],
  tier: CoastlineTier,
): readonly FlatPolygon[] {
  const tolerance = COASTLINE_TIER_TOLERANCES[tier] as number;
  if (tolerance === 0) return source;
  let byTier = cache.get(source);
  if (byTier === undefined) {
    byTier = new Map();
    cache.set(source, byTier);
  }
  let simplified = byTier.get(tier);
  if (simplified === undefined) {
    simplified = simplifyPolygons(source, tolerance);
    byTier.set(tier, simplified);
  }
  return simplified;
}
