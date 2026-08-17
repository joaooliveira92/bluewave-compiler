# INC-2 — Mission Eligibility + Reliability

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

## Acceptance (spec AC-4, AC-5)

- Operational missions (§6): seven canonical missions (`FLEET_INTERDICTION`/
  `MERCHANT_RAIDING`/`MINE_LAYING`/`RECONNAISSANCE`/`TACTICAL_BATTLE_SUPPORT`/
  `RETURNING_SHIP_INTERCEPTION`/`MISSILE_PATROL`); mission-eligibility predicate
  validates type, technology, range, base support, readiness, damage,
  reliability, fuel, policy, area, and war state; any ineligible →
  `SUBMARINE_MISSION_INELIGIBLE` (`test/submarines/mission-eligibility.test.ts`).
- Reliability (§7): integer range 0..100; shipped operational multiplier table
  (0..19:4_000, 20..39:6_000, 40..59:8_000, 60..79:10_000, 80..94:11_000,
  95..100:12_000); reliability below `20` prohibits offensive deployment and
  permits only repair transfer / training / emergency defense →
  `SUBMARINE_RELIABILITY_INSUFFICIENT` (`test/submarines/reliability.test.ts`).

## Hints

Ship `submarine_missions_v1` + `submarine_reliability_v1` contracts + validate
guards. Mission priority is needed later for §26 ordering (INC-8) — model it here
as an explicit field. Do NOT modify `mines/`/`torpedoes/`/`weather/`/
`phase-engine`/`random`/desktop-e2e (concurrent).
