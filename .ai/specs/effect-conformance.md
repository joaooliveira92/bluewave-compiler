# Index — Effect conformance

Pointer: `.scratch/effect-conformance/spec.md`

Close the residue of the Effect-conformance audit: pin
`discoverShipBuildingFiles` order-independence; complete ADR-0100's policy of
record (the `09_testing` test-file boundary + the six declined modules named);
remove the residual decode-then-narrow casts; normalise `validateAgainstSchema`
to `Result.isFailure`. The audit's Blocker/Major findings (the false "closed
`Struct`" rule, the `apps/**` tagged-error gap, the `compiler-cli` boundary-cast
gap) are already applied and gated in tickets 01–14. Governance only — goldens
byte-identical; no runtime wave (ADR-0128).

- **Triage:** `ready-for-agent` — ready for slicing.
- **Status:** sliced — 4 frontier-ordered tickets at
  `.scratch/effect-conformance/issues/` (`INC-1`..`INC-4`), all unblocked.
- **Grounds:** ADR-0100, ADR-0106, ADR-0109, ADR-0128, ADR-0150, ADR-0151,
  ADR-0152, ADR-0155; the findings register in
  `.scratch/effect-conformance/issues/11-assemble-conformance-plan.md`.
