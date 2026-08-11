# B10a Milestone: Economy + Construction

## Scope

### Economy (aligned to DESIGN-13)

Production-ready economy in the monthly phase pipeline. `MonthExecutor` already has phases for appropriation, obligation, and construction. B10a formalizes these against the canonical economic state contract.

In scope:

- **Monthly revenue / possession income**: Nations earn income from controlled possessions each month (`POST_MONTHLY_REVENUE`). Income is derived from `baseResources` and possession yield, credited to treasury.
- **Financial ledger**: A balanced, hashed ledger per nation. Every treasury change is a balanced transaction with debit/credit postings summing to zero. Builds on the existing `FinancialLedger` in `phase-engine`, extended to the canonical `LedgerTransaction` shape (category, formula id, rounding mode, pre/post hash).
- **Maintenance cost**: Ships in port incur `MAINTENANCE_EXPENDITURE` per turn, drawn from treasury. This gives construction and fleet size real economic weight.
- **Appropriation**: The existing proportional appropriation phase formalized against `navalAppropriationRateBp` / `monthlyNavalAppropriation` from DESIGN-13 (basis-point rate, `FLOOR` rounding).
- **Obligation**: Mandatory fixed expenses paid before discretionary spending, matching the existing `obligation` phase.
- **Treasury invariants**: Treasury stays within `0..9_000_000_000_000_000` currency micro-units; never negative at a committed boundary (existing opening/closing validation retained).

Explicitly out of scope for B10a (deferred):

- **Tax rates** and political/budget pre-spending changes (deferred to B10c politics).
- **Industrial capacity** as a separate bottleneck resource (construction capacity handled within construction, below).
- **Resource extraction** and trade income (trade requires diplomacy; deferred to B10c).
- **Arrears / insolvency / surplus state machines** (post-MVP; treasury simply clamps and flags).
- **Wartime modifiers** (blockade, war costs — B10c).

### Construction (aligned to DESIGN-23)

Production-ready ship construction, extending the existing `ConstructionProject` in `NationState`.

In scope:

- **Ship construction projects**: Ships built over multiple turns, consuming treasury work. Extends the existing `ConstructionProject` type (`type: "ship"`) with the canonical `DockyardProject` fields: `totalWork`, `completedWork`, `paidWork`, `status`, `startedAt`.
- **Project status lifecycle**: `PLANNED` → `AUTHORIZED` → `ACTIVE` → `COMPLETED` (minimal set; `HALTED`/`DELAYED`/`ACCELERATED`/`CANCELLED` deferred). Invalid transitions fail with a specific reason code.
- **Paid-work rule** (DESIGN-23 §7.4): Construction progress is based only on paid effective work. A project receiving zero payment receives zero work. This is the canonical constraint the existing month.ts appropriation must honor.
- **Completion**: When `completedWork` reaches `totalWork`, the ship transitions from a construction project to a commissioned ship in `FleetState` (using the existing `isUnderConstruction` / `constructionProgress` fields).
- **Construction capacity**: A simple per-nation monthly construction-work cap derived from `baseResources` (a production-ready stand-in for DESIGN-16 shipyard capacity, without the full dockyard-capacity system). Projects exceeding available capacity accrue to next month.

Fleet/class ordering beyond one project at a time is deferred.

Explicitly out of scope for B10a (deferred):

- **Ship design system** (hull/machinery/armament/armor) — B10b.
- **Naval base construction** / infrastructure / fortifications — B10c or later.
- **Repair / rebuild / conversion / scrapping** — post-MVP.
- **Class order batches** (1–12 ships of one design) — B10b with design.
- **Acceleration / delay / latent defects** — post-MVP.

### Fixture

- Extend the 1880 fixture minimally to make economy meaningful: add **Germany (GER)** as a third nation with a few areas, a port, and a fleet. GBR/FRA alone is too thin for a construction-triggering economy.
- Keep GBR vs FRA as the primary war/peace pair; GER is a passive economic participant for B10a.

### Command surface

- Add a production command for ordering construction and budgeting, extending the existing `BudgetProjectCommand` in `@bluewave/commands`, validated through `CommandLifecycle`. The existing `command_collection` and `appropriation` phases consume it.

### Package placement

- **Extend `@bluewave/campaign`** for the economic state and construction aggregate types (they already live in `NationState` / `ConstructionProject`).
- **Extend `@bluewave/phase-engine`** for the monthly economic and construction phases (month.ts already has appropriation/obligation/construction).
- **Extend `@bluewave/commands`** for the construction command.
- No new packages for B10a. AI legality (a new `@bluewave/ai`) is B10d.

## Out of scope

- Tax rates, political budget changes, trade income, resource extraction (economy breadth)
- Industrial capacity, arrears, insolvency, surplus, wartime modifiers
- Ship design system, naval bases, fortifications, repair/rebuild/conversion/scrapping
- Class order batches, acceleration, delay, latent defects
- AI decision-making (B10d)
- Any desktop render of economy/construction (B9 is CLI-only; B10a stays CLI)

## Acceptance criteria

1. `MonthExecutor` runs a full monthly turn with GBR, FRA, and GER.
2. Each nation's treasury updates monthly: possession income credited, maintenance deducted, construction and expenses paid — all recorded as balanced ledger postings.
3. Financial ledger hash changes deterministically and equals the canonical serialization of its entries.
4. A ship construction project progresses only when funded (paid work); zero payment → zero progress (DESIGN-23 §7.4).
5. A completed construction project produces a commissioned ship in `FleetState` (no longer `isUnderConstruction`).
6. Treasury never goes negative at a committed boundary; negative-treasury attempt is flagged with a specific reason code.
7. All state changes are deterministic for a fixed seed (replay produces identical snapshots and hashes).
8. `CommandLifecycle` accepts/rejects the construction and budget commands with typed outcomes.
9. Existing compiler, command, phase, persistence, and determinism test suites still pass.
10. `vitest run` passes across the workspace.

## Stop conditions

- A canonical DESIGN-13/23 invariant cannot be expressed within the existing `CampaignSnapshot`/`NationState` structure without a breaking persistence change (then stop and propose a migration ADR).
- Balanced-ledger requirement conflicts with the existing treasury-based `FinancialLedger` in a way that forces a rewrite of `phase-engine` (then stop and re-scope).
- The paid-work-only rule (DESIGN-23 §7.4) cannot be satisfied without a full construction-capacity system (then pull construction capacity into B10a scope and re-estimate).
- Determinism cannot be preserved for a fixed seed across the new economic and construction phases.
