# B-3 Spec — M2 Gunnery: Core Surface Fire-Resolution (M2 Surface Tactical Core)

- **Sprint:** B-3 (`.ai/SPRINT-PLAN.md` Track B row 3)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the B-3 scoping sprint; B-3-IMPL executes it)
- **Governing docs:** DESIGN-39 (`docs/rules/gunnery.md`) — **core surface gunnery fire-resolution slice only** (state, fire modes, accuracy, rate-of-fire/reload, gun quality, ammunition, event record, ordering, reason codes); cross-refs DESIGN-38 (tactical combat — minute-advance, contact, `BattleLedger`/`canonicalEventOrder`, reason-code catalog), DESIGN-07 (integer arithmetic), DESIGN-55 §3.
- **Baseline:** B-2-IMPL DONE (2026-08-12, PASS). `@bluewave/combat` minute-advance engine in place (`simulation/engine.ts` steps 4–8, `BattleLedger`+`canonicalEventOrder`, versioned `*_v1` contracts + `SHIPPED_*_CONTRACT` + validate guards, reason-code catalog, `TacticalContact` tracks via `contact/lifecycle.ts`). `BattleResolver`/`StrengthCalculator` unmodified.
- **Target:** core surface gunnery fire-resolution reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (integration into the phase pipeline is B-6); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes must remain unchanged (no ADR-0007 regeneration).

---

## 1. Scope

