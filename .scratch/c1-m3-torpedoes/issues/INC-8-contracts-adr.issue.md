# INC-8 — Contracts Rollup + Research Constants + ADR + Traceability + Gate

**Type:** implementation
**Status:** open
**Blocked by:** INC-7
**Frontier:** no

## Acceptance (spec AC-21, AC-24..AC-25)

- Full `*_v1` rollup: `torpedo_v1`, `torpedo_launch_authority_v1`,
  `underwater_tube_hit_hazard_v1`, `torpedo_models_v1` with `SHIPPED_*_CONTRACT` +
  validate guards; `test/torpedo/contracts.test.ts` fail-closed on tampering (AC-24).
- `reason-codes-torpedoes.test.ts` set-equality vs DESIGN-40 §29 + existing catalog:
  hand-code the 21-code §29 list; partition IN_SLICE/DEFERRED; union covers §29 with no
  gaps/overlap; shipped catalog == in-slice; no deferred code shipped; reused catalog
  codes not redefined; module vs top-level catalogs disjoint (AC-21).
- Research-grounded `torpedo_models_v1` constant set (~6–8 historical models 1880–1945 +
  hazard/launch constants) per `docs/research/c1-m3-torpedoes.md`; BALANCE TARGET items
  flagged (never claimed grounded); §7 25-kt-vs-15-20-kt and G7a-range discrepancies
  recorded (AC-24).
- **ADR-0029** — C-1 scope/integration boundary + reason-code/constant policy (mirrors
  ADR-0020) incl. the §7 threshold note, oxygen multiplier note, and the in-slice marker
  codes.
- Traceability: SPRINT-PLAN C-1 row done + "Immediate next action" → C-2; PROGRESS.md
  M3 row; validation report `.ai/reports/c1-m3-torpedoes-impl.md` per
  `.ai/templates/validation-report.md`; `.ai/specs/c1-m3-torpedoes.md` pointer refresh.
- Orchestrator gate: clean uncached build (`pnpm -w turbo run build --force`), `tsc -b`,
  lint, format, full tests, golden verify `node scripts/verify-golden-hashes.cjs` (10/10),
  two-process cross-process determinism; `BattleResolver`/`StrengthCalculator` unmodified
  (diff) (AC-25). Pre-existing unrelated failures documented only.