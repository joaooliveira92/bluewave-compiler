# INC-11 — Foreign technology-insight milestones

**State:** PARTIAL/BLOCKED — insight logic + wiring landed; unreachable until the research engine materialises content technologies · **Frontier:** no · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R24) · **ADR:** ADR-0138 (foreign-construction save state; DESIGN-16 §13.1–13.4) · no new ADR (DESIGN-16 §13.5 shipped)

## What to build

Make ordering abroad a way to catch up: when the ordering nation lacks the technology, foreign
construction awards research insight at three milestones — the manual's "you may gain insight into the
technology of the building nation".

## Acceptance criteria

- [ ] When the contract references `foreign_construction_insight_v1` and the ordering nation lacks the
      technology, insight is awarded exactly: design-study `500` research micro-points at acceptance,
      construction-observation `1_000` at 50 % paid work, delivery `1_500` at delivery — capped at
      `3_000` per technology family and contract. **FALSE end-to-end:** the values, cap and duplicate guard
      are implemented and unit-tested, but no compiled campaign reaches them (see Answer (a)/(c)).
- [ ] Insight never grants a technology, bypasses prerequisites, moves availability dates, duplicates a
      milestone, or exceeds the technology's remaining research requirement. **FALSE end-to-end:** the
      no-direct-grant rules are implemented and unit-tested, but the remaining-requirement clamp is inert
      for content technologies because the engine's cost lookup is the stub `TECH_DEFINITIONS`
      (see Answer (b)).
- [ ] A technology already known to the ordering nation awards nothing (implemented + unit-tested). Only
      the **policy half** of the eligible-family source lands: the eligible families are the shipped policy
      list `FOREIGN_INSIGHT_ELIGIBLE_FAMILIES`. The compiled-design half is **deferred** — the compiled
      design carries no major-technology-family list (see Answer).
- [x] Tests: unit (each milestone, the cap, no direct grant); boundary (already-known awards nothing);
      determinism (no duplicate award; stable ordering of eligible families). The integration test injects
      an eligible `activeCandidates` entry directly; the reachability gap is pinned by a dedicated unit test.

## Notes for implementator

Posts research micro-points into the existing research model; never flips a technology. Depends only on
the contract from INC-9.

## Answer

**Honest status: PARTIAL/BLOCKED.** The insight logic and its wiring at the two milestone sites are landed
and unit-tested, but the ticket's headline acceptance criteria are **false end-to-end** in a compiled
campaign: the research engine has no content technology catalogue, so no insight milestone is ever awarded
for a real technology. This is a reachability gap owned by the content-runtime effort, not a defect in this
ticket's pure module.

**(a) Implemented and unit-tested.** The milestone values (`500`/`1_000`/`1_500`), the per-family and
per-contract `3_000` cap, the duplicate guard (a recorded milestone is never re-awarded) and the
no-direct-grant rules (never sets `completed`, never edits `discoveredTechs`/`activeCandidates`/
`fieldPriorities`, never moves availability) are implemented and unit-tested in
`packages/phase-engine/test/foreign-insight.test.ts`. The module is pure, integer-only and deterministic.

**(b) The remaining-requirement clamp is inert for content technologies.** `resolveForeignInsight` bounds
each award by `remainingRequirementFor(techId)`, and the wiring supplies
`makeRemainingRequirementFor(research, researchCostOf)`. `researchCostOf` reads the engine's cost table,
which is still the stub `TECH_DEFINITIONS` in `packages/phase-engine/src/research.ts` (6 fabricated techs:
`basic_hull`, `advanced_hull`, `basic_steam`, …). The real content technologies live in
`content/production/1880/technologies.yaml` and are never materialised into that table, so for a content
technology `researchCostOf` returns `undefined` and the award is bounded only by the `3_000` family cap.
The pure unit tests prove the clamp with a supplied cost; the wiring will honour it automatically once the
engine's cost lookup is content-materialised.

