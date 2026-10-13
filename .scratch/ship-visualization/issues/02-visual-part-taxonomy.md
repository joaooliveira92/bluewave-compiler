# Visual part taxonomy and binding to design systems

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Define the full visual-part taxonomy and, for each part, which **compiled design element**
it binds to — so a part is always derived from authoritative data, never decorative:

- **Gun mounts / turrets** → a placed mount instance (already in `draft.placements`; the mount
  carries `mountType`, `gunCount`, calibre, `introductionMonth`).
- **Funnels** → a component tagged as a funnel (already drawn in profile).
- **Superstructure / bridge** → the hull form's superstructure zone (already a convention).
- **Masts, decks, accessories** → which compiled element, or a hull-form convention?
- **Sponson** → a mount's `sponsonRadius`-equivalent setting.
- **Torpedo tubes, aviation facilities, radar/electronics, mines/depth-charge gear, armour
  shading, hull features (ram/bulge), damage state** → which system each binds to, and which
  are conventions.

Decide the **EARLY-first subset** to implement now (proposal: gun mounts, funnels,
superstructure/bridge, masts, hull features; defer aviation/radar/torpedo/damage) and mark
every part as **data-bound** or **drawing convention** — the existing legend already
distinguishes `data` / `convention` / `mixed` and that discipline must carry over.

## Answer

Resolved autonomously (AGENTS.md), grounded in the compiled design model
(`ComponentSummary` per placement) and the research note. Every part is **data-bound**,
**convention**, or **mixed**, carrying the existing legend's `data` / `convention` / `mixed`
discipline forward.

| Part kind | Binds to | Source | EARLY build |
| --- | --- | --- | --- |
| `gun_mount` | a placement whose compiled category is a gun (`MAIN_GUN`, `SECONDARY_GUN`, `DUAL_PURPOSE_GUN`, `AA_WEAPON`): station + side from the placement; calibre from `armament.caliberUm` (else `attr.caliberUm`); gun count from `armament.gunCount` (else `params.barrels`); mount type from `armament.mountType` | **mixed** (station/side/calibre/count/type are data; silhouette, seat height, facing are convention) | **yes**: profile + plan |
| `mast` | the hull form's `SUPERSTRUCTURE` zone: a foremast at the bridge, a mainmast at the zone's aft end | **convention** | **yes**: profile |
| `funnel` | a placement tagged `funnel` | mixed (already drawn) | unchanged |
| `superstructure` / `bridge` | the `SUPERSTRUCTURE` zone | convention (already drawn) | unchanged |
| hull features (ram, counter, …) | hull-form id (`hull-character.ts`) | convention (already drawn) | unchanged |
| `sponson` | none: the design model has no sponson setting | would be convention | **deferred** |
| `torpedo_tube` | placement category `TORPEDO_TUBE` | mixed | deferred |
| aviation (`AIRCRAFT_FACILITY`), electronics (`RADAR`/`DIRECTOR`/`RANGEFINDER`) | placement category | mixed | deferred (no EARLY content) |
| mines (`MINE_GEAR`) | placement category | mixed | deferred and unreachable (D-7, DESIGN-55 §14) |
| decks / deck panels / accessories (boats, cranes, ventilators) | none | convention | deferred |
| armour shading | `draft.armour` | data | already an overlay on the plan |
| damage state | none in the design view | reserved | path reserved (`tone`), not built |

**Mount classes.** Visual mount class comes from the authoritative `ArmamentMountType`:
`TURRET`→`TURRET`, `BARBETTE`→`BARBETTE`, `DECK_SHIELDED`→`SHIELDED`, `DECK_OPEN`→`OPEN`,
`CASEMATE` and `BROADSIDE_BATTERY`→`CASEMATE`. Tube types are not gun mounts. This replaces
the manual's "the game decides shielded vs turreted" rule: our mount type is data.
`TURRET`/`BARBETTE` are multi-gun mounts (one symbol carries the guns); `SHIELDED`/`OPEN`/
`CASEMATE` are single-gun mounts, so a placement of *n* guns draws *n* single-gun symbols.
With no compiled armament, the class defaults to `TURRET` for `MAIN_GUN` and `SHIELDED`
otherwise (convention, flagged in the legend).
