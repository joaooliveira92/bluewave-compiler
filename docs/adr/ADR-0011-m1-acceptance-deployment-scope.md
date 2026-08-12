# ADR-0011: M1 Acceptance Scope — Deployment (DESIGN-25) Ownership and M1 Completion Sign-off

## Status

Accepted

## Context

Sprint A-5 is the M1 formal acceptance gate (`.ai/SPRINT-PLAN.md` row A-5): apply
DESIGN-55 §9 to every M1 capability, reconcile `docs/OPEN-ISSUES.md`, refresh
`docs/PROGRESS.md`, and sign `M1_STRATEGIC_CAMPAIGN_KERNEL` COMPLETED per §23.

DESIGN-55 §2 lists eleven capability families owned by M1, including
**deployment**. The M1 implementation delivered through B0–B10d covers ten of
them (campaign compiler; nations and world; economy; research; ship design and
construction; diplomacy; war and peace; monthly phase pipeline; save/load/replay/
hashes; deterministic auto-resolution). **Deployment (DESIGN-25)** has no
implemented mechanic, no authored content, and no reachable path in the anchored
`scen_1880` production pack's M1-era (EARLY/PRE_WAR), and the project has
consistently deferred it (DESIGN-25 is unassigned; `docs/rules/deployment-and-logistics.md`
is listed in the unassigned cross-cutting docs; every CONTENT brief records
deployment as deferred, mechanics-gated).

This is not a silent descope. It is a delivery-scope decision (it does not change
any authoritative gameplay because no deployment mechanic exists), recorded here
per the workflow rule that every scope/ambiguity closure must be an ADR, not an
ambient assumption.

## Decision

1. The **M1 acceptance closure** is scoped to the ten implemented capability
   families registered in `docs/acceptance/m1-capability-registry.md`.
2. **Deployment (DESIGN-25)** is a registered capability with readiness state
   `CONTENT_ONLY` (canonical rules exist; no mechanics, no content, unreachable in
   the M1-era of `scen_1880`). It is **not** part of the M1 COMPLETED sign-off.
   It is required by DESIGN-55 §20 as part of the strategic/logistics system
   family for a `FULLY_SUPPORTED` scenario and is therefore scheduled in the
   REL-1 / strategic-logistics track, not the M1 milestone.
3. M1 is signed `COMPLETED` (DESIGN-55 §23) **with this limitation recorded** —
   the same treatment given to B9 (PASS_WITH_LIMITATIONS): the milestone is
   complete for its scoped capability closure, and the deferred deployment
   capability is explicitly visible in the registry, not hidden.

## Consequences

- M1 acceptance evidence (`.ai/reports/a5-m1-acceptance-gate.md`) lists
  deployment explicitly as a deferred, non-blocking-for-M1 capability, so no
  claim of full strategy coverage is made before it lands.
- A future sprint must register deployment as `ACCEPTED` (and later
  `SUPPORTED_MECHANICAL` content) before `scen_1880` can reach `FULLY_SUPPORTED`
  at REL-1 (§17, §20).
- No engine change, no hash change, and no migration result from this ADR.
