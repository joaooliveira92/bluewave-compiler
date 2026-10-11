# ADR-0068: Campaign command screen — decisions

## Status

accepted (2026-10-08). Spec: `.scratch/campaign-command-screen/spec.md`; map and decision tickets in the same folder. Builds on ADR-0059.

## Decisions
1. **Features, not layout.** The home screen becomes a map-first command screen; RTW3's tab strip and 15-button action grid are not copied. BottomNav stays the only screen navigation; RTW3 buttons map to existing screens or contextual actions, and engine-absent ones appear as "Not yet modelled" items inside their eventual screen.
2. **Status strip readouts are real or labelled.** Nation and Budget groups show only engine-derived values; deferred readouts (prestige, morale, unrest, dock size, build requirement, treaty limits, naval aircraft, extra training, intelligence) sit behind one "Not yet modelled" disclosure with reasons.
3. **Monthly budget is labelled "projected"** until the revenue source is confirmed: `baseResources` is compiled as 0 while the revenue phase pays from it, and the projection shows a scaled income figure. Needs an owner/engine check.
4. **`FOREIGN_STATION_RULE_V1`:** "ships on foreign stations" counts a ship whose area is controlled by another nation (own areas and unclaimed seas excluded). It is a ship count, not tonnage, because campaign views carry no per-ship displacement. Display-only; no engine state.
5. **Shipyard capacity** is shown as the sum of port levels, labelled "(port levels)", until per-yard capacity is wired (SB-14b).
6. **Area regions** are a presentation-layer table with an exhaustiveness test over the compiled areas; no content or golden change.
