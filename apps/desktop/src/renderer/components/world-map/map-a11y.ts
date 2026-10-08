/**
 * Text alternatives for the chart. Ownership is drawn as colour; this is the
 * same information as words, for screen readers and colour-blind players.
 */

export interface AreaOwnershipRow {
  readonly id: string;
  readonly name: string;
  /** Controlling nation's display name, or null when unclaimed. */
  readonly owner: string | null;
  readonly fleets: number;
  readonly selected: boolean;
}

export function describeArea(row: AreaOwnershipRow): string {
  const owner = row.owner === null ? "unclaimed" : `held by ${row.owner}`;
  const fleets =
    row.fleets === 0 ? "no fleets" : row.fleets === 1 ? "1 fleet" : `${row.fleets} fleets`;
  return `${row.name}: ${owner}, ${fleets}`;
}

export function buildOwnershipRows(
  areas: readonly { readonly id: string; readonly name: string }[],
  ownerOf: (areaId: string) => string | null,
  fleetCountOf: (areaId: string) => number,
  selected: string | null,
): AreaOwnershipRow[] {
  return areas
    .map((area) => ({
      id: area.id,
      name: area.name,
      owner: ownerOf(area.id),
      fleets: fleetCountOf(area.id),
      selected: area.id === selected,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Case-insensitive match on area name or owner; an empty query keeps every row. */
export function filterAreaRows(
  rows: readonly AreaOwnershipRow[],
  query: string,
): readonly AreaOwnershipRow[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return rows;
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(needle) ||
      (row.owner ?? "unclaimed").toLowerCase().includes(needle),
  );
}
