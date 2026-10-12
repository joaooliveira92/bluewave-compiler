# INC-16 — Ship dimension dock predicate (owner for the deferral)

**State:** deferred · **Frontier:** no · **Owner:** ship-design / campaign content (this sprint's reviewer flagged it; no
builder can be held to a dimension limit the compiled design does not carry)
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R15, SB3-R20) · **ADR:** none yet
**Origin:** the INC-9 code review (recorded in `INC-9-foreign-contract-capability-payment.issue.md`).

## What is deferred

DESIGN-16 §4.1–§4.2 and §13.2 require new construction to be assessed against a dock's **dimension**
predicate (length, beam, crane) as well as its mass ceilings. The engine's dock records carry the mass limits
and the ship-design `newConstructionDockEligibility` predicate reads `lengthMm`/`beamMm`, but
`CompiledDesignVersion` persists **no length or beam**, so every order path (domestic and foreign) supplies
`lengthMm: 0, beamMm: 0` and the dimension half of the predicate is inert. The mass ceiling
(`SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`) is enforced and tested; the dimension predicate is not.

## Why deferred, not fixed here

Adding `lengthMm`/`beamMm` to `CompiledDesignVersion` is a compiled-design/save-format change that also touches
the drawing-board compile path (SB-1/SB-2) and the content schema. It is out of the shipbuilding-process sprint's
EARLY-band delta scope and belongs with the design-model work; inventing the values would violate the
"no fabricated values" rule.

## Acceptance criteria (for whoever picks this up)

- [ ] `CompiledDesignVersion` carries persisted length/beam (or a derived dimension predicate), with a
      compatibility/ADR decision and `snapshotClone.ts` coverage.
- [ ] Both the domestic and foreign order paths pass the real dimensions into
      `newConstructionDockEligibility`; the dimension failure surfaces with the existing dock reason.
- [ ] Golden/determinism impact assessed (ADR-0007).
- [ ] Tests: a hull within mass but over beam is refused; a hull within both is accepted.
