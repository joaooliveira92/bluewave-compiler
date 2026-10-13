# Warn-only determinism advisories outside pure packages

**Type:** task
**Status:** resolved
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

**Verdict: the current exemption is correct — accept with rationale. No scoped hard gate
over the IO boundaries; no code change.** Durable evidence:
`docs/research/effect-conformance-06-determinism-advisory-gating.md`.

**Why.** Authoritative output is frozen *behaviourally*, not by silence: the reference run
(`packages/cross-process-test/src/run-child.ts`) executes `content-compiler`, `persistence`
(save→load), `phase-engine` (executing the command envelope it builds) and `combat` and
hashes their outputs. The snapshot/ledger/replay/battle hashes are pinned in
`golden/hashes.json` and every compared hash is re-asserted byte-identical across two
processes (`verify-cross-process-determinism.cjs`); `content-compiler`'s `contentBundleHash`
is asserted byte-identical across those two runs and across host locales (CAH-DET-1), though
it is not itself a `golden/hashes.json` key. Any ambient read that reaches a hashed output
on an exercised path already fails a hard gate. Every ambient read at the named boundaries
is legitimate and non-authoritative:

- `packages/persistence` — `Date.now()`/`randomUUID()` save id (`store.ts:109`),
  `new Date().toISOString()` `metadata.timestamp` (`store.ts:136`) and `recoveredAt`
  (`recovery.ts:35`) are envelope metadata, never in a hash; the hashed fields are pure
  functions of state (`store.ts:121-123`) re-verified on load
  (`store.ts:464-467,486-499,535-543`); the lone `readdirSync` (`store.ts:561`) is
  neutralised by the explicit F6 total order (test-locked, `persistence.test.ts:288`).
- `packages/content-compiler` — its `contentBundleHash` path uses only *sorted* enumeration
  (`shipBuildingDiscovery.ts:83,106,114`), so host readdir order cannot leak.
- `apps/compiler-cli` — no clock/RNG/enumeration; only the `process.env.VITEST` auto-run
  guard (`main.ts:258`).
- `apps/desktop/src/main` — injectable clock defaults, dev flags, session-id identity and
  host metadata; outside the golden path (ADR-0128 §2).

A scoped hard gate over these roots would flag those legitimate sites, forcing a non-empty
allowlist whose entries are the very "legitimate IO-boundary and app-entry-point clocks"
ADR-0150 §Alternatives rejects, and would mis-flag the already-sorted enumeration — the
gate's scope (test-locked at `assert-authoritative-determinism.test.mjs:59-66`) is
deliberate.

**Residual gap (recorded, deferred).** The boundaries get only behavioural coverage, so an
ambient read on an *unexercised* boundary path could escape a hard gate. The concrete case
is `discoverShipBuildingFiles` (authoritative, but not exercised by the golden fixture).
Remedy for ticket 11's plan: add a focused order-independence test for it, or accept
explicitly. Not applied (map: decide remedies, do not execute).

**Gates confirmed green this session:** `assert-authoritative-determinism` (15 roots),
`assert-runtime-free` (16 roots), `verify-golden-hashes` (10/10), `verify-cross-process-determinism`
(byte-identical).
