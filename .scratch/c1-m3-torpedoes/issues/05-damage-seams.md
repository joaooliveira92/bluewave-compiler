# Ticket 05 — Damage Seams

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01-scope-boundary

## Question

Which B-4 damage subsystems does the `TorpedoDamagePackage` (DESIGN-40 §16–23)
reuse verbatim, which need torpedo-specific additions, and which are deferred?

## Decision

Reuse verdicts (explore seam map, 2026-08-16):

- **Reuse verbatim:** `resolveStructureFlotation` (`damage/structureFlotation.ts:51`)
  once the §17 flotation amount is computed; `applyTurretDamage` +
  `ComponentOutcome` vocabulary (`damage/turretStates.ts:58`, `componentDamage.ts`);
  `evaluateMagazineHazard` evaluator **shape** as a template for
  `underwater_tube_hit_hazard_v1` (`damage/magazineHazard.ts:84`); `evaluateTerminalSeam`
  (`damage/terminalSeam.ts:110`) — any torpedo damage flowing through `resolveDamage`
  gets SINKING/FOUNDERED detection for free; the `deepFreeze` + envelope-hash record
  pattern (`damage/eventRecord.ts:79`).
- **New (torpedo-specific):**
  - §16 `TorpedoDamagePackage` type + its own torpedo damage record (new fields:
    warhead explosive-equivalent mass, detonation depth, impact side + longitudinal
    position, underwater-protection resistance, hull-breach area, immediate flooding,
    progressive-source rate, machinery, shock, fire probability, crew casualties,
    structural, flotation, damage-control accessibility, package hash).
  - §17 flotation formula: `floor(baseWarheadFlotationDamage * protectionLeakMultiplierBp
    * impactZoneMultiplierBp * existingDamageMultiplierBp / 10_000^3)` with the
    shipped protection-leak (`15_000/12_500/10_000/7_500/5_000`) and impact-zone
    (`7_500/12_500/12_500/10_000/15_000`) multiplier tables; final value non-negative
    and MUST NOT exceed remaining flotation reserve without transitioning to
    sinking/sunk.
  - §18 flooding-source **creation** with a computed torpedo `floodingRateKgMin`
    (`floor(baseBreachRate * seaPressureMultiplierBp * hullDamageMultiplierBp *
    compartmentMultiplierBp * isolationMultiplierBp / 10_000^4)`, isolation
    `5_000/10_000/15_000`); a torpedo hit does NOT produce a shell
    `FULL_PENETRATION` outcome, so the creation predicate is torpedo-specific.
    Per-minute **resolution** is deferred (C-5 / reserved Stage 7).
  - §19 machinery: keyed weighted selection over the §19 severity weights
    (`1_000/4_000/3_000/1_500/500`, total exactly 10_000) + reduced non-machinery
    eligibility `2_500` bp, writing into `ComponentOutcome`-style results.
  - §20 system shock: base probabilities `3_000/1_000/0` bp by declared shock
    radius; keyed weighted selection from actual nearby systems in ascending
    stable-id order; never destroys a spatially ineligible system.
  - §21 underwater-tube hit hazard: base `5_000` bp; four multiplier groups
    (loaded tubes `2_500/10_000/12_500`, propulsion `10_000/15_000/7_500`,
    isolation `7_500/10_000/15_000`, protection `12_500/10_000/7_500`); severe
    result creates immediate flooding `5_000` bp of remaining reserve (capped),
    one additional source at rate multiplier `15_000`, launcher `DESTROYED`, §22
    detonation check, crew-casualty + shock checks.
  - §22 chain reaction: base `1_500` (ordinary) / `3_000` (oxygen) / `1_000`
    (electric) bp with explicit integer modifiers; a chain reaction creates a
    separate explosion damage package and consumes the affected torpedoes.
  - §23 oxygen: exact effects — range `15_000`, speed `11_000`, wake-detection
    `7_500`, tube-hit severe-flooding `15_000`, chain-reaction base `3_000` bp;
    gains apply only when the selected setting/launcher is compatible.
- **Damage application:** torpedo hits synthesize a torpedo impact surface into the
  existing damage resolution entry (a new torpedo impact type, mirroring
  `battleResolution/damage.ts:196-240` synthesizeImpact), so flotation/terminal
  seam/machinery/shock all flow through the proven path. The exact wiring seam is
  an orchestrator/implementator decision inside INC-5 with the B-4 pipeline
  invariant intact (rollback on stage failure).

## Deferred (recorded)

- Progressive-flooding resolution + damage control — C-5 (reserved Stage 7).
- §26 campaign persistence of torpedo damage/flooding — later battle-results slice.
- §25 evasion as a hit-defeating mechanic — ship-maneuver track.

## Rationale / authority

DESIGN-40 §16–23 are normative and fully specified (exact formulas + shipped
multiplier tables). B-4 explicitly deferred torpedo/mine/bomb/missile weapon
contracts into Stage 2 (DESIGN-41 §10 items) to the owning M3/M4 sprints — C-1
is that owning sprint for torpedoes.