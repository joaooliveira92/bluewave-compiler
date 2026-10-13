# Research note — `scripts/**` and the Effect gate scope: verdict + rationale

- **Ticket:** `.scratch/effect-conformance/issues/09-scripts-lint-effect-scope.md`
- **Type:** task (decision)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` + tests are the evidence-of-truth for
  *what an API does*; repo ADRs / `RULES.md` / `.ai/ENGINEERING-CONTRACT.md` are the policy
  of record. A conflict is itself a finding.
- **Scope:** whether `pnpm lint:effect` (the `@effect/tsgo` Oxlint gate) and the
  Effect-specific gates should be extended to cover `scripts/**`, or whether the exclusion
  is correct.
- **Probe run:** `node .scratch/effect-conformance/probe/scripts-effect-usage-probe.mjs`
  → scanned **61** authored script files, **0** `effect`/`@effect/*` module references;
  ambient IO in `process.env` 11 files, `readdir(Sync)` 11, `new Date()`/`Date.now` 3,
  `Math.random`/`randomUUID` 2.
- **Durable note sibling of:** `docs/research/effect-conformance-0{1..8}-*.md`.

---

## 1. Question

`pnpm lint:effect` runs
`effect-tsgo patch --no-typescript --oxlint && oxlint --config oxlint.effect.json packages apps`
(`package.json`). The `scripts/**` tree is passed to neither that command nor
`assert-runtime-free.mjs` (whose `RUNTIME_FREE_ROOTS` are all `*/src`). Does any
`scripts/**` file import/use Effect in a way that should be covered, and should the gate
scope be extended?

## 2. Scan result — `scripts/**` imports Effect nowhere

The probe walks every authored source file under `scripts/` (61 files: `.mjs`/`.cjs`
tooling, `scripts/lib/`, and the `scripts/test/` fixtures) and parses each with
`oxc-parser`, collecting every `import`/`export … from`/`require()` specifier that is
`effect`, `effect/*`, or `@effect/*`.

```
scanned 61 authored script files under scripts/**
effect/@effect module references: 0
```

The only occurrences of the word "effect" in the tree are **data and prose**, never a
module reference:

- `scripts/vendor-effect-sync.mjs` — names `"@effect/vitest"` as a package string it
  vendors (it inspects the artifact; it does not import Effect);
- `scripts/assert-runtime-free.mjs` — its allowlist and its embedded string fixtures
  (`'import { Effect } from "effect";'` as test data);
- `scripts/assert-single-effect.mjs` / `verify-package-dependencies.mjs` /
  `verify-tsgo-integration.mjs` — lockfile / pin checks over the *strings* `effect` and
  `@effect/tsgo`;
- comments in the other gates.

There is no Effect code in `scripts/**` to cover.

## 3. Why `scripts/**` is outside the gate by construction

1. **Not a workspace package and not a declared Effect consumer.** `pnpm-workspace.yaml`
   lists only `packages/*`, `apps/*`, `vendor/effect`, `vendor/effect-vitest`. The root
   `package.json` has **no `effect` dependency at all**; `scripts/**` is "dependency-light
   Node scripts (`.mjs`/`.cjs`)" (`scripts/README.md`) that may not even resolve `effect`.
2. **Not in the TypeScript project graph.** Root `tsconfig.json` references only
   `packages/*` and `apps/*`; no `tsconfig` includes `scripts/`. The Effect gate is
   `typeAware: true` (`oxlint.effect.json:6`) and its rules (`duplicate-package`,
   `*-in-effect`, the determinism advisories) are type-driven — the gate is aimed at the
   typed application graph.
3. **The exclusion is the repo's idiom for script trees.** `oxlint.effect.json`'s
   `ignorePatterns` already declines `apps/desktop/scripts/**` (a build-script tree) for
   the same reason. `scripts/**` was implicitly excluded only by the command's path list.
4. **Scripts are already gated where it matters.** `verify-no-unknown-casts.mjs`
   (`AREAS = ["packages/", "apps/", "scripts/"]`) and `verify-test-focus.mjs`
   (`AREAS = ["packages/", "apps/", "scripts/"]`) scan `scripts/**`; `pnpm lint` (`vp lint
   .`) and `pnpm format` cover it too. It is not an un-linted tree — it is simply outside
   the *Effect-diagnostics* gate.

## 4. Why extending the gate would be wrong (ambient census)

The `@effect/tsgo` rules that `lint:effect` surfaces are the determinism advisories
`globalRandom`/`globalDate`/`cryptoRandomUUID`/`processEnv`/`nodeBuiltinImport`. Dev
tooling legitimately does exactly what those advisories flag:

| advisory | `scripts/**` files | example |
| --- | --- | --- |
| `processEnv` | 11 | `run-gates.mjs:213` (`process.env[name]`), `vitest-shared.mjs:14` (`NODE_COMPILE_CACHE`), `change-scope.mjs:24` (`LANG`/`LC_ALL`) |
| `nodeBuiltinImport` | 11 | `install-hooks.mjs:9`, `verify-check-parity.mjs:12`, `vendor-effect-sync.mjs:103` (`node:fs`) |
| `globalDate` | 3 | `vendor-effect-sync.mjs:206` (`new Date().toISOString()`), `check-commit-msgs.cjs`/`verify-golden-repin.mjs` date/range handling |
| `globalRandom`/`cryptoRandomUUID` | 2 | scratch-directory / temp-name generation |

These are not authoritative-gameplay reads; they are build/CI mechanics (environment
flags, directory enumeration, timestamps for generated artefacts, temp paths). Extending
`lint:effect` to `scripts/**` would emit warnings for essentially every gate script while
protecting nothing, and the same rationale that keeps the *hard* determinism gate off the
IO boundaries (ticket 06, ADR-0150 §Alternatives) applies a fortiori to dev tooling that is
not in the runtime at all.

A dedicated "scripts never import the Effect runtime" guard is also unwarranted: the
runtime-free boundary (ADR-0100 §2, ADR-0128) exists to keep the **renderer bundle** free
of the Effect runtime and the **pure packages** deterministic. `scripts/**` is never
bundled into the app and has no `effect` dependency, so there is no boundary to protect.

## 5. Verdict — **accept with rationale; no scope extension, no new guard**

- `scripts/**` imports Effect nowhere (probe: 0/61 files).
- It is dev/build tooling outside the workspace, the TS project graph, and the shipped
  runtime, and it is already covered by the gates that apply to it (`verify-no-unknown-casts`,
  `verify-test-focus`, `vp lint`, `vp fmt`).
- Extending `lint:effect`/`assert-runtime-free` would produce only false positives on the
  legitimate ambient IO tooling requires, for no reachable-risk reduction.

## 6. Applied remedy — make the declination explicit

The one small hardening applied by this ticket: add `"scripts/**"` to
`oxlint.effect.json`'s `ignorePatterns`, so the exclusion is declared in the gate's config
rather than left implicit in the `lint:effect` path list — mirroring the existing
`apps/desktop/scripts/**` entry. This is declarative only (the current command already
passes `packages apps`, not `scripts`); it makes a future broadened invocation keep the
declination, and it records the decision where a reader of the gate will find it.

## 7. References

- Ticket 09: `.scratch/effect-conformance/issues/09-scripts-lint-effect-scope.md`
- Probe: `.scratch/effect-conformance/probe/scripts-effect-usage-probe.mjs`
- Config: `oxlint.effect.json` (`ignorePatterns`), `package.json` (`lint:effect`)
- Policy of record: `docs/adr/ADR-0100-adopt-effect-v4.md` §2,
  `docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md`,
  `docs/adr/ADR-0150-authoritative-determinism-gate.md` §Alternatives,
  `scripts/README.md`
- Gates that do cover `scripts/**`: `scripts/verify-no-unknown-casts.mjs`,
  `scripts/verify-test-focus.mjs`
- Sibling notes: `docs/research/effect-conformance-0{1..8}-*.md`
