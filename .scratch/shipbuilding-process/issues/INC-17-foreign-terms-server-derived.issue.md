# INC-17 — Foreign-order command must derive contract terms server-side

**State:** deferred · **Frontier:** no · **Blocked by:** INC-9b (owns the builder-flow + terms derivation)
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20) · **ADR:** none yet
**Origin:** the shipbuilding-sprint code review (spec axis, HIGH).

## The finding

The reachability wiring for `placeForeignConstructionOrder` added an `OrderForeignConstruction` command and a
desktop IPC `placeForeignConstructionCommand` whose wire payload carries `terms` and `capability` as opaque
values (`Schema.Unknown`). `applyOrderForeignConstruction` defaults `capability` to the all-true
`FOREIGN_BUILDER_CONDITIONS_SATISFIED`, and `buildForeignConstructionContract` copies `totalPriceUnits`,
`totalWorkPerUnit` and the payment schedule verbatim from `terms`. The engine recomputes only the DOCK and
CAPACITY predicates. A compromised/untrusted renderer could therefore fabricate a cheap price, a favourable
schedule, or every capability boolean.

`placeForeignConstructionOrder`'s own contract is a pure function that takes caller-resolved terms (INC-9's
posture); the defect is that the **command/IPC boundary trusts the renderer** for values the engine should
derive from authoritative content (`@bluewave/ship-design` naval profiles, the compiled design's projected
cost, the builder's capability). No production renderer control exists yet (INC-9b), so the path is currently
reachable only from tests/e2e.

## What to build (when INC-9b lands)

- A pure, content-grounded terms builder (price from `projectedConstructionOrderCosts` + the builder's
  declared price policy; schedule from a versioned instalment policy; capability booleans resolved from the
  builder's technology/licence/treaty/component state), owned by the engine or desktop main.
- The IPC payload should carry only what the player chooses (design, builder, quantity, maybe delivery
  month); the server derives `terms` and `capability`.
- If any client-supplied field must remain, validate it against the derived value and reject a mismatch with a
  stable reason (never silently accept a fabricated contract).

## Acceptance criteria

- [ ] `terms`/`capability` are derived server-side from authoritative content, not accepted from the renderer.
- [ ] A fabricated `totalPriceUnits`/schedule/capability payload is rejected (test).
- [ ] Golden/determinism unchanged (no foreign contract in the reference run).
