# INC-6 — TorpedoDamagePackage (Flotation, Flooding, Machinery, Shock, Tube Hazard, Chain Reaction, Oxygen)

**Type:** implementation
**Status:** done (2026-08-16, orchestrator pipeline, commit `072b704`) — AC-15..AC-18 green
(`damage-package/flotation/flooding-creation/machinery/system-shock/tube-hazard/chain-reaction/
oxygen` tests, 453/453 torpedo); reviewer NEEDS_REWORK resolved (HIGH-1 constants pin,
MEDIUM-1 §21 reserve-loss interpretation, MEDIUM-2 citation fix, MEDIUM-3 ADR-0031 TUBE_BAY,
MEDIUM-4 chain-package helper, LOW-1/2); report
`.ai/reports/c1-m3-torpedoes-inc6-damage-package.md`; ADR-0031 entries 8–10.

## Acceptance (spec AC-15..AC-18)

- §16 `TorpedoDamagePackage` (all §16 fields + package hash) applying atomically through
  the tactical damage contract (`test/torpedo/damage-package.test.ts`).
- §17 flotation: `floor(baseWarheadFlotationDamage * protectionLeakMultiplierBp *
  impactZoneMultiplierBp * existingDamageMultiplierBp / 10_000^3)` with exact shipped
  protection-leak (`15_000/12_500/10_000/7_500/5_000`) + impact-zone
  (`7_500/12_500/12_500/10_000/15_000`) tables; final non-negative; never exceeds
  remaining reserve without SINKING/SUNK transition (`test/torpedo/flotation.test.ts`).
- §18 flooding **creation**: ≥0 `FloodingSource` records with computed
  `floodingRateKgMin = floor(baseBreachRate * seaPressureMultiplierBp *
  hullDamageMultiplierBp * compartmentMultiplierBp * isolationMultiplierBp / 10_000^4)`,
  isolation `5_000/10_000/15_000`; `TORPEDO_PROGRESSIVE_FLOODING_CREATED`
  (`test/torpedo/flooding-creation.test.ts`).
- §19 machinery: keyed weighted selection over severity weights `1_000/4_000/3_000/1_500/500`
  (total exactly `10_000`) + reduced non-machinery eligibility `2_500` bp →
  `TORPEDO_MACHINERY_DAMAGE_CREATED` (`test/torpedo/machinery.test.ts`).
- §20 system shock: base `3_000/1_000/0` bp by declared shock radius; keyed weighted
  selection from actual nearby systems in ascending stable-id order; never destroys an
  ineligible system → `TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED`
  (`test/torpedo/system-shock.test.ts`).
- §21 tube-hit hazard: base `5_000` bp; exact loaded-tube (`2_500/10_000/12_500`),
  propulsion (`10_000/15_000/7_500`), isolation (`7_500/10_000/15_000`), protection
  (`12_500/10_000/7_500`) tables; severe result → immediate flooding `5_000` bp of
  remaining reserve (capped), one extra source at rate multiplier `15_000`, launcher
  `DESTROYED`, §22 check, casualty+shock → `UNDERWATER_TUBE_SEVERE_FLOODING`
  (`test/torpedo/tube-hazard.test.ts`).
- §22 chain reaction: base `1_500` (ordinary) / `3_000` (oxygen) / `1_000` (electric) bp
  with explicit integer modifiers; creates a separate explosion damage package + consumes
  affected torpedoes → `TORPEDO_CHAIN_REACTION` (`test/torpedo/chain-reaction.test.ts`).
- §23 oxygen: exact effects range `15_000` / speed `11_000` / wake-detection `7_500` /
  tube-hit severe-flooding `15_000` / chain-reaction base `3_000` bp; gains only when the
  selected setting/launcher is compatible (`test/torpedo/oxygen.test.ts`).

## Hints

Follow `issues/05-damage-seams.md` verdicts exactly: reuse `resolveStructureFlotation`,
`applyTurretDamage`, `ComponentOutcome`, `evaluateMagazineHazard` shape,
`evaluateTerminalSeam`, and the `deepFreeze`+envelope record pattern. New torpedo impact
surface mirrors `battleResolution/damage.ts:196-240` synthesizeImpact. Flooding resolution
is creation-only (C-5 owns per-minute resolution).