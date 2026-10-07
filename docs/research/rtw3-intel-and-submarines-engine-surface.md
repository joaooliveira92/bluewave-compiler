# Research — RTW3 intel (F-2) and submarines (F-3): what the engine exposes

> Sprint: RTW3 parity / UX overhaul (`.scratch/rtw3-parity-ux-overhaul`, tickets 06, 07).
> Method: source and content sweep (2026-10-07). Same rule as the war panel
> (`rtw3-war-panel-engine-surface.md`): real engine data is shown; everything else
> is an explicit deferred panel with a reason, never invented numbers.

## Intelligence (F-2)

| RTW3 item | Engine surface today | Verdict |
|---|---|---|
| Per-nation intel level / spend / "Intel reports" | `IntelligenceState { shells: Record<string, unknown> }` (`packages/campaign/src/state.ts:266`) is an empty placeholder; no levels, budget line or report model | **Deferred** |
| Relations matrix, tension, NAP | `DiplomacyRelationRow` (relation, tension, nap, since) — already on the Diplomacy screen | **Real**, already shown |
| "Foreign intelligence" page | `opening-briefing.ts` foreignIntelligence is only the rival-relations list | **Real**, already shown as "Likely rival" |
| Almanac (nation facts) | `content/production/1880/countries.yaml` has authored nation descriptions; no UI | **Possible later** (content-backed), not engine-backed |

## Submarines (F-3)

| RTW3 item | Engine surface today | Verdict |
|---|---|---|
| Submarine roster | No campaign roster. `SubmarinePool` (`campaign-engine/src/simulation.ts:232`) exists only as tactical-simulation input. `FleetShipView` carries name and design id, not hull type. | **Deferred** |
| 1880-era submarines | `content/production/1880/designs.yaml` has no submarine hull at all (the era predates them). `hullType: "submarine"` exists only as a construction label. | **Era-gated** — an empty roster would be correct, not a bug |
| "Auto build submarines" | No campaign setting or command | **Deferred** |

## Decision
1. No new top-level screens for intel or submarines: nothing real to put in them.
2. Show a visible "Not yet modelled by the engine" panel in Diplomacy (intel) and Fleet
   (submarines), through one shared component, each item with its reason.
3. Follow-ups are engine tickets: campaign intel levels/spend/reports; campaign submarine
   roster (hull type on the fleet view) and an auto-build setting; plus submarine content
   for the later eras.
