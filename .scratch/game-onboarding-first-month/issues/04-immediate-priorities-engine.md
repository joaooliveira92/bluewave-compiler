**Type:** grilling
**Status:** resolved
**Blocked by:** 11

## Question

Spec §7 (Immediate Priorities System) of [01-diagnosis.md](../01-diagnosis.md).

No priority/warning-card system exists anywhere in the engine today — this
is a wholly new subsystem. Decide:

1. **Priority shape and types** (§7.2–§7.3): confirm the `StrategicPriority`
   interface and the eight priority types are all buildable from real data.
   `obsolete_active_class` in particular depends on an "obsolescence score"
   the doc itself flags as possibly not trustworthy yet (§7.4) — verify
   current state via a research subagent before committing to it; fall back
   to the doc's own suggested technology-gap-only comparison, or cut the
   type entirely, if no trustworthy signal exists.
2. **Trigger rules and thresholds** (§7.4): adopt the doc's numeric
   constants as-is (8% research minimum, the cash-reserve/deficit formulas,
   `remainingMonths <= 2`, etc.) — this was decided during charting and is
   not open for renegotiation here. `high_foreign_tension` depends on
   [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md),
   which this ticket is blocked by — use its resolved threshold, don't
   invent one.
3. **Sorting and dismissal** (§7.5–§7.6): confirm feasibility of the sort
   key (severity → financial risk → time-to-consequence → stable type order
   → stable id) against real data availability for "direct financial risk"
   and "shortest time to consequence" per priority type. Confirm dismissal
   metadata storage (campaign UI metadata, keyed by fingerprint) fits the
   real persistence model from [Saving, loading & campaign-list](./16-saving-loading-campaign-list.md).

## Answer

Verified against the real snapshot/projection surfaces (a research subagent
grounding pass + direct re-reads). The priorities system is **a wholly new,
pure, read-only projection** in `@bluewave/campaign-engine` (new
`src/priorities.ts`, re-exported like `diplomacy.ts`/`research.ts`) — it never
writes to the snapshot and is **not** wired into `MonthExecutor`, so it cannot
change authoritative hashes (projections are read-only over the immutable
snapshot; `commitMonth` builds the executor from the snapshot directly, never
from a projection — `commitMonth.ts:100-125`).

**Headline: M2 ships 6 of the 8 doc priority types. Two are cut**
(`obsolete_active_class`, `construction_stalled`) with recorded reasons —
neither has a trustworthy derivable signal on the real snapshot today. The
`StrategicPriority` shape and the sort/dismissal policies are all buildable.

### 1. Priority shape and types (§7.2–§7.3)

**Shape — adopt as-is.** `StrategicPriority { id, type, severity, title,
summary, reason, destination, fingerprint }` + `prioritySeveritySchema`
(`information | advisory | warning | critical`) + `strategicPriorityTypeSchema`
are all a presentation record, fully buildable as a pure projection function
`buildPrioritiesProjection(snapshot, playerNationId)`. Deterministic `id` and
`fingerprint` derive from the *condition identity* (type + stable key fields)
via canonical serialization — `fingerprint` for tension is
`high_foreign_tension:<relationNationId>`, for near-completion is
`construction_near_completion:<projectId>`, so distinct occurrences never
conflate (§7.2). `destination` maps to a **real screen** from the shipped
registry (`overview | construction | fleet | research | diplomacy`);
`focus*` fields stay unvalidated per the Navigation decision (ticket 02) — no
focus-param navigation exists and none is commissioned. Note: **no `treasury`
route exists** (ticket 02 reserved a stub); cash priorities point at
`overview`, where the treasury panel already lives.

**Per-type verdicts** (real-data availability):

