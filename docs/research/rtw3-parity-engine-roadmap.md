# RTW3 parity — engine roadmap (for owner ranking)

> Sprint: RTW3 parity / UX overhaul (`.scratch/rtw3-parity-ux-overhaul`). Method: source sweep of
> `packages/*/src` and `content/production/1880` (2026-10-07). Companion notes:
> `rtw3-war-panel-engine-surface.md`, `rtw3-intel-and-submarines-engine-surface.md`,
> `rtw3-losses-ledger-engine-surface.md`.
>
> **Why this exists.** Every parity check so far ended the same way: the UI can only show what the
> engine records and accept what the engine accepts. Anything else is *engine* work that changes
> authoritative state, so it needs an ADR, determinism proof and a golden-hash update — and it
> changes gameplay, which is the owner's call (AGENTS.md: deterministic, documented resolution).

## The fact that frames everything

The engine's **entire player-command vocabulary** (`packages/commands`) is 14 commands:

| Group | Commands | Exposed in the desktop today? |
|---|---|---|
| Diplomacy (7) | DeclareWar, AcceptPeace, FormAlliance, BreakAlliance, FormNonAggressionPact, BreakNonAggressionPact, DeclareBlockade | Yes (Diplomacy & War) |
| Divisions (5) | CreateDivision, AddShipToDivision, RemoveShipFromDivision, ChangeDivisionFlagship, DissolveDivision | **No** |
| Research (1) | SetResearchPriority | Yes (Research) |
| Construction (1) | BudgetProject | Yes (Construction) |

Movement orders exist in the UI but the bridge answers NOT_IMPLEMENTED (known, shown honestly).

## Verdict per RTW3 area

| RTW3 area | Engine today | Verdict | Effort |
|---|---|---|---|
| **Fleet organization / division editor** (F-7) | Real model `PermanentDivision` (role, formation, experience, cohesion, flagship, commander ref, ship order) + the 5 commands above, validated by DESIGN-26 reason codes. Production starts with **zero** divisions (`divisions: []`). | **Buildable now — UI only, no engine change** | Medium: bridge command + read model + editor |
| Fleet movement orders | Bridge returns NOT_IMPLEMENTED; no movement command in the 14 | Engine work | Medium |
| War score, blockades | Real | Done | — |
| Trade protection, ASW rating | None at campaign level | Engine work | Large |
| Submarine policy / roster / auto-build | Tactical model only; 1880 content has no subs | Engine work + content | Large |
| Invasion planning | Tactical mission type only | Engine work | Large |
| Intel levels / spend / reports | Empty `IntelligenceState` placeholder | Engine work | Large |
| Forts and bases (F-4) | Coastal defense exists only as tactical battle records (`combat/coastal-defense`); no campaign build command or state | Engine work | Large |
| Air groups / aircraft types (F-8) | Aircraft model is tactical only; no campaign air state | Engine work | Large |
| Officers (F-9) | Only `commanderOfficerId` on a division, always `VACANT`; no officer roster or content | Engine work + content | Large |
| Doctrine (F-10) | Exists only as a new-game archetype bonus; no player choice or research | Engine work | Medium |
| Mobilization / reserve, fleet exercise / extra training (F-10) | None at campaign level (training is a tactical-aircraft concept) | Engine work | Medium–Large |
| Treaties and naval limits (F-11) | None | Engine work + content | Large |
| Budget allocation (F-12) | `researchBudget` and `navalAppropriationRateBp` exist as state; no command changes them (only research *priority weights* and per-project `BudgetProject`) | Engine work (small) | Small–Medium |
| Message / event history (F-13) | Month reports exist per turn; no persisted history | UI + small engine | Small–Medium |
| Copy game / Resign (F-13) | Save/load/verify/replay/recover exist; copy-as-new-campaign and resign do not | Small engine/bridge work | Small |
| Ship designer (F-14) | Construction picks from a designs catalog; no free-form design with stats | Engine work | Large |
| Ships sunk: names / date / cause / scrapping | Ids only, no date, cause not persisted, no scrap mechanic | Engine work | Small–Medium |

## Engine gaps found while building the division editor

Pinned by tests in `apps/desktop/src/main/commands/divisionCommands.test.ts`:

1. **`CreateDivision` keeps only the first ship.** The validator checks the whole `shipOrder`, but
   `applyDivisionCommand`'s `create` case sets `shipOrder = [shipId]`. A division is founded on its
   flagship; the rest must join via `AddShipToDivision`. The desktop sends one flagship, never a list.
2. **`AddShipToDivision` does not enforce the same-area rule** (`DIVISION_LOCATION_CONFLICT` is defined
   in DESIGN-26 but only checked at creation). A division can end up spanning two areas. The UI offers
   only same-area ships; the engine should enforce it.
3. **Reorganization is not free:** adding a ship costs 5 experience and 10 cohesion, removing a
   non-flagship 3 and 5, changing flagship 5 and 10 (a new division starts at 20 and 30). The UI states
   these costs before the player commits.

## Recommended ranking (my view — yours to overrule)

Ranked by *player value per unit of engine risk*:

1. **Division editor (F-7) — build now, no decision needed.** It exposes existing commands;
   nothing authoritative changes. Gives players real agency over fleet organization and unlocks
   division experience/cohesion, which battles already read.
2. **Budget allocation (F-12) + copy game / resign (F-13).** Small, self-contained, and they
   touch the economy and campaign lifecycle players expect from day one.
3. **Persist loss details (names, class, date, cause).** Small engine change that turns the
   battle history into the full "ships sunk" ledger and is a prerequisite for any record-keeping.
4. **Fleet movement orders.** The Fleet screen already has the UI; the engine command is missing.
5. **Officers + doctrine.** One coherent feature (commanders give doctrine bonuses; the engine
   already has `commanderOfficerId` and battle multipliers for vacant commanders) — needs content.
6. **Trade protection + submarines + ASW** as one "commerce war" package (they share state).
7. **Forts/bases, air, treaties, intel, ship designer** — large, each its own project.

## Decisions I need from the owner
- Accept or re-order the ranking above (it sets the next engine sprints).
- For each chosen item: confirm it may change authoritative state (ADR + golden update).
- Content: who authors officer rosters, treaty tables and submarine/air designs for the eras?
