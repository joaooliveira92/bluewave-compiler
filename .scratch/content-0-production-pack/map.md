# Wayfinder Map: CONTENT-0 — Production Content Strategy + Pack Charter

## Destination

Decide and lock the production content architecture for the first
`FULLY_SUPPORTED` Bluewave scenario (DESIGN-55 §17), then land a content charter
brief that every later content sprint (CONTENT-1… and the C-track) founders on.
The charter must fix: the primary scenario ID + start date, the reachable era
bands, the maximum supported campaign duration, the codebase/pack layout, the
production pack module(s) and their release classification (DESIGN-55 §12), and
the acceptance anchor used by all later content/support checks.

## Notes

- Domain: `README.md` and `.ai/ENGINEERING-CONTRACT.md` are canonical. `DESIGN-55`
  (§11 era bands, §12 classification, §15 scenario manifest, §17 full-support
  predicate, §18 capability closure, §19 era coverage matrix, §20 coverage,
  §21 auto-resolution, §22 packaged smoke) is the completion definition.
- Canonical scenario and timeline contracts: `DESIGN-03` (§1 five scenarios,
  §2 sim ends Dec 1970) and `DESIGN-01` (§1 scope, §3 long-form ≥120 months,
  §9 start-readiness gates).
- Skills: `/research` for any external grounding (real nations, hulls, timelines);
  `/domain-modeling` to keep the content map / pack taxonomy consistent.
- Governance: every authored content feature must declare exactly one release
  classification (DESIGN-55 §12); fixtures stay non-production (plan "Fixtures ≠
  production"). Production pack is separate and validated.
- Anchor rule (plan): pick and lock ONE primary `FULLY_SUPPORTED` scenario here;
  later content/support checks refer to it.
- Deliverable: `.ai/briefs/<slug>.md` (content charter) + a content map, per the
  milestone-brief template; plus this wayfinder map and numbered tickets.

## Decisions so far

- [01-primary-scenario-era-bands](issues/01-primary-scenario-era-bands.md) — Primary scenario `scen_1880`, Jan 1880; reachable era bands all five (EARLY..LATE) because sim ends Dec 1970.
- [02-max-campaign-duration](issues/02-max-campaign-duration.md) — Maximum supported campaign duration 1092 completed months (Jan 1880–Dec 1970); no shorter canonical cap exists.
- [03-pack-layout](issues/03-pack-layout.md) — Top-level `content/production/<pack>/`, `type:"production"`, all files enumerated; zero compiler change; anchor at `content/production/1880/`.
- [04-content-map-classification](issues/04-content-map-classification.md) — Content map + DESIGN-55 §12 classification policy; CONTENT_ONLY_LOCKED until owning mechanic accepted.
- [05-content-charter-brief](issues/05-content-charter-brief.md) — Charter brief landed at `.ai/briefs/content-0-production-pack-charter.md`.

All tickets 01–05 resolved; the CONTENT-0 scoping sprint is landed (commit
`281f1ed`, "docs(content): land CONTENT-0 production content charter"). The
charter brief founders CONTENT-1 (landed via PR #2) and the C-track.

## Not yet specified

- Exact list of production nations/playable slots and their starting fleets
  (graduates into CONTENT-1; governed by the locked scen_1880 + all-bands reach).
- Concrete pack YAML file set per collection, with per-feature release
  classifications and reachability proof — CONTENT-1.
- ScenarioSupportManifest / era-coverage-matrix / release-validation
  materialization — REL-1, not authored by content sprints.

## Out of scope

- Authoring actual game content YAML (CONTENT-1+).
- Implementing any new mechanic (Track A/B/C/D/E).
- The A-3/B10c decision request (separately blocked, unrelated to content).
- Full `ScenarioSupportManifest`, era-coverage matrix, and release-validation
  materialization (built at REL-1).
