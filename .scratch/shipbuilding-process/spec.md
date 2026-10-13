# SB-3: Building-ships process manual parity (EARLY band)

**Status:** implemented — implementation tickets `INC-1..INC-17` in `.scratch/shipbuilding-process/issues/`; all
resolved except two, which carry no open frontier: **INC-11** (foreign tech-insight, blocked on content-technology
materialisation; owner `.scratch/content-runtime-integrity/`) and **INC-16** (ship-dimension dock predicate, deferred
because `CompiledDesignVersion` persists no length/beam; owner ship-design / campaign content). The player surfaces
closed on 2026-10-13 (INC-9b foreign builder, INC-12b/INC-15b rebuild) and INC-17 server-derived foreign terms landed.
**Source:** `docs/manual.pdf` — **BUILDING SHIPS** (printed p30–33) and **APPENDIX 1** ship-type
definitions (printed p131–134). Grounding notes: `docs/research/manual-building-ships-rules.md`
(p30–36) and `docs/research/manual-appendix-1-ship-type-definitions.md` (p131–134).
**Authority policy:** per ADR-0095 the normative implementation baseline is the DESIGN docs
(`DESIGN-22` ship-classification, `DESIGN-23` construction-repair-and-rebuild, `DESIGN-13`
economy, `DESIGN-16` bases-and-infrastructure, `DESIGN-21` ship-design); an ADR that changes a rule
amends them and is recorded in the DESIGN header **and** `docs/adr/AMENDMENTS.md`. The RTW3 manual
is the authoritative reference for **intended** behaviour; where it and a DESIGN doc/code disagree,
resolve it by aligning to the manual or by recording a deliberate deviation (ADR-0067 precedent).
Richer-than-manual depth (work micro-units, latent defects, `IMPOUNDED`, capacity-pressure delay)
is kept, not trimmed.
**Scope:** the playable **EARLY** band (January 1880 – December 1899, DESIGN-22 §6). **Delta-only**
over the existing `.scratch/ship-building/` effort (SB-1 `spec.md` + SB-2 `parity-spec.md`, ADRs
0063–0078): SB-1/SB-2 own the component-level design/drawing-board model and are verified, not
rebuilt. This spec implements the specified-but-unbuilt *build-phase* mechanics and the player
surface, and records what stays deferred.
**Citation caution:** APPENDIX 1 is **p131–134** (verified against the PDF bookmark tree). The
pre-existing `docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` cites it at
p133–135 — consistently **+2**; do not mix the citation sets.

---

## Problem Statement

A player who has designed and approved a ship cannot yet run the manual's **building-ships**
process. The app's normative rules docs (DESIGN-13/22/23) already encode the manual's mechanics, but
several of them are **specified and not built**: construction cannot be halted or delayed, ships
cannot be ordered in batches of up to 12 with auto-assigned names, engine-side acceleration does not
exist (only a forecast), the national dock ceiling / dock growth / national concurrency cap are not
modelled, foreign-yard contracts are unimplemented, and the rebuild list is missing bulges and the
manual's armament-change conditions. The Construction screen therefore shows a project that ages but
cannot be steered, and the manual's monthly instalment / halt / accelerate / dock-pressure /
foreign-order flow is not playable. Classification already matches the manual for every type the
EARLY band implements, so that work is a verification task, not a rewrite.

## Solution

Bring the EARLY-band building-ships process to manual parity by **implementing the DESIGN-13/22/23
rules that already specify it**, adding only the ADRs a genuine rule change requires. Concretely:
confirm and pin classification parity against Appendix 1; add `HALTED`/`DELAYED` statuses with the
manual's carrying-cost and non-deduction rules; move acceleration into the phase engine with the
manual's 10 %-faster / +5 %-cost behaviour and its capacity-pressure delay; add the 1..12 class-order
batch with a deterministic naming policy; add the dock ceiling, 12-month dock expansion, private
industrial expansion event, and the national concurrency cap; implement foreign-yard contracts with
builder capability, payment grace, tension-scaled impoundment, treaty-delivery guarantee and tech
insight; add the `BULGE` refit and the manual's armament-change validation; and surface all of it on
the Construction screen and Drawing Board so the process is playable end-to-end. Everything lands
under the existing determinism, persistence and validation bar.

---

## Requirement IDs

Legend: **AC** = acceptance criteria; **Implements** = DESIGN doc/section it realises; **Tests** =
`unit` / `boundary` / `determinism` / `persistence`; **BALANCE TARGET** = a value the manual does not
give, to be a versioned `balance.yaml` constant (never invented in code).

### (a) Classification parity — verified, deviations recorded

**SB3-R1 — EARLY-band classification matches Appendix 1.**
- **AC:** For each EARLY-implemented type (`DD`, `CL`, `B`, `CA`, `BB`, `KE`, `AMC`) the shipped
  predicate (operators and integer bounds) equals the Appendix 1 bound table: DD `<2000 t`, `>19 kn`,
  torpedoes required, no qualifying armour; CL `≥2000` & `<8000 t`, `>16 kn`, gun `≤6 in` (protected
  single-mount `≤8 in`); B `≥5000 t`, belt `≥6 in`, gun `>6 in`, `<20 kn`, `≤2` turrets; CA `>4000 t`,
  `>19 kn`, belt `>2` & `≤12 in`, gun `>6` & `≤11 in` (deviations below); BB `>8000 t`, `≥3` turrets,
  belt `>6 in`, gun `>10 in`; KE `<2500 t`, belt `≤2 in`, gun `≤6 in`, no torpedoes; AMC `>1700 t`,
  no qualifying armour, gun `≤6 in`, fleet-share limits. Test-vector fixtures are the manual's own
  wording.
- **Implements:** DESIGN-22 §§7–15 (and §2 canonical units, §7 qualifying armour = 2 in).
- **Tests:** unit (one fixture per type, both sides of every strict/inclusive boundary); boundary
  (2000 t, 6 in, 34 aircraft, 22 kn); determinism (identical compiled design → identical result).
- **Deviations kept (no change):** CA main gun strictly `>6 in` so CL keeps the 6 in gun (ADR-0067
  §1); DD "cannot be armoured" read as the 2 in qualifying-armour threshold (ADR-0088 §5); CL belt
  `≤2 in` with a missing armour deck a WARNING not a rejection (ADR-0088 §5); KE/AMC read the largest
  gun of **any** role (ADR-0088 §5); AMC "fast" `≥22 kn` with fleet-share limits (ADR-0088); 1880
  scenario relaxes B to 1500 t / 4 in / `<18 kn` (ADR-0116).
- **BALANCE TARGET:** none — every value is manual or an already-recorded deviation.

**SB3-R2 — DESIGN-22 §9 lower-bound annotation (documentation only).**
- **AC:** DESIGN-22 §9 gains a one-line boundary note recording that the manual leaves exactly
  2000 t illegal (DD `<2000`, CL `>2000`) while the app makes CL `≥2000`, filling the gap: every
  2000 t design is a legal light cruiser. No constant changes; the gap-fill is kept.
- **Implements:** DESIGN-22 §9 (annotation); ticket 04 (no ADR — easy to reverse, unsurprising).
- **Tests:** boundary (a 2000 t design compiles as `CL`); no behavioural change.

