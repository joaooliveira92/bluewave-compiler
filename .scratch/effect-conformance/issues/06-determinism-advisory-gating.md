# Warn-only determinism advisories outside pure packages

**Type:** task
**Status:** open
**Blocked by:** none

## Question

`pnpm lint:effect` runs `@effect/tsgo` determinism advisories
(`globalRandom` / `globalDate` / `cryptoRandomUUID` / `processEnv` /
`nodeBuiltinImport`) at **warn** level only. The hard backstop,
`scripts/assert-authoritative-determinism.mjs` (ADR-0150), covers only the pure
packages — IO boundaries are intentionally exempt.

Decide whether that exemption is still right. Assess: do the IO/orchestration
boundaries (`packages/persistence`, `apps/desktop/src/main`, `apps/compiler-cli`) hold
authoritative-logic code that could leak ambient nondeterminism into the golden/determinism
surface? Is a scoped hard gate warranted there, or is the current exemption correct?

Deliver: a verdict with the evidence (`assert-authoritative-determinism.mjs` roots,
`oxlint.effect.json`, the golden/cross-process pipeline) and a remedy: extend a gate,
add a scoped allowlist, or accept with rationale.

## Answer

_(empty)_