| Type | Verdict | Real backing |
| --- | --- | --- |
| `monthly_deficit` | **BUILDABLE** | projected balance = `monthlyAppropriation − maintenanceCost − constructionSpend − researchSpend`, all engine-backed once ticket 06's two new `PlayerProjection.economy` fields land (`projection.ts:9-13` today is `{treasury, monthlyAppropriation, shipyardCapacity}`; ticket 06 adds `constructionSpend` + `researchSpend`). Spec dependency on 06. |
| `critical_cash_reserve` | **BUILDABLE** | `treasury < max(totalMonthlyExpenditure, 1)` with `totalMonthlyExpenditure = maintenanceCost + constructionSpend + researchSpend` (same 06 fields). |
| `low_research_spending` | **BUILDABLE** | `researchBudget` is real (`state.ts:43`, compiled `compiler.ts:568`, default 0); ratio to `monthlyAppropriation` real. 8% threshold centralized as `MIN_RESEARCH_SHARE_BP = 800`. |
| `construction_near_completion` | **BUILDABLE (adapted)** | `totalWork`/`completedWork`/`status` real (`state.ts:214-225`). See §2 for the `remainingMonths` adaptation. |
| `construction_stalled` | **CUT** | No from-snapshot signal — see below. |
| `obsolete_active_class` | **CUT** | No signal at all — see below. |
| `high_foreign_tension` | **BUILDABLE** | `isHighTension`/`HIGH_TENSION_THRESHOLD = 8`/`tensionLabel` real (`diplomacy.ts:59,75-85`, re-exported `index.ts:6`); numeric `tension` per relation real (`state.ts:78`). |
| `no_active_construction` | **BUILDABLE** | Real predicate from the appropriation phase (`month.ts:520-525`): zero `constructionProjects` with `status !== "COMPLETED"`; "sufficient funds + dock capacity" = `treasury > 0` and `shipyardCapacity > 0` (`projection.ts:111`) and ≥1 eligible design in the real construction design catalog (`construction.ts:105-129`). Severity advisory, never critical (doc §7.4). |

**`obsolete_active_class` — CUT (no trustworthy signal).** Verified: **no
obsolescence score exists anywhere** in the codebase; `CompiledDesignVersion`
has no era/introduced-year/vintage field (`state.ts:48-64`); and the doc's own
fallback — a technology-gap comparison — is **also not buildable**, because
**no design→required-tech mapping exists**: `requiredTechnologyIds` is
hardcoded `[]` (`construction.ts:124`, note `construction.ts:97-99` — the
content pack links nothing). The briefing's "obsolescence" concern category is
actually a **capital-ship-presence heuristic** (no `battleship`/`battlecruiser`
→ fires, `opening-briefing.ts:222-239`), not an obsolescence signal, and must
not be reused as this trigger. Per the ticket's instruction, cut the type
entirely. Recorded so the trigger becomes buildable once a trustworthy
design-era/tech-gap datum exists (deferred; a future engine slice).

**`construction_stalled` — CUT (no from-snapshot signal).** The stall signal
ticket 09 defined (month-over-month `completedWork` delta) is **not derivable
from a single snapshot**: per-project deltas exist only transiently at commit
time (`ConstructionProgressed` events / `APPROPRIATION` ledger entries,
`month.ts:880-890`) and are **not persisted**; `MonthReport` carries only the
aggregate `newConstructionSpending` (`simulation.ts:17-23`). A persistent
priority card evaluated by a read-only projection over the current snapshot
cannot see last month's delta. Ticket 09's *display* stall flag on the
Construction page still works (it can consume the just-committed month's
transient report delta), but the *persistent priority card* is cut. Recorded:
the trigger becomes buildable when a per-project last-month-progress field
exists on the snapshot (a future engine slice / schema change).

### 2. Trigger rules and thresholds (§7.4)

