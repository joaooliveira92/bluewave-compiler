# ADR-0110: Every scenario nation has an authored naval profile

## Status

Accepted (2026-10-11). Extends ADR-0108 from the playable nations to all scenario nations.

## Context

ADR-0108 closed the gap for the **ten playable** nations but the 1880 pack defines
**fourteen** nations. The four non-playable nations (`ottoman_empire`, `netherlands`,
`portugal`, `brazil`) still resolved a generic, nation-neutral ship-building
environment — but they appear in the campaign and in battle, so the generic
environment is exactly the "playable nation without identity" problem ADR-0096 named,
one level down. `productionNationCoverage.test.ts` asserted the opposite invariant
("no profiled nation is outside the playable set"), which would have blocked profiling
them.

## Decision

1. **Profile all fourteen scenario nations.** Author a researched note, a
   `naval-profiles/<nation>.yaml` and six classified `DOCTRINE_TEMPLATE` starters for
   `ottoman_empire`, `netherlands`, `portugal` and `brazil`, exactly as for the playable
   nations (ADR-0092 pipeline, ADR-0108 starters).
2. **Replace the playable-only invariant.** `productionNationCoverage.test.ts` now
   asserts that **every nation in `countries.yaml` has an authored profile** and that no
   profile names a nation outside the pack. The `UNAUTHORED_PLAYABLE` allowlist is gone.
3. **Playability is unchanged.** The ten playable nations remain playable; the four new
   profiles only give the non-playable nations identity in campaign and battle.

## Alternatives considered

- **Keep the playable-only invariant and leave the four generic.** Rejected: it leaves
  the same silent-identity gap the release gate exists to catch.
- **Make the four playable instead.** Rejected: playability is a canonical scenario
  slot decision, out of scope; the missing piece was content, not playability.

## Consequences

- `validateAllNations` now validates fourteen nations; all return zero issues at release.
- Four research notes, four profiles and 24 starters are added; the completeness report
  covers fourteen nations.
- Deferred (recorded, not fabricated): nation-specific heavy-gun families the shared
  catalogue lacks (Ottoman 229 mm, Brazilian Whitworth 300-pdr, Portuguese 121 mm,
  Dutch 283 mm Krupp), sourced shell masses beyond the headline guns, and per-nation
  dock/throughput sources.
