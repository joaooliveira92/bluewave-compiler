# B-2 Spec — Tactical Movement, Spotting & Contact State (M2 Surface Tactical Core)

- **Sprint:** B-2 (`.ai/SPRINT-PLAN.md` Track B row 2)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the B-2 scoping sprint; B-2-IMPL executes it)
- **Governing docs:** DESIGN-38 (`docs/rules/tactical-combat.md`) — **movement/spotting/contact subset only**; cross-refs DESIGN-26 (formations), DESIGN-07 (fixed-point arithmetic), DESIGN-55 §3.
- **Baseline:** B-1 IMPL DONE (2026-08-12, PASS_WITH_LIMITATIONS). `@bluewave/combat` scaffolding in place: `movement.ts`, `targeting.ts`, `tactical/{state,unit,division}.ts`, `tacticalPipeline.ts`, `tacticalClock.ts`, `tacticalTime.ts`, `fullSpeedStress.ts`, `battleLedger.ts`.
- **Target:** movement/spotting/contact capabilities reach `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (integration into the phase pipeline is B-6); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes must remain unchanged (no ADR-0007 regeneration).

---

## 1. Scope

B-2 delivers a deterministic, pure, minute-advancing **tactical movement/spotting/
contact simulation** over the B-1 `TacticalBattleState`, driven by the existing
`TacticalClock`, implementing the DESIGN-38 §3 pipeline steps 4–8 subset:
`update_contact_knowledge` (step 4), `resolve_movement_intent` (step 5),
`resolve_propulsion_formation` (step 6), and `resolve_sensors_spotting` (step 8).
It also ships the movement/spotting/contact versioned constants + reason codes and
a research-grounded formation/movement constant set.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-38 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **Movement state invariant** — authoritative movement uses integer/fixed-point for the full numeric `MovementState` surface (§20: position, heading, ordered/current speed, acceleration, turning rate, collision radius; fuel/propulsion/enum fields excluded); non-integers are rejected (`TACTICAL_STATE_INVARIANT_FAILED`). | `combat/test/movement/movement.test.ts` (invalid + boundary) |
| AC-2 | **Position advance** — a unit at heading+currentSpeed advances deterministically over a substep and a minute; result is integer and reversible-to-invariant. | `movement/position.test.ts` |
| AC-3 | **Propulsion** — `currentSpeed` approaches `orderedSpeed` at bounded thrust/brake acceleration per versioned contract; clamps at attainable max. | `movement/propulsion.test.ts` |
| AC-4 | **Turning** — heading approaches `orderedHeading` at bounded design turning rate; rate-limited; reciprocal-course reuse (`battleTurnAway`). | `movement/turning.test.ts` |
| AC-5 | **Formation stations** — per-formation column interval/gap/tolerance are versioned constants; each unit computes desired station from ordinal + formation lead; helm steers toward station. | `movement/formation-station.test.ts` |
| AC-6 | **Collisions/grounding hook** — `resolve_collisions_grounding` emits a successful **empty** record (deferred resolution); no partial mutation. | `movement/pipeline.test.ts` |
| AC-7 | **Detection model** — detection when target within sensor range + line-of-sight at baseline clear daylight; sensor ranges + neutral visibility multiplier are versioned constants; deterministic. | `spotting/detection.test.ts` (+ keyed-stream scatter) |
| AC-8 | **Line-of-sight** — pure flat-open-sea horizon predicate; extensible seam for geometry later; no ambient I/O. | `spotting/los.test.ts` |
| AC-9 | **Spotting resolution** — `resolve_sensors_spotting` produces contact tracks only from detected true assets, recording reason/source; never hidden identity leak. | `spotting/resolve.test.ts` |
| AC-10 | **Contact lifecycle** — create/update/age/merge across minutes; confidence decay (versioned slope) + staleness threshold; deterministic by stable asset key. | `contact/contact-lifecycle.test.ts` |
| AC-11 | **Fog-of-war** — targeting/order resolution references legal `ContactTrack` only; hidden true asset → `TACTICAL_FOG_OF_WAR_VIOLATION` (reuse `validateTargetOrder`). | `contact/fog-of-war.test.ts` |
| AC-12 | **Minute-advance simulation** — an orchestrator advances a `TacticalBattleState` N minutes through steps 4–8 in DESIGN-38 order from a `TacticalClock`, appending battle events **via the existing `BattleLedger` with `canonicalEventOrder` (DESIGN-38 §35 12-field record, minute/substep/priority/actor/target/event-id ordering)** + computing a minute-state hash per minute. | `simulation/advance.test.ts`, `simulation/pipeline-order.test.ts`, `simulation/ledger-order.test.ts` |
| AC-13 | **Determinism** — identical state+inputs produce identical per-minute hashes and events; verified by **two separate child processes** (node-spawn ×2, byte-compared) so OS-independence is genuinely exercised (no ambient randomness/clock). | `simulation/determinism.test.ts` + `@bluewave/cross-process-test` child ×2 |
| AC-14 | **Contracts + reason codes** — every new constant ships `*_v1` + `SHIPPED_*_CONTRACT` + validate guard; the reason-code surface ships exactly the existing DESIGN-38 §36 codes relevant to this subset (`TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`, `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`); any genuinely new code is recorded as a versioned-ruleset ADR decision, never invented without a doc. | `contracts.test.ts`, `reason-codes.test.ts` (set-equality vs §36 + existing catalog) |
| AC-15 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 9/9. | orchestrator gate |

### 1.2 In scope

1. **Movement kinematics** (INC-1): `MovementState` integration — position advance,
   propulsion, turning, formation stations (DESIGN-38 §20, §3 steps 5–6);
   `assertFixedPointMovement` guards.
2. **Spotting/sensor model** (INC-2): detection ranges, line-of-sight, baseline
   visibility, deterministic detection + keyed-stream scatter (DESIGN-38 §3 step 8).
3. **Contact state & knowledge lifecycle** (INC-3): track create/update/age/merge +
   confidence/uncertainty + fog-of-war enforcement (DESIGN-38 §3 step 4, §19).
4. **Tactical simulation engine** (INC-4): `TacticalClock`-driven minute-advance
   running steps 4–8 in order, emitting battle-event records + minute-state hashes
   (DESIGN-38 §3, §35).
5. **Versioned constants, contracts, reason codes** (INC-5): new `*_v1` constants +
   `SHIPPED_*_CONTRACT` + validate guards for movement/spotting/contact; reason codes
   (DESIGN-38 §36 subset) with exact names; research-grounded formation/movement
   constant set.
6. **B-2 ADR + traceability**: ADR-0018 scope/integration boundary; spec + brief +
   research note; PROGRESS/SPRINT-PLAN update.

### 1.3 Content deliverable

The **formation/movement constant set** as engine versioned constants
(`*_v1` + `SHIPPED_*_CONTRACT`), grounded in
`docs/research/b2-m2-movement-spotting.md`. No production-pack YAML change
(`content/production/1880/` untouched; goldens unchanged). A future tactical-
constants content collection may absorb these at integration (deferred).

### 1.4 Reason codes (DESIGN-38 §36 subset)

B-2 ships exactly the existing DESIGN-38 §36 codes relevant to this subset:
`TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`,
`INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT` — all already present in
the combat catalog. DESIGN-38 §36 defines **no** movement/spotting/contact-specific
codes; if the implementation genuinely needs a new code, it MUST be recorded as a
versioned-ruleset ADR decision (B-2 scope ADR), never invented doc-less. A
`reason-codes.test.ts` set-equality check against §36 + the existing catalog
prevents silent addition.

---

## 2. Increments (frontier-ordered implementation tickets, to-tickets output)

- **INC-1 — Movement kinematics** (movement contracts + position/propulsion/turning/
  formation-station functions; AC-1..AC-6).
- **INC-2 — Spotting & sensor model** (detection + LOS + spotting resolution;
  AC-7..AC-9).
- **INC-3 — Contact state & knowledge lifecycle** (create/update/age/merge + fog;
  resolve the authoritative contact-shape seam — extend `BattleContact` to match
  `ContactTrack` or unify — recorded in an ADR; AC-10..AC-11).
- **INC-4 — Tactical simulation engine** (minute-advance orchestrator over
  `BattleLedger`+`canonicalEventOrder` + minute-state hashes + a deterministic
  spawn/initial-position helper derived from manifest area geometry + two-process
  determinism; AC-12..AC-13).
- **INC-5 — Contracts, reason codes, content constants rollup** (AC-14..AC-15) +
  ADR-0018 + traceability.

Each increment passes its AC tests and the reviewer before the next. INC-1..INC-4
add no snapshot schema or phase change; INC-5 verifies goldens unchanged.

---

## 3. Out of scope (deferred)

- **Gunnery/weapons** (B-3), **armor/damage/fire/flooding** (B-4), **weather/
  visibility modifiers** (B-5; baseline clear daylight only here), **smoke** (M3),
  **ECM/radar/EW** (M5; sensor types registered-but-inert), **collisions/grounding
  resolution** (hook-only empty records here; resolution owner confirmed at B-6
  scoping — B-6 or M3), **phase-engine wiring replacing `BattleResolver`** (B-6),
  **auto-resolution statistical validation** (B-6/release), **player battle UI**.

---

## 4. Testing and validation

- Unit tests per function (movement, spotting, contact) incl. invalid/boundary.
- Integration: minute-advance simulation order + event emission.
- Determinism: **two separate child processes** (node-spawn ×2, byte-compared) via
  the `@bluewave/cross-process-test` child where reachable from a campaign artifact,
  else a battery of two-process byte-compares within `@bluewave/combat` — so the
  minute-state hash (authoritative) is proven OS-independent.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs` (9/9),
  cross-process byte-identical.
- Pre-existing unrelated failure documented (not newly caused): content-schema
  `nation.test.ts` (broken `content/research/nations/1880/index.ts` import). The
  desktop `project.test.ts` suite passes (5/5) and is NOT a baseline failure.

---

## 5. Definition of done (B-2-IMPL)

- All AC-1..AC-15 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified); `BattleResolver`/`StrengthCalculator`
  unmodified (verified by diff).
- Versioned contracts + reason codes + ADR-0018 landed; research note present.
- Traceability updated (SPRINT-PLAN B-2 row, PROGRESS, validation report
  `.ai/reports/b2-m2-movement-spotting-impl.md`); Conventional Commits on `dev`;
  clean working tree.
