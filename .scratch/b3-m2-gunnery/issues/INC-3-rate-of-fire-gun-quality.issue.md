# INC-3 — Rate-of-Fire / Reload + Gun Quality

**State:** READY_FOR_AGENT · **Blocked by:** INC-2
**Spec:** `.scratch/b3-m2-gunnery/spec.md` (AC-5, AC-6) · **ADR:** (recorded at INC-5)

## Acceptance criteria
- AC-5 **Rate-of-fire/reload**: reload is integer tactical-milliseconds of work;
  `baseReloadMilliseconds` positive integer; `effectiveReloadMs = ceil(baseReloadMs * 10_000^n / Π rateMultipliersBp)`
  with multipliers in §4 order 1–11; a missing rate factor fails with
  `GUNNERY_RATE_FACTOR_MISSING`; progress advances in exact ms and a battery fires
  only at full progress AND all firing predicates pass. Proving test:
  `combat/test/gunnery/rate-of-fire.test.ts` (integer-ms + ceil + order).
- AC-6 **Gun quality**: integer `-3..+2` with shipped range/penetration/rate
  multipliers `8_500..11_000` (§5); out-of-range fails with `GUN_QUALITY_OUT_OF_RANGE`;
  a definition MAY declare quality does not affect rate-of-fire (rate multiplier then
  omitted). Proving test: `combat/test/gunnery/gun-quality.test.ts` (table exactness + bounds).

## Notes for implementator
Deferred rate factors (autoloader/damage/etc.) pinned to neutral 10_000 as authored
constants; ship the real gun-quality + crew + technology surface so §4 order + ceiling
rounding are fully exercised. `ceil` for reload (contrast `floor` for accuracy).
