# Wayfinder Map: M2 Gunnery (B-3)

## Destination

Scope and implement the first coherent **vertical slice of DESIGN-39
(`docs/rules/gunnery.md`)** as an engine-only, deterministic, minute-advancing
**surface gunnery fire-resolution** in `@bluewave/combat`, demonstrated against the
B-2 `TacticalContact` tracks already produced by the B-2 minute-advance engine.
Integration into the phase pipeline is B-6 (same boundary rule as B-2).
**No** campaign snapshot schema change; golden hashes must remain unchanged
(no ADR-0007 regeneration) unless an authoritative cause is documented.

This chart follows the B-2 pattern (`.scratch/b2-m2-movement-spotting/`) exactly:
B-2 scoped only the **movement/spotting/contact** subset of DESIGN-38; B-3 scopes
only a **gunnery** subset of DESIGN-39.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Builds
  on B-1 (battle generation / tactical units) + B-2 (movement/spotting/contact,
  minute-advance engine, `BattleLedger`, `canonicalEventOrder`, reason-code
  catalog). `BattleResolver`/`StrengthCalculator` remain unmodified.
- Skills: `/grilling` + `/domain-modeling` for scope; `/research` for naval
  gunnery ballistics grounding; `/to-tickets` for slicing.
- This is the **active M3/M2-frontier track** — NOT a side track. It is the plan's
  "Immediate next action". Do not let the desktop UI-* side tracks compete.
- ADR required: the B-3 scope/integration boundary (mirrors ADR-0018 for B-2) and
  any genuinely new reason codes / constant policies (versioned-ruleset ADR rule).
- DESIGN-39 is ~584 lines with 32 §33 validation items spanning guns (fire modes,
  accuracy, rate-of-fire, gun quality, autoloaders, dual-purpose) **and** armor
  (zones, thickness limits, penetration outcomes). Too large for one session; the
  scope boundary ticket carves the first bounded slice and records what is deferred
  (never silently dropped).

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** This sprint ships
  the **core surface gunnery fire-resolution** slice: `GunneryState` (§1), the full
  fire-mode set (§2), accuracy resolution (§3), rate-of-fire/reload (§4), gun
  quality (§5, incl. the -3..+2 shipped multipliers), ammunition count/atomic
  consume (§28), salvo/AA-burst → `GunneryEventRecord` (§30), canonical ordering
  (§31), required reason codes (§32), and §33 validation items 1-4, 6-? relevant to
  the slice. **Deferred (recorded, follow-up INCs/tickets):** autoloaders (§6-10),
  dual-purpose (§11-15), armor zones/thickness/penetration (§16-24, folded with the
  B-4 armor-and-damage track), straddle registration (§25), target allocation
  (§26-27), damage effects (§29). RAPID/AA fire modes are defined (state + mode
  semantics + reload/ammo behavior) but their eligibility predicates (straddle
  required for RAPID; AA-capable eligibility) are deferred to the straddle/AA slice.
- [Integration Boundary](issues/02-phase-integration-boundary.md) — **resolved.**
  Gunnery runs as a pure **engine-stage** (`resolveGunnery`) inside the minute-advance
  simulation, after spotting (step 8), emitting `GunneryEventRecord`s via the existing
  `BattleLedger`+`canonicalEventOrder`. No phase-engine change (phase wiring is B-6),
  no snapshot change, goldens unchanged.
- [GunneryState & Fire Modes](issues/03-gunnery-state-and-fire-modes.md) —
  **resolved.** Authoritative `GunneryState` (battery/gun/mount ids, target contact
  or NONE, acquisition bp, range estimate/uncertainty, fire-control solution quality,
  ammunition by type, fire mode, reload progress, straddle state (reserved), damage
  state (reserved), last salvo minute/substep, ruleset+formula versions, state hash).
  Seven canonical fire modes as a closed enum; each declares ammo/reload/accuracy/
  eligibility behavior. Integer/fixed-point guards via `assertFixedPointGunnery`.
- [Accuracy Resolution](issues/04-accuracy-resolution.md) — **resolved.** The
  §3 16-factor precision product retained as exact integer (basis-point) arithmetic
  through all multipliers, rounded **once** with `FLOOR`, `clamp(0,10_000,*);
  missing factor → `GUNNERY_ACCURACY_FACTOR_MISSING`. Hit check = one keyed integer
  draw 0..9_999 vs `finalAccuracyBp` (draw < finalAccuracyBp). Factor manifest is
  explicit + versioned.
- [Rate-of-Fire & Reload](issues/05-rate-of-fire-reload.md) — **resolved.** Reload
  is integer tactical-milliseconds work. `effectiveReloadMs = ceil(baseReloadMs *
  10_000^n / Π rateMultipliersBp)`, multipliers in §4 order 1-11. Progress advances
  in exact ms; a battery fires only at full progress AND all firing predicates pass.
- [Gun Quality & Content Constants](issues/06-gun-quality-and-constants.md) —
  **resolved.** Gun quality integer -3..+2; shipped range/penetration/rate
  multipliers 8_500..11_000 per §5. Content deliverable: versioned gunnery
  constants `*_v1` + `SHIPPED_GUNNERY_CONTRACT` + validate guards + a
  research-grounded **naval gun ballistics constant set** (base reload ms by
  caliber, fire-control/spotting practice) in `docs/research/b3-m2-gunnery.md`.

## Not yet specified (later INC slices / follow-up tickets)

- **In-slice (this sprint)**: straddle is reserved-but-not-computed (RAPID/`AA_*`
  eligibility predicates deferred); armor/penetration (B-4 track); target
  allocation (a later gunnery slice); damage effects (B-4 / DAMAGE track);
  autoloaders + dual-purpose (dedicated later slices). These are **recorded, not
  dropped** — the spec's "Out of scope" section lists every DESIGN-39 item not in
  this slice plus the owning track.

## Out of scope for B-3

- Phase-engine wiring replacing `BattleResolver` (B-6), auto-resolution statistical
  validation (B-6/release), player battle UI, production-pack YAML changes
  (content tracked separately), armor zones/penetration (B-4), DESIGN-41 damage/
  fire/flooding (B-4), weather/visibility modifiers (B-5).
