# INC-4 — Strategic Mission Effectiveness + Coastal Restriction

**Type:** implementation
**Status:** open
**Blocked by:** INC-3 (DONE 2026-08-28)
**Frontier:** yes

## Acceptance (spec AC-9, AC-10)

- Strategic mission effectiveness (§11): exact formula
  `floor(baseMissionStrength * typeRemoteEfficiencyBp * reliabilityMultiplierBp *
  baseSupportMultiplierBp * policyMultiplierBp * intelligenceMultiplierBp *
  enemyProtectionMultiplierBp * blockadeMultiplierBp / 10_000^7)`; exact rational
  retained through all multipliers, rounded once with `FLOOR`; every multiplier
  explicit + versioned (`test/submarines/effectiveness.test.ts`).
- Coastal range restriction (§12): coastal submarines receive full local
  efficiency only in `LOCAL`; during war normal strategic movement only within the
  home area / across one adjacent legal edge to an area with an accessible support
  base / through a typed emergency redeployment event; MUST NOT chain adjacent
  exceptions or conduct remote raiding; violation →
  `COASTAL_SUBMARINE_RANGE_RESTRICTED` (`test/submarines/coastal-restriction.test.ts`).

## Hints

Ship `submarine_effectiveness_v1` contract + validate guard. Intelligence /
enemy-protection / blockade multipliers are explicit versioned inputs (their
consumers may be deferred, but the formula takes them as arguments). Do NOT modify
`mines/`/`torpedoes/`/`weather/`/`phase-engine`/`random`/desktop-e2e (concurrent).