**SB3-R3 — locked types stay locked and are recorded, not silently omitted.**
- **AC:** `BC`, `CV`, `CVL`, `AV`, `SS`, `MTB`, `TR` remain unclassifiable / `mechanicsImplemented:
  false` in the EARLY band; no EARLY design can be classified as one of them; `BC` predicate stays
  absent and locked (ADR-0088 §4). The deferred items (BC two-branch speed rule vs DESIGN-22 §12,
  BB↔BC armour-index precedence, era-scaled CL/CV maxima) are recorded in this spec's deferred
  section.
- **Implements:** DESIGN-22 §§1, 12, 16–19; ADR-0088 §4.
- **Tests:** unit (a would-be BC/CV design is refused with a blocking classification finding);
  boundary (mismatch path `INTENDED_CLASSIFICATION_ILLEGAL` / `SHIP_TYPE_UNREGISTERED`).

### (b) Work, payment, halt and delay

**SB3-R4 — the manual's monthly instalment is the existing per-package payment.**
- **AC:** The manual's "cost is paid in monthly instalments during the build time" (p30) is realised
  by DESIGN-23 §6: each month a project pays its share and converts it to work
  (`affordableWork = floor(paymentReceived / costPerWorkMicroUnit)`; `appliedWork` is the month's
  progress). No separate "instalment plan" object is introduced. Zero payment → zero progress.