**(c) `activeCandidates` is never populated for content technologies, so no milestone awards in a compiled
campaign.** `resolveForeignInsight` reads the target technology from
`research.activeCandidates.get(familyId)`. The research phase (`packages/phase-engine/src/research.ts`
`resolveResearchPhase`) only sets `activeCandidates` for technologies that appear in `TECH_DEFINITIONS`; a
compiled nation's `technologies` come from `packages/campaign/src/nationCompilation.ts` `buildResearch`
(the `research.yaml` starting state), whose content tech ids are absent from the stub, so they are never
selected and `activeCandidates` stays empty. A compiled-campaign-style state therefore awards nothing. The
integration test injects an eligible `activeCandidates` entry directly to prove the order/month wiring, and
a dedicated unit test pins the gap ("awards nothing for a compiled-campaign research state with no active
candidates").

**(d) Owner effort and files.** Materialising the content technology catalogue into the engine is not owned
by this ticket. The owning effort is the **content-runtime integrity** boundary
(`.scratch/content-runtime-integrity/`, ADR-0122/0123/0124), whose invariant is "validated content is the
only thing that runs": it compiles `content/production/1880/technologies.yaml` into the content artifact and
carries the `research` campaign collection so the runtime consumes validated content. It does **not** yet
replace the phase-engine's `TECH_DEFINITIONS` stub — that is the missing integration.
`.scratch/content-2-prewar-tech-design/` explicitly scopes "zero engine change" and does **not** own it.
The exact files are `packages/phase-engine/src/research.ts` (`TECH_DEFINITIONS`, `researchCostOf`,
`resolveResearchPhase`) and `packages/campaign/src/nationCompilation.ts` (`buildResearch`).

Implemented DESIGN-16 **§13.5** (the ticket's "DESIGN-13" was a stale citation; the section lives in
`docs/rules/bases-and-infrastructure.md` §13.5, lines 442-461) as a pure module plus wiring at the two
milestone sites. Rule source: `docs/rules/research-and-technology.md` §11.3 (insight) and §11.2
(progress never exceeds cost), plus the numeric contract's research micro-point unit.

**Files**

- `packages/phase-engine/src/foreignInsight.ts` (new) — the pure engine:
  `resolveForeignInsight` (awards `{ familyId, techId, microPoints }[]` + updated record),
  `applyForeignInsightAwards` (posts into `ResearchState.technologies[].investedPoints`),
  `applyForeignInsightMilestone`, `foreignInsightMilestonesDue` (the 50 %/delivery gates),
  `foreignInsightEligibleFamilies`, `isForeignInsightContract`, `makeRemainingRequirementFor`,
  `mergeForeignInsightAwardRecord`, and the shipped constants
  (`FOREIGN_INSIGHT_POLICY_ID`, `FOREIGN_INSIGHT_MILESTONES`,
  `FOREIGN_INSIGHT_MILESTONE_MICRO_POINTS` 500/1 000/1 500,
  `FOREIGN_INSIGHT_PER_FAMILY_CAP_MICRO_POINTS` = 3 000, `FOREIGN_INSIGHT_ELIGIBLE_FAMILIES`).
- `packages/phase-engine/src/foreignConstruction.ts` — `FOREIGN_TECHNOLOGY_TRANSFER_POLICY_ID` now
  aliases the canonical `FOREIGN_INSIGHT_POLICY_ID`; the acceptance award in `placeForeignConstructionOrder`
  via the new `applyAcceptanceInsight`. The review-flagged invented contract field
  `insightEligibleFamilyIds` was **removed** (see the eligible-family decision).
- `packages/phase-engine/src/foreignContractPhase.ts` — `runForeignContractPhase` posts the observation
  milestone at ≥50 % paid work and delivery on completion, threading one `ResearchState` and the per-
  contract record across the nation's projects.
- `packages/phase-engine/src/research.ts` — exports `researchCostOf(techId): number | undefined` (the
  research model's own cost authority) for the remaining-requirement clamp.
- `packages/campaign/src/state.ts` — `ForeignInsightAwardRecord`; `NationState.foreignInsightAwards?`
  (optional and hash-neutral when unused). No `ForeignConstructionContract` insight field.
- `packages/campaign/src/index.ts`, `packages/phase-engine/src/index.ts` — type/symbol exports.
- `packages/phase-engine/src/snapshotClone.ts` — explicit `ForeignInsightAwardRecord` entry + `_Assert`,
  `foreignInsightAwards` clone coverage.
- `packages/phase-engine/test/foreign-insight.test.ts` (new), `packages/phase-engine/test/snapshot-clone.test.ts`,
  `.../snapshotClone.test.ts` — clone fixtures.

**How insight posts into research without granting a technology.** Insight adds `microPoints` to the
target `TechnologyProgress.investedPoints` and nothing else: it never sets `completed`, never edits
`discoveredTechs`, `activeCandidates` or `fieldPriorities`, and never touches availability. Discovery
stays the research phase's decision (DESIGN-20 §11.3/§13, which revalidates prerequisites and
availability first), so prerequisites cannot be bypassed and no availability date moves. The per-
technology award is `min(milestone, family cap remaining, remaining requirement)`; the family cap is
per family *and* contract, so three milestones total exactly 3 000.

**Eligible-family source decision (recorded).** The compiled `CompiledDesignVersion` genuinely carries
no major-technology-family list (it persists armament identity, hull/machinery and the construction
plan, not the component `requires`). Per the ticket's fallback, the eligible families are authored
explicitly by the shipped policy `foreign_construction_insight_v1`
(`FOREIGN_INSIGHT_ELIGIBLE_FAMILIES` = the canonical research fields, DESIGN-20 §1 — the technology
chains' families), selected by the contract's `technologyTransferPolicyId`. The review flagged the
contract-level `insightEligibleFamilyIds` field as an invented DESIGN-16 §13.1 field (no such field
exists in §13.1); it has been **removed** from the contract, the terms, validation and the clone surface,
and `foreignInsightEligibleFamilies` reads only the shipped policy list. No families are fabricated.
Deferral: the **compiled-design half** of §13.5's "listed by the compiled design and policy" is deferred
until the compiled design persists its required-technology families; the policy list can then be
intersected with the design's own families.

**Duplicate guard.** `NationState.foreignInsightAwards?: ForeignInsightAwardRecord[]` (one record per
`contractId`) records the milestones awarded and the micro-points per family. A milestone already in
`milestones` is never re-resolved; the field is created only on the first actual award, so a save that
transfers no insight is byte-identical to INC-9 and existing hashes do not move.

**Commands + results** (re-run after the INC-11 repair; the invented contract field removed)

- `pnpm --filter @bluewave/campaign exec tsc -b` — pass.
- `pnpm --filter @bluewave/phase-engine exec tsc --noEmit` — pass.
- `pnpm --filter @bluewave/phase-engine exec vp test run` — 40 files / 436 tests pass
  (19 in `foreign-insight.test.ts`; 7 + 13 in the two clone suites).
- `pnpm --filter @bluewave/persistence exec vp test run` — 13 files / 75 tests pass.
- `pnpm exec vp lint .` — 0 warnings / 0 errors.
- `pnpm exec vp fmt --check .` — clean.
- `node scripts/verify-no-unknown-casts.mjs` — no new assertions (290 existing remain).
- `pnpm check:golden` — 10/10 hashes match. `pnpm check:determinism` — two runs byte-identical.
  **No golden or determinism movement** (both phases are strict no-ops without a foreign project /
  accepted insight contract; `foreignInsightAwards` is created only on the first actual award, and the
  invented contract field was optional and never authored in production content).

**Deferred.** Per-technology remaining requirement is enforced exactly when the research model carries a
cost for the technology (`researchCostOf`); the engine's cost table is still the stub `TECH_DEFINITIONS`
(real content technologies are not materialised into it), so for an unknown cost the award is bounded
only by the 3 000 family cap — the pure unit tests prove the remaining-requirement clamp with a supplied
cost, and the wiring automatically honours it once the research model materialises content costs.
**Reachability (see (c)/(d) above):** `activeCandidates` is never populated for content technologies, so
no milestone is awarded in a compiled campaign until the research engine is content-materialised by the
content-runtime integrity effort. UI (foreign-builder selection, insight readouts) is out of scope as
instructed; the war/impoundment effects (§13.6-13.7) remain INC-10.
