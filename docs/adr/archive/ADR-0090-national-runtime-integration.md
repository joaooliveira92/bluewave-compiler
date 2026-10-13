# ADR-0090: National naval profiles at runtime (construction economics, access, research, procurement)

## Status

Accepted 2026-10-10. Extends ADR-0089 (the `NationNavalProfile` model) by wiring national identity into the live
campaign economy, research, AI and construction order policy.

## Context

ADR-0089 introduced the platform-independent `NationNavalProfile` and the two-nation content, but the profile only
reached ship design through the drawing board; the campaign runtime (construction cost/duration, research allocation,
fleet procurement) ignored it. This ADR records how national identity becomes authoritative at runtime while global
classification, component legality and the construction-order policy stay the sole authorities.

## Decision

1. **Construction economics are composed once and persisted (ADR-0089 §1).**
   `@bluewave/ship-design`'s `nationalConstruction.ts` composes the industrial cost/build-time multipliers with the
   heavy-gun and armour-plate access premiums (basis points, integer, round-up) into one
   `NationalConstructionModifiers`. `placeConstructionOrder` resolves the nation's profile from the ship-building
   content at the order month and passes the combined cost multiplier into
   `projectedConstructionOrderCosts(design, costMultiplierBp)`; the resolved multipliers and the profile id are
   written onto the `ConstructionProject` (`nationalProfileId`, `costMultiplierBp`, `buildTimeMultiplierBp`).
   `fundConstructionProject` scales the project's effective yard capacity by `buildTimeMultiplierBp`, so build time
   is honoured without re-pricing. Because the values are persisted at order time, later content changes never
   retroactively change an existing project. A project ordered without content (fixtures, nation-neutral callers)
   keeps the previous arithmetic exactly.
2. **Component access is a narrow, explicit policy (ADR-0089 §2).** `accessEffect(status, policy)` maps the five
   access states to cost/delivery/reliability/refit consequences; `ComponentAccessPolicy` carries only
   `{ wartime, alignment }` — no diplomacy system. In wartime a neutral/hostile overseas supply line is cut, which
   makes the nation's construction modifiers fail closed (`NATIONAL_SUPPLY_UNAVAILABLE`) rather than silently
   build. `catalogueForNation` already removes `UNAVAILABLE` families at design time.
3. **Research priorities reflect doctrine without dominating (ADR-0089 §3).** `nationalResearch.ts` turns the
   profile's `researchPreferences` into a full field allocation, capped so at most five fields are HIGH, flattened
   under budget pressure, capped when a field is saturated, boosted by a deficiency, and varied ±1 by a
   campaign-seeded stream. `AiPlanner` accepts the allocation and, when it covers every field with a valid priority,
   emits it as the `SetResearchPriority` body; otherwise it keeps its neutral randomisation. The phase engine
   supplies the allocation from the profile (`runAiPlanningPhase`), so no command-body change leaks a ship-design
   dependency into `@bluewave/ai`. Player choices are never overridden: the allocation is only what the AI emits.
4. **AI fleet assessment and procurement decision (ADR-0089 §4, §8-9).** `fleetProcurement.ts` assesses the fleet by
   type/status, computes deficits from the profile's procurement shares, chooses the first build-order role with a
   deficit, selects doctrine-appropriate archetypes, generates legal candidates through the authoritative
   `generateCandidates`, rejects blocking/dock/affordable failures, ranks with the role's national weights and a
   diversity penalty, and returns a structured `ProcurementDecision` (deficits, role, candidates, rejection reasons,
   selected design/draft, resolved cost, access effects, and a `noProcurementReason` instead of throwing). It never
   mutates state.

## Alternatives considered

- *Apply modifiers per-component during compile.* Rejected for the order projection: the order projection is
  mass-based, so a single ship-level multiplier (composed from the access premiums of heavy guns and armour) is
  applied exactly once; per-component access consequences remain available via `accessEffect` for a later pass.
- *A new command type for AI construction.* Deferred: ordering requires an approved design in the snapshot, which
  runs through the existing design-study pipeline; the decision module is delivered and tested first (see
  Consequences).
- *Let a national preference saturate the research board.* Rejected: the HIGH cap, saturation cap and budget-pressure
  flatten keep doctrine from permanently dominating.

## Consequences

- `ConstructionProject` gains three optional fields; existing projects and fixture snapshots omit them, so
  cross-process determinism and the golden hashes are unchanged (the fixture has no naval profiles).
- AI nations with a profile now research by doctrine; the production campaign's France does, the UK (player) does
  not. The cross-process fixture has no profiles, so its hashes are unchanged.
- **Live AI procurement (ADR-0091, phase `ai_procurement`, order 1.6)** closes the loop: `runAiProcurementPhase`
  assesses the fleet (including building ships, projects and open intents), plans a decision, submits the chosen
  candidate as a `SubmitDesign` command through the existing lifecycle and `applySubmitDesign` (creating a design
  study), and — after the study approves the design — places an order through `placeConstructionOrder`. It persists
  a `ProcurementIntent` per attempt (stable ids and explicit states) and emits bounded `AI_PROCUREMENT_*` / `AI_DESIGN_STUDY_*`
  diagnostics. One active intent per role group bounds duplicate procurement; retries are bounded (3); an approved
  intent that stays unaffordable for 12 months expires with a structured reason; any unexpected error is recorded as
  a deferral so a month can never be aborted by procurement.
- Remaining limitations: the intent's `dockRequirement` is reserved but not yet populated; per-intent budget
  reservation relies on the existing study/appropriation funding (no new reservation); component-access refit
  consequences remain modelled but unconsumed by the refit pipeline.
