# 03 — Toolchain: `@effect/tsgo` lint gate, tsconfig policy, ADR set

**Type:** implementation
**Status:** done
**Blocked by:** 02 (workspace + guard)
**Frontier:** no

## What to build

Install the pinned `@effect/tsgo` linter as an external devDependency (not
vendored) and wire the Effect LSP + Oxlint type-aware lint gate; add the
`AGENTS.md` "Vendored repositories" guidance and optional `agent-patterns/`
files; record the tsconfig policy (`skipLibCheck: true` stays; decide
`erasableSyntaxOnly` for consumer code); and write the four governing ADRs.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-VENDOR-5,
  MIG-REF-1, MIG-ADR-1**, and the runtime-usage policy (**MIG-RUNTIME-1**); read
  "`@effect/tsgo` policy", "Read-only agent reference", "Runtime-usage policy",
  "ADRs to be written".
- `.scratch/effect-v4-vendor-migration/plan.md` §2.1, §2.7, §3, §9.
- `docs/research/effect-v4-official-references.md` — tsgo/Oxlint setup, rules,
  `duplicatePackage`, agent-reference recipe.
- `.scratch/effect-v4-adoption/issues/05-engine-core-effect-policy.md` and
  `09-version-line-choice.md`; `docs/research/effect-v4-incremental-adoption.md`
  (§3.4 tooling), `docs/research/effect-v4-runtime-determinism.md`.
- `.ai/ENGINEERING-CONTRACT.md` (Determinism, Content, Electron boundary),
  `docs/adr/README.md` for ADR format.

## Acceptance criteria

- [x] `@effect/tsgo` is a pinned **exact** devDependency and lives **outside**
      `vendor/`; no `vendor/@effect/tsgo` directory exists (`MIG-VENDOR-5`).
- [x] The lint gate is wired per the official Oxlint setup: `oxlint` +
      `oxlint-tsgolint` + `effect-tsgo patch --oxlint`, extending
      `@effect/tsgo/oxlint-presets/recommended.json` (scoped presets/severities
      as needed), with the `@effect/language-service` plugin `diagnostics:false`
      to avoid double-reporting; runs green on the current tree in the repo's
      lint pipeline (`vp lint` rule or a dedicated `lint:effect` Turbo task)
      (`MIG-VENDOR-5`).
- [x] `duplicatePackage` is enabled and reinforces the single-copy invariant
      (`MIG-GRAPH-1`).
- [x] `AGENTS.md` gains a "Vendored repositories" section: `repos/effect` is
      read-only reference; do not edit or import from it; read
      `repos/effect/LLMS.md` before writing Effect code; optional
      `agent-patterns/effect-*.md` created (`MIG-REF-1`).
- [x] tsconfig policy recorded: `skipLibCheck: true` retained (load-bearing for
      Effect); an explicit decision on `erasableSyntaxOnly` for consumer code
      (`MIG-RUNTIME-1`).
- [x] ADR-1 **Adopt Effect v4** (stable line; pin exact `4.0.2`/`4.0.x`;
      runtime-free core vs full-Effect boundaries) (`MIG-ADR-1`).
- [x] ADR-2 **Vendor Effect** (V1 layout incl. workspace wrapper, sync procedure,
      single-copy invariant, zero-patch default, `repos/effect` agent reference,
      `duplicatePackage`) (`MIG-ADR-1`).
- [x] ADR-3 **Replace Zod with Effect Schema** (boundary-by-boundary, no dual
      maintenance, wire formats frozen) (`MIG-ADR-1`).
- [x] ADR-4 **DESIGN-08 determinism spine demoted** (records the conflict with
      DESIGN-08 per adoption ticket 05) (`MIG-ADR-1`).
- [x] `pnpm check` green.

## Notes

- `@effect/tsgo` requires a native TS ≥ 7 (repo has 7.0.2). If it cannot plug
  into `vp lint`, add it as a separate Turbo task rather than weakening the gate.
- Keep determinism rules (`globalRandom`, `globalDate`, `cryptoRandomUUID`,
  `processEnv`, `nodeBuiltinImport`) at a severity that fits our runtime policy:
  pure packages must not trip `globalRandom`/`globalDate`; boundary packages
  justify any exception.
- Write ADR **decision records only**; do not implement migration code here.

## Comments

### Evidence (2026-10-11)

**Toolchain pins.**
- `@effect/tsgo` = **`0.51.1`** (exact; `pnpm add -D -E -w @effect/tsgo`). Lives at
  `node_modules/@effect/tsgo`; **no `vendor/@effect/tsgo`** directory (verified).
- `oxlint` = **`1.87.0`**, `oxlint-tsgolint` = **`7.0.2003`** (exact) — the same
  versions `vite-plus@1.1.0` resolves, so the standalone invoker never conflicts
  with `vp lint`.
- Official patch: `effect-tsgo patch --no-typescript --oxlint` (idempotent; run by
  the lint script).

**Chosen lint path (deviation, deliberate).** `vp lint` could not host the gate:
its config does not register the native `effecttsgo` plugin and does not accept
an Oxlint config file, so the Effect rules cannot be hosted there without
weakening it. Wiring is therefore a **dedicated `pnpm lint:effect` script**
(invoked directly by `pnpm check` after `pnpm lint`). `vp lint` is unchanged and
still green.

