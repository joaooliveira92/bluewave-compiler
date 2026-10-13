# Confirm every declined ai-docs section is documented + gated

**Type:** task
**Status:** open
**Blocked by:** none

## Question

The audit validates the declination (ADR-0128) rather than reversing it. For each
ai-docs section Bluewave does not use, confirm there is (a) a documented rationale and
(b) a machine gate that keeps it declined.

Sections to confirm: `03_services`, `05_resources`, `06_running`, `07_pubsub`,
`03_stream`, `04_integration`, `05_batching`, `06_schedule`, `07_datetime`,
`08_observability`, `09_testing`, `10_predicate`.

For each, report: the ADR / doc line that declines it, the gate that enforces the
decline (if any), and whether the declination is still sound. Flag any section that is
declined only implicitly (no doc, no gate) as a finding. Also sanity-check the
runtime-free allowlist (`Data, Equal, Hash, Option, Predicate, Result, Schema,
SchemaIssue`) against the vendored runtime-free surface.

Deliver: a table of section → rationale → gate → verdict (documented+gated / gap), with
a remedy for each gap.

## Answer

_(empty)_
