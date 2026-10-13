# Research note — persistence async facade / `BluewaveError` cleanup: verdict + triggers

- **Ticket:** `.scratch/effect-conformance/issues/08-persistence-facade-bluewave-error.md`
- **Type:** task (decision)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` + tests are the evidence-of-truth for
  *what an API does*; repo ADRs / `RULES.md` / `.ai/ENGINEERING-CONTRACT.md` are the policy
  of record. A conflict is itself a finding.
- **Scope:** the two residual debts listed in `.ai/reports/effect-v4-final-acceptance.md`
  §"Known limitations" — the `persistence` async facade and the `BluewaveError` cleanup —
  which are also `.scratch/effect-v4-vendor-migration/issues/00-…` §6 items 1 and 3.
- **What this session did:** read the current code, ADR-0104/ADR-0128/ADR-0152, the Wave 5
  ticket 34 decision, and the gates; edited **no code** (per the map: "harden means *decide
  remedies*, not apply them"). Ticket answer + map entry only.
- **Durable note sibling of:** `docs/research/effect-conformance-0{1,2,3,4,5,6,7}-*.md`.

---

## 1. The debts, restated precisely

Both come from the migration tracker's deferred list (ticket 00 §6; the tracker directory
was pruned by commit `57133aeb`, so cite `git show 1852b12d:.scratch/effect-v4-vendor-migration/issues/00-reconcile-migration-tracker.md`),
carried into the final acceptance report (`.ai/reports/effect-v4-final-acceptance.md:74-78`).

### 1.1 `persistence` async facade — two sub-parts

ADR-0104 selected `@bluewave/persistence` as the Effect beachhead. It has two related
pieces of withheld work, both named in ticket 00 §6 item 3:

1. **The async/Effect IO facade.** Wave 5 ticket 34's origin plan (`plan.md` §5.2 wave 5)
   was to "flip cross-package facades to Effect-typed interfaces" and give `persistence`
   "Effect runtime + `Scope`/AbortSignal cancellation; tagged `PERSISTENCE_*` errors" —
   i.e. replace the synchronous `node:fs` `SaveStore` implementation with the async Effect
   `platform` FileSystem service behind an async facade. **Lives at:**
   `packages/persistence/src/store.ts:98` (`SaveStore`; sync `readFileSync`/`writeFileSync`/
   `renameSync`/`existsSync` at `:3-9,165-179`) and `packages/persistence/src/recovery.ts:1-2`.
   **Policy of record:** ADR-0104 §6 ("Runtime scope: raw synchronous IO is kept") and its
   Consequences ("a later wave may route the remaining `SaveStore` failure sites…").
2. **Routing the `SaveStore` failure sites through the `PERSISTENCE_*` tagged errors.**
   The tagged vocabulary *exists* (`packages/persistence/src/errors.ts:50-101`: five
   `Data.TaggedError` classes, `_tag` = the code) but is **unused by the store** — the
   store still reports every failure through `diagnostics.addError(...)` (32 sites in
   `store.ts`, e.g. `:208,215,246,271,285,307,353,370,392,400,424,451,530,536`). Only
   `PersistenceCompatibilityMismatchError` is constructed outside tests, by the separate
   compatibility checker (`compatibility.ts:23`). ADR-0104 §5/Consequences retained the
   `DiagnosticCollector` public surface and labelled the tagged classes "preparatory
   typed vocabulary".

### 1.2 `BluewaveError` cleanup — one item

Ticket 00 §6 item 1: convert `BluewaveError` (`packages/contracts/src/index.ts`) and the
`ship-design`/`campaign` plain error families to `Data.TaggedError`, "deferred until the
renderer can consume an Effect-free error contract (e.g. a plain-TS error package with
`_tag`, or renderer-side `sideEffects:false` proven by the bundle guard). Revisit only
with an ADR." **Lives at:** `packages/contracts/src/index.ts:57` plus the eight
`ship-design` classes and `campaign`'s `ConstructionProjectTransitionError`.

## 2. Current state (verified, 2026-10-13)

- **`BluewaveError` cleanup: already dispositioned and applied.** ADR-0152
  (errors-by-reachability) *is* the ADR the deferral asked for. It resolves the debt
  without `Data.TaggedError` at the renderer boundary: renderer-reachable packages
  (`contracts`, `ship-design`, `campaign`, `campaign-engine`, `ship-visual`) keep plain
  classes with a `readonly _tag`; `BluewaveError` gained `_tag = "BluewaveError"` and the
  `isBluewaveError` guard (`contracts/src/index.ts:57,80`). Tickets 12 and 14 applied it:
  `rg "instanceof BluewaveError"` over authored source returns **zero** hits; the
  `ship-design` classes (`persistence.ts:11-19`, `edits.ts:44`, `units.ts:18`,
  `formula/ast.ts:8`, `construction.ts:290`, …) and `campaign`'s
  (`constructionStatus.ts:98`) all carry a `readonly _tag` (most also a `static is` guard);
  `scripts/assert-tagged-errors.mjs` guards every first-party root (ADR-0152 §4, ticket 12).
- **`persistence` async facade: still synchronous, and the tagged vocabulary still unused by the store.**
  `store.ts` imports `node:fs` directly and routes none of its 32 `diagnostics.addError(...)`
  sites through the tagged classes (`rg "PersistenceCorrupt|PersistenceMissing" packages/persistence/src/store.ts`
  → none); the only non-test construction of a tagged class is the compatibility checker
  (`compatibility.ts:23`, `PersistenceCompatibilityMismatchError`). `CompatibilityError`
  stays a plain class by ADR-0152 §5.

## 3. Weighing against ADR-0128

ADR-0128 ("the runtime wave is not warranted") already decided the *shape* question and
ticket 34 closed on it:

- **The facade flip is barred by reachability/purity, not merely postponed.** ADR-0128 §1
  bars Effect-typed public facades that the renderer can reach; §2/§3 bar introducing a
  `ManagedRuntime`/`runPromise` where there is no composable async service graph. For
  `persistence` specifically the operative rule is ADR-0104 §6 + ADR-0128: `SaveStore` is
  **synchronous by contract**, and the sync→async `platform` FileSystem rewrite is a wide,
  high-regression-risk behaviour change with no present caller need. The map's own scope
  line reinforces it: "No runtime wave: ADR-0128 stands."
- **Ticket 34's inventory was empty**, for exactly this reason: `SaveStore` "not flipped —
  synchronous by contract (ADR-0104 §6)".
- **The tagged-error routing sub-part is *not* a runtime question at all.** It needs no
  `Layer`/`ManagedRuntime`, changes no wire format, and the tagged classes already exist;
  it is withheld only because the collector is the deliberate public error surface
  (ADR-0104 §5). A scoped boundary gate (ticket 06) already covers `persistence` by
  behaviour, and no caller needs `Effect.catchTag("PERSISTENCE_*")` today.

So neither debt justifies reopening a runtime wave, and neither is an Effect-conformance
*leak* — the runtime-free boundary (`scripts/assert-runtime-free.mjs`,
`RUNTIME_FREE_ROOTS`) is green.

## 4. Verdict

1. **`BluewaveError` cleanup — DROPPED (resolved).** Not deferred, not reopened: the
   literal `Data.TaggedError` conversion is permanently wrong under `MIG-EXCL-1` for the
   renderer-reachable packages, and ADR-0152 replaced it with the `_tag`-by-reachability
   idiom, which is applied and gate-enforced (tickets 12/14). Nothing remains to do; no
   further trigger.
2. **`persistence` async facade — KEPT DEFERRED.** No new ADR: the disposition and its
   triggers are already recorded. Reopen per **ADR-0128 §"Revisit triggers" #1 and #3** —
   #1 ("a non-renderer-reachable async IO seam appears that has a composable service
   graph") and #3 (a caller *requires* `AbortSignal`/typed `Cause` on a path where the
   hand-rolled implementation is insufficient). #2 does not apply: `persistence` is already
   an IO-row package, not a runtime-free package gaining IO. Under ADR-0152, `persistence`
   is not renderer-reachable, so it is a legitimate future host for that seam; the first
   caller that needs async save/load (not merely a `Promise` wrapper over the sync
   pipeline) introduces the runtime there.
3. **`SaveStore` → `PERSISTENCE_*` tagged-error routing — KEPT DEFERRED.** Separate,
   non-runtime, wire-neutral. Revisit trigger: the first caller that needs to recover a
   save failure by `catchTag`/`_tag` instead of reading a `DiagnosticCollector` — at which
   point the existing `errors.ts` vocabulary is wired into the store's failure sites and
   the collector projection (`toDiagnostic()`) keeps output byte-identical (ADR-0104 §5).

No code, wire format, gate, or ADR changed. The decisions of record are this ticket's
`## Answer` and the one-line entry in `.scratch/effect-conformance/map.md`.

