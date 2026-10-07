# 01 — First visual sweep: playability findings (2026-10-07)

**Type:** task
**Status:** open
**Blocked by:** none
**Frontier:** yes

Captured with `pnpm run snap --save <pkg> --click <screen>` (see `docs/agents/desktop-view.md`) on
a fresh UK 1880 campaign at 1280x738. Every screen rendered with a clean console and no render
churn. Findings, most impactful first. None of these is fixed yet.

## Needs investigation (possible data inconsistency)

1. **[FIXED] Active construction count disagrees — root cause found.** The Pre-turn review is right (1 active
   project; the engine counts `status !== "COMPLETED"` everywhere, and the starting campaign has one
   project under construction). The Overview is wrong: `activeConstructionCount()` in
   `overview-screen-state.ts` is an explicit placeholder (`constructionSpend > 0 ? 1 : 0`, "until INC-8's
   construction projection enriches the view"). Fix: have the Overview read the same real count the
   Pre-turn review uses (the construction screen projection's `projects`), then add a test that the two
   surfaces agree.
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

11. **[FIXED, ADR-0054] Diplomacy command flow is hard to discover** (corrected after investigation: the backend is
    fine). "Declare war" only creates a *draft*; the "Command queue" bar with "Submit command" sits at
    the bottom of the page, off-screen, so the click appears to do nothing. After "Submit command" and a
    month advance the engine does apply it (relation becomes "At war", tension 10/10, state
    `war_imminent`). Needs: visible draft feedback (scroll to / pin the queue bar), and a confirmation
    for the irreversible declaration.
13. **Header status ignores war.** Header says "Status: Armed peace" while the Diplomacy screen says
    "At war" with the Austro-Hungarian Empire.
14. **Month advance is not shared across surfaces.** The header "Advance Month" does not feed the
    Simulation screen's Turn Report ("No turn advanced yet"), and advancing from the Simulation screen's
    own "Advance Turn (1 Month)" leaves the header on "January 1880" while the report says Month 8/1880.
    Also, the Diplomacy screen kept showing 01/1880 REV 0 while the header advanced to July until the
    screen was re-opened (stale while visible; verify).
15. Eight months at war (UK vs Austria-Hungary) produced no battle ("No battles resolved this month"),
    so war-triggered auto-resolution is not a practical way to see battle screens.

12. **Tactical Sandbox cannot generate a battle in the desktop app.** In a debug build, "Generate
    Engagement" returns `NOT_IMPLEMENTED`: `generateBattle` has no case in
    `apps/desktop/src/main/campaignBridge.ts` (it falls through to the stub). The sandbox UI and the
    renderer provider exist; the bridge command does not. This is the shortest path to inspecting
    battle screens for the combat-tuning work.

## Done when

Each item is fixed, deliberately deferred in a comment below, or split into its own ticket.
