# D-4 Spec — M4 Aviation: Air Defense / AA

- **Sprint:** D-4 (`SPRINT-PLAN.md` Track D row 4)
- **Kind:** Implementation scoping (this spec defines the vertical slice)
- **Governing doc:** DESIGN-45 (511 lines, 29 sections)
- **Baseline:** D-1 (aircraft), D-2 (carrier ops), D-3 (CAP & strikes) all COMPLETE. M1+M2+M3 completed.
- **Target:** Pure deterministic AA air-defense module in `@bluewave/combat/src/air-defense/`. Defense layers: HEAVY_AA, MEDIUM_AA, LIGHT_AA, CIWS_TERMINAL_DEFENSE. SAM layers deferred to E-track.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. `BattleResolver`/`StrengthCalculator` unmodified. Goldens unchanged (no phase/snapshot wiring this sprint).

## 1. Scope

### 1.1 In scope

1. **Defense system definitions** — `AirDefenseSystemDefinition` per DESIGN-45 §3 (systemId, layer, category, mountCount, barrels, range min/max, altitude min/max, target speed limit, profile eligibility, fire control, radar, engagement channels, base kill/damage/abort/disruption values, rate, saturation group, content version/hash)
2. **Air-defense state** — `AirDefenseState` per §2 (defenderId, scope, ordered systems, director/radar state, crew quality, damage/power, ammunition by type, target allocations, channel reservations, disruption records, state hash)
3. **Layer resolution order** — §1: HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS. Each layer with eligible systems processes sequentially; surviving attacks proceed to next layer. Empty layers emit successful empty result.
4. **Heavy AA eligibility** — §7: own ship or protected nearby ship within 5nm radius. Range/altitude/speed/arc/director/radar/ammunition/power predicates.
5. **Medium AA eligibility + timing** — §8: pre-release window when attacker enters range; min 4_000bp fire-control solution; post-release only if explicitly supported.
6. **Light AA eligibility + windows** — §9: attack-profile durations (2min level, 1min dive/torpedo/skip/rocket). Speed-modified windows per §9 speed bands.
7. **Guaranteed light-AA disruption** — §10: at least one substep disruption check. No guarantee of hit/damage/abort.
8. **AA director assignment + scaling** — §11-12: one channel per director. Assignment order per §11. Director scaling table per §12 (0→5_000, 1→10_000, 2→18_000, 3→25_000, 4→31_000).
9. **Radar-directed medium-AA groups** — §13-14: saturation diminishing returns per §14 (1-4→10_000, 5-6→5_000, 7-8→2_500, 9+→500).
10. **CIWS system definition + redundancy** — §15-16: independent mount, one channel. Redundancy per §16 (1-4→10_000, 5-6→5_000, 7-8→1_500, 9+→500).
11. **Simultaneous threat assignment** — §17: order per §17 criteria. Excess threats unengaged.
12. **Attack-layer matching** — §18: eligibility matrix per §18.
13. **Engagement resolution formula** — §19: `effectiveDefenseBp = floor(baseDefenseBp * director * radar * crew * damage * ammunition * targetProfile * weather * saturation / 10_000^8)`. Floor-once rounding. Keyed RNG draw for kill/damage/abort/disruption.
14. **Disruption** — §6: severity levels (LIGHT→9_000/9_500, MODERATE→7_500/8_500, SEVERE→5_000/6_500, MISSION_ABORT). Separate from damage. Highest severity per layer, multiply across layers.
15. **Ammunition consumption** — §20: basic consumption (rounds per engagement, magazine capacity, empty→zero contribution).
16. **Damage/power effects** — §21: simplified — system-level damage state (OPERATIONAL/DAMAGED/DESTROYED). Local control at 5_000bp when supported.
17. **Records + ordering** — §26-27: `AirDefenseEngagementRecord` per engagement. Ordering per §27.
18. **Reason codes + contracts** — §28: 20 shipped codes. `air_defense_v1`, `aa_director_scaling_v1`, `ciws_redundancy_v1` contracts.
19. **Engine stage** — new `resolve_air_defense` stage at step 7.8 (after air-combat, before spotting). Strict no-op when no AA systems or attacks present.

