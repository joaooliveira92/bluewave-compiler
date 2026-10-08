# Milestone C-1: M3 Torpedo Fire-Resolution (Advanced Surface Warfare)

## Objective

A deterministic, engine-only **torpedo fire-resolution** engine stage
(`resolveTorpedoes`) in `@bluewave/combat` that, given torpedo launchers, launch
inputs, and B-2 `TacticalContact` tracks, resolves DESIGN-40's torpedo slice —
model → launcher → ammunition → compatibility → launch legality (authority,
eligibility, speed limits) → fire solution → salvo → launch → track → hit →
detonation → `TorpedoDamagePackage` (flotation, flooding creation, machinery,
system shock, tube-hit hazard, chain reaction, oxygen) → friendly-fire safety —
emitting immutable torpedo records through `BattleLedger` + `canonicalEventOrder`,
with strict no-op behavior that leaves B-2…B-6 hashes unchanged and goldens 10/10.

## Canonical requirements

DESIGN-40 §§1–4, §6–24, §27–30 (torpedo fire-resolution slice); DESIGN-38
(minute-advance, `BattleLedger`, `canonicalEventOrder`, reason-code catalog,
`validateTargetOrder`); DESIGN-41 (B-4 damage reuse seams); DESIGN-07 (integer
arithmetic); DESIGN-55 §4 (M3 scope).

## Starting state

Verified baseline (2026-08-16): B-6-IMPL DONE — M2 COMPLETED (2026-08-15).
`@bluewave/combat` has minute-advance engine with `resolveGunnery`, `resolveDamage`,
`resolveWeather`; versioned `*_v1` contracts; per-module reason-code catalogs;
two-process determinism children. `BattleResolver`/`StrengthCalculator` unmodified.

## In scope

- `TorpedoModelDefinition` (§1) + `TorpedoLauncherState` (§2) + ammunition/reload (§3) + compatibility (§4).
- `torpedo_launch_authority_v1` policy + launch eligibility (§5–6) + underwater-tube speed limit (§7) + above-water limits (§8).
- Fire-solution quality (§9–10) + salvo (§11) + friendly-fire safety (§24).
- Launch timing/failure (§12) + `TorpedoTrack` (§13).
- Hit resolution (§14) + detonation outcomes (§15).
- `TorpedoDamagePackage` (§16) + flotation (§17) + flooding **creation** (§18) + machinery (§19) + system shock (§20) + tube-hit hazard (§21) + chain reaction (§22) + oxygen (§23).
- Records (§27) + ordering (§28) + reason codes (§29) + versioned contracts + research-grounded `torpedo_models_v1` constants.

## Out of scope (deferred)

- §5 player command plumbing (manual launch / division orders / tactical AI).
- §3 production/inventory delivery + §4 refit (DESIGN-23).
- §18 progressive-flooding resolution (C-5), §25 evasion, §26 campaign persistence.
- Submarine launch (C-3), mines (C-2), coastal defense (C-4), aerial torpedoes (D-track).
- Phase wiring (`resolveBattleAuto` torpedo integration).

## Acceptance criteria

25 ACs total (AC-1..AC-25) — see `.scratch/c1-m3-torpedoes/spec.md` §1.1.

## Slices

8 incremental slices (INC-1..INC-8) — see spec §2. Frontier order: INC-1 → INC-2 →
INC-3 → INC-4 → INC-5 → INC-6 → INC-7 → INC-8.