- `oxlint.effect.json` extends `@effect/tsgo/oxlint-presets/recommended.json`,
  enables the `effecttsgo` plugin + `options.typeAware: true`, sets
  **`effecttsgo/duplicate-package: "error"`**, and enables the determinism rules
  (`global-random`/`global-random-in-effect`, `global-date`/`global-date-in-effect`,
  `crypto-random-uuid`/`crypto-random-uuid-in-effect`, `process-env`/
  `process-env-in-effect`, `node-builtin-import`) as **warnings** per the
  runtime-usage policy. `ignorePatterns` exclude `vendor/**`, `repos/**`,
  `**/dist/**`, renderer/preload, `cross-process-test`, `test-support`.
- `@effect/language-service` plugin `diagnostics:false` added to
  `tsconfig.base.json` (additive; ignored by `tsc`, prevents LSP/Oxlint
  double-reporting).
- The `effect-native` preset was **not** extended wholesale: its `async-function`
  rule alone produced 364 warnings on a non-Effect tree; only the five named
  determinism rule pairs from the ticket are enabled.

**Firing proof (throwaway probes removed).**
- `packages/deterministic/src/__effect_probe.ts` containing `Math.random()` /
  `new Date()` fired `effecttsgo(global-date)` and `effecttsgo(global-random)`;
  exit 0 (warnings). Removed afterwards.
- A resolved probe `import * as Effect from "effect/Effect"; Effect.succeed(1);`
  fired `effecttsgo(floating-effect)` (an `error`-severity recommended,
  type-aware rule) → exit 1. Removed afterwards. This proves the tsgo preset and
  type-aware plugin actually apply to real Effect code. No probe files remain.

**tsconfig policy.**
- `skipLibCheck: true` retained (load-bearing for Effect's `Channel.d.ts` DOM
  globals; the zero-patch default depends on it).
- `erasableSyntaxOnly` **not enabled**: the tree uses `enum`
  (`packages/combat/src/carrier-operations/model.ts`), `namespace`
  (`packages/contracts/src/index.ts`), and constructor parameter properties
  (`packages/random`, `packages/phase-engine`, tests); enabling it would force
  domain rewrites outside Wave 0. Recorded in ADR-0101.

**AGENTS.md / MIG-REF-1.** The "Vendored repositories" section already existed
from ticket 01/02 and already covers read-only `repos/effect`, never edit/import,
read `repos/effect/LLMS.md`, `agent-patterns/effect-*.md`, and the lint/fmt/search
exclusions. Added one paragraph documenting the `pnpm lint:effect` gate,
`duplicatePackage`, the determinism-rule severity, and the tsgo pins (no
duplication).

**ADRs written (numbers per `docs/adr/README.md`), all `Accepted (2026-10-11)`.**
- **ADR-0100** Adopt Effect v4 — stable line, exact `4.0.2`/`4.0.x` pin, the
  runtime-free vs full-Effect boundary table, do-not-migrate list.
- **ADR-0101** Vendor Effect — V1 layout + wrapper, sync procedure, single-copy
  invariant + `duplicatePackage`, zero-patch default, `repos/effect` agent
  reference, the `@effect/tsgo` gate, and the tsconfig policy.
- **ADR-0102** Replace Zod with Effect Schema — boundary-by-boundary, atomic
  (no dual maintenance), no bridge, wire formats frozen + parity tests, conceptual
  API mapping.
- **ADR-0103** DESIGN-08 determinism spine demoted — records the conflict per
  adoption ticket 05; named streams retained; drift recorded, never a blocker.
- `pnpm adr:index` regenerated `docs/adr/README.md` (new "Effect adoption" area
  added to `scripts/adr-index.cjs` AREAS); `docs/adr/AMENDMENTS.md` + the
  DESIGN-08 `Amended by: ADR-0103` header updated so `docs-check` stays green.

**Commands + observed results.**
- `pnpm add -D -E -w @effect/tsgo` → `+ @effect/tsgo 0.51.1`.
- `pnpm add -D -E -w oxlint@1.87.0 oxlint-tsgolint@7.0.2003` → pinned exact.
- `pnpm lint:effect` → `Found 246 warnings and 0 errors.` exit 0 (1104 files, 150
  rules).
- `pnpm preflight` → `preflight: ok`; guard self-test 9/9; `assert-single-effect:
  ok (no registry effect; workspace:vendor/effect)`; `docs-check: ok (329 links,
  102 ADRs indexed)`.
- `node scripts/assert-single-effect.mjs` → exit 0.
- `pnpm format` → all matched files formatted; `pnpm lint` (`vp lint .`) → 0
  warnings/0 errors; `pnpm typecheck` → 37/37; `pnpm build` (forced, uncached) →
  20/20; `pnpm test:run` → 241 files / 1554 tests passed; `pnpm check:licenses`
  → ok; `pnpm check:balance-reports` → ok; `pnpm test:e2e` → 30 passed.
- `pnpm check` composition: every stage above is green; `check` now includes
  `pnpm lint:effect`.

**Out-of-ticket change (flagged).** `pnpm format` was **already red at the base
commit `cc7eec0f`**: `.ai/reports/effect-v4-ticket-02-vendor-workspace-guard.md`
(committed by ticket 02) had a misformatted evidence table. Fixed mechanically via
`pnpm format:fix` (table alignment only, 5 lines) to keep `pnpm check` green. No
content changed.

**Residual limitations.**
- `cryptoRandomUUID` is enabled as a warning but no current code trips it; the
  determinism rules are warnings, not errors, because existing boundary/domain
  code legitimately uses wall-clock/node builtins. They are intended to be
  promoted per-package as each wave migrates.
- `preferSchemaTaggedError` (referenced in the research note) does not exist as a
  rule in `@effect/tsgo@0.51.1`; the Data-vs-Schema `TaggedError` split is
  recorded in ADR-0102 instead of a rule severity.
