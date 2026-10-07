# 01 — First visual sweep: playability findings (2026-10-07)

**Type:** task
**Status:** open
**Blocked by:** none
**Frontier:** yes

Captured with `pnpm run snap --save <pkg> --click <screen>` (see `docs/agents/desktop-view.md`) on
a fresh UK 1880 campaign at 1280x738. Every screen rendered with a clean console and no render
churn. Findings, most impactful first. None of these is fixed yet.

## Needs investigation (possible data inconsistency)

1. **Active construction count disagrees.** Overview says "ACTIVE CONSTRUCTION 0 projects" and the
   Construction ledger says 0 committed, but the Pre-turn review dialog on the same Jan 1880 save says
   "Active construction projects: 1". One of them is wrong, or they count different things (the
   research project `mac_triple_expansion`?). Reproduce: `--save <pkg>`, open Overview, click Advance Month.
2. **"Projected balance: -£56" in the header** reads like a balance, but it is the monthly
   surplus/deficit (Treasury shows month-end funds of 944). Label it "Projected change" or show 944.

## Raw internal ids shown as player-facing text

3. Fleet cards are titled `fleet_gbr_cape`, `fleet_gbr_home`, `fleet_gbr_mediterranean`; the readable
   name ("Cape & East Indies Squadron") is demoted to the subtitle. The Fleet radio list is the same.
4. Research shows `mac_triple_expansion` as the current project and `HULL_CONSTRUCTION`,
   `SHIP_DESIGN`, `FIRE_CONTROL` etc. as field names.
5. Overview and headers show "Session <uuid>", "Rev 0", "01/1880" — debug-flavoured; hide or move
   behind the debug mode (ADR-0029).

## Polish / clarity

6. Diplomacy rows show the stance twice ("Neutral" badge and "neutral" badge) plus "tension 5/10 since
   1880-01". "Declare war / Form alliance / Form NAP" have equal weight on every row; check that
   Declare war asks for confirmation.
7. Header strip shows "Alerts: —", "Prestige: —", "World tension: —" placeholders on a fresh game.
8. Mixed money formats: "£1k" (header), "1,000" (Overview/Treasury), "£1,000" (pre-turn review).
9. New-game screen: the "FLEET DISPATCH" heading is nearly invisible (low-contrast text on the
   light panel); the globe now renders after the CSP fix.
10. Fleet cards for `fleet_gbr_cape` list no ships, unlike the other two fleets — confirm that is
    real data and not a missing assignment.

11. **Diplomacy actions are silent.** Clicking "Declare war" (no confirmation) changes nothing visible:
    no pending/queued marker on the row, no notice, header status stays "Armed peace". The page says
    commands apply on the next turn advance, but the player cannot tell the click registered, or undo it.
    Three months advanced after declaring war on the Austro-Hungarian Empire; the Turn Report showed no
    battle (not investigated whether the declaration reached the engine).
12. **Tactical Sandbox cannot generate a battle in the desktop app.** In a debug build, "Generate
    Engagement" returns `NOT_IMPLEMENTED`: `generateBattle` has no case in
    `apps/desktop/src/main/campaignBridge.ts` (it falls through to the stub). The sandbox UI and the
    renderer provider exist; the bridge command does not. This is the shortest path to inspecting
    battle screens for the combat-tuning work.

## Done when

Each item is fixed, deliberately deferred in a comment below, or split into its own ticket.