## 5. References

- Ticket 08: `.scratch/effect-conformance/issues/08-persistence-facade-bluewave-error.md`
- Debts: migrated tracker §6 items 1 & 3 (pruned from `.scratch/`, recoverable via
  `git show 1852b12d:.scratch/effect-v4-vendor-migration/issues/00-reconcile-migration-tracker.md`);
  `.ai/reports/effect-v4-final-acceptance.md:74-78`
- Policy of record: `docs/adr/ADR-0104-persistence-effect-beachhead.md` §5/§6 and
  Consequences; `docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md` §1-§3 +
  Revisit triggers; `docs/adr/ADR-0152-errors-by-reachability.md` §1-§5
- Code: `packages/persistence/src/store.ts:98`, `packages/persistence/src/errors.ts:50-101`,
  `packages/persistence/src/compatibility.ts:23`, `packages/persistence/src/recovery.ts:1-2`,
  `packages/contracts/src/index.ts:57,80`
- Wave 5 decision: pruned ticket 34 (closed; ADR-0128), recoverable via
  `git show 1852b12d:.scratch/effect-v4-vendor-migration/issues/34-facade-unification.md`
- Gates: `scripts/assert-runtime-free.mjs`, `scripts/assert-tagged-errors.mjs`
- Sibling notes: `docs/research/effect-conformance-0{1,2,3,4,5,6,7}-*.md`
