# Persistence async facade / BluewaveError cleanup

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

`.ai/reports/effect-v4-final-acceptance.md` lists known limitations: a deferred
`persistence` async facade and a `BluewaveError` cleanup. Decide whether these are
reopened now, kept deferred (with a recorded trigger), or dropped.

Deliver: restate the debt precisely (what the async facade / `BluewaveError` are, where
they live), weigh reopening against ADR-0128 (no runtime wave), and record a verdict +
trigger. This is a disposition decision, not an implementation.

## Answer

**Verdict: `BluewaveError` cleanup is DROPPED (already resolved); the `persistence`
async facade and its `SaveStore` tagged-error routing are KEPT DEFERRED with recorded
triggers. No new ADR, no code change.** Durable note:
`docs/research/effect-conformance-08-persistence-facade.md`.

**The debts, precisely.**

- **`persistence` async facade** (migrated tracker §6 item 3, pruned from `.scratch/`;
  recoverable via `git show 1852b12d:.scratch/effect-v4-vendor-migration/issues/00-reconcile-migration-tracker.md`)
  has two halves. (a) The async Effect IO facade: Wave 5's origin plan was to replace the
  synchronous `node:fs` `SaveStore` with the async Effect `platform` FileSystem service
  behind an async facade (`packages/persistence/src/store.ts:98`, `recovery.ts:1-2`).
  (b) Routing the `SaveStore` failure sites through the `PERSISTENCE_*` tagged errors: the
  vocabulary exists (`packages/persistence/src/errors.ts:50-101`, five `Data.TaggedError`s)
  but the store routes none of its 32 `diagnostics.addError(...)` sites through it (only the
  compatibility checker constructs one, `compatibility.ts:23`).
- **`BluewaveError` cleanup** (migrated tracker §6 item 1): convert `BluewaveError`
  (`packages/contracts/src/index.ts:57`) and the `ship-design`/`campaign` plain error
  families to `Data.TaggedError`.

**Current state (verified 2026-10-13).** `BluewaveError` already carries
`readonly _tag` + `isBluewaveError` (`contracts/src/index.ts:57,80`); every renderer-reachable
class (`ship-design`, `campaign`) carries a `readonly _tag` (most also `static is`);
`rg "instanceof BluewaveError"` over authored source returns **zero** hits;
`assert-tagged-errors.mjs` guards every root. `SaveStore` is still synchronous and routes
none of its failure sites through the tagged classes.

**Weighing ADR-0128.** The facade flip is barred, not merely postponed: ADR-0104 §6 keeps
`SaveStore` sync by contract, and ADR-0128 §2/§3 bar a `ManagedRuntime`/`runPromise` where
there is no composable async service graph (§1 does not apply — ADR-0152 makes `persistence`
non-renderer-reachable); ticket 34's inventory was empty for this reason. The tagged-error
routing is a non-runtime, wire-neutral change withheld only because the
`DiagnosticCollector` is the deliberate public surface (ADR-0104 §5). Neither is an
Effect-conformance leak — `assert-runtime-free.mjs` is green.

**Verdict + trigger.**

1. `BluewaveError` cleanup — **dropped**: permanently wrong under `MIG-EXCL-1`, and ADR-0152
   replaced it with the applied `_tag`-by-reachability idiom (tickets 12/14). No trigger.
2. `persistence` async facade — **kept deferred**: reopen per ADR-0128 §Revisit triggers #1
   and #3 when a caller genuinely needs the async IO seam (`AbortSignal`/typed `Cause`),
   under ADR-0100 §2.
3. `SaveStore` → `PERSISTENCE_*` routing — **kept deferred**: reopen when a caller needs to
   recover a save failure by `catchTag`/`_tag` rather than a collector diagnostic.
