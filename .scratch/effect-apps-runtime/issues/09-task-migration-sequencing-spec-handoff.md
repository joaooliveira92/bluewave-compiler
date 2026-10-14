# 09: Migration sequencing and the spec hand-off

**Type:** task
**Status:** resolved
**Blocked by:** 04, 05, 06, 07, 08

## Question

Produce the destination: a decision-complete spec for the implementator.

- Order the work into **frontier-ordered vertical slices** (per `to-tickets`):
  the first slice is a thinnest-end-to-end one (one command through the one
  `ManagedRuntime` with a service or two), then widen to the full service graph,
  then the compiler-cli surface — each slice behaviour-preserving and goldens
  green.
- Record **blocking edges** between slices and the **definition of done** on the
  exact commit (`pnpm preflight`, `pnpm test:scripts`, `pnpm check`; goldens
  byte-identical; renderer bundle clean).
- Fold in the ADR-0159 decision, the service/layer map (04), the dispatch/error
  design (05), the CLI shape (06), the test strategy (07), and the invariant +
  gate/doc edit list (08).
- State the **rollback point** (ADR-0128 §5 ticket 38 lineage) and the migration
  order for removing the hand-rolled `*Deps` seams.

Deliverable: `.scratch/effect-apps-runtime/spec.md` via the `to-spec` skill, plus
its `to-tickets` slices. This resolves the map's destination.

## Answer

Resolved 2026-10-14. Spec published at `.scratch/effect-apps-runtime/spec.md`
(`ERA-R1..R20`; Decisions D1–D7; the two test seams; out-of-scope; ADR-0159 as the
governing decision), with a pointer added to `.ai/specs/README.md`. Sliced into
eight frontier-ordered vertical tickets:

- `INC-1` runtime skeleton + gate move + one command end-to-end — **frontier**
- `INC-2` content boundary services (← INC-1)
- `INC-3` persistence & session services (← INC-1)
- `INC-4` IO, dialog & sidecar services (← INC-1)
- `INC-5` CommandDispatcher in Effect + retire `*Deps` (← INC-2,3,4)
- `INC-6` compiler-cli entrypoint facade (← INC-1)
- `INC-7` `@effect/vitest` + test Layers (← INC-1)
- `INC-8` final validation & doc reconciliation (← INC-5,6,7)

Destination reached: the map's decisions are complete and implementation is
handed off. Execution is the follow-on effort off these tickets.