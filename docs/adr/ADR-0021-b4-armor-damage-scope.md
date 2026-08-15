# ADR-0021 (B-4): Armor & Damage Scope / Integration Boundary + In-Slice Reason-Code & Constant Policy

## Status

Accepted 2026-08-14

## Context

B-4 is the fourth M2 sprint: the DESIGN-41 (`docs/rules/damage-fire-and-flooding.md`)
**basic armor & damage** subset, folded with the DESIGN-39 (`docs/rules/gunnery.md`)
armor model (§§16–24) that B-3 recorded as deferred here. B-2 (ADR-0018) delivered the
minute-advance simulation and its integration/interference pattern; B-3 (ADR-0020)
delivered `resolveGunnery` and its reserved impact/armor seam, plus
`GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` and the in-slice §32/policy record that
explicitly deferred the three armor §32 codes to B-4. DESIGN-41 is large (866 lines)
and its §3 pipeline references subsystems that are genuinely M3 operational
(flooding/fire control, damage-control resources, terminal-state adjudication,
survivors/rescue). SPRINT-PLAN rows B-4 ("DESIGN-41 basic subset; detailed damage
control deferred to M3 per DESIGN-55 §4") and C-5 ("remainder of DESIGN-41, DESIGN-42")
fix the M2/M3 hand-off.

Two questions were open: (1) what exactly is the M2 "basic armor & damage" slice of
DESIGN-41 and its integration boundary vs. the B-2/B-3 minute-advance engine and the
`BattleResolver` auto-resolution path; and (2) how the new reason codes and armor/
damage constant surfaces (some not pinned by DESIGN-41/39, e.g. armor-technology
quality families) are recorded rather than fabricated.

## Decision

1. **Scope = DESIGN-41 basic armor & damage (engine-stage integration).** B-4
   implements, as a pure deterministic engine in `@bluewave/combat`, DESIGN-41 §§1–9
   and §45–48 plus the DESIGN-39 §§16–24 armor model: authoritative `ShipDamageState`
   (§1), the seven §2 categories, the §3 ten-stage pipeline (with the no-skip
   empty-stage rule and full-transaction rollback on stage failure),
   Stage 1 hit location (§4), Stage 2 protection interaction (§5, using the armor
   model), Stage 3 local component damage incl. §7 turret states (§6), Stage 4
   structure & flotation (§8), Stage 5 immediate fire/flooding **creation only** (§9),
   Stage 6 magazine secondary hazard (no other hazards), immutable `DamageEventRecord`s
   (§45), canonical ordering (§46), basic SINKING/FOUNDERED terminal detection,
   the in-slice §47 reason codes, and §48 validation items for the incorporated stages.
   The engine runs as a new stage `resolveDamage` in the B-2 minute-advance simulation
   **after** `resolveGunnery` (step 8) each minute, emitting through the existing
   `BattleLedger` + `canonicalEventOrder`. **`BattleResolver` and `StrengthCalculator`
   remain unmodified.** Phase-pipeline wiring that replaces the strategic auto-resolution
   path is **B-6**; **no snapshot schema / phase change** and **no golden hash change**
   (no ADR-0007 regeneration). When no impact/hazard is presented in a minute,
   `resolveDamage` is a strict no-op (B-2/B-3 hashes preserved).
2. **Deferred subset recorded (M3/C-5, never silently dropped).** DESIGN-41 §13–18
   flooding operations (serious/major/critical severity bands, speed/stability
   multipliers, 10-kt safe-control threshold, high-speed-loss risk, ingress/control/
   dewatering), §19–26 fire resolution (intensity, spread, suppression, ship-type
   risk, rate-of-fire penalty, carrier ops, night visibility, smoke, aluminum
   superstructure), §27–28 damage-control resources/priority, §29–44 terminal-state
   adjudication (mission-kill, stabilization, abandonment, scuttling/capture/recovery,
   sinking credit, victory-point timing, post-battle survival, survivors/rescue) and
   §44 fire/flooding persistence → **M3/C-5**; secondary hazards beyond the magazine
   reaction (§10 items 2–9) → M3/C-5; torpedo/mine/bomb/missile weapon contracts
   feeding Stage 2 → their owning M3/M4 contracts; weather/visibility damage
   modifiers → B-5; smoke → M3/C-5; ALUMINUM_SUPERSTRUCTURE → deferred; damage
   control, stabilization/abandonment/scuttling/capture/recovery, survivors/rescue,
   post-battle survival → M3/C-5.
3. **In-slice reason-code policy (recorded, versioned).** The in-slice damage
   catalog ships exactly: `INVALID_SHIP_DAMAGE_STATE`, `DAMAGE_RESOLUTION_FAILED`,
   `DAMAGE_HIT_LOCATION_INVALID`, `DAMAGE_PROTECTION_INTERACTION_INVALID`,
   `DAMAGE_COMPONENT_OUT_OF_SCOPE`, `DAMAGE_SECONDARY_HAZARD_CREATED`,
   `FIRE_SOURCE_CREATED`, `FLOODING_SOURCE_CREATED`, `SHIP_SINKING`, `SHIP_FOUNDERED`,
   `DAMAGE_STATE_INVARIANT_FAILED`, plus the three DESIGN-39 §32 armor codes B-3
   recorded as deferred — `ARMOR_ZONE_MAXIMUM_MISSING`, `ARMOR_THICKNESS_LIMIT_EXCEEDED`,
   `SPLINTER_PROTECTION_NOT_QUALIFIED` — and one new `ARMOR_QUALITY_MULTIPLIER_MISSING`
   (a design without an active armor-quality multiplier is invalid, per §20). It
   additionally reuses the existing combat catalog (`TACTICAL_STATE_INVARIANT_FAILED`,
   `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`). All remaining §47
   codes (flooding/fire-resolution, terminal/survivor/rescue/scoring) are **recorded
   as deferred** to M3/C-5. A `reason-codes-damage.test.ts` set-equality check against
   DESIGN-41 §47 + DESIGN-39 §32 + the existing catalog prevents silent addition.
4. **Penetration model**: Simplified linear penetration formula
   (caliber × velocity / 1000) as a deterministic first approximation. A more
   sophisticated naval penetration model (De Marre, Thompson F) is deferred to a
   later ticket.

5. **Armor/§18–19 and §17 constants are normative (shipped verbatim).** Zone maxima
   (belt 508 000 µm, turret face/barbette/conning-tower 660 400 µm), the 304 800 µm
   thick-armor threshold, the 7 500 bp excess-effectiveness, the 50 800 µm splinter
   threshold, and the §15/§20 fire/flooding creation-type tables are shipped exactly
   as DESIGN-41/39 mandate (pre-declared maxima; above-max → `ARMOR_THICKNESS_LIMIT_EXCEEDED`;
   missing zone maximum → `ARMOR_ZONE_MAXIMUM_MISSING`).

6. **Armor-technology quality families are recorded BALANCE TARGETs.** The active
   armor technology's quality multiplier (§20) is authored as a versioned-ruleset
   constant — `armor_v1` family table (wrought-iron → compound → Harvey → Krupp
   cemented → post-KC, era-ordered quality 8_000..11_000 bp) — grounded in
   `docs/research/b4-m2-armor-damage.md` §3 as a *qualitative historical ordering*
   (not primary-sourced exact integers). Shipped bp multipliers: iron=8_000,
   compound=9_000, Harvey=10_000, Krupp/KC=10_500, post-KC=11_000. Tuning within
   the recorded range is a balance-bound decision, not a decision-request. Exact
   production-class family assignment is a content-track (CONTENT) concern, deferred
   and recorded.

7. **Design-41 §2 category difference**: The spec uses a 7-category model
   (PENETRATION, NON_PENETRATION, SPLINTER, FIRE, FLOODING, SECONDARY_HAZARD,
   NO_EFFECT) while DESIGN-41 §2 defines a different 7-category set
   (LOCAL_COMPONENT_DAMAGE, STRUCTURE_DAMAGE, etc.). The pipeline-stage design
   treats the spec's packages as resolution output that maps into the §2 categories
   at the event-record boundary.

## Consequences

- B-4 adds engine capability without disturbing the accepted M1 strategic auto-
  resolution path or the B-2/B-3 minute-advance engine: goldens stay 9/9, there is no
  snapshot schema or phase change, and `BattleResolver`/`StrengthCalculator` are
  verifiably unmodified. The strict no-op path means minute-advance hashes for
  B-2/B-3 fixtures are byte-identical.
- The relationship to DESIGN-41 is bounded and explicit: §§1–9 + §§45–48 in-slice,
  everything downstream of immediate creation recorded-deferred with its owning
  sprint; the 10-stage pipeline runs completely with successful empty stage records
  where an M3 subsystem owns the content.
- Stage 2 ships the gunnery armor seam now; torpedo/mine/bomb/missile operands plug
  into the same hazard package surface in their owning sprints without rework.
- New codes and constants are authoritative and versioned; the two genuinely new
  codes (`ARMOR_QUALITY_MULTIPLIER_MISSING`; `DAMAGE_SECONDARY_HAZARD_CREATED` used
  only for the in-slice magazine class) and every authorable constant are recorded
  here as versioned-ruleset decisions, satisfying the ENGINEERING-CONTRACT ADR +
  traceability rule. Armor-quality family multipliers are BALANCE TARGETs; the only
  flagged open item is the production-class armor-family mapping (content track).
- The §2 category mapping (spec's 7 packages → DESIGN-41 §2 categories) is
  resolved at the event-record boundary without requiring a spec amendment.
- All shipped values (contract rollup, armor constants, reason codes) are under
  set-equality guard in `reason-codes-damage.test.ts` to prevent silent drift.

## Related requirements

- DESIGN-41 §§1–9, §45–48 (subset); DESIGN-39 §§16–24, §32 (armor codes); DESIGN-38
  (minute-advance + reasoning catalog); DESIGN-07 (integer arithmetic); DESIGN-55 §3–4
  (M2 contents / M3 boundary).

## Related ADRs

- ADR-0018 (B-2 integration boundary), ADR-0020 (B-3 gunnery scope; records the armor
  §16–24 deferral landing here), ADR-0017 (auto-resolution scope), ADR-0007
  (cross-process determinism).