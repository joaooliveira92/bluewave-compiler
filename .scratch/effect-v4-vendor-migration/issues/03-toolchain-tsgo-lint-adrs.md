# 03 — Toolchain: `@effect/tsgo` lint gate, tsconfig policy, ADR set

**Type:** implementation
**Status:** open
**Blocked by:** 02 (workspace + guard)
**Frontier:** yes

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

- [ ] `@effect/tsgo` is a pinned **exact** devDependency and lives **outside**
      `vendor/`; no `vendor/@effect/tsgo` directory exists (`MIG-VENDOR-5`).
- [ ] The lint gate is wired per the official Oxlint setup: `oxlint` +
      `oxlint-tsgolint` + `effect-tsgo patch --oxlint`, extending
      `@effect/tsgo/oxlint-presets/recommended.json` (scoped presets/severities
      as needed), with the `@effect/language-service` plugin `diagnostics:false`
      to avoid double-reporting; runs green on the current tree in the repo's
      lint pipeline (`vp lint` rule or a dedicated `lint:effect` Turbo task)
      (`MIG-VENDOR-5`).
- [ ] `duplicatePackage` is enabled and reinforces the single-copy invariant
      (`MIG-GRAPH-1`).
- [ ] `AGENTS.md` gains a "Vendored repositories" section: `repos/effect` is
      read-only reference; do not edit or import from it; read
      `repos/effect/LLMS.md` before writing Effect code; optional
      `agent-patterns/effect-*.md` created (`MIG-REF-1`).
- [ ] tsconfig policy recorded: `skipLibCheck: true` retained (load-bearing for
      Effect); an explicit decision on `erasableSyntaxOnly` for consumer code
      (`MIG-RUNTIME-1`).
- [ ] ADR-1 **Adopt Effect v4** (stable line; pin exact `4.0.2`/`4.0.x`;
      runtime-free core vs full-Effect boundaries) (`MIG-ADR-1`).
- [ ] ADR-2 **Vendor Effect** (V1 layout incl. workspace wrapper, sync procedure,
      single-copy invariant, zero-patch default, `repos/effect` agent reference,
      `duplicatePackage`) (`MIG-ADR-1`).
- [ ] ADR-3 **Replace Zod with Effect Schema** (boundary-by-boundary, no dual
      maintenance, wire formats frozen) (`MIG-ADR-1`).
- [ ] ADR-4 **DESIGN-08 determinism spine demoted** (records the conflict with
      DESIGN-08 per adoption ticket 05) (`MIG-ADR-1`).
- [ ] `pnpm check` green.

## Notes

- `@effect/tsgo` requires a native TS ≥ 7 (repo has 7.0.2). If it cannot plug
  into `vp lint`, add it as a separate Turbo task rather than weakening the gate.
- Keep determinism rules (`globalRandom`, `globalDate`, `cryptoRandomUUID`,
  `processEnv`, `nodeBuiltinImport`) at a severity that fits our runtime policy:
  pure packages must not trip `globalRandom`/`globalDate`; boundary packages
  justify any exception.
- Write ADR **decision records only**; do not implement migration code here.