- **Implements:** DESIGN-23 §6 (research p30).
- **Tests:** unit (payment → work conversion); boundary (zero/insufficient payment, cap at
  `remainingWork`); persistence (a project's progress survives save/load).
- **BALANCE TARGET:** the efficient/undeveloped shipbuilding-industry modifier magnitude and the
  ship-type build-time table (the manual names no numbers; SB-1's displacement-based build-time table
  plus its era multiplier stand — see Further Notes).

**SB3-R5 — `HALTED` status, halt/resume command, and half-mothball carrying cost.**
- **AC:** A player can halt and resume one or more ship projects. A `HALTED` project receives exactly
  `0` work and `0` ordinary work charge and pays a preservation cost equal to **half the mothballed
  maintenance cost** (DESIGN-13 preserving cost ×`5_000` bp). `HaltConstruction` / `ResumeConstruction`
  commands are accepted; resume returns the project to `ACTIVE` (or `AWAITING_CAPACITY` when capacity
  is unavailable).
- **Implements:** DESIGN-23 §7/§2; DESIGN-13 preservation-cost rule (research pp30–31).
- **Tests:** unit (halt → zero work/charge + preservation cost); boundary (resume with/without
  capacity); persistence (status round-trip); determinism (preservation cost is integer).
- **BALANCE TARGET:** the mothballed-maintenance cost base (the manual defines the *half* rule but not
  the base); versioned `balance.yaml` constant, PLACEHOLDER until sourced.

**SB3-R6 — `DELAYED` status and the delayed-month non-deduction.**
- **AC:** A `DELAYED` project for a month receives exactly `0` work and `0` ordinary work charge, so
  its monthly build cost is not deducted (the manual's "lower than expected monthly expenses", p31);
  delayed/halted months do not count as active completion months; one explicit delay record with a
  reason code is written.
- **Implements:** DESIGN-23 §7 (research p31).
- **Tests:** unit (delayed month charges nothing); boundary (month after delay resumes charged work);
  persistence (delay record persists).

**SB3-R7 — project-status model and save migration.**
- **AC:** The engine project status is exactly DESIGN-23 §2 — `PLANNED`, `AUTHORIZED`,
  `AWAITING_CAPACITY`, `ACTIVE`, `HALTED`, `DELAYED`, `ACCELERATED`, `COMPLETED`, `CANCELLED`,
  `IMPOUNDED` — with legal transitions enforced and an illegal transition failing with
  `INVALID_DOCKYARD_PROJECT_TRANSITION`. This is a save-format change: it follows ADR-0113 (reject a
  stale compatibility version with `PERSISTENCE_COMPATIBILITY_MISMATCH`) and carries a registered
  migration (or a documented, ADR'd rejection) on read.
- **Implements:** DESIGN-23 §2; ADR-0113.
- **Tests:** unit (transition table, legal and illegal); persistence (round-trip at the new
  compatibility version; a pre-change save is migrated or rejected with the stable diagnostic);
  determinism (status does not affect unrelated hashes).

### (c) Acceleration and capacity pressure

**SB3-R8 — engine-side acceleration (`SetAcceleration`).**
- **AC:** Acceleration moves from forecast-only into the phase engine. A `SetAcceleration` command
  toggles a project's `ACCELERATED` state; on enable, remaining work is multiplied once by exactly
  `10_500` bp (the +5 % cost premium); in each paid accelerated month the effective capacity is
  multiplied by exactly `11_000` bp (10 % faster). Completed work is never retroactively increased, and
  re-enabling acceleration never charges the premium twice for the same remaining-work segment. The
  observable effect (10 % faster, +5 % cost) is consistent with the forecast's existing
  `accelerationTimeBp`/`accelerationCostBp` values.
- **Implements:** DESIGN-23 §8; DESIGN-13 `construction_acceleration_v1` (research p31).
- **Tests:** unit (premium applied once; rate multiplier in paid months); boundary (toggle off/on,
  completing while accelerated); determinism (premium arithmetic is integer; no double charge).

**SB3-R9 — acceleration capacity-pressure delay.**
- **AC:** Acceleration raises a project's capacity-pressure weight by exactly `12_500` bp. When a
  pool's capacity pressure exceeds `9_000` bp, an eligible accelerated project can be delayed with a
  keyed random decision on stream `construction/month/project/acceleration_pressure`, probability
  bounded at `5_000` bp, for exactly one month, setting status `DELAYED` with zero work/charge and
  reason `ACCELERATION_CAPACITY_PRESSURE_DELAY`. Every delay has a random-decision record; no delay
  is inferred or invisible.
- **Implements:** DESIGN-23 §9; DESIGN-13 (research p31).
- **Tests:** unit (pressure weighting, threshold, probability bound, one-month delay); determinism
  (same seed → same delay decisions and same hash, identical in two processes); boundary (exactly
  `9_000` bp does not delay; `5_000` bp cap).

**SB3-R10 — "a limited number" is capacity pressure, not a count cap.**
- **AC:** No fixed N-ship acceleration cap exists. Many accelerated projects raise pressure and, per
  SB3-R9, can delay other projects — the manual's "many ships in accelerated construction risks
  causing delays in the construction of other ships" (p31) is realised deterministically. A negative
  test asserts there is no count-based rejection and no retroactive premium re-charge.
- **Implements:** DESIGN-23 §8–§9; ticket 06 (rejects a literal cap: unsourced and duplicative).
- **Tests:** unit (accelerating many ships raises pressure and can delay an eligible project);
  boundary (no `ACCELERATION_NOT_ALLOWED` for a valid toggle other than the project-type gate).

### (d) Class-order batch and naming

**SB3-R11 — `OrderConstructionCommand` for 1..12 ships of one design.**
- **AC:** One command orders from `1` through exactly `12` ships of one approved compiled design
  version (the manual's "up to 12 ships of the same class laid down", p31). The batch carries one
  compiled-design-version id, one named-class id, quantity `1..12`, one builder or explicit per-ship
  builder allocation, stable ship ids, canonical name assignments or a naming policy, capacity and
  payment reservations, and a batch hash. A quantity above `12` fails with
  `CONSTRUCTION_BATCH_LIMIT_EXCEEDED`; a second batch needs a second command.
- **Implements:** DESIGN-23 §3–§4.
- **Tests:** unit (batch 1..12 accepted; 13 rejected); boundary (1 and 12); persistence (batch
  round-trip); determinism (batch hash stable; ship-ordering by batch ordinal then ship id).

**SB3-R12 — authorization gate and reservations before any project exists.**
- **AC:** A batch starts only after one immutable approved compiled design version, intended and
  natural classification, treaty validation, builder technology and dock limits, construction-capacity
  reservation, material/personnel/government authorization, and an accepted locked command. The batch
  reserves money and capacity **before** any project is added; a failed gate creates no project and no
  reservation and returns a specific reason code.
- **Implements:** DESIGN-23 §3.
- **Tests:** unit (each gate fails independently); boundary (reservation exactly equals the batch);
  determinism (no reservation leaks into hash).

**SB3-R13 — deterministic per-nation auto-naming policy.**
- **AC:** The manual's "names will be assigned automatically" (p31) is a canonical naming policy:
  names are allocated from a per-nation, per-type name pool in a deterministic order with defined
  collision handling; the named-class id is assigned once for the batch. Name allocation consumes no
  ambient randomness and records its source pool and ordinal.
- **Implements:** DESIGN-23 §4; research p31.
- **Tests:** unit (deterministic allocation, collision resolution, exhaustion behaviour); determinism
  (same batch + pool → same names across processes).
- **BALANCE TARGET / content:** the name pools and uniqueness policy are content (map fog); ship with
  PLACEHOLDER pools until authored.

**SB3-R14 — repeat orders need no new study; mechanical change does.**
- **AC:** Additional ships of an approved compiled design version need no new design study when the
  exact version id and hash are unchanged and technology/treaty/builder/dock predicates still pass
  (DESIGN-23 §5). A command claiming study exemption for a mechanically changed design fails with
  `NEW_DESIGN_STUDY_REQUIRED`; cosmetic-only changes do not require a new study.
- **Implements:** DESIGN-23 §5; DESIGN-21 study rules.
- **Tests:** unit (repeat order accepted; changed design rejected); boundary (cosmetic change).

### (e) Dock size, expansion and national capacity

**SB3-R15 — national dock ceiling.**
- **AC:** A nation's dock is stored as `maximumNewConstructionMassKg` plus
  `maximumMajorRepairMassKg`, `maximumRebuildMassKg`, `maximumConversionMassKg` and a ship-dimension
  predicate. Domestic new construction is eligible only when the compiled displacement is
  `≤ maximumNewConstructionMassKg`, the dimension predicate passes, the dock/shipyard are operational,
  technology/capability are present, and capacity can be reserved. Exceeding it fails with
  `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT` (the manual's "you cannot build ships larger than your current
  dock size", pp32–33). Per-yard length/beam/displacement/crane fit (SB-1) remains and composes with
  this ceiling.
- **Implements:** DESIGN-13 §4.1–§4.2; ADR-0067 §6.
- **Tests:** unit (at/over the mass limit; dimension predicate); boundary (exactly at the limit);
  persistence (dock limits persist).

**SB3-R16 — dock expansion (`dock_expansion_v1`).**
- **AC:** A completed expansion step increases every dock mass limit covered by the project by the
  era's exact step: EARLY `1_000` metric tonnes (`1_000_000` kg); `baseDurationMonths` is exactly
  `12` (the manual's "docks take one year to build"); the applicable era is locked at authorization;
  completion requires **both** elapsed active months reaching the duration and paid work reaching
  total work. A step never completes on elapsed time alone.
- **Implements:** DESIGN-13 §5.1–§5.4 (research pp32–33).
- **Tests:** unit (step by era; both completion conditions); boundary (9..18 month permitted range
  guard; exactly 12 shipped); determinism (era step locked at authorization).

**SB3-R17 — private industrial dock expansion opportunity.**
- **AC:** The manual's "dock size may occasionally increase by itself as a result of private
  shipbuilding" is the typed seeded event `private_dock_expansion_opportunity_v1`: minimum `7_500` bp
  trailing-12-month dock utilisation, `60`-month cooldown, at most one active event per nation,
  stream `event/month/nation/private_dock_expansion`, nations/possessions processed in ascending id
  order. A successful event creates a **normal** expansion project (SB3-R16); it never increases dock
  size immediately, and no possession without explicit eligibility receives inferred development.
- **Implements:** DESIGN-13 §6.
- **Tests:** unit (eligibility, cooldown, one-active rule); determinism (stream keyed; same seed →
  same event).

**SB3-R18 — national concurrency cap (multiple of dock size).**
- **AC:** A nation has `maxConcurrentConstructionMassKg = shipyardCapacityMultipleBp ×
  dockMaxMassKg`. At order time the new ship's displacement is reserved against it, and an order
  beyond it is rejected with a capacity reason (`INSUFFICIENT_PROJECT_CAPACITY` /
  `SHIPYARD_CAPACITY_EXCEEDED`). This cap governs **how much tonnage may be under construction at
  once**; DESIGN-13 §7's per-shipyard work-micro-unit pools continue to govern **how fast** work
  advances (ADR-0067 §6, per-yard rate scaled by `maxDisplacementKg`). Both are kept and must not be
  conflated.
- **Implements:** DESIGN-13 §7 alongside §10; research p33.
- **Tests:** unit (reservation and rejection at the cap); boundary (exactly at the cap); determinism
  (reservation ordering by pool/project priority).
- **BALANCE TARGET:** `shipyardCapacityMultipleBp` (the manual states "a multiple" but no number);
  versioned `balance.yaml` constant.

**SB3-R19 — capacity inclusions/exclusions and the unit-layering note.**
- **AC:** Per the manual (p33): ships **under rebuild** book to the `REFIT_REBUILD` pool and do not
  count against the new-construction concurrency cap; **AMC and small corvettes** do not count;
  **submarines** do count. The canonical capacity unit remains work micro-units (DESIGN-13 §7), and
  the manual's tonnage cap is expressed as a displacement-denominated reservation layered on top; the
  unit choice is documented so the two numbers are not confused.
- **Implements:** DESIGN-13 §7–§9; research p33.
- **Tests:** unit (rebuild excluded; submarine counted); boundary (an AMC/small-corvette boundary).
- **RESOLVED (orchestrator, 2026-10-12): align to the manual.** The manual is authoritative for
  intended behaviour, and DESIGN-13 §9 already anticipates this — it defines
  `ConstructionCapacityExemptionDefinition` precisely so "a future ruleset MAY define a non-zero
  exemption". Author a non-zero exemption for `AMC` and a designated small-corvette type, backed by a
  declared **external capacity source** (`separate external capacity source identifier`) so exemption
  never creates capacity from nothing (DESIGN-13 §9). The manual gives neither a percentage nor a
  "small corvette" threshold: fix both as versioned `balance.yaml` constants — `amcCapacityExemptionBp`
  and `smallCorvetteMaxDisplacementKg` — marked **BALANCE TARGET**. This amends DESIGN-13 §9 by
  **new ADR** (which also fixes the "small corvette" definition). The exemption feeds the §9
  `normalPoolConsumption`/`externalPoolConsumption` split and the national concurrency cap (SB3-R18).

### (f) Foreign-yard construction

**SB3-R20 — `ForeignConstructionContract` and builder-capability validation.**
- **AC:** Ordering abroad creates one immutable `ForeignConstructionContract` (DESIGN-13 §13.1) only
  when the builder satisfies §13.2: compiled displacement/dimensions within the **builder's** dock
  limits, technology or licensed design capability, shipyard capability, available `NEW_CONSTRUCTION`
  capacity, government/treaty permission, component sourcing, and no occupation/destruction. A
  missing contract fails with `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`; missing capability fails with
  `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` or produces an explicit delayed/impossible outcome, never
  a silent design downgrade. Capability is revalidated monthly.
- **Implements:** DESIGN-13 §13.1–§13.2; research p33 ("limited by the building nation's dock size").
- **Tests:** unit (each capability predicate); boundary (exactly at the builder's dock limit);
  persistence (contract round-trip).

**SB3-R21 — foreign capacity consumes the builder's pools.**
- **AC:** Foreign construction consumes the **builder's** physical capacity, not the ordering nation's
  (DESIGN-13 §13.3); reservations compete with the builder's domestic and other foreign projects
  under the builder's priority (accepted existing foreign contracts after legally mandatory domestic
  work, before new discretionary domestic projects); a builder must not sell the same capacity twice.
- **Implements:** DESIGN-13 §13.3.
- **Tests:** unit (ordering nation's pool unchanged; builder's pool reduced); boundary (double-sell
  rejected); determinism (foreign-contract ordering by builder nation, shipyard, authorization month,
  contract id).

**SB3-R22 — payment schedule and grace.**
- **AC:** Payments use balanced ledger postings and the contract's schedule (DESIGN-13 §13.4). The
  shipped payment grace is `1` month; after it, the project enters `PAYMENT_DEFAULT_DELAYED` until
  payment or termination. Unpaid work receives zero progress.
- **Implements:** DESIGN-13 §13.4.
- **Tests:** unit (grace, default transition, zero-progress); boundary (payment on the grace month);
  persistence (ledger balances).

**SB3-R23 — war effects, impoundment, and the delivery guarantee.**
- **AC:** At war entry involving the ordering nation, builder nation or builder's controller, the
  contract evaluates `foreign_contract_war_policy_v1` to exactly one of `CONTINUE`, `DELAY`,
  `SUSPEND`, `IMPOUND`, `CANCEL_WITH_SETTLEMENT`, `PHYSICALLY_IMPOSSIBLE` (DESIGN-13 §13.6). The
  manual's tension-scaled impoundment risk is the policy predicate; an impoundment transfers custody
  per §13.7, records a causal record, and is carried by the `IMPOUNDED` project status; discretionary
  impoundment without a policy result fails with `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`. A
  valid treaty/contract delivery guarantee (§14) prohibits discretionary `IMPOUND` but never
  overrides `PHYSICALLY_IMPOSSIBLE`.
- **Implements:** DESIGN-13 §13.6–§13.7, §14; research p33.
- **Tests:** unit (each outcome; guarantee blocks discretionary impound; guarantee does not block
  physical impossibility); determinism (policy predicate keyed/stable).
- **BALANCE TARGET:** the tension → impoundment policy-predicate values (the manual gives no
  formula); versioned constant.

**SB3-R24 — foreign technology-insight milestones.**
- **AC:** When the contract references `foreign_construction_insight_v1` and the ordering nation lacks
  the technology, insight is awarded exactly: design-study `500` research micro-points at acceptance,
  construction-observation `1_000` at 50 % paid work, delivery `1_500` at delivery, capped at `3_000`
  per technology family and contract. Insight never grants a technology, bypasses prerequisites,
  moves availability dates, duplicates a milestone, or exceeds the remaining requirement.
- **Implements:** DESIGN-13 §13.5 (research p33).
- **Tests:** unit (each milestone, cap, no-grant); boundary (already-known technology awards nothing);
  determinism (no duplicate award; stable ordering of eligible families).

### (g) Rebuild parity

**SB3-R25 — `BULGE` refit action.**
- **AC:** A new `BULGE` refit kind represents the manual's "add bulges, which will increase torpedo
  protection but will also reduce speed" (p32): it raises torpedo-defence/protection at a speed
  penalty, is validated by the normal compile (mass, stability, speed), and its constants are
  versioned.
- **Implements:** DESIGN-23 §18/§21; DESIGN-22 §22; research p32; ADR-0067 §3 (extends the armour
  subset already implemented in SB tickets 21/28).
- **Tests:** unit (protection up, speed down, compile passes/fails on mass/stability); boundary (no
  speed left to give); determinism (result hash stable).
- **BALANCE TARGET:** the bulge protection gain and speed-penalty constants (the manual gives
  directions, not numbers).

**SB3-R26 — armament-change validation for `REARMAMENT`.**
- **AC:** `REARMAMENT` gains the manual's conditions as a validation rule set (not a new kind): main
  guns above 6 in cannot be changed (refresh to a more modern gun of the same calibre is allowed);
  secondary/tertiary batteries may change only when the existing guns are casemates or `≤6 in`
  turrets, and may become any arrangement of `≤6 in` guns; triple↔double or double↔single swaps only
  within compatible calibres (e.g. double 8 in → single 10 in; triple 12 in → double 16 in). An
  incompatible change fails with a specific reason code.
- **Implements:** DESIGN-23 §21; DESIGN-22 §22; research pp31–32; extends ADR-0067.
- **Tests:** unit (each condition, worked examples); boundary (>6 in main gun; 6 in secondary edge).

**SB3-R27 — retained-hull rebuild validation path (verified).**
- **AC:** Completed rebuilds continue to route through `rebuild_validation_v1` (DESIGN-23 §21:
  displacement `+20 %`, speed `+3 kn`, length/beam `±5 %`, no hull-category change) and produce one new
  immutable `CompiledDesignVersion` with atomic per-ship switch and a classification re-run (§22).
  `BULGE` (SB3-R25) and the armament-change rules (SB3-R26) exist inside this path, not beside it.
- **Implements:** DESIGN-23 §21–§22; ADR-0078.
- **Tests:** unit (each retained-hull limit at its boundary); persistence (old version retained for
  history/replay); determinism (atomic switch).

**SB3-R28 — design-revision limits cross-check (p27).**
- **AC:** Confirm that `constructionRevision` / `ReviseProject` enforce the manual's printed-p27
  design-**revision** limits — displacement `+10 %` or `1000 t`, main guns `>6 in` unchangeable,
  secondary `>6 in` limited, speed `±1 kn`, vertical armour `±1 in`, horizontal armour `±0.5 in` —
  which are **distinct** from the rebuild retained-hull limits of DESIGN-23 §21. If they are already
  enforced, no change (a test pins them); if not, align them to the manual, which is a rule change and
  requires a **new ADR** amending DESIGN-21.
- **Implements:** DESIGN-21 §§10–15 (similarity/revision thresholds); DESIGN-23 §21 (distinct);
  research p27.
- **Tests:** unit (each p27 limit at its boundary); determinism (revision decision keyed/stable).

**SB3-R29 — rebuild-driven reclassification; conversions deferred.**
- **AC:** A rebuild that changes the natural type re-runs classification and fails with
  `REBUILD_CLASSIFICATION_INVALID` when the intended type becomes illegal or mismatched (DESIGN-22
  §22). Suggested-vs-mandatory reclassification messaging rides on DESIGN-22 §22 once `BC` exists.
  CV/CVL conversion (`AVIATION_CONVERSION`/`ROLE_CONVERSION`) and BC→BB reclassification are deferred
  to the carrier/BC bands.
- **Implements:** DESIGN-22 §22–§23; DESIGN-23 §22.
- **Tests:** unit (reclassification failure/success); boundary (type unchanged → no new class).

### (h) Player-facing building-ships flow

**SB3-R30 — build dialog and batch.**
- **AC:** A "new construction" flow picks an approved compiled design version, a builder (domestic
  yard or foreign), and a batch quantity `1..12` with auto-assigned names (SB3-R11/R13); it shows
  per-yard fit and the dock-size ceiling (SB3-R15). Quantity above 12 is refused in the UI for the
  same reason the command refuses it.
- **Implements:** DESIGN-23 §3–§5; ticket 11; AGENTS.md desktop conventions.
- **Tests:** UI (render test + `pnpm snap` of the dialog; aria by role + accessible name; console
  clean).

**SB3-R31 — money/time readouts.**
- **AC:** The Construction screen shows the monthly instalment (the per-package funding), remaining
  months, total cost, and the launch month; a hull still building ages toward its launch month. Every
  figure is a display of a compiled/derived value, never an authored constant in the UI.
- **Implements:** DESIGN-23 §6; SB-2 display-vs-edit rule.
- **Tests:** UI (readout matches the engine's compiled value); `pnpm snap`.

**SB3-R32 — halt/resume and accelerate controls.**
- **AC:** Each `NEW_CONSTRUCTION` project row offers halt/resume (SB3-R5) and an accelerate toggle
  (SB3-R8). Halted rows show the half-mothball carrying cost; the accelerate control discloses the
  +5 % cost and states the capacity-pressure-delay risk; accelerated rows are badged.
- **Implements:** DESIGN-23 §7–§9; ticket 11.
- **Tests:** UI (controls issue the commands; disclosure text present); e2e (order → halt →
  accelerate → advance month → launch); `pnpm snap`.

**SB3-R33 — dock and shipyard-capacity panel with a dock-expansion action.**
- **AC:** A nation panel shows dock size (max build displacement), the concurrency cap and its current
  utilisation, and a dock-expansion action (12 months, next era step; SB3-R16/R18). Utilisation and
  cap are compiled values.
- **Implements:** DESIGN-13 §4–§7; ticket 11.
- **Tests:** UI (panel values, expansion action issues the command); `pnpm snap`.

**SB3-R34 — foreign-yard order flow and rebuild surface.**
- **AC:** The build dialog offers foreign builders when no domestic yard fits or by choice, showing
  the builder's dock limit, impoundment risk (tension-based) and treaty-delivery status (SB3-R20,
  SB3-R23). The rebuild surface exposes the ticket-10 action set (`BULGE`, armament changes, and the
  existing machinery/FC/armour actions).
- **Implements:** DESIGN-13 §13–§14; DESIGN-23 §20–§22; ticket 11.
- **Tests:** UI (foreign builder selection, risk disclosure, rebuild actions); `pnpm snap`.

**SB3-R35 — display-versus-edit discipline.**
- **AC:** Every new control either edits a command/draft or displays a compiled value; the Drawing
  Board never invents data (SB-2); no authoritative randomness is consumed by UI navigation or
  rendering.
- **Implements:** SB-2 decision; BW-ARC-002; BW-TST-002.
- **Tests:** UI (no-mechanics-in-renderer guard); determinism (UI action does not change snapshot hash
  unless it issues a command).

---

## Acceptance criteria → requirement → proving tests (roll-up)

| Theme | Requirements | Primary DESIGN ids | BW requirement ids | Proving tests |
|---|---|---|---|---|
| (a) classification parity | SB3-R1..R3 | DESIGN-22 §§7–15, 22 | BW-RUL-001, BW-TST-001 | type test-vectors; boundary; classification determinism |
| (b) work/payment/halt/delay | SB3-R4..R7 | DESIGN-23 §§2, 6, 7; DESIGN-13 preserving cost | BW-CMD-001/002, BW-PER-001..003, BW-STA-001 | funding unit; status transition; save migration round-trip |
| (c) acceleration + pressure | SB3-R8..R10 | DESIGN-23 §§8, 9; DESIGN-13 | BW-DET-001..004 | premium/rate unit; seeded stream; two-process determinism |
| (d) batch + naming | SB3-R11..R14 | DESIGN-23 §§3–5 | BW-CMD-001/002, BW-STA-002 | batch 1/12/13; reservation; naming determinism |
| (e) dock/capacity | SB3-R15..R19 | DESIGN-13 §§4–10; DESIGN-16 | BW-PER-001, BW-DET-003 | dock boundary; expansion dual condition; seeded event |
| (f) foreign yard | SB3-R20..R24 | DESIGN-13 §§13, 14 | BW-CMD-002, BW-DET-004, BW-STA-001 | capability unit; capacity ledger; war policy; insight cap |
| (g) rebuild | SB3-R25..R29 | DESIGN-23 §21–22; DESIGN-22 §22; DESIGN-21 | BW-CMD-002 | refit legality; retained-hull boundary; reclassification |
| (h) player surface | SB3-R30..R35 | DESIGN-23; DESIGN-13; SB-2 | BW-ARC-002, BW-TST-002 | render tests; e2e; `pnpm snap` + aria |

---

## User Stories

1. As a player, I want to order up to 12 ships of one approved class in a single command, so that I
   can lay down a large destroyer flotilla without repeating the order a dozen times.
2. As a player, I want the ships in a batch to be named automatically, so that I do not have to name
   each hull by hand.
3. As a player, I want the order refused with a clear reason when I ask for 13 or more, so that I
   understand the manual's batch limit.
4. As a player, I want to see the monthly instalment, remaining months and total cost of each
   project, so that I can plan my budget.
5. As a player, I want to halt a project when money runs short, so that I stop paying its ordinary
   cost while keeping the hull.
6. As a player, I want a halted project to cost only half of its mothballed maintenance, so that I
   understand the carrying cost of a paused hull.
7. As a player, I want to resume a halted project, so that construction continues where it stopped.
8. As a player, I want a delayed project not to have its monthly build cost deducted, so that my
   monthly expenses can come in lower than expected.
9. As a player, I want to accelerate a selected ship, so that it builds 10 % faster even though it
   costs 5 % more.
10. As a player, I want to know that accelerating many ships risks delaying others, so that I can
    make an informed trade-off.
11. As a player, I want an accelerated ship to be visibly badged, so that I can tell at a glance which
    projects are running hot.
12. As a player, I want to see my nation's dock size, so that I know the largest ship I can build.
13. As a player, I want an order above my dock size refused with a clear reason, so that I do not
    waste a design study on an unbuildable hull.
14. As a player, I want to expand my docks (one year, +1000 t in the early era), so that I can build
    larger ships later.
15. As a player, I want my dock size occasionally to rise from private shipbuilding, so that industry
    growth rewards a busy yard.
16. As a player, I want to see my shipyard capacity and how much of it is in use, so that I know how
    much tonnage I can have building at once.
17. As a player, I want rebuilding ships, AMCs and small corvettes not to count against my
    new-construction capacity, so that the manual's exemptions are honoured.
18. As a player, I want submarines to count against the capacity limit, so that the manual's rule is
    followed.
19. As a player, I want to contract a ship to a foreign yard when my own industry cannot build it, so
    that I am not blocked by a domestic gap.
20. As a player, I want a foreign order limited by the builder's dock size, so that I send a ship the
    builder can actually make.
21. As a player, I want to see the impoundment risk of a foreign order, so that I can weigh it before
    committing.
22. As a player, I want a treaty to guarantee delivery of a foreign order, so that diplomacy can
    protect my fleet.
23. As a player, I want foreign construction to give me insight into the builder's technology, so
    that ordering abroad is a way to catch up.
24. As a player, I want a foreign order that falls into arrears to be delayed rather than silently
    advanced, so that the contract is honest.
25. As a player, I want to add bulges to an existing ship, so that it gains torpedo protection at the
    cost of speed.
26. As a player, I want to change a ship's main or secondary armament only when the manual's
    conditions allow, so that rebuilds stay realistic.
27. As a player, I want a rebuild that turns a ship into another type to re-run classification, so
    that the fleet list stays correct.
28. As a player, I want to be told when a rebuild is suggested or mandatory, so that I understand
    when a ship must be reclassified.
29. As a player, I want the Construction screen to show a hull still building ageing toward its
    launch month, so that the build feels real.
30. As a player, I want a rebuild surface that exposes the full rebuild action set, so that I can
    modernise an old hull.
31. As a player, I want every control on the construction screens to change a real command or draft,
    so that I trust nothing is faked.
32. As a player, I want every readout to come from the engine's compiled values, so that the numbers
    I see are authoritative.
33. As an AI nation, I want the same batch, halt, accelerate, dock and foreign-yard rules the player
    has, so that the competition is fair.
34. As a maintainer, I want halting, delay and acceleration to be deterministic and auditable, so
    that a replay reproduces exactly the same schedule.
35. As a maintainer, I want a save from the old status model either migrated or rejected with a clear
    diagnostic, so that no campaign is silently corrupted.
36. As a maintainer, I want the manual's build-time and dock mechanics to be backed by versioned
    constants with PLACEHOLDER markers where the manual is silent, so that no value is invented.
37. As a reviewer, I want each changed rule to carry unit, boundary, determinism and persistence
    tests, so that manual parity is provable.

---

## Implementation Decisions

*(module/interface level; SB-1/SB-2 own the drawing-board model and are verified, not rebuilt. No
file paths — see to-spec.)*

- **Seams (existing, preferred).** The highest existing seams are the pure `ship-design` package
  (classification, refit/rebuild, revision, dock/capacity model) and the `phase-engine` monthly
  resolution (per-package construction progress, funding, command lifecycle). New seams are added at
  the same level: pure functions for the new build-phase decisions, wired into the monthly phase and
  the command registry. No renderer reads authoritative state.
- **Classification (SB3-R1..R3).** No code change; add type test-vectors and the DESIGN-22 §9
  annotation. The locked-type guard already exists (ADR-0088 §4) and is pinned by test.
- **Status model (SB3-R7).** Extend the engine project-status union to DESIGN-23 §2 and enforce the
  transition table. This is a save-format change: bump the compatibility contract per ADR-0113 and
  register a read migration (empty-registry seam already fixed by ADR-0113 §6) or a documented
  rejection ADR.
- **Halt/resume (SB3-R5).** `HaltConstruction` / `ResumeConstruction` commands with the domain
  function in `phase-engine`; preservation cost = mothballed-maintenance base × `5_000` bp (new
  PLACEHOLDER constant).
- **Acceleration (SB3-R8..R10).** `SetAcceleration` command; the one-time `10_500` bp remaining-work
  premium and `11_000` bp monthly rate live in `phase-engine`, replacing/extending the forecast-only
  values. The forecast's `accelerationTimeBp`/`accelerationCostBp` and the engine's
  `10_500`/`11_000` must agree in observable effect — a test pins agreement (the manual's 10 %/5 %).
- **Capacity pressure (SB3-R9).** The existing DESIGN-13 §9 stream
  `construction/month/project/acceleration_pressure` is used with a keyed random-decision record;
  eligible projects are evaluated in ascending project id order and set to `DELAYED` with
  `ACCELERATION_CAPACITY_PRESSURE_DELAY`.
- **Class-order batch (SB3-R11..R14).** `OrderConstructionCommand` and batch reservations in
  `phase-engine`'s order path; naming policy in `ship-design` (pure, deterministic, pool-driven). The
  batch limit and reason codes (`CONSTRUCTION_BATCH_LIMIT_EXCEEDED`, `NEW_DESIGN_STUDY_REQUIRED`) are
  added to the command registry's reason-code set.
- **Dock/capacity (SB3-R15..R19).** A nation dock record (`maximum*MassKg` + dimension predicate) and
  `dock_expansion_v1` (`12` months, EARLY `1_000 t` step) in the `ship-design`/`campaign` model,
  composed with SB-1's per-yard fit. The private-expansion event is a `phase-engine` event on the
  DESIGN-13 §6 stream. The concurrency cap is a displacement reservation layered over the work-
  micro-unit pools. The AMC/small-corvette exemption conflict (SB3-R19) must be resolved by ADR
  **before** implementation; the spec does not choose.
- **Foreign yard (SB3-R20..R24).** `ForeignConstructionContract` and `foreign_contract_war_policy_v1`
  in `phase-engine`; the contract consumes the builder's capacity (the ordering nation's capacity is
  untouched). Tech-insight milestones post research micro-points (never a technology). The
  tension → impound predicate values are a new PLACEHOLDER `balance.yaml` constant.
- **Rebuild (SB3-R25..R29).** Add a `BULGE` kind to the refit-kind union and a `REARMAMENT`
  validation rule set in `ship-design`; both run inside `rebuild_validation_v1` and the normal
  compile. Cross-check `ReviseProject`/`constructionRevision` against the p27 numbers and pin them
  with tests; a real change needs an ADR. CV/CVL conversion and BC→BC reclassification stay deferred.
- **Commands and reason codes.** New commands: `HaltConstruction`, `ResumeConstruction`,
  `SetAcceleration`, batch `OrderConstructionCommand`; new reason codes per DESIGN-23 §32 and
  DESIGN-13 §18 (e.g. `CONSTRUCTION_BATCH_LIMIT_EXCEEDED`, `NEW_DESIGN_STUDY_REQUIRED`,
  `ACCELERATION_NOT_ALLOWED`, `ACCELERATION_CAPACITY_PRESSURE_DELAY`,
  `INVALID_DOCKYARD_PROJECT_TRANSITION`, `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`,
  `SHIPYARD_CAPACITY_EXCEEDED`, `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`,
  `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`, `REBUILD_CLASSIFICATION_INVALID`).
- **Player surface (SB3-R30..R35).** Extend the Construction screen and Drawing Board behind the
  existing construction bridge contract; add row actions (halt/resume/accelerate), the batch dialog,
  the dock/capacity panel, and the foreign-yard flow. Every control edits a command/draft; every
  readout displays a compiled value (SB-2).
- **Numeric/determinism.** All new arithmetic is integer/bp with declared rounding; all randomness is
  keyed (the acceleration-pressure stream and the private-expansion event stream) and recorded;
  nothing reads wall clock, locale or `Math.random`.

## Testing Decisions

Good tests exercise **external behaviour**: the produced work, status, cost, capacity reservation,
classification result and hash — never private helpers. Prefer the highest seam (the pure package
function or the monthly phase), then the command lifecycle, then persistence round-trip, then the
desktop render/e2e test.

- **Classification:** one test-vector fixture per type from the Appendix 1 table, both sides of every
  strict/inclusive boundary; a locked-type refusal test. Prior art: the existing classification and
  `shipTypeAvailability` suites.
- **Build phase (halt/delay/acceleration):** pure-function unit tests on the monthly resolution
  (zero work/charge when halted/delayed; premium applied once; rate multiplier in paid months),
  boundary tests at the acceleration-pressure threshold and probability cap, and a two-process
  determinism test on the seeded stream. Prior art: SB-1 construction-transition tests and
  `packages/ship-design` progress tests (ADR-0077).
- **Batch/naming:** unit tests for quantity 1/12/13, reservation equality, deterministic name
  allocation and collision handling; a persistence round-trip. Prior art: the construction-order
  eligibility suite (ADR-0088 §8).
- **Dock/capacity:** boundary tests at the dock mass limit, the expansion dual-completion condition,
  the private-event eligibility/cooldown, and the concurrency cap. Persistence for dock/limits.
- **Foreign yard:** capability-predicate unit tests, a capacity-ledger test (ordering nation
  untouched), war-policy outcome tests, delivery-guarantee vs physical-impossibility tests, and the
  insight-milestone/cap tests. Prior art: the financial-ledger tests and the phase-engine
  command-lifecycle tests.
- **Rebuild:** refit-legality tests for `BULGE` and armament changes; retained-hull boundary tests;
  the p27 revision-limit pin; reclassification-failure test. Prior art: SB tickets 21/28 refit-rebuild
  suites.
- **Desktop:** render tests per new control; `pnpm snap` for every changed screen with `aria.yaml`
  assertions by role and accessible name, console clean, no churn warning; the e2e suite covers
  order → halt → accelerate → advance month → launch. Per AGENTS.md a UI change without a captured
  screen is not APPROVE-able.

## Out of Scope

- **Rebuilding the design/drawing-board model.** SB-1/SB-2 own it; this spec verifies it.
- **Cloning the reference UI.** Mechanics are matched, not screens.
- **Later-era constructs beyond the EARLY band.** Dreadnought BB/BC evolution, carriers and CV/CVL
  conversions, missiles, helicopter AV; **BC predicate / BB↔BC armour-index precedence and the
  manual ↔ DESIGN-22 §12 BC speed divergence** (ticket 04, deferred).
- **DESIGN-23 latent defects, scrapping/salvage, and treaty inspection** beyond the BUILDING SHIPS
  span.
- **DESIGN-21 design-study/similarity** beyond what batch and repeat orders require (SB3-R14).
- **Submarine and coastal-artillery design.** The manual builds both "like ships" (pp33/36) but they
  belong to the existing `c3-m3-submarines` / `c4-m3-coastal-defenses` efforts (map §Not-yet-specified);
  this spec only counts submarines in capacity (SB3-R19).
- **AI consumption of ship type.** The manual says "the AI relies heavily on ship type"; how far AI
  decision-making must be type-driven is unresolved (map fog) and not scoped here.
- **Treaties vs classification/docks** (displacement/tonnage-cap interaction) — may belong to a
  separate diplomacy effort.

## Further Notes

- **Deferred and recorded, not dropped:** era-threshold content (DD/CL/CV maxima growth, BC speed
  rise, CA→heavy-cruiser morph); dock-growth period bands beyond EARLY; name pools; foreign-yard
  resolution detail (impound timing, treaty-delivery guarantee, insight transfer numbers already fixed
  but predicate values pending); AI type consumption; treaties vs classification.
- **Build-time determinant divergence.** The manual says build time is a function of **ship type**
  (p30) modified by an efficient/undeveloped industry; the app realises it as SB-1's
  displacement-based build-time table plus an era multiplier (SB tickets 20/22/26). The ship-type
  table and the industry-modifier magnitude are BALANCE TARGETs the manual does not give; record the
  equivalence and keep the values as versioned constants rather than inventing them.
- **`pnpm snap`.** `apps/desktop` is screenshotted via Playwright; per AGENTS.md the implementator and
  reviewer each capture the affected screen and check it against the acceptance criteria.
- **Provenance.** Every numeric constant in this spec is either a manual value (cited), an
  already-recorded ADR value, or explicitly a BALANCE TARGET/PLACEHOLDER. No value is invented.

---

## Decisions

### Ticket answers folded in (source of truth: `.scratch/shipbuilding-process/issues/`)

- **01 research — Appendix 1 reference.** The eleven types tabulated with exact bounds (p131–134);
  tech-scaled maxima are unscheduled BALANCE TARGETs. → feeds SB3-R1/R3.
- **02 research — BUILDING SHIPS reference.** Instalments, halting, acceleration, batch 1–12, rebuild
  list, docks, capacity, foreign yards captured p30–33; the industry modifier, acceleration count,
  dock multiplier, impoundment probability and mothball cost base have no manual number. → feeds
  (b)–(g).
- **03 fidelity policy.** DESIGN-21/22/23 stay normative, amended by ADR (ADR-0095); the manual is the
  intended-behaviour reference; deviations recorded (ADR-0067 precedent); richer-than-manual depth
  kept; hand-off is a sprint spec + ADRs; `pnpm check` + determinism is the bar; EARLY band confirmed.
  → this spec's authority policy.
- **04 classification fidelity.** EARLY-band classification already matches the manual for all
  implemented types; deviations in ADR-0067/0088; only new item a DESIGN-22 §9 annotation for the
  2000 t gap-fill; BC, carriers, SS/MTB/TR and era-scaled CL/CV maxima deferred. → SB3-R1..R3.
- **05 work/payment/halt/delay.** Instalments = existing per-package payment; add `HALTED`/`DELAYED`
  statuses, a halt/resume command, a status-enum migration; halted cost = half the mothballed
  maintenance (PLACEHOLDER base). → SB3-R4..R7.
- **06 acceleration/capacity pressure.** DESIGN-23 §8–9 already reproduces 10 %/+5 %
  (`10_500`/`11_000`); the "limited number" is the §9 capacity-pressure delay, not a count cap; move
  acceleration into the phase engine with `SetAcceleration`. → SB3-R8..R10.
- **07 class-order batch/naming.** Implement DESIGN-23 §3–5 (`OrderConstructionCommand` of 1..12, one
  compiled version, reservations before projects, deterministic per-nation naming; >12 rejected).
  → SB3-R11..R14.
- **08 dock/capacity.** The manual's dock mechanics live in DESIGN-13 §4–6; add the national
  concurrency cap (`shipyardCapacityMultipleBp × dockSize`, BALANCE TARGET) with rebuilds/AMC/
  corvettes excluded and submarines counted, alongside DESIGN-13 §7 work pools. → SB3-R15..R19.
- **09 foreign yards.** Map one-to-one onto DESIGN-13 §13–14 (builder dock limit, tension-scaled
  impoundment, treaty delivery, tech insight); implement as written. → SB3-R20..R24.
- **10 rebuild parity.** Rebuild suite maps onto the refit kinds already done; add a `BULGE` action and
  armament-change validation; defer CV/CVL conversion and BC→BB; cross-check the p27 revision limits.
  → SB3-R25..R29.
- **11 player-facing flow.** Construction screen + Drawing Board surface the batch dialog, instalments,
  halt/resume, accelerate, a dock/capacity panel and foreign-yard ordering, with the `pnpm snap` +
  aria + e2e bar. → SB3-R30..R35.

### ADRs still to create

New ADRs must reference DESIGN docs and be classified in `docs/adr/AMENDMENTS.md` with the DESIGN
header `> **Amended by:**` banner (ADR-0095 §3; `pnpm preflight` fails otherwise).

1. **Bulges refit action** — new `BULGE` refit kind and its protection/speed constants; extends
   ADR-0067 §3 and amends DESIGN-23 §18/§21. (SB3-R25)
2. **Armament-change validation** — the manual's main/secondary/tertiary conditions on `REARMAMENT`;
   extends ADR-0067/ADR-0088 and amends DESIGN-23 §21 / DESIGN-22 §22. (SB3-R26)
3. **Design-revision limits (p27)** — only if the cross-check finds `ReviseProject`/
   `constructionRevision` do not enforce the manual's p27 numbers; aligning is a rule change and
   amends DESIGN-21. (SB3-R28)
4. **AMC / small-corvette construction-capacity exemption** — resolves the DESIGN-13 §9 `0` bp vs the
   manual's exclusion (SB3-R19 **OPEN DECISION**); amends DESIGN-13 §9 and fixes the "small corvette"
   threshold. **Flag to orchestrator — do not resolve by guesswork.**
5. **National concurrency cap constant** — materialises `maxConcurrentConstructionMassKg` /
   `shipyardCapacityMultipleBp` and the displacement-reservation-layered-on-work-micro-units unit
   choice, beyond DESIGN-13 §7; likely an ADR (new capacity unit) with a versioned balance constant.
   (SB3-R18/R19)
6. **Project-status model + save migration** — the DESIGN-23 §2 status extension is a save-format
   change; record the compatibility bump and the registered migration (or documented rejection) per
   ADR-0113. (SB3-R7)

**Not an ADR:** the **DESIGN-22 §9 lower-bound annotation** (ticket 04 explicitly decides no ADR —
easy to reverse, unsurprising); it is a one-line doc note only. (SB3-R2)

**Already covered — do not repeat:** CA strictly `>6 in` and the broader `ARMOUR_MODIFICATION`
(ADR-0067); DD armour read as 2 in, CL belt `≤2 in` warning, KE/AMC any-role gun, AMC fast `≥22 kn`,
and the locked `BB`/`BC` roster (ADR-0088); the 1880 scenario B relaxation (ADR-0116); rebuild
retained-hull validation and projects (ADR-0078, DESIGN-23 §21–22). SB3 extends these, it does not
re-litigate them.

### Open decisions flagged (not resolved)

- **SB3-R28 — p27 revision limits** are a cross-check with a conditional ADR: if the code already
  enforces them, no change; the spec does not assume either outcome.

(SB3-R19 was resolved by the orchestrator on 2026-10-12 — see its requirement: align to the manual via
a non-zero `ConstructionCapacityExemptionDefinition` plus an ADR.)

---

## Definition of Done (reviewer checklist)

On the exact commit, for each requirement delivered:

- [ ] Every acceptance criterion has an automated test (unit / boundary / determinism / persistence)
      that exercises external behaviour.
- [ ] `pnpm preflight` green — git state, single-copy `effect`, dependency policy, docs links/anchors,
      ADR index/`AMENDMENTS.md`, doc budgets, no new `as unknown` casts.
- [ ] `pnpm test:scripts` green (gate fixtures).
- [ ] `pnpm check` green end-to-end — format, lint, `lint:effect`, licences, typecheck, build, tests,
      balance reports, desktop E2E.
- [ ] Cross-process determinism holds (`pnpm test:cross-process`): identical inputs/seed → identical
      authoritative hash in two processes (acceleration-pressure, private-expansion and naming in
      particular).
- [ ] Goldens updated deliberately: old and new hashes, authoritative cause and migration assessment
      recorded (ADR-0099, ADR-0106, ADR-0107); never regenerated merely to pass.
- [ ] Persistence: the status-model change migrates or rejects a stale save with the stable
      diagnostic (ADR-0113); save/load preserves future outcomes.
- [ ] UI changes captured with `pnpm snap` (screenshot + `aria.yaml`, console clean, no churn
      warning); e2e covers order → halt → accelerate → advance month → launch.
- [ ] Required ADRs created and classified in `docs/adr/AMENDMENTS.md` with DESIGN banners; OPEN
      DECISION (SB3-R19) resolved by ADR, not silently.
- [ ] Traceability updated: `.ai/SPRINT-PLAN.md` (P-2 row), `.ai/specs/README.md` pointer, and
      `docs/requirements/` if a new requirement id is added.
- [ ] Conventional Commits, clean working tree, no weakened tests or fixtures.

### Validation commands

- Focused (per increment): the affected package's test task via the workspace filter, plus the
  package build/typecheck.
- Full orchestrator gate: `pnpm preflight`, `pnpm test:scripts`, `pnpm check`,
  `pnpm test:cross-process`, and `pnpm snap` for each changed screen.

---

## Plan order (dependency-ordered frontier for `to-tickets`)

1. **SB3-R1..R3** classification parity + §9 annotation (doc/test only; unblocks nothing, lands
   first).
2. **SB3-R7** project-status model + migration (foundational: gates halt/delay/acceleration/foreign).
3. **SB3-R4..R6** instalment confirmation, halt/resume, delay.
4. **SB3-R8..R10** engine acceleration + capacity-pressure delay.
5. **SB3-R15..R19** dock ceiling, expansion, private event, concurrency cap (resolve the SB3-R19 open
   decision first).
6. **SB3-R11..R14** class-order batch + naming (needs reservations + dock/capacity).
7. **SB3-R20..R24** foreign-yard contracts, payment, war effects, insight.
8. **SB3-R25..R29** rebuild parity (`BULGE`, armament validation, p27 cross-check).
9. **SB3-R30..R35** player-facing surface (after all domain slices; ticket 11's blocking edges
   honoured).
