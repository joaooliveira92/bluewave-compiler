# INC-8 — Batch order 1–12 + auto-names + build dialog

**State:** READY_FOR_AGENT · **Frontier:** no · **Blocked by:** INC-5, INC-7
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R11, R12, R13, R14, R30, R33) · **ADR:** none new (DESIGN-23 §3–5 shipped; name pools are PLACEHOLDER content)

## What to build

Let a player lay down up to 12 ships of one approved class in a single command with automatically
assigned names, gated by the same authorization and reservations as a single order — the manual's
"order up to 12 ships of the same class laid down; names assigned automatically". Plus the build dialog
and the dock/capacity panel.

## Acceptance criteria

- [ ] One `OrderConstructionCommand` orders `1..12` ships of one approved compiled design version; the
      batch carries one design-version id, one named-class id, quantity, one builder (or per-ship
      builders), stable ship ids, canonical names or a naming policy, reservations, and a batch hash.
      Quantity above `12` fails with `CONSTRUCTION_BATCH_LIMIT_EXCEEDED` (a second batch needs a second
      command).
- [ ] A batch starts only after the DESIGN-23 §3 gate passes (approved compiled version, intended and
      natural classification, treaty, builder technology/dock limits, capacity reservation,
      material/personnel/government authorization, accepted locked command). The batch reserves money
      and capacity **before** any project exists; a failed gate creates no project/reservation and
      returns a specific reason code.
- [ ] Names are allocated from a per-nation, per-type name pool in deterministic order with defined
      collision handling; the named-class id is assigned once; allocation consumes no ambient randomness
      and records its pool and ordinal. Name pools ship as PLACEHOLDER content.
- [ ] Repeat orders of an unchanged design version/hash need no new study; a mechanically changed design
      fails with `NEW_DESIGN_STUDY_REQUIRED`; cosmetic-only changes do not.
- [ ] UI: the build dialog picks design version, builder and quantity 1..12 with auto-names, and shows
      per-yard fit and the dock-size ceiling; the dock/capacity panel shows cap and utilisation and
      offers the expansion action (INC-6).
- [ ] Tests: unit (1/12 accepted, 13 rejected; each gate; repeat vs changed design); boundary (1 and
      12; reservation exactly the batch); persistence (batch round-trip); determinism (batch hash
      stable; ship ordering by batch ordinal then ship id); `pnpm snap` of the dialog and panel.

## Notes for implementator

Batch reservations and the order path live in the phase engine; the naming policy is a pure,
pool-driven function in `@bluewave/ship-design`. New reason codes join the command registry.
