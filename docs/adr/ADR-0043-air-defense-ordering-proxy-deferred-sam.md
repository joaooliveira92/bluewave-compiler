# ADR-0043: Air-Defense §27 Ordering Proxy + Deferred SAM Markers

## Status

Accepted (2026-08-31)

## Context

D-4 (Air Defense, DESIGN-45) ships INC-5 of the pure AA air-defense module in
`@bluewave/combat/src/air-defense/` — records, canonical ordering, the full §28
reason-code rollup, and the four `*_v1` contracts. Two DESIGN-45 statements are
underspecified and required a deterministic resolution:

1. **§27 ordering step 4** (`docs/rules/air-defense.md` line 447) orders records by
   "threat priority from Section 17." §17 defines a 7-criteria threat-ordering.
   The `AirDefenseEngagementRecord` (INC-5, §26) does not yet carry a dedicated
   threat-priority field because §17 threat assignment is not part of the INC-5
   records-only increment (it wires in later). A single scalar had to be chosen as
   a deterministic, total-order tie-breaker for the record comparator.

2. **Deferred marker count** — the D-4 spec (`spec.md` §1.3 line 61) defers the
   three SAM layers (HEAVY_SAM, MEDIUM_SAM, LIGHT_SAM) to the E-track / M5. The
   sibling `air-combat` module ships `<NAME>_DEFERRED` markers for deferred codes;
   the exact number of air-defense deferred markers was not pinned to a single
   number, only "6 deferred SAM markers" (ticket 05, AC-16).

## Decision

1. **§27 step 4 proxy.** `compareAirDefenseEngagementRecords` (`ordering.ts`)
   sorts records by `outcomeProbabilityBp` **descending** as the deterministic
   proxy for §17 threat priority. Rationale: higher effective defense probability
   is treated as "prioritized engagement," providing a total, locale-free order.
   This is a documented proxy, not a claim of full §17 semantics. When §17 threat
   assignment is wired in a later increment, a dedicated `threatPriorityOrdinal`
   field will be added to the record and used for step 4, replacing the proxy.

2. **Six deferred SAM markers.** Exactly six `_DEFERRED` markers are shipped:
   `HEAVY_SAM_DEFERRED`, `HEAVY_SAM_ENGAGEMENT_DEFERRED`, `MEDIUM_SAM_DEFERRED`,
   `MEDIUM_SAM_ENGAGEMENT_DEFERRED`, `LIGHT_SAM_DEFERRED`,
   `LIGHT_SAM_ENGAGEMENT_DEFERRED` (three layer types × a layer marker + an
   engagement marker). They are deliberately excluded from
   `AIR_DEFENSE_REASON_CODE_SET` (they are not shipped codes). This matches the
   sibling `air-combat` pattern and satisfies AC-16's "6 deferred markets (SAM)."

## Consequences

1. Record ordering is fully deterministic and provides a total order even without
   a dedicated threat-priority field.
2. The `_DEFERRED` markers never collide with the 20 shipped §28 codes (verified
   by a disjointness test in `reason-codes-rollup.test.ts`), and no shipped code
   was removed during the reason-code relocation.
3. The §27 step-4 proxy is a known limitation recorded here; it is replaced by a
   real `threatPriorityOrdinal` when §17 wiring lands.

## Compliance

- **ENGINEERING-CONTRACT.md**: deterministic, locale-free ordering; fail-closed;
  no stalling on canonical ambiguity (recorded, deterministic resolution).
- **DESIGN-45 §26, §27, §28** (`docs/rules/air-defense.md` lines 424-478).
- **Ticket INC-5** (`.scratch/d4-m4-air-defense/issues/05-records-ordering-reason-codes-contracts.md`).
