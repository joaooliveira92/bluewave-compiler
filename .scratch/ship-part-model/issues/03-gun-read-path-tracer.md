# 03: Gun and mount read path over today's content (P1 tracer)

**Type:** implementation
**Status:** open
**Blocked by:** 02
**Frontier:** yes
**Requirements:** SPM-R3, SPM-R6, SPM-R13, SPM-R14, SPM-R16, SPM-R19, SPM-R20 (gun rows, in memory only) · Stories 1, 25, 26, 33, 36

## What to build

The first end-to-end path. An in-memory **adapter** reads today's armament catalogue,
national gun overrides and component variants as gun and gun-mount **parts**. It reads
hull forms as **platforms** with **compatibility slot templates**: one slot per zone and
interface, accepting whatever is allowed today. It reads each reference design's gun
placements as **loadout entries**. The ship-design package compiles those entries through
**basis-driven** quantities and feeds them to the existing armament resolver. This
produces the same `ResolvedArmament` and compiled weapon contract that the legacy path
produces today.

- Gun translation follows §9.2:
  - single-gun mount types → `mountCount: barrels`, `gunsPerMount: 1`;
  - a turret or barbette with 1–2 barrels → `mountCount: 1`, `gunsPerMount: barrels`;
  - the legacy fixed installation → `PER_LOADOUT_ENTRY`; per-barrel terms →
    `PER_CONTAINED_UNIT` on the mount; gun mass → `PER_PART_UNIT` on the gun.
- The nine central-battery placements become battery assemblies (D17), and their legacy
  resolved type and `RECLASSIFIED_AS_CENTRAL_BATTERY` disposition go into migration
  provenance only.
- The compiled entry keeps the part id, the revision, the source file, `mountCount`,
  `gunsPerMount`, contained units, and each quantity's basis, multiplier and contribution.
- P1 limits (SPM-R19): no content rewrite, no save-version bump, no change to visual YAML,
  and the production path stays on the legacy pipeline.

## Acceptance criteria

- [ ] For all 91 reference designs (230 gun placements), the read path's
      `ResolvedArmament` and compiled weapon contract are byte-identical to the legacy
      path. The only exceptions are the D18 identity paths (`mountType`, `mountId`) of the
      nine D17 entries.
- [ ] A hand-worked example checks each basis multiplier: 1, `mountCount`, and
      `mountCount × gunsPerMount`, with a nested entry's part units equal to its parent's
      contained units.
- [ ] For each of the nine, `legacy barrels = mountCount × gunsPerMount` and the legacy
      fixed installation equals the translated `PER_LOADOUT_ENTRY` installation.
- [ ] No calculation infers a basis from the family; a test with a deliberately unusual
      basis proves it.
- [ ] Production content, saves, visual YAML and every golden are unchanged.
