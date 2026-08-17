# INC-6 — Screening Balance + Attack-Opportunity Selection (Value-Only)

**Type:** implementation
**Status:** open
**Blocked by:** INC-5
**Frontier:** no

## Acceptance (spec AC-13, AC-14)

- Heavy-ship-to-destroyer screening balance (§18): exact
  `screenRatioBp = floor(eligibleDestroyerAndEscortStrength * 10_000 / max(1, eligibleHeavyShipStrength))`;
  heavy ships `BB`/`BC`/`B`/`CV`/`CVL`/`CA`; escorts eligible `DD`/`KE`/ASW-capable
  `CL`; submarine opportunity-multiplier table (ratio <2_500:15_000,
  2_500–4_999:12_500, 5_000–7_499:10_000, 7_500–9_999:8_500, ≥10_000:7_500)
  (`test/submarines/screening-balance.test.ts`).
- Strategic attack-opportunity **selection** (§19, value-only): opportunity
  selection uses policy weights + target availability + intelligence + regional
  protection + mission strength; **keyed stream** `submarine/month/war/area/attack_opportunity`;
  a successful opportunity creates one typed merchant-loss/warship-battle/
  interception opportunity record → `SUBMARINE_ATTACK_OPPORTUNITY_CREATED`; MUST
  NOT apply a warship loss directly without the owning battle or attack resolver
  (`test/submarines/attack-opportunity.test.ts`).

## Hints

Ship `submarine_screening_balance_v1` + `submarine_attack_opportunity_v1`
contracts + validate guards. The keyed RNG stream uses the `@bluewave/random`
keyed-draw pattern (no ambient randomness). No loss application — only selection /
opportunity records. Do NOT modify `mines/`/`torpedoes/`/`weather/`/
`phase-engine`/`random`/desktop-e2e (concurrent).
