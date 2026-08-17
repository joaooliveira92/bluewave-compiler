# INC-8 — Records/Ordering + Contracts Rollup + Determinism + ADR + Traceability + Gate

**Type:** implementation
**Status:** open
**Blocked by:** INC-7
**Frontier:** no

## Acceptance (spec AC-17, AC-18, AC-19, AC-20, AC-21, AC-22)

- `SubmarineOperationsRecord` (§25) with all fields (war, nation, area; strategic
  assets + tactical allocations; policies + missions; type + proximity modifiers;
  reliability/support/intelligence/protection/blockade/screening modifiers;
  sea-state detection/observation/attack modifiers; opportunity/interception/mine/
  ASW/friendly-fire decisions; losses + provenance; merchant/war-score/political/
  inventory/report effects; ruleset + formula versions; record hash)
  (`test/submarines/records.test.ts`).
- Canonical ordering (§26): wars by id → areas by id → submarine assets by id →
  missions by priority → targets by id → tactical allocations by battle id → ASW
  contacts by id → friendly-fire checks by contact+submarine id; via deterministic
  collection + explicit sort (not incidental JS ordering); DB/UI/wall-clock order
  MUST NOT affect outcomes (`test/submarines/ordering.test.ts`).
- Reason-code set-equality: all 14 §27 codes (see spec §1.4) + `SUBMARINE_RESOLUTION_DEFERRED`
  marker; `reason-codes-submarines.test.ts` partition (in-slice/deferred/catalog)
  (`test/submarines/reason-codes-submarines.test.ts`).
- Integration-boundary proof (AC-19): no `phase-engine`/`CampaignSnapshot`/
  minute-advance coupling; `mines/`/`torpedoes/`/`weather/`/`BattleResolver`/
  `StrengthCalculator` unmodified (diff).
- Two-process determinism: new `run-submarines-child.ts` (node-spawn ×2,
  byte-compared) via `@bluewave/cross-process-test`; only keyed `submarine/...`
  RNG streams (`test/submarines/determinism.test.ts`).
- Contracts rollup: full `*_v1` set + `SHIPPED_*_CONTRACT` + `validate*Contract`
  guards (`test/submarines/contracts.test.ts`).
- ADR: C-3 scope/integration boundary + tactical/ASW/friendly-fire/loss deferral +
  reason-code/constant policy. Traceability: SPRINT-PLAN C-3 row, PROGRESS,
  validation report `.ai/reports/c3-m3-submarines-impl.md`.
- Goldens unchanged: `verify-golden-hashes.cjs` 10/10 (AC-22).

## Hints

This is the gate increment — run the full orchestrator validation (uncached
build, `tsc -b`, lint, format, full tests, golden verify, two-process determinism)
and record exact observed results. Do NOT modify `mines/`/`torpedoes/`/`weather/`/
`phase-engine`/`random`/desktop-e2e (concurrent); the shared tree may be
mid-edit by another session, so verify your own changed-file diff is confined to
`packages/combat/src/submarines/` + `packages/combat/test/submarines/` + the
child + ADR + docs.
