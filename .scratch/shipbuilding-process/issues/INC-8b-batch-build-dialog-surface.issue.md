# INC-8b — Batch build dialog, auto-name display and dock/capacity panel

**State:** done · **Frontier:** no · **Blocked by:** INC-8
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R11, R13, R15, R30, R33) · **ADR:** none new
**Parent:** `INC-8-batch-order-names-build-dialog.issue.md` (engine slice landed)

## What to build

The player surface for the class-order batch: the **build dialog** picks an approved compiled design
version, a builder (domestic yard or foreign), and a quantity `1..12` with auto-assigned names, shows
per-yard fit and the dock-size ceiling, and refuses a quantity above `12` for the same reason the
engine does. A **dock/capacity panel** shows the dock size, the national concurrency cap and its
current utilisation, and offers the dock-expansion action (INC-6). Every readout displays a compiled
value; every control issues a command; navigation consumes no authoritative randomness.

### Builder split (decision, 2026-10-12)

A DOMESTIC batch's builder is the design's own yard: `OrderConstructionCommand`/`orderConstructionBatchCommand`
carry no separate builder field, so the dialog shows no domestic builder selector — it shows the
design's yard and its dock fit. The **builder selector (domestic or foreign)** is delivered by INC-9b
(the foreign builder surface), which owns candidate-builder selection; that is why AC1's "a builder"
clause is satisfied by INC-9b, not this ticket.

## Acceptance criteria

- [x] The build dialog offers the nation's approved compiled design versions, a quantity `1..12`, and
      previews the auto-assigned names from the engine's naming policy — `previewConstructionBatch`
      (phase-engine) through the read-only `previewConstructionBatchCommand` bridge; the builder
      selector is INC-9b (see the decision above).
- [x] The dialog shows per-yard fit and the dock-size ceiling (SB3-R15), and refuses quantity `> 12`
      with the same reason code the engine returns (`CONSTRUCTION_BATCH_LIMIT_EXCEEDED`, surfaced from
      the engine, never a UI-invented code).
- [x] Ordering from the dialog places the batch through the INC-8 engine path
      (`placeConstructionBatch`) behind the existing construction bridge contract.
- [x] The dock/capacity panel shows dock size (max build displacement), the concurrency cap and its
      current utilisation, all from compiled values, and offers the dock-expansion action (INC-6) —
      delivered by INC-5b/6b/7b.
- [x] Display-vs-edit: each control issues a command or a draft; no readout invents data.
- [x] Desktop render test + `pnpm snap` of the dialog and the panel (screenshot + `aria.yaml`,
      console clean, no churn warning); the e2e path covers configure → order batch → advance month —
      `e2e/construction-batch.spec.ts`.

## Notes for implementator

One component per file under the construction screen's `components/`; re-export from the barrel.
The engine slice (`placeConstructionBatch`, `allocateShipNames`, `CONSTRUCTION_BATCH_LIMIT_EXCEEDED`,
batch fields on `ConstructionProject`) is already in `@bluewave/phase-engine` / `@bluewave/ship-design`.
Follow the renderer conventions in AGENTS.md and keep the surface consistent with the other
construction panels. This is part of WS5.