B-3 delivers a deterministic, pure, minute-advancing **surface gunnery fire-resolution**
over the B-2 `TacticalContact` tracks, running as an engine stage (`resolveGunnery`)
inside the existing minute-advance simulation **after** spotting (step 8). It
implements DESIGN-39 §§1–5, §28, §30–32 and the §33 validation items that pertain
to this slice, emitting immutable `GunneryEventRecord`s through the existing
`BattleLedger` + `canonicalEventOrder`. It ships the gunnery versioned constants +
reason codes and a research-grounded **naval gun ballistics constant set**.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-39 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **GunneryState invariant** — authoritative numeric `GunneryState` surface (§1: acquisition bp, range estimate/uncertainty, fire-control solution quality, ammunition count by type, reload progress ms, last salvo minute/substep, versions) uses integer/fixed-point; non-integers rejected (`GUNNERY_STATE_INVARIANT_FAILED` / `TACTICAL_STATE_INVARIANT_FAILED`); state carries an authoritative hash. | `combat/test/gunnery/state.test.ts` (invalid + boundary) |
| AC-2 | **Fire modes** — seven canonical modes as a closed enum with a per-mode record (§2): `CEASE_FIRE`, `RANGING`, `NORMAL`, `RAPID`, `AA_TRACKING`, `AA_BARRAGE`, `LOCAL_CONTROL`; each declares ammo/reload/accuracy/eligibility/fire-control/cancellation behavior. `RAPID`/`AA_TRACKING`/`AA_BARRAGE` are **defined** (semantics + reload/ammo) but their eligibility predicates are **deferred** — a firing guard reports the deferred predicate rather than fabricating one. | `combat/test/gunnery/modes.test.ts` |
| AC-3 | **Accuracy formula exactness** — `finalAccuracyBp = clamp(0, 10_000, floor(baseAccuracyBp * Π_m multiplierBp_m / 10_000^16))` with the exact integer (basis-point) rational value retained through **all** multipliers and rounded **once** with `FLOOR` (§3); the factor manifest is explicit + versioned (base + fire-control, crew, officer, training, range, visibility, radar, own-maneuver, target-maneuver, previous-salvo, sea-state, smoke, damage, multiple-attacker, glare, target-evasion = 17 named factors); a missing factor fails with `GUNNERY_ACCURACY_FACTOR_MISSING` (never a silent 10_000 fallback). | `combat/test/gunnery/accuracy.test.ts` (exactness + floor + factor-missing) |
| AC-4 | **Hit-check draw semantics** — one keyed integer draw `0..9_999` (domain-separated `@bluewave/random` stream) compared to `finalAccuracyBp`, succeeding exactly when `draw < finalAccuracyBp` (§3); the draw is recorded as a random decision in the event record. | `combat/test/gunnery/hit-check.test.ts` (+ keyed-stream) |
| AC-5 | **Rate-of-fire/reload** — reload is integer tactical-milliseconds of work; `baseReloadMilliseconds` positive integer; `effectiveReloadMs = ceil(baseReloadMs * 10_000^n / Π rateMultipliersBp)` with multipliers in §4 order 1–11; a missing rate factor fails with `GUNNERY_RATE_FACTOR_MISSING`; progress advances in exact ms and a battery fires only at full progress AND all firing predicates pass. | `combat/test/gunnery/rate-of-fire.test.ts` (integer-ms + ceil + order) |
| AC-6 | **Gun quality** — integer `-3..+2` with shipped range/penetration/rate multipliers `8_500..11_000` (§5); out-of-range fails with `GUN_QUALITY_OUT_OF_RANGE`; a definition MAY declare quality does not affect rate-of-fire (rate multiplier then omitted). | `combat/test/gunnery/gun-quality.test.ts` (table exactness + bounds) |
| AC-7 | **Ammunition count + atomic consume** — exact count by type tracked; a salvo reserves and consumes ammunition **atomically** (§28); when required ammo is unavailable, another permitted type is selected or it fails with `GUNNERY_AMMUNITION_UNAVAILABLE`. | `combat/test/gunnery/ammunition.test.ts` |
| AC-8 | **GunneryEventRecord completeness** — every salvo/AA burst produces an immutable record carrying the §30 fields (battle minute/substep; battery/shooter/target contact ids; command source; fire mode; ammunition; accuracy+rate factors; random decisions; impact/armor inputs (reserved this slice); outcome; damage-event references (reserved); formula+ruleset versions; event hash). | `combat/test/gunnery/event-record.test.ts` |
| AC-9 | **Canonical ordering** — gunnery events order by §31 (tactical sides → shooting ships by id → batteries → mounts → target contacts → shots/barrel → impacts → damage effects); DB/UI/rendering/wall-clock order MUST NOT affect outcomes; emitted via `BattleLedger`+`canonicalEventOrder`. | `combat/test/gunnery/ordering.test.ts`, `combat/test/gunnery/ledger-order.test.ts` |
| AC-10 | **Reason-code set-equality** — this slice ships exactly the DESIGN-39 §32 codes relevant to the slice (see §1.4) plus the reused existing combat codes; a `reason-codes` set-equality check against §32 + the existing catalog prevents silent addition; every genuinely new code is recorded as a versioned-ruleset decision in the B-3 scope ADR, never invented doc-less. | `combat/test/reason-codes-gunnery.test.ts` |
| AC-11 | **Gunnery-in-minute-advance** — `resolveGunnery` runs as a pure engine stage after spotting (step 8) each minute, given the B-2 `TacticalContact` tracks and the observing ships' batteries, emitting events via `BattleLedger`+`canonicalEventOrder` + a minute-state hash; `BattleResolver`/`StrengthCalculator` UNMODIFIED (verified by diff). | `combat/test/gunnery/advance.test.ts`, `combat/test/gunnery/pipeline-order.test.ts`, `combat/test/gunnery/integration-boundary.test.ts` |
| AC-12 | **Fog-of-war targeting** — a battery MUST NOT target a hidden authoritative asset; targeting references a legal `TacticalContact` only; hidden true asset → `TACTICAL_FOG_OF_WAR_VIOLATION` (reuse `validateTargetOrder`, the DESIGN-38 fog predicate — §1 cross-ref §27). | `combat/test/gunnery/targeting-fog.test.ts` |
| AC-13 | **Two-process determinism** — identical state+inputs produce identical per-minute hashes and events; verified by **two separate child processes** (node-spawn ×2, byte-compared) so OS-independence is genuinely exercised (no ambient randomness/clock; §33.32). | `combat/test/gunnery/determinism.test.ts` + `@bluewave/cross-process-test` child ×2 |
| AC-14 | **Contracts + validate guards** — every new gunnery constant ships `*_v1` + `SHIPPED_GUNNERY_CONTRACT` (and any `SHIPPED_*_CONTRACT` subsets) + a validate guard; gunnery contract/version pinning fails closed validation. | `combat/test/gunnery/contracts.test.ts` |
| AC-15 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 9/9; `BattleResolver`/`StrengthCalculator` unmodified (verified by diff). | orchestrator gate |

### 1.2 In scope

1. **GunneryState + fire modes + guards + constants** (INC-1): authoritative `GunneryState`
   per operational battery (DESIGN-39 §1 — battery/gun/mount ids, target contact or `NONE`,
   acquisition bp, range estimate + uncertainty, fire-control solution quality, ammunition
   by type, fire mode, reload progress ms, straddle state (reserved), damage state
   (reserved), last salvo minute/substep, ruleset+formula versions, state hash); the seven
   fire modes as a closed enum with per-mode records (§2); `assertFixedPointGunnery`
   guards; base gunnery constant contracts seeded.
2. **Accuracy resolution** (INC-2): 17-factor versioned manifest, exact integer basis-point
   product, `clamp(0,10_000, floor(…))`, `GUNNERY_ACCURACY_FACTOR_MISSING` (DESIGN-39 §3);
   keyed hit-draw check (§3). Non-slice factors pinned to neutral 10_000 as authored
   constants until their owning modifier track lands (range/visibility/radar/etc. are
   as-authored neutral constants, not invented behavior).
