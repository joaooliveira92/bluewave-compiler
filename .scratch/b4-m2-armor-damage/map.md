# Wayfinder Map: M2 Armor & Damage (B-4)

## Destination

Scope and implement the first coherent vertical slice of **DESIGN-41
(`docs/rules/damage-fire-and-flooding.md`) as the M2 "basic armor & damage"
subset**, folding in the **DESIGN-39 §§16–24 armor model** (armor zones,
thickness limits, thick-armor manufacturing, quality, impact geometry,
splinter, penetration outcomes) that B-3 deferred here. Engine-only,
deterministic, minute-advancing **damage resolution** in `@bluewave/combat`,
consuming the B-2 `TacticalBattleState` + B-3 `GunneryEventRecord` impact seam.
Integration into the phase pipeline remains **B-6**. **No** campaign snapshot
schema change; golden hashes must remain unchanged (no ADR-0007 regeneration).

This chart follows the B-2/B-3 pattern exactly (`.scratch/b2-m2-movement-spotting/`,
`.scratch/b3-m2-gunnery/`): scope a bounded subset, record every deferral
(never silently drop), ship versioned constants + ADR.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic). Builds
  on B-1 (tactical units: armor/guns from `TacticalUnit`), B-2 (minute-advance
  engine, `BattleLedger`, `canonicalEventOrder`, reason-code catalog), B-3
  (`resolveGunnery` after spotting → its `GunneryEventRecord` carries the
  reserved impact/armor inputs this sprint fills).
- `BattleResolver`/`StrengthCalculator` remain unmodified (same boundary rule as
  B-1/B-2/B-3). Gunnery salvo/event code MUST be strictly no-op without a damage
  seam this sprint.
- Skills: `/grilling` + `/domain-modeling` + `/research` (armor technology
  families + historical armor/damage grounding) + `/to-tickets`.
- ADR required: ADR-0021 (B-4 scope/integration boundary + in-slice §47
  reason-code policy + armor constant policy), mirroring ADR-0018/0020.
- DESIGN-41 is 866 lines; the M2 subset is **basic armor & damage**, with
  **detailed damage control deferred to M3/C-5** (per DESIGN-55 §4 + SPRINT-PLAN
  C-5 "remainder of DESIGN-41"): flooding control ops, fire suppression/spread,
  damage-control resources/priority, terminal-state survivors/rescue, post-battle
  adjudication, victory points.

## Decisions so far (resolved during B-4 scoping — see issues/01..06)

- Scope Boundary — **resolved.** M2 basic armor & damage = DESIGN-41 §§1–9, §§45–48
  (damage state, categories, 10-stage pipeline, hit location, protection
  interaction, local component damage, turret states, structure+flotation,
  immediate fire/flooding creation, damage event record, canonical ordering,
  reason codes, validation) **folded with DESIGN-39 §§16–24 armor model**.
  **Deferred to M3/C-5 (recorded):** DESIGN-41 §§10–18 (secondary hazards full
  set, flooding control/serious-major/progressive/containment/dewatering),
  §§19–26 (fire resolution/spread/suppression/night-visibility/smoke/aluminum),
  §§27–28 (damage-control resources/priority), §§29–44 (terminal states,
  stabilization, abandonment, scuttling/capture/recovery, sinking credit,
  victory timing, post-battle survival, survivors/rescue), §44 fire/flooding
  persistence (wired at B-6).
- Armor Model Integration — **resolved.** DESIGN-39 §§16–24 shipped as the
  protection-interaction backend: zone maxima (µm), `thick_armor_manufacturing_v1`
  (12 in = 304 800 µm threshold, 7 500 bp excess effectiveness), armor-quality
  multiplier, impact geometry/obliquity, 2-in splinter threshold + 4 splinter
  classes, 7 penetration outcomes.
- Protection-Interaction Seam — **resolved.** `resolveGunnery` stays as-is; a
  damage-resolution engine stage runs after gunnery each minute, using armored
  tactical-unit definitions + the B-3 event record's reserved impact inputs where
  present; strict no-op when no impact/hazard is presented (B-2/B-3 hashes
  unchanged).
- Minimal Secondary Hazards — **resolved.** Only **magazine/ammunition reaction**
  is in-slice (fundamental to armor/damage); the remaining 8 hazard classes of
  §10 are recorded-deferred to M3/C-5. Stage runs with successful empty record
  when no in-slice hazard applies.
- Terminal-State Seam — **resolved.** Basic detection only: flotation 0 →
  `SINKING` initiation, catastrophic structure → `FOUNDERED` per §32.
  Stabilization/abandonment/scuttling/capture/recovery/survivors/rescue/scoring
  all deferred (recorded) — no sinking credit or victory points this sprint.
- Content & Constants — **resolved.** Ship armor tables as engine versioned
  constants (`armor_v1` + `SHIPPED_ARMOR_CONTRACT` + validate guard) grounded in
  `docs/research/b4-m2-armor-damage.md`; armor-technology quality-multiplier
  family set grounded in armor-history sources. No production-pack YAML change;
  goldens unchanged.

## Not yet specified (recorded, owning track)

- Flooding/fire per-minute resolution, damage-control operations, terminal-state
  adjudication, survivors/rescue, post-battle survival → **M3/C-5** (SPRINT-PLAN
  C-5: "remainder of DESIGN-41").
- Phase-pipeline wiring replacing `BattleResolver` + damage persistence to
  campaign + M2 acceptance gate → **B-6**.
- Torpedo/mine/bomb-missile weapon contracts feeding Stage 2 → their owning M3/M4
  sprints (DESIGN-40/35/43–47); Stage 2 ships only the gunnery armor seam now.

## Out of scope for B-4

Phase-engine wiring (B-6), strategic auto-resolve replacement (B-6), player battle
UI, production-pack YAML changes (content tracked separately), detailed damage
control (M3/C-5), weather/visibility damage modifiers (B-5), smoke (M3/C-5).