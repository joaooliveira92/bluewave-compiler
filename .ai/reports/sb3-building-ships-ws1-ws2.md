# SB-3 building-ships parity — WS1 + WS2 session report (2026-10-12)

Orchestrator session on `dev`. Full gate green on the exact tree
(`pnpm check`: preflight 13/13, format, lint, `lint:effect`, `test:scripts`,
licences, typecheck 37/37, build, `test:run` 1788 passed, `test:heavy`,
`check:golden` 10/10, cross-process determinism byte-identical, golden-repin,
balance reports, `test:e2e` 33 passed).

## WS1 — manual verification pass

- Added `docs/research/manual-designing-ships-revision-limits.md`: p27 verbatim,
  the six in-place revision limits, and the cross-check against ADR-0132. Five
  match the manual; the **secondary >6 in** rule is stricter than the manual's
  "can be changed to a limited extent" (no manual magnitude).
- Correction tickets opened: `INC-14b` (p27 secondary deviation), `INC-13b`
  (real gun mount style), `INC-12c` (bulge protection consumption).

## WS2 — shipped-prompt corrections

- **INC-5c / ADR-0135 (done).** Per-nation `dock` block authored in all 14 naval
  profiles (four explicit mass limits + provenance), grounded in
  `docs/research/1880-national-dock-capacity.md` (largest hull each nation
  fields, rounded up to the next 1,000 t). `dockRecordFromCeiling`'s implicit
  copy removed; `dockRecordFromDefinition`/`dockRecordFor` read each limit
  explicitly. `constructionOrderEligibility` rejects a domestic order over the
  dock with `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`; `validateNationCompleteness`
  fails an opening design over its own dock. `NationState` gains an optional
  persisted `dock` (the expansion hook) with a save/load round-trip test.
- **INC-14b (done).** ADR-0132 §4 records the secondary-gun deviation.
- **INC-2 follow-up (done).** ADR-0129 gains the normative transition table and
  marks `PLANNED → ACTIVE/COMPLETED` as an interim allowance for INC-8.
- **INC-12c (done, deferral).** ADR-0130 §4: no torpedo-protection consumer
  exists, so `bulgeProtectionGainBp` is recorded but not yet consumed.
- **INC-13b (deferred, recorded).** Needs a whole-catalogue gun `mountStyle`
  content pass alongside the mechanism; ADR-0131 keeps the approximation.

## Deferred (recorded, not dropped)

- WS3: INC-3 halt/resume, INC-4 acceleration, INC-6 dock expansion, INC-7
  concurrency cap, INC-8 batch order.
- WS4: INC-9/10/11 foreign yards, INC-15 reclassification, INC-12b/INC-5b.
- WS5: player surface.
- WS6: save-fixture corpus, DESIGN reconciliation, release PR.

## Blocker / note

- `deff5d30` (the dock commit) changed `content/production` naval profiles that
  do **not** feed the golden reference run; `check:golden` verified all 10
  hashes unchanged. It needed a `Golden-Repin: not-needed` trailer but was
  pushed to `origin/dev` by a concurrent writer before the omission was caught,
  and force-push is prohibited, so `scripts/golden-repin.baseline` was advanced
  past it with the reason recorded (`8679dd00`). The guard still applies to
  every later commit.
