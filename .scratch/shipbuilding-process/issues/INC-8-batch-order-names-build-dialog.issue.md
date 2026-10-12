# INC-8 — Batch order 1–12 + auto-names + build dialog

**State:** RESOLVED (engine slice; UI split to INC-8b) · **Frontier:** no · **Blocked by:** INC-5, INC-7
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R11, R12, R13, R14, R30, R33) · **ADR:** none new (DESIGN-23 §3–5 shipped; name pools are PLACEHOLDER content)

## What to build

Let a player lay down up to 12 ships of one approved class in a single command with automatically
assigned names, gated by the same authorization and reservations as a single order — the manual's
"order up to 12 ships of the same class laid down; names assigned automatically". Plus the build dialog
and the dock/capacity panel.

## Acceptance criteria

- [x] One `OrderConstructionCommand` orders `1..12` ships of one approved compiled design version; the
      batch carries one design-version id, one named-class id, quantity, one builder (or per-ship
      builders), stable ship ids, canonical names or a naming policy, reservations, and a batch hash.
      Quantity above `12` fails with `CONSTRUCTION_BATCH_LIMIT_EXCEEDED` (a second batch needs a second
      command). *Engine slice: `placeConstructionBatch`; explicit per-ship builder allocation is
      deferred to INC-8b/INC-9 (batch inherits the design's yard).*
- [x] A batch starts only after the DESIGN-23 §3 gate passes (approved compiled version, intended and
      natural classification, treaty, builder technology/dock limits, capacity reservation,
      material/personnel/government authorization, accepted locked command). The batch reserves money
      and capacity **before** any project exists; a failed gate creates no project/reservation and
      returns a specific reason code.
- [x] Names are allocated from a per-nation, per-type name pool in deterministic order with defined
      collision handling; the named-class id is assigned once; allocation consumes no ambient randomness
      and records its pool and ordinal. Name pools ship as PLACEHOLDER content.
- [x] Repeat orders of an unchanged design version/hash need no new study; cosmetic-only changes do not.
- [ ] A mechanically changed design fails with the literal `NEW_DESIGN_STUDY_REQUIRED` code. **Not emitted**:
      the rule is enforced structurally at the design-study boundary (a mechanical change is a new compiled
      version that only `SubmitDesign`→`planDesignStudy` can approve), not at the order boundary — see the
      Answer for why the review rejected a contrived caller-hash guard. The code-review flagged this tick as
      an overclaim of the spec's literal wording; if the literal code is required it is a follow-up.
- [ ] UI: the build dialog picks design version, builder and quantity 1..12 with auto-names, and shows
      per-yard fit and the dock-size ceiling; the dock/capacity panel shows cap and utilisation and
      offers the expansion action (INC-6). **Split to INC-8b.**
- [x] Tests: unit (1/12 accepted, 13 rejected; each gate; repeat vs changed design); boundary (1 and
      12; reservation exactly the batch); persistence (batch round-trip); determinism (batch hash
      stable; ship ordering by batch ordinal then ship id). `pnpm snap` of the dialog and panel:
      **split to INC-8b.**

## Notes for implementator

Batch reservations and the order path live in the phase engine; the naming policy is a pure,
pool-driven function in `@bluewave/ship-design`. New reason codes join the command registry.

## Answer (engine slice)

Landed the engine/domain half of SB3-R11..R14; the player surface (build dialog, auto-name display,
dock/capacity panel) is split to `INC-8b-batch-build-dialog-surface.issue.md`.

**What landed**

- **Naming policy** — new `packages/ship-design/src/naming.ts`, re-exported from the package index.
  `allocateShipNames({ pool, count, taken, placeholderStem })` returns one
  `{ name, pool, ordinal }` per ship plus an `exhausted` flag. Rule (module doc comment): walk the
  authored pool stems in order skipping any base name already taken (existing ships, class names,
  in-flight `shipName`s, earlier same-batch ships); when every base is taken, use numbered variants
  (`<stem> <n>`, `n` from 2) of the earliest stem with a free number; when the pool is empty, use the
  class-name placeholder. `ordinal` is the 1-based authored pool position (`0` for placeholders).
  Pure/deterministic, no ambient randomness.
- **Batch order** — new `placeConstructionBatch(snapshot, request, content)` in
  `packages/phase-engine/src/constructionOrder.ts` (the single-order `placeConstructionOrder` is
  untouched). Quantity must be an integer `1..12`; else `CONSTRUCTION_BATCH_LIMIT_EXCEEDED` and no
  project/reservation. It reuses `constructionOrderEligibility` for the design (revalidation, AMC,
  dock ceiling) and the national concurrency cap now reserves the **whole batch**
  (`committed + quantity × per-ship <= cap`), via a new `batchQuantity` parameter (default `1`, so
  single-order behaviour is unchanged). It creates N `ConstructionProject`s that share one `batchId`
  (`batch-<commandId>`), one `namedClassId` (the design family id, else `class-<designVersionId>`),
  per-ship `shipName`/`namePoolId`/`namePoolOrdinal` from the policy, and stable per-ship ids
  (`constructionBatchProjectIdForCommand` → `project-<commandId>-<ordinal>` in
  `packages/campaign-engine/src/construction.ts`; always ordinaled, even at quantity 1). Projects are
  ordered by batch ordinal then id; a `batchHash` over the canonical batch fields is returned.
- **Campaign state** — optional-only `shipName?`, `batchId?`, `namedClassId?`, `batchOrdinal?`,
  `namePoolId?`, `namePoolOrdinal?` on `ConstructionProject` (`packages/campaign/src/state.ts`) and in
  the `snapshotClone.ts` field list; no existing save hash changes (fields are absent unless set).
- **Completed ship name + identity** — `constructionPhase.ts` `buildCompletedShip` uses
  `project.shipName ?? \`Ship ${stats.className}\``, and a batch ship's id is derived from its stable
  ordinaled project id (`ship-<projectId>`), so several hulls of one batch launching in the same month
  no longer collide on `ship-<design>-<turn>`; a single order keeps the historical id (no golden move).
- **Reason code** — `CONSTRUCTION_BATCH_LIMIT_EXCEEDED` (phase-engine, `constructionOrder.ts`),
  exported from the phase-engine index.

**Repeat-order / study rule (SB3-R14, DESIGN-23 §5).** `NEW_DESIGN_STUDY_REQUIRED` is **not** emitted
here, because the rule is enforced structurally, not at the order boundary: compiled versions are
immutable and the order path only accepts an existing `snapshot.designs` version, so a repeat order of
an unchanged version needs no study (pinned by test), while a mechanically changed design is a new
draft compiled into a new version that only the design-study path (`SubmitDesign` →
`planDesignStudy`) can approve. Cosmetic-only changes keep the approved version's `compiledHash` and
need no study. The earlier draft of this ticket added a `claimedApprovedCompiledHash` guard, but a
review found it unreachable in production (a contrived caller field no real caller sets), so it was
removed rather than kept as fabricated enforcement.

**Flagged / deferred**

- The name pools are real authored content (the naval profiles' `namingPolicy.stems`); the PLACEHOLDER
  path only fires for types the profile is silent about (e.g. submarines). It records
  `name_pool:placeholder`; the pool stem stays a PLACEHOLDER content gap per SB3-R13.
- Batch-to-batch **replacement** is not supported in this slice: `placeConstructionBatch` has no
  `replacingCommandId` (removing a prior batch by single-order id would have silently double-counted
  its tonnage against the national cap). Replacement stays single-order only; batch replacement can be
  added with the dialog surface (`INC-8b`) if needed.
- Builder allocation is unchanged from the single-order path: every batch ship inherits the design's
  `constructionPlan` yard. Explicit builder / per-ship builder choice belongs to the dialog surface
  (`INC-8b`) and the foreign-yard flow (INC-9).

**Tests + commands**

- `pnpm --filter @bluewave/ship-design exec vp test run test/naming.test.ts` → 8 passed.
- `pnpm --filter @bluewave/phase-engine exec vp test run test/construction-batch.test.ts` → 16 passed
  (1/12 accepted; 13/0/2.5/-1 rejected with no snapshot/projects; each gate fails independently; whole
  batch reserved to the cap; batch hash stable and changing; canonical order; distinct launched ids;
  recorded name + legacy fallback).
- `tsc --noEmit` clean for `ship-design`, `campaign`, `campaign-engine`, `phase-engine`,
  `persistence`; `vp lint .` clean in `ship-design`, `phase-engine`, `persistence`; `vp fmt --check`
  clean on all changed files.
- No golden, determinism, or save-hash change observed.

