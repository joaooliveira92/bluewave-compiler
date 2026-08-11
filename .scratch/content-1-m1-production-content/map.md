# Wayfinder Map: CONTENT-1 — M1-Era Production Content Pack

## Destination

Author the first **production** content pack for the `scen_1880` anchor
scenario (start Jan 1880), per the CONTENT-0 charter
(`.ai/briefs/content-0-production-pack-charter.md`). The pack is a
separately-authored, validated artifact at `content/production/1880/` with
`type: "production"`; it must compile deterministically through the existing
compiler (zero engine change) and be grounded in real, research-backed
data (real nations, world geography, 1880 ironclad fleets, EARLY-era tech
tree, ship-design templates).

## Notes

- Domain: `README.md`, `.ai/ENGINEERING-CONTRACT.md` canonical; `DESIGN-55`
  §12 (content classification) and §14 (unsupported isolation) govern how each
  content feature is declared. The engine's content compiler does not yet carry
  per-feature classification fields — that materialization is a REL-1 concern.
- Content map + classification policy: `docs/research/content-0-content-map.md`.
- Melee rule: content whose owning mechanic is not `ACCEPTED` must be
  `CONTENT_ONLY_LOCKED` and provably unreachable. M1 staples (economy B10a,
  research/design B10b) are `ACCEPTED`; diplomacy (B10c) is **blocked** on a
  decision request, so no diplomacy relations are authored into the reachable
  starting state (they would be reachable without an accepted capability).
- Skills: `/research` for grounding (done — 4 notes under `docs/research/content-1-*`);
  `/domain-modeling` for pack taxonomy consistency.
- Anchor: scenario `scen_1880`, Jan 1880, five reachable era bands, max 1092 mo.

## Decisions so far

<!-- populated as tickets are resolved -->

- [01-author-m1-production-pack](issues/01-author-m1-production-pack.md) —
  Pack authored at `content/production/1880/` (14 countries, ~100 areas,
  35+ routes, ~70 possessions, ~95 ports, 34 EARLY techs, 16 designs,
  22 fleets, 14 economies, 9 constructions, 14 research states). Diplomacy
  omitted (B10c blocked). Brief: `.ai/briefs/content-1-m1-production-content.md`.
- [02-deterministic-compile](issues/02-deterministic-compile.md) — Pack
  compiles deterministically via desktop `runCompilation`:
  content `44953238…`, snapshot `f3e72642…`; `production-pack.test.ts` locks it.

## Not yet specified

- Later era bands (PRE_WAR..LATE) content — CONTENT-2+/C-track.
- Diplomacy relations — pending A-3/B10c.
- Classification annotations + reachability-proof record and release
  artifacts — REL-1 (pack authored supported-only).
- Golden determinism hash for the pack — now captured in the test (the
  hashes above are the reference values).

## Out of scope

- Later era bands' content (PRE_WAR..LATE) — CONTENT-1 authors the M1/EARLY slice.
- Implementing new mechanics (Track A/B/C/D/E).
- Diplomacy relations (B10c blocked) — deferred to keep reachable content
  supported-only.
- Materializing ScenarioSupportManifest / era-coverage matrix / release report
  (REL-1).
