# scripts/** is outside pnpm lint:effect

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

`pnpm lint:effect` runs `oxlint --config oxlint.effect.json packages apps` — the
`scripts/**` tree is linted by neither the Effect-diagnostics gate nor (effect-specific)
`assert-runtime-free`. Decide whether any `scripts/**` file imports/uses Effect in a way
that should be covered, and whether to extend the gate scope.

Deliver: a scan of `scripts/**` for `effect` usage, a verdict on whether to extend
`lint:effect`/gates to cover it, and the remedy (extend scope, add a guard, or accept
with rationale).

## Answer

**Verdict: accept with rationale — no scope extension, no new guard.** `scripts/**`
imports Effect nowhere, and extending the Effect gate would only false-positive on the
ambient IO that dev tooling requires. Durable evidence:
`docs/research/effect-conformance-09-scripts-lint-effect.md`.

**Scan.** The probe
`.scratch/effect-conformance/probe/scripts-effect-usage-probe.mjs` walks every authored
source file under `scripts/**` (61 files) and parses each with `oxc-parser`, collecting
every `import`/`export … from`/`require()` specifier that is `effect`, `effect/*`, or
`@effect/*`: **0 module references.** The only "effect" strings in the tree are data/prose —
`vendor-effect-sync.mjs` names `"@effect/vitest"` to vendor it, `assert-runtime-free.mjs`
carries it in its allowlist and string fixtures, and the lockfile/pin gates
(`assert-single-effect`, `verify-package-dependencies`, `verify-tsgo-integration`) check
the *strings* `effect`/`@effect/tsgo`.

**Why the exclusion is right.** (1) `scripts/**` is not a workspace package
(`pnpm-workspace.yaml` lists only `packages/*`, `apps/*`, the two `vendor/effect*`) and the
root `package.json` declares **no `effect` dependency**; it is "dependency-light Node
scripts" (`scripts/README.md`). (2) It is not in the TypeScript project graph — root
`tsconfig.json` references only `packages/*`/`apps/*`, and the gate is `typeAware: true`
(`oxlint.effect.json:6`) against the typed app graph. (3) The exclusion is the repo's idiom
for script trees: `ignorePatterns` already declines `apps/desktop/scripts/**`. (4) Scripts
are already gated where it applies — `verify-no-unknown-casts.mjs` and
`verify-test-focus.mjs` both set `AREAS = ["packages/", "apps/", "scripts/"]`, plus
`vp lint .` and `vp fmt`. The tree is not un-linted; it is outside the *Effect-diagnostics*
gate.

**Why extending would be wrong.** The rules `lint:effect` surfaces are the determinism
advisories (`processEnv`/`nodeBuiltinImport`/`globalDate`/`globalRandom`/`cryptoRandomUUID`),
and dev tooling legitimately does all of them — `process.env` in 11 script files
(`run-gates.mjs:213`, `vitest-shared.mjs:14`, `change-scope.mjs:24`), `node:fs` in 11,
`new Date()` in 3 (`vendor-effect-sync.mjs:206`), random/temp-name generation in 2. Those
are build/CI mechanics, not authoritative-gameplay reads. A dedicated runtime-free guard is
also unwarranted: ADR-0100 §2 / ADR-0128 protect the *renderer bundle* and the *pure
packages*; `scripts/**` is never bundled and has no Effect dependency, so there is no
boundary to guard.

**Remedy applied (declarative only).** `"scripts/**"` added to `oxlint.effect.json`'s
`ignorePatterns`, making the declination explicit in the gate's config rather than implicit
in the `lint:effect` path list — mirroring the existing `apps/desktop/scripts/**` entry.
The current command already passes `packages apps`, so this is a no-op today; it keeps the
declination if a future invocation broadens the path, and records the decision where a
reader of the gate will find it. No gate scope widened, no new guard.

