# ADR-0115: Debug-only campaign battle drill for the playable-loop E2E

## Status

Accepted (2026-10-11).

## Context

Ticket 01 (`.scratch/playable-loop/issues/01-playable-loop-acceptance.md`) requires a
desktop E2E slice proving the player path reaches a **campaign-generated** battle:
declare war → advance → generation → resolution → a surfaced result that changes
campaign state. Two shipped-content facts make this unreachable through the real UI
alone:

- **No co-location.** `generateBattles` only yields a mission when both sides of a war
  have completed ships in the SAME area, and fleet movement is not implemented in the
  desktop app.
- **Strength floors.** The engine's eligibility floors (`FLEET_BATTLE_MIN_STRENGTH` 300 /
  `CRUISER_BATTLE_MIN_STRENGTH` 150) are compared with summed `ship.firepower`, which is
  ~14–26 per 1880 ship — so a real turn cannot generate a battle with today's content
  (already documented for the Tactical Sandbox, `SANDBOX_DEFAULT_STRENGTH_SCALE`).

The E2E must not inject a prebuilt battle or bypass campaign generation, and any
test-only capability must be narrowly scoped, unavailable in production builds, and
validated at the IPC boundary.

## Decision

1. **Add a debug-only `seedCampaignBattleDrill` IPC command** (next to the existing
   `generateBattle`/`resolveBattle` sandbox commands). It prepares the LIVE session so
   the REAL month phases (`battle_generation` 7.5 + `battle_resolution` 8) generate and
   resolve a battle and apply real consequences:
   - co-locates the war's completed fleets (`colocateWarSides`) — movement is unimplemented;
   - scales the belligerents' committed `firepower` by `DRILL_STRENGTH_SCALE` for the
     eligibility floors only (auto-resolution reads designs, not `firepower`);
   - treats ships without a compiled design as unavailable (`excludeUndesignedShips`);
   - persists the prepared snapshot as the live session state.
   It never fabricates a battle or its outcome: generation is left to the month's own
   `generateBattles` call and resolution to `resolveBattleAuto`.
2. **Gate it exactly like the sandbox.** `isBattleSandboxEnabled()` (the build-time
   `__BLUEWAVE_DEBUG__` constant) returns `DEBUG_ONLY` in a normal build, and the payload
   is schema-validated at the IPC boundary.
3. **Run its E2E spec under a debug build in CI.** `apps/desktop/e2e/campaign-battle-drill.debug.spec.ts`
   is excluded from the default `pnpm test:e2e` (`testIgnore`) so the normal build's
   `DEBUG_ONLY` assertions stay green; `.github/workflows/desktop-e2e.yml` rebuilds with
   `VITE_BLUEWAVE_DEBUG=true` after packaging and runs the spec via
   `playwright.debug.config.ts`.

## Alternatives considered

- **Seed a battle fixture directly into tactical resolution.** Rejected: the ticket
  forbids injecting a prebuilt battle.
- **Apply consequences in the observational sandbox commands.** Rejected: the sandbox is
  contractually observational (never mutates the session); a separate drill that
  explicitly mutates the live session is clearer and keeps the sandbox invariant.
- **Lower the engine eligibility floors or add strong ships to content.** Rejected:
  that changes gameplay balance and is out of scope.

## Consequences

- The E2E proves the player path end to end against the real generation + resolution +
  consequence pipeline; the only concession is the documented, debug-only co-location and
  eligibility scale.
- Production builds expose no new command; the drill is unreachable without the debug
  build constant.
