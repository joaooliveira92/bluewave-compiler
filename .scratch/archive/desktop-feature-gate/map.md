# Wayfinder Map: Desktop Feature Gate (engine-built → desktop-surface)

## Destination

A gated, prioritized set of desktop (`apps/desktop`) features that surface
**engine-built, accepted** capabilities the desktop does not yet expose —
nothing fabricated. Each candidate is grounded in an authoritative engine
anchor from `.ai/SPRINT-PLAN.md` / PROGRESS. The map's only job is to decide
*what to build next*; the frontier candidate then becomes a normal sprint
(spec → slice → implement → review → gate → commit).

## Notes

- Domain: Bluewave, a deterministic 1880–1970 naval strategy sim. The desktop
  (`apps/desktop`, Electron 41 + React 19) drives a real campaign through ~26
  `campaign:execute` bridge commands against `@bluewave/campaign-engine`
  projections + `MonthExecutor`. The desktop NEVER mutates authoritative state;
  it issues command envelopes + renders read-only projections.
- Anchor for this session: the user asked to work on the **desktop** — "missing
  some features the engine already built" — and to gate ideas from SPRINT-PLAN.
- Standing precedent: `.scratch/desktop-engine-feature-gate/` already gated and
  shipped Research & Technology and (.scratch/desktop-diplomacy-war) Diplomacy &
  War; its recorded **next frontier** is tactical battle-outcome surfacing (B-6
  follow-up). This map broadens the gate across SPRINT-PLAN engine-built
  capabilities and re-confirms the frontier increment.
- Frontier rule: one decision ticket per session; the chosen generator
  candidate becomes a normal sprint. Candidate 01 (battle outcomes) is the
  recorded next frontier — expect it to win the gate.
- Constraints: engine/combat/phase-engine packages are being changed by a
  *concurrent* agent session on the phase-engine — the desktop sprint must
  remain read-only over the engine (projection + bridge + renderer only), must
  not touch `BattleResolver`/`StrengthCalculator`, and must not change
  authoritative hashes.

## Decisions so far

- [01-gate-and-frontier](issues/01-gate-and-frontier.md) — gate = engine-built,
  accepted capabilities the desktop can surface measurably; frontier = tactical
  battle-outcome surfacing (B-6 follow-up) because (a) it is the recorded next
  frontier of the prior desktop-engine-feature-gate effort, (b) the engine
  already emits `BattleResolved` events + `wars.battles[].result`
  (winner/loser/losses/explanation) that the desktop's `closingSnapshot` and
  turn report ignore today. See ticket for the full candidate ledger + rationale.

## Not yet specified

- Surfacing depth for other engine-built capabilities after the frontier lands
  (weather, AI-plan, design-template read-only views) — not sharp enough to
  ticket until the battle-outcome surface proves the seam pattern.
- Whether battle outcomes should be a strategic turn-report card, a dedicated
  "Recent Battles" view, or both — a render-shape decision for the spec phase,
  not the gate.

## Out of scope

- Changing any authoritative engine/combat/phase-engine behavior, content pack,
  or golden hash from a desktop sprint (the phase-engine is being worked by a
  concurrent session).
- Re-authoring engine design templates / establishing a design-er UI — the
  engine compiles designs; desktop re-authoring is not needed to render
  progress/discovery (recorded in `.scratch/desktop-engine-feature-gate/map.md`).