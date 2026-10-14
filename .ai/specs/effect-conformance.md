# Index — Effect conformance

Pointer (archived): `.scratch/archive/effect-conformance/spec.md`

Close the residue of the Effect-conformance audit: pin
`discoverShipBuildingFiles` order-independence; complete ADR-0100's policy of
record (the `09_testing` test-file boundary + the six declined modules named);
remove the residual decode-then-narrow casts; normalise `validateAgainstSchema`
to `Result.isFailure`. The audit's Blocker/Major findings (the false "closed
`Struct`" rule, the `apps/**` tagged-error gap, the `compiler-cli` boundary-cast
gap) are already applied and gated in tickets 01–14. Governance only — goldens
byte-identical; no runtime wave (ADR-0128).

- **Triage:** archived — all tickets resolved.
- **Status:** archived (2026-10-13) — all tickets resolved; files moved to
  `.scratch/archive/effect-conformance/` (`INC-1`..`INC-4` and tickets 01–14).
- **Grounds:** ADR-0100, ADR-0106, ADR-0109, ADR-0128, ADR-0150, ADR-0151,
  ADR-0152, ADR-0155; the findings register in
  `.scratch/archive/effect-conformance/issues/11-assemble-conformance-plan.md`.
