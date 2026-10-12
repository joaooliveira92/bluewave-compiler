# INC-15 — Rebuild reclassification + rebuild surface

**State:** RESOLVED (engine slice; rebuild surface split to INC-15b) · **Frontier:** yes · **Blocked by:** INC-12, INC-13
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R29, R34 rebuild) · **ADR:** none new (DESIGN-22 §22, DESIGN-23 §22 shipped)

## What to build

Make a completed rebuild that changes a ship's natural type re-run classification and refuse a rebuild
whose intended type becomes illegal — so the fleet list stays correct — and expose the full rebuild
action set on one surface.

## Acceptance criteria

- [ ] A rebuild re-runs classification; if the intended type becomes illegal or mismatches the natural
      type, rebuild completion fails with `REBUILD_CLASSIFICATION_INVALID` and remains uncommitted
      (no state change).
- [ ] The rebuild surface exposes the full ticket-10 action set: `BULGE` (INC-12), the armament-change
      rules (INC-13), and the existing machinery / fire-control / armour actions.
- [ ] CV/CVL conversion (`AVIATION_CONVERSION`/`ROLE_CONVERSION`) and BC→BB reclassification stay
      deferred to the carrier/BC bands; the surface does not offer them in the EARLY band.
- [ ] Tests: unit (reclassification failure/success); boundary (type unchanged → no new class);
      `pnpm snap` of the rebuild surface.

## Notes for implementator

Reclassification rides on DESIGN-22 §22 (already specified). The suggested-vs-mandatory reclassification
messaging waits for `BC` (deferred); do not fake it.

## Answer (engine slice, 2026-10-12)

The `REBUILD` completion branch in `constructionPhase.ts` now re-runs classification via
`checkRebuildClassification` (`@bluewave/phase-engine/src/rebuildClassification.ts`) BEFORE any
mutation; on the shipped DESIGN-22 §5 mismatch rejections (`INTENDED_CLASSIFICATION_ILLEGAL`,
`NATURAL_CLASSIFICATION_MISMATCH`, `NO_NATURAL_CLASSIFICATION_MATCH`) it fails with
`REBUILD_CLASSIFICATION_INVALID` and commits nothing (project stays uncompleted, ship untouched, no
`ShipRebuilt`). A valid rebuild completes and re-runs classification; a type-unchanged rebuild creates
no new class. CV/CVL conversion and BC→BB reclassification remain deferred. `check:golden` and
cross-process determinism unchanged. The rebuild surface is INC-15b.
