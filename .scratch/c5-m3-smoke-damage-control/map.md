# Wayfinder Map: M3 Smoke + Detailed Damage Control (C-5)

## Destination

Scope the first coherent **vertical slice of DESIGN-42 §§7-23 (smoke) + DESIGN-41 remainder (detailed damage control)** as an engine-only, deterministic module in `@bluewave/combat`:

**Primary deliverable: Tactical smoke module** (`packages/combat/src/smoke/`): SmokeCloud model (§7), drift/decay (§8), line intersection (§9), fire-through-smoke (§10), funnel smoke (§11), smokescreen eligibility/generation/cooldown/density/effects (§12-16), smoke-float technology/capacity/deployment (§17-19), smoke-generator technology/policy/capacity (§20-22), source precedence (§23), records/ordering/reason codes (§28-30).

**Secondary deliverable: Damage-control extension** (`packages/combat/src/damage/` extension): fire propagation + fire state resolution (§19-22, §24-25), flooding state + flooding resolution (§13-18), damage-control resources + priority (§27-28), extending B-4's pipeline stages 5-8 from creation-only to full per-minute resolution. Fire smoke (§25) couples smoke with fire, making this the natural companion slice.

**No phase-engine/snapshot wiring this sprint** (mirrors C-2/C-3/C-4 pattern). Golden hashes must remain unchanged.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic).
- DESIGN-42 (§§1-6 weather + §§7-23 smoke) — §§1-6 already shipped in B-5 (weather/visibility); §§7-23 is smoke, untouched.
- DESIGN-41 (866 lines) — B-4 shipped §§1-9 (basic armor & damage: pipeline skeleton, armor, hit location, component damage, structure/flotation, immediate fire/flooding creation, magazine hazard, basic SINKING/FOUNDERED terminal). C-5 remainder: §§10-11 (full secondary hazards), §§13-18 (flooding state + control), §§19-25 (fire state + propagation + smoke), §§26 (aluminum), §§27-28 (damage control resources/priority), §§29-43 (terminal states beyond SINKING/FOUNDERED: MISSION_KILLED, STABILIZED, ABANDONMENT, SCUTTLING, CAPTURE, RECOVERY, sinking credit, post-battle adjudication, survivors, rescue), §§44-48 (persistence, records, ordering, validation).
- Fire smoke (§25) is the coupling point: DESIGN-41 says fire smoke "MUST become a tactical visibility element" — this needs the smoke module to exist first, making smoke the natural dependency.
- Deferred to C-5 continuation or C-6: full terminal state machine (MISSION_KILLED through CAPTURED), survivors/rescue (§34-43), post-battle adjudication (§38), detailed record/validation (§44-48).
- C-5 is the last M3 sprint before C-6 (M3 acceptance gate).