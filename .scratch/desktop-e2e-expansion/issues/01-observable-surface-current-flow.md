# Desktop E2E Expansion — 01: Observable surface of the current commissioning flow & uncovered production screens

Type: research
Status: resolved
Blocked by: (none)

## Answer

Complete factual inventory filed at
[`docs/research/e2e-expansion-current-flow-surface.md`](../../../docs/research/e2e-expansion-current-flow-surface.md)
(321 lines). Key findings:

- **Commissioning flow is now 8 steps** (nation "Fleet Dispatch" first → Rules of the Naval Age → archetype → identity → fleet method → review → launching → briefing → Overview). Every create-side selector in the existing specs is stale (national-level mapping: `getByLabel("Campaign Seed")` must now follow nation selection, `"Next: Choose Nation"` is now `"Next: Choose Archetype"`, nation is selected in step 1 not after archetype, `"Start Campaign"` is now on fleet-method step).
- **Guided tour auto-opens on every fresh compile** but does NOT block clicks (overlay has `pointer-events:none`; it is a latent race-risk not currently exercised or interfering).
- **Production build excludes** Simulation, Tactical Sandbox, Debugging (debug-gated by `VITE_BLUEWAVE_DEBUG`); e2e config has no env override.
- **Reachable-but-uncovered copy**: Research → "Set priorities" / "Priorities queued"; Diplomacy → "Submit command" / "Command queued" / blockade `<Select aria-label="Blockade area">`; Treasury → read-only 3-card layout.

Research note: `docs/research/e2e-expansion-current-flow-surface.md`

## Question

What is the **user-visible surface** of `apps/desktop` today, for the parts the
current e2e suite touches but gets wrong, and for the parts it does not touch at
all — as facts for re-anchoring (ticket 03) and scope (ticket 04)?

Collect by reading `apps/desktop/src/renderer` source + the existing component/
unit tests (never by running in this ticket):

1. **Commissioning flow, current order** — from landing ("New Campaign") to a
   compiled campaign on Overview. Enumerate every step in order
   (e.g. nation selection "Fleet Dispatch", Rules of the Naval Age / Era & Scale,
   archetype, identity, fleet method, briefing, commissioning review, launching —
   confirm which steps exist and their true order), the exact heading/copy, the
   primary-action labels, and the reachable `getByRole` affordances at each
   screen (e.g. `listbox "Playable nations"`, `option "United Kingdom" …`,
   primary-action "Continue" button, "Next: Choose Archetype", the "Campaign
   Seed" input `<FieldLabel htmlFor="campaignSeed">`, archetype preset buttons).
   Flag any keyboard-driven / focus-indexed interaction (NewGameNationScreen's
   `focusedIndex`) and whether plain `getByRole().click()` still works on it.
2. **Reset the stale spec assumptions** — what row 1 of `mvp-loop.spec.ts`
   assumed vs. what exists now (its button names "Next: Choose Nation",
   nation-at-the-end ordering, "Choose your archetype" heading, "Start
   Campaign"). State precisely which selectors break and the current replacement
   interaction for each.
3. **Guided first-month inspection** — read `shell/useGuidedInspection.ts`,
   `shell/guided-inspection-state.ts`, and where the overlay mounts. When does
   it auto-open (`shouldAutoOpen`), is it active on a fresh compile, and does it
   overlay/block the screens the current specs click (did rows 1+ already have to
   pass through it)? Is it currently covered or interference for e2e?
4. **Reachable-but-uncovered production screens** — for Research & Technology,
   Diplomacy & War, and Treasury: the exact headings/aside labels, the
   submit-affordance copy ("Set priorities" / "Submit command" / blockade area
   select), the optimistic-concurrency notice copy ("Command queued" /
   "Priorities queued"), and which bridge commands they exercise. Also the
   landing surface: recent-campaigns / "Open Campaign" / "Verify" / "Replay" /
   "Recover" copy and the `listCampaigns` recency surface.
5. **Debug-gating proof** — confirm from `shell/debug-mode.ts` +
   `electron.vite.config.ts` that a production build (no `VITE_BLUEWAVE_DEBUG`)
   excludes Simulation/Tactical Sandbox/Debugging from the sidebar and that the
   rows-1–6 suite never enters Simulation. Note the exact `NODE_ENV`/flag
   mechanics a hypothetical debug e2e build would need (for ticket 09).

Write the findings to `docs/research/e2e-expansion-current-flow-surface.md`
(link it as this ticket's asset on resolution). Keep it a factual inventory
with file:line references — no recommendations.