Centralized as **named, documented, unit-tested constants in `priorities.ts`**
(mirroring ticket 11's centralization): `MIN_RESEARCH_SHARE_BP = 800`,
`NEAR_COMPLETION_WORK_RATIO = 0.9`, the cash-reserve inequality
`treasury < max(totalMonthlyExpenditure, 1)`, and the deficit-criticality
predicate `treasury + projectedBalance < 0`. `HIGH_TENSION_THRESHOLD = 8` is
**imported from `diplomacy.ts` — not re-declared** (doc §7.4: "reuse
diplomacy-domain policy"). Severity assignments documented per type:
`monthly_deficit` warning when affordable / critical when insolvent;
`critical_cash_reserve` warning; `low_research_spending` warning;
`construction_near_completion` information; `high_foreign_tension` warning;
`no_active_construction` advisory (never critical).

**`construction_near_completion` adaptation (recorded deviation).** The doc's
`remainingMonths <= 2` trigger requires a months-to-completion value, which is
**not derivable from a snapshot**: `computeConstructionCap` is module-private
(`month.ts:111-114`) and returns `0` for compiled campaigns because the
compiler hardcodes `baseResources: SafeInt(0)` (`compiler.ts:441`) — so
"expected monthly spend" is undefined, and ticket 09's labeled
months-estimate has no real denominator today. Per the ticket's "confirm each
type is buildable from real data" mandate, the trigger is **adapted to a
work-ratio proxy**: near-completion = `completedWork / totalWork >=
NEAR_COMPLETION_WORK_RATIO` (0.9), reusing the briefing's existing heuristic
(`opening-briefing.ts:225-230`) as the named constant. The doc's
"`remainingMonths <= 2`" intent is recorded as the approximation target; the
deviation is documented in the spec (and becomes a literal months trigger when
a real per-nation construction-cap/expected-spend value exists).

**Recorded finding — revenue-base divergence (flagged, not resolved here).**
The engine's authoritative `monthly_revenue` phase computes on
`baseResources` (`month.ts:246-255`), which the compiler always sets to `0`
(`compiler.ts:441`), so compiled campaigns receive `0` monthly revenue; the
projection surface (`monthlyAppropriation = income × navalAppropriationRateBp`,
`projection.ts:112-114`) uses `income` and is nonzero. The priority engine
consumes the **projection surface** (consistent with the shipped
Overview/Treasury display per tickets 02/03/06 — the "projected balance" is a
player-facing projection, not the engine's authoritative ledger). The
divergence is a **pre-existing engine concern affecting M1 economy display
truthfulness**, recorded here as a flagged candidate for a future engine
repair decision — it is **not** silently resolved by this charting ticket.

### 3. Sorting (§7.5)

The 5-key sort chain is **feasible and deterministic**; each key is a pure
derivation with a stable total order:
1. **severity** — ordinal rank of the 4-value enum.
2. **direct financial risk** — per-type numeric: `monthly_deficit` → deficit
   magnitude; `critical_cash_reserve` → shortfall magnitude
   (`max(totalMonthlyExpenditure,1) − treasury`); `low_research_spending` →
   shortfall below the 8% share; `construction_near_completion` → remaining
   cost (`totalWork − completedWork`, real); `high_foreign_tension` → tension
   score; `no_active_construction` → stable constant.
3. **shortest time to consequence** — `monthly_deficit` → months of reserves
   (`treasury / |projectedBalance|`); `critical_cash_reserve` /
   `high_foreign_tension` → `0` (imminent); `construction_near_completion` →
   the work-ratio proxy (monotone in remaining work); remaining types → stable
   neutral constant. No type lacks a well-defined numeric here.
4. **stable priority type order** — fixed enum order (the type schema itself).
5. **stable id** — the deterministic `fingerprint`.

No nondeterministic ordering; identical inputs → identical order (doc §7.5).

### 4. Dismissal (§7.6)

Adopted verbatim: only `information`/`advisory` dismissible; `warning`/
`critical` never permanently dismissible; dismissal keyed by `fingerprint`,
expires on turn advance, never mutates simulation state.

**Storage (genuinely new — no existing mechanism fits).** Verified there is
**no UI-metadata bag on `CampaignSnapshot`** (all fields required,
`state.ts:327-351`), **no arbitrary keyed save metadata**
(`SaveMetadataSchema` is a fixed-shape `z.object`, unknown keys stripped,
`schemas.ts:101-110`), and **no per-campaign renderer-owned UI-state
persistence** anywhere (`store.ts` writes only `campaign.json`/
`campaign.sig.json`/`metadata.json`/`pointer.json`). Ticket 16's additive
`SaveMetadata` fields serve the *campaign-list screen* only. **Decision: a
small per-campaign UI-state sidecar** — `ui-state.json` in the campaign save
directory, written atomically (tmp-dir → rename, matching `SaveStore.save`),
read **tolerantly** (missing/corrupt → empty defaults), containing
`{ turnNumber, dismissedFingerprints: string[], firstMonthInspection?: {...} }`
and keyed by `campaignId`. It is renderer-owned, **never part of the
authoritative envelope/hash, never loaded into authoritative state** (contract
"React and UI state are never authoritative simulation state"), and expiry is
inherent (entries are compared against the current `turnNumber`). This **also
resolves the storage gap deferred from ticket 05** (first-month-inspection
state) — the map note is updated so both tickets share one mechanism instead
of two ad-hoc ones.

### Net spec effect

M2 ships the priorities engine as a read-only projection with **6 of 8** types
(`obsolete_active_class` + `construction_stalled` cut, reasons above), doc
trigger constants centralized as named policy constants (one adapted to a
work-ratio with the deviation recorded), the 5-key deterministic sort, and
dismissal stored in a new tolerant `ui-state.json` sidecar (shared with
ticket 05's inspection state). The engine gains no new authoritative schema;
goldens stay 10/10. **Spec dependencies:** ticket 06 (the two
`PlayerProjection.economy` fields) for the two cash triggers; ticket 02
(destination → real screens, no `treasury` route); ticket 11
(`isHighTension`, imported not re-derived).

## Notes for the resolving session

- This is likely the single largest ticket on the map — budget accordingly,
  and split further mid-session if needed rather than forcing a shallow
  resolution.
