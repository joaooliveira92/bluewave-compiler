# Content Map: Production Pack (scen_1880 anchor)

The authoritative inventory that CONTENT-1+ fills for the primary production
pack `content/production/1880/`. Grounded in DESIGN-05 (content model) and the
compiler's collection model.

## Scenario anchor (locked in CONTENT-0)

- Scenario: `scen_1880`, start January 1880.
- Reachable era bands: `EARLY`, `PRE_WAR`, `INTERWAR`, `MID_CENTURY`, `LATE`
  (all five).
- Maximum supported campaign duration: 1092 completed months (Jan 1880–Dec
  1970).

## Pack layout

`content/production/1880/` with `pack.json` (`type: "production"`) enumerating
every collection file. Content collections (content-compiler): rulesets,
countries, areas, routes, possessions, ports, technologies. Campaign
collections (CampaignCompiler, desktop-wired today): fleets, economies,
constructions, diplomacy, research, designs.

## Required collections and coverage

| Collection                      | What it must contain for the anchor pack                                               | Classification rule                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| countries (nations/governments) | Real nations + governments for the reachable era; canonical playable slots (DESIGN-04) | SUPPORTED_MECHANICAL once an owning capability is accepted; CONTENT_ONLY_LOCKED until then |
| areas (world geography)         | Real world geographic areas within reach                                               | CONTENT_ONLY_LOCKED (no accepted owning capability yet)                                     |
| routes                          | Sea/rail/land adjacency routes                                                         | CONTENT_ONLY_LOCKED (no accepted owning capability yet)                                     |
| possessions                     | Territorial control per nation                                                         | CONTENT_ONLY_LOCKED (no accepted owning capability yet)                                     |
| ports                           | Ports and levels                                                                       | CONTENT_ONLY_LOCKED (no accepted owning capability yet)                                     |
| technologies                    | Tech tree across era bands (per-field, availability)                                   | SUPPORTED_MECHANICAL where M1 research accepted (HULL/MACHINERY/GUNNERY); CONTENT_ONLY_LOCKED where owning field unmet |
| designs                         | Ship design templates (real hulls/classes)                                             | SUPPORTED_MECHANICAL where M1 design accepted                                                                          |
| fleets                          | Historical starting fleets per nation                                                  | CONTENT_ONLY_LOCKED (no accepted owning capability yet)                                                                 |
| economies                       | Treasury/income/expenses per nation                                                    | SUPPORTED_MECHANICAL (M1 economy)                                                                                      |
| constructions                   | Dockyard projects / starting builds                                                    | SUPPORTED_MECHANICAL (M1 construction)                                                                                 |
| diplomacy                       | Initial relation pairs + tension                                                       | CONTENT_ONLY_LOCKED while B10c diplomatic state owner is pending (A-3 blocked)                                         |
| research                        | Initial per-nation research state                                                      | SUPPORTED_MECHANICAL (M1 research accepted)                                                                            |

## Classification promotion rule

Every authored feature declares exactly one DESIGN-55 §12 classification at
author time. `CONTENT_ONLY_LOCKED` items are authored when their governing
mechanic is not `ACCEPTED`; they are promoted to `SUPPORTED_MECHANICAL` only
when the owning capability lands, and must remain provably unreachable until
then (§13/§14). At CONTENT-0 the only accepted owning capabilities are the M1
strategic staples (economy/research/design/construction); M1-era content
scheduled for CONTENT-1 is therefore expected to be largely
`CONTENT_ONLY_LOCKED` except those staples, promoted as each mechanic lands.

## Unreachability proof (deferred to author time)

Per §14, any `CONTENT_ONLY_LOCKED` feature must pass automated reachability
traversal (technology graphs, starting state, AI pools, etc.) and fail release
with `UNSUPPORTED_CONTENT_REACHABLE` if reachable. Concrete proof is authored
with each CONTENT-1 item.
