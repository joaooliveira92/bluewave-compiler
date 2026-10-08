**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §10 (Research Management) of [01-diagnosis.md](../01-diagnosis.md).

**Already decided during charting**: adopt the real weight-based allocation
model (`fieldPriorities` with `RESEARCH_FIELD_PRIORITY_WEIGHTS`, capped by
`MAX_HIGH_PRIORITY_FIELDS` — `packages/campaign-engine/src/research.ts:34-57`)
instead of building the doc's proposed basis-points-summing-to-10,000 system.
This ticket designs the UI/spec around that real model, not the doc's §10.3.

Decide:

1. **Research page fields** (§10.2): confirm each listed field (name,
   description, current allocation, progress, level/known-tech state,
   projected monthly progress, bonuses/penalties) is real and derivable from
   `ResearchState` (`researchBudget`, `fieldPriorities`, `discoveredTechs`,
   `technologies[]`).
2. **Allocation editing model**: since the real mechanism is integer
   weights (not basis points), design the equivalent of §10.3–§10.4's
   "adjust in stable increments" / "auto-balance" UX against weights and
   `MAX_HIGH_PRIORITY_FIELDS` instead. Decide what the UI analog of a
   "balancing category" is under a weight cap, or whether that concept
   doesn't apply and gets cut.
3. **Command shape** (§10.5): redesign `ReviseResearchAllocationCommand`'s
   payload to carry weights/priorities instead of basis points; confirm
   against the real `CAMPAIGN_COMMAND_NAMES` contract (likely
   `setResearchPriorityCommand`, per the charting-session IPC audit) rather
   than inventing a new command name.
4. **Monthly resolution** (§10.6): confirm research resolution during
   month-advance already exists in `phase-engine`/`campaign-engine` in some
   form; decide what's genuinely new for M2 versus already implemented.
   Cross-check RNG usage against
   [Determinism/RNG audit](./17-determinism-rng-audit.md) once it resolves.

## Answer

Verified against `packages/campaign-engine/src/research.ts`,
`packages/campaign/src/state.ts` (`ResearchState`), and
`packages/phase-engine/src/research.ts` / `month.ts`. The real model is
**already fully implemented end-to-end**; this ticket's job is to design the
M2 research page + edit UX around that real model, not build an allocator.

### 1. Research page fields (§10.2)

The projection already exists: `buildResearchScreenProjection`
(`packages/campaign-engine/src/research.ts:66-92`) exposes `researchBudget`,
`fieldPriorities` (Record<fieldId, weight>), `discoveredTechIds`,
`inProgressTechnologies` (`{techId, investedPoints, completed}`), and
`currentProjectTechId`. The 15 canonical fields come from
`CANONICAL_RESEARCH_FIELD_IDS` (content-schema `research-fields.ts:8-24`).
Map the doc's list onto reality:

- **name** — the 15 canonical `ResearchFieldId`s; real.
- **description** — no authored description exists for any field; **cut** (do
  not fabricate flavor copy). Display only the stable field id/name.
- **current allocation** — `fieldPriorities[fieldId]` (integer weight:
  `HIGH=4 / MEDIUM=2 / LOW=1`); real, no per-row derived cost.
- **progress / level / known-tech state** — `inProgressTechnologies[].investedPoints`
  + `completed`, and `discoveredTechIds`; real.
- **projected monthly progress** — derivable deterministically: the engine
  allocates research resources by largest-remainder proportional split over
  the weight-bearing fields (`phase-engine/research.ts` `largestRemainderAllocation`),
  so projected points-per-field is a pure function of `researchBudget` +
  weights. Specify it as a projection derivation, not a stored field.
- **bonuses/penalties** — research-speed and technology-variation are real
  per-campaign settings (`packages/campaign/src/researchSpeed.ts`,
  `technologyVariation.ts`) that modulate monthly resolution. Surfacing them
  as an explainable "effective modifier" is in scope only where they actually
  affect that field's progress; otherwise omit. Do not invent per-field
  bonuses that don't exist.

### 2. Allocation editing model (replaces doc §10.3–§10.4)

Adopt the real integer-weight model. There is **no fixed-total invariant** on
weights (they never must sum to 10,000), so the doc's basis-points
"auto-balance / balancing category" concept **does not apply and is cut**.
The UI analog of the weight cap is `MAX_HIGH_PRIORITY_FIELDS = 5`: a field's
priority is selectable as `HIGH / MEDIUM / LOW / (unset)` with a
deterministic rule that **no more than 5 fields may be `HIGH`**. The
"balancing" constraint becomes that single cap — when raising a 6th field to
`HIGH`, the edit is rejected (or the player must first lower another `HIGH`
field); there is no silent redistribution. Editing writes the complete
`fieldPriorities` record in stable increments (one priority change per
command), matching `SetResearchPriorityCommand`'s whole-record payload.

### 3. Command shape (replaces doc §10.5)

Use the real `SetResearchPriorityCommand`
(`packages/commands/src/envelope.ts:35-40`):
`{ type: "SetResearchPriority", nationId, fieldPriorities: Record<string, SafeInt>, exactTechId? }`
issued as the existing desktop command (`setResearchPriorityCommand`), with
Zod at the IPC boundary + domain validation in the phase engine. **No new
command name or payload shape.** The doc's basis-points
`ReviseResearchAllocationCommand` is dropped.

### 4. Monthly resolution (§10.6)

Already implemented: `resolveResearchPhase`
(`packages/phase-engine/src/research.ts:80`) runs as phase `resolve_research`
(phase 9 in `month.ts:920-931`), spends the research budget from treasury
(ADR-0036), allocates by largest-remainder, does a seeded weighted field draw
(`drawWeighted`) via the campaign RNG stream (`random/.../research`),
ledgers `researchProgressedEvent`, and is deterministic. The desktop
Research & Technology screen already ships this projection + command issue
path (desktop-engine-feature-gate INC-1 report). **Genuinely new for M2:
nothing in the resolution itself** — only the field-level edit UX and any
missing wiring on top of the shipped screen.
