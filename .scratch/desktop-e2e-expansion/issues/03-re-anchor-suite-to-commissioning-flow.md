# Desktop E2E Expansion — 03: Re-anchor the suite to the current commissioning flow

Type: grilling
Status: open
Blocked by: 01 — Observable surface of the current commissioning flow & uncovered production screens

## Question

The suite is red: `mvp-loop.spec.ts` row 1 and `continuance.spec.ts` setup both
time out because the commissioning flow was restructured (nation selection now
precedes preferences; the seed field is in the "Rules of the Naval Age" step
via Era & Scale; "Next: Choose Archetype" replaced "Next: Choose Nation").
What is the canonical **re-anchored** create flow that the suite's create-side
specs should drive, and which selector strategy should the re-anchor adopt?

Weigh (with the facts from ticket 01):

- The exact step order and each step's primary-action / heading labels to key on
  (landing → nation "Fleet Dispatch" → Rules of the Naval Age → archetype → …
  review → launch → Overview), and whether any step the suite doesn't need
  (identity, briefing, commissioning review) is skippable or must be driven
  through.
- Seed entry point: the "Campaign Seed" input id `campaignSeed` inside Era &
  Scale — confirm it is the deterministic input for `commitMonth` months, and
  how to reach it in the flow without the pre-existing label assumption.
- Selector strategy for the keyboard/focus-driven nation listbox: plain
  `getByRole("option").click()` vs `data-testid` additions — and the standing
  rule "add `data-testid` only where accessible copy is genuinely ambiguous".
- Scope of the repair: re-anchor only the create-side narrative (mvp-loop rows
  1–5, continuance setups) to the current flow, keeping the assertions that
  still hold (Overview "Campaign Overview", "Revision 0", "campaign-…-1880 …"
  identity), or also refresh the fleet row 6 copy in the same pass.
- Whether the re-anchor lands in the follow-up suite implementation or inside
  this map as a task ticket (the map's plan-don't-do default says hand it off as
  part of the repair-run plan in the handoff matrix).

The resolution records the decided flow order, selector decisions, and the
repair-run shape — the implementation is the follow-up effort.