3. **Rate-of-fire / reload + gun quality** (INC-3): integer tactical-ms reload, `ceil`,
   §4 order 1–11, `GUNNERY_RATE_FACTOR_MISSING` (§4); gun-quality `-3..+2` table + bounds,
   optional no-rate-effect declaration, `GUN_QUALITY_OUT_OF_RANGE` (§5). Deferred rate
   factors (autoloader/damage/etc.) pinned to neutral 10_000 as authored constants; the
   real gun-quality + crew + technology surface ships so order + ceiling rounding are fully
   exercised.
4. **Salvo/AA-burst → event + ordering + reason codes + engine wiring** (INC-4): atomic
   ammunition reserve+consume + `GUNNERY_AMMUNITION_UNAVAILABLE` (§28); immutable
   `GunneryEventRecord` (§30) with canonical ordering (§31) via `BattleLedger` +
   `canonicalEventOrder`; the in-slice reason-code surface (§32 subset, see §1.4);
   `resolveGunnery` engine stage wired after spotting in the minute-advance simulation
   (integration boundary, ticket 02); fog-of-war target legality (AC-12); two-process
   determinism (AC-13).
5. **Contracts / content-constants rollup + ADR + traceability** (INC-5): full
   `*_v1` + `SHIPPED_GUNNERY_CONTRACT` + validate guards + reason-code set-equality vs
   §32 + catalog (AC-10, AC-14); research-grounded **naval gun ballistics constant set**
   (base reload ms by broad caliber, salvo/spotting practice, fire-control cycle —
   grounding `baseReloadMilliseconds` for the demonstration batteries) referenced from
   `docs/research/b3-m2-gunnery.md` (produced by the research subagent in parallel);
   B-3 scope/integration + reason-code-constant ADR (`ADR-0020`, mirrors ADR-0018); spec +
   brief + research note + PROGRESS/SPRINT-PLAN update; goldens unchanged (AC-15).
6. **B-3 ADR + traceability**: ADR-0020 (scope/integration boundary + reason-code/constant
   policies); spec + brief + research note; PROGRESS/SPRINT-PLAN update.

### 1.3 Content deliverable

The **naval gun ballistics constant set** as engine versioned constants (`gunnery_v1` +
`SHIPPED_GUNNERY_CONTRACT` + `validateGunneryContract`), grounded in
`docs/research/b3-m2-gunnery.md` (base reload ms by broad caliber, salvo/spotting
practice, fire-control cycle). No production-pack YAML change (`content/production/1880/`
untouched; goldens unchanged). A future tactical-constants content collection may absorb
these at B-6 integration (deferred).

### 1.4 Reason codes (DESIGN-39 §32 subset for this slice)

DESIGN-39 §32 is **authoritative for this subsystem**. This slice ships the §32 codes
relevant to the core fire-resolution surface; codes owned by deferred subsystems are
recorded, not dropped. **In-slice (new, recorded in ADR-0020):**

- `INVALID_GUNNERY_STATE`
- `GUNNERY_ACCURACY_FACTOR_MISSING`
- `GUNNERY_RATE_FACTOR_MISSING`
- `GUN_QUALITY_OUT_OF_RANGE`
- `GUNNERY_AMMUNITION_UNAVAILABLE`
- `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT` (surface-mode firing guard; the exact
  surface solution threshold is a versioned-ruleset constant documented in ADR-0020 — not
  fabricated)
- `GUNNERY_STATE_INVARIANT_FAILED`
- `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` (new, non-§32 marker code: `RAPID`/`AA_TRACKING`/
  `AA_BARRAGE` eligibility predicates are deferred to the straddle/AA slice; a firing guard
  reports this rather than fabricating a predicate, AC-2)

These form the 8-code in-slice surface shipped as `GUNNERY_REASON_CODES`.

**Reused existing combat catalog codes** (no new record needed): `TACTICAL_STATE_INVARIANT_FAILED`
(state-invariant guard), `TACTICAL_FOG_OF_WAR_VIOLATION` (targeting legality via reused
`validateTargetOrder`), `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`
(minute-advance clock).

**Deferred §32 codes (recorded, owned by later slices/tracks):**
`AUTOLOADER_TECHNOLOGY_UNAVAILABLE`, `AUTOLOADER_MOUNT_INELIGIBLE`, `AUTOLOADER_FEED_JAMMED`
(autoloader slice §6–10); `DUAL_PURPOSE_GUN_CONTRACT_MISSING`, `DUAL_PURPOSE_ROLE_SWITCHING`,
`DUAL_PURPOSE_AA_INELIGIBLE` (dual-purpose slice §11–15); `ARMOR_ZONE_MAXIMUM_MISSING`,
`ARMOR_THICKNESS_LIMIT_EXCEEDED`, `ARMOR_MANUFACTURING_POLICY_MISSING`,
`SPLINTER_PROTECTION_NOT_QUALIFIED` (armor/penetration §16–24 → B-4 armor track);
`GUNNERY_TARGET_ILLEGAL` (target-allocation/manual-orders §26–27 slice);
`GUNNERY_STRADDLE_INVALID` (straddle slice §25).

