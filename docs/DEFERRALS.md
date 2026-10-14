# Deferred work ledger

Single release-gate-auditable list of work an ADR has **recorded as deferred**
rather than completed. `AGENTS.md` forbids silently dropping deferred or
mechanics-gated work; this ledger is where that work is held to account.

**Contract (enforced by `scripts/docs-check.cjs`):**

- Every ADR whose `## Status` section flags a deferral (matches `deferr` or a
  non-hyphenated `pending`) MUST have a row here naming its `ADR-NNNN`.
- Every `ADR-NNNN` named here MUST exist, and the row's status MUST be `open` or
  `closed`.
- A closed row stays in the ledger (history), with the closing ADR or PR noted.

Reviewers check this file during the release verification gate (ADR-0099).

| ID | Source ADR | Deferred | Next step | Status |
| --- | --- | --- | --- | --- |
| D-1 | ADR-0056 | The unit of "effective strength" fed to the battle-generation floors (part 2). `ship.firepower` is provisional; the rules fix the numbers (300/150) but never define a point. | Decide the unit together with movement/contact, as a versioned ruleset constant with its own ADR and a golden refresh. | open |
| D-2 | ADR-0069 | The 1880-borders dataset (`world_1880.geojson`, GPL-3.0) carries a licence obligation into any distributed build. | Before release: obtain licence sign-off, or re-bake from a permissively licensed source, or remove the layer. | open |
| D-3 | ADR-0071 | Full migration of the five command screens onto one orchestration convention; the second (`RequestLifecycle`) convention remains. | Generalize the workflow adapter to accept any screen state, migrate Construction/Fleet/Treasury and Research/Diplomacy, delete the hand-rolled wiring. | open |
| D-4 | ADR-0106 | Gating required CI checks on `scripts/change-scope.mjs` (skip heavy jobs on docs-only changes). It currently runs informational-only, so a scope bug cannot skip a real gate. | Prove docs-only detection (fixtures for `committed`/`staged`/`unstaged`/`untracked` and fail-safe defaults), then make heavy steps conditional in `quality.yml` and `determinism.yml`. | open |
| D-5 | ADR-0106 | Paying down the production `as unknown` inventory frozen by `scripts/no-unknown-casts.baseline.json` (73 in production source; 238 in tests). The ratchet stops growth but does not reduce it. | Reduce production casts package-by-package through the Effect Schema boundaries (ADR-0102/0104/0105); regenerate the baseline with `verify-no-unknown-casts.mjs --prune` as each lands. | open |
| D-6 | ADR-0106 | A bounded-concurrency, dependency-aware gate runner to replace the flat `pnpm check` chain (the oversubscription/cache-replay pain noted in `determinism.yml`). | Closed by ADR-0107: `scripts/run-gates.mjs` schedules `preflight` with bounded concurrency, `needs` edges, per-gate timeouts, and optional fail-fast. | closed |
| D-7 | ADR-0112 | Mine warfare (C-2), submarines (C-3) and coastal defense (C-4) remain built but unreachable; each needs a new strategic `phase-engine` month phase (their design is monthly/area-level, not per-minute tactical). | Register each phase in `packages/phase-engine/src/registry.ts` + month pipeline and persist its campaign state; submarine/coastal additionally need campaign state/authored content models. | open |
| D-8 | ADR-0157 | Slice 13b still owns combat reading `CompiledTorpedo`, retiring the per-model torpedo constants with a grep/no-reader gate, and the P4 combat-golden/cross-process proof. The engine-side model fields with no content home (`ownerNationIds`, `technologyPrerequisiteIds`, `productionRequirementId`, `depthKeepingProfile`) are carried `(none)`. | Closed by ticket 13b (ADR-0157 §13b resolution): combat reads `CompiledTorpedo`, the constants are deleted behind `scripts/verify-no-torpedo-model-constants.mjs`, `technologyPrerequisiteIds` is modelled, and the other three fields are dropped. | closed |
| D-9 | ADR-0154 | `interfaces/1` has no aircraft-facility token, so `AVIATION_CONVERSION.allowedInterfaces` is empty: an aviation-facility refit is rejected with `REFIT_KIND_MISMATCH` rather than silently allowed (ship-part-model ticket 14; I-21). | Define the aircraft-facility interface and its concrete provider/consumer with the aviation-parts work (P7), then author the `AVIATION_CONVERSION` rule against it. | open |
| D-10 | ADR-0154 | The authored `balance.yaml` `refit.rules.*.allowedCategories` was not renamed to `allowedInterfaces` (ship-part-model ticket 14). The `refit:` section is carried verbatim into the content artifact with no decoded reader, so the rename would move the content-lock and golden content hashes — outside the ticket's no-hash-change rule. | Rename it to `allowedInterfaces` alongside an approved content-lock + golden `contentArtifactHash`/`contentBundleHash` re-pin; wire a decoded reader for the production `RefitBalance` at the same time. | open |