### 1.2 Acceptance criteria

| AC | Requirement | Proving test |
|----|-------------|--------------|
| AC-1 | System definitions validate correctly | `air-defense/system-definition.test.ts` |
| AC-2 | State model has all required fields + hash | `air-defense/state.test.ts` |
| AC-3 | Layers resolve in HEAVY→MEDIUM→LIGHT→CIWS order | `air-defense/layer-order.test.ts` |
| AC-4 | Heavy AA protects own ship + 5nm protected radius | `air-defense/heavy-aa-eligibility.test.ts` |
| AC-5 | Medium AA pre-release window with 4_000bp FC solution | `air-defense/medium-aa-timing.test.ts` |
| AC-6 | Light AA windows per attack profile + speed bands | `air-defense/light-aa-windows.test.ts` |
| AC-7 | Guaranteed disruption opportunity for light AA | `air-defense/light-aa-disruption.test.ts` |
| AC-8 | Director assignment order + scaling table values | `air-defense/director-scaling.test.ts` |
| AC-9 | Radar-directed group saturation diminishing returns | `air-defense/radar-saturation.test.ts` |
| AC-10 | CIWS redundancy schedule | `air-defense/ciws-redundancy.test.ts` |
| AC-11 | Engagement formula: effectiveDefenseBp = 9-factor product, floor-once | `air-defense/engagement-formula.test.ts` |
| AC-12 | Disruption severity levels + stacking rules | `air-defense/disruption.test.ts` |
| AC-13 | Ammunition consumption + empty system contributes zero | `air-defense/ammunition.test.ts` |
| AC-14 | Simplified damage/power state + local control multiplier | `air-defense/damage-power.test.ts` |
| AC-15 | Engagement records + ordering per §27 | `air-defense/records.test.ts`, `air-defense/ordering.test.ts` |
| AC-16 | 20 shipped reason codes + set-equality guard + 6 deferred markers (SAM) | `air-defense/reason-codes-rollup.test.ts` |
| AC-17 | Contracts: air_defense_v1, director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1 | `air-defense/contracts.test.ts` |
| AC-18 | Engine stage at step 7.8, strict no-op | `air-defense/integration.test.ts` |
| AC-19 | Two-process determinism (child process) | cross-process-test |
| AC-20 | `BattleResolver`/`StrengthCalculator` unmodified | orchestrator gate |

### 1.3 Out of scope (deferred)

- SAM systems: HEAVY_SAM, MEDIUM_SAM, LIGHT_SAM (→ E-track/M5)
- Full independent damage model for weapon/director/radar/power (beyond system level)
- Full ammunition model: burst/cooling/reload/jams (future refinement)
- Content YAML constants (→ CONTENT-track)
- Player UI for AA management (→ desktop-track)
- Strategic AI AA planning (→ AI package)
- CAP integration with AA (already shipped D-3)

### 1.4 Implementation increments

| INC | Deliverable | ACs | Blocked by |
|-----|-------------|-----|------------|
| INC-1 | System definitions + state model + constants | AC-1, AC-2 | none |
| INC-2 | Layer resolution + eligibility (heavy/medium/light) + CIWS | AC-3, AC-4, AC-5, AC-6 | INC-1 |
| INC-3 | Engagement formula + disruption + ammunition + damage | AC-11, AC-12, AC-13, AC-14 | INC-2 |
| INC-4 | Director scaling + radar saturation + CIWS redundancy | AC-8, AC-9, AC-10 | INC-1 |
| INC-5 | Records + ordering + reason codes + contracts + guaranteed disruption | AC-7, AC-15, AC-16, AC-17 | INC-2 |
| INC-6 | Engine wiring + two-process + gate | AC-18, AC-19, AC-20 | INC-1..INC-5 |