A `reason-codes-gunnery.test.ts` set-equality check against §32 + the existing catalog
prevents silent addition (AC-10).

---

## 2. Increments (frontier-ordered implementation tickets, to-tickets output)

- **INC-1 — GunneryState + fire modes + guards + constants** (state contract + `assertFixedPointGunnery` + closed-mode enum + per-mode records; AC-1..AC-2, AC-14 seeds).
- **INC-2 — Accuracy resolution** (17-factor versioned manifest + exact product + one FLOOR + clamp + factor-missing + keyed hit-draw; AC-3..AC-4).
- **INC-3 — Rate-of-fire / reload + gun quality** (integer-ms reload + ceil + §4 order + factor-missing + gun-quality table/bounds; AC-5..AC-6).
- **INC-4 — Salvo / event + ordering + reason codes + engine wiring** (atomic ammunition + `GUNNERY_AMMUNITION_UNAVAILABLE`; `GunneryEventRecord` + §31 ordering; in-slice reason codes; `resolveGunnery` stage after spotting in the minute-advance simulation; fog-of-war target legality; two-process determinism; AC-7..AC-9, AC-11..AC-13).
- **INC-5 — Contracts / content-constants rollup + ADR + traceability** (full `*_v1` + `SHIPPED_GUNNERY_CONTRACT` + validate guards; reason-code set-equality vs §32 + catalog; research-grounded ballistics constant set; ADR-0020; PROGRESS/SPRINT-PLAN update; goldens unchanged; AC-10, AC-14..AC-15).

Each increment passes its AC tests and the reviewer before the next. INC-1..INC-4 add
no snapshot schema or phase change; INC-5 verifies goldens unchanged and records the
B-3 ADR.

---

## 3. Out of scope (deferred — enumerated, owning track)

- **Autoloaders (§6–10)** — later dedicated gunnery slice.
- **Dual-purpose (§11–15)** — later dedicated gunnery slice.
- **Armor zones / thickness limits / penetration outcomes (§16–24)** — folds with the
  **B-4 armor-and-damage** track (DESIGN-41).
- **Straddle registration (§25) + RAPID/AA eligibility predicates** — later straddle/AA
  slice (RAPID/AA modes are defined but their predicates are deferred, never fabricated).
- **Target allocation + manual target orders (§26–27)** — later gunnery slice (GUNNERY_TARGET_ILLEGAL deferred).
- **Damage effects on gunnery state (§29)** — B-4 / DAMAGE track.
- **Phase-engine wiring replacing `BattleResolver`** (B-6); **auto-resolution statistical
  validation** (B-6/release); **player battle UI**; **production-pack YAML changes**
  (content tracked separately).
- **Golden regeneration / campaign snapshot schema change** — none unless an authoritative
  cause is documented.

---

## 4. Testing and validation

- Unit tests per gunnery function (state, modes, accuracy, rate-of-fire/reload, gun
  quality, ammunition, event record, ordering) incl. invalid/boundary cases.
- Integration: `resolveGunnery` minute-advance order + event emission via `BattleLedger` +
  `canonicalEventOrder`; fog-of-war target legality.
- Determinism: **two separate child processes** (node-spawn ×2, byte-compared) via the
  `@bluewave/cross-process-test` child where reachable from a campaign artifact, else a
  battery of two-process byte-compares within `@bluewave/combat` — so the minute-state
  hash (authoritative) is proven OS-independent.
- Reason-code set-equality vs DESIGN-39 §32 + existing catalog.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs` (9/9),
  cross-process byte-identical; `BattleResolver`/`StrengthCalculator` unchanged (diff).
- Pre-existing unrelated failure documented (not newly caused): content-schema
  `nation.test.ts` (broken `content/research/nations/1880/index.ts` import). The desktop
  `project.test.ts` suite passes and is NOT a baseline failure.

---

## 5. Definition of done (B-3-IMPL)

- All AC-1..AC-15 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified); `BattleResolver`/`StrengthCalculator` unmodified
  (verified by diff).
- Versioned contracts + reason codes + ADR-0020 landed; research note
  `docs/research/b3-m2-gunnery.md` present.
- Traceability updated (SPRINT-PLAN B-3 row, PROGRESS, validation report
  `.ai/reports/b3-m2-gunnery-impl.md`); Conventional Commits on `dev`; clean working tree.
