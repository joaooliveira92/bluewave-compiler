# National content completeness report (all fourteen scenario nations)

Validated by `validateAllNations` (`@bluewave/ship-design/test/nationCompleteness.test.ts`) at release:
all fourteen nations in `countries.yaml` return **zero issues**, and `productionNationCoverage.test.ts`
asserts every scenario nation has a profile. Reference designs are classified in the test's classification
map. See ADR-0108/ADR-0110 (coverage), ADR-0109 (one file per nation) and ADR-0092 (the pipeline).

## Completeness (per nation)

Every nation below passes every check: a resolvable opening profile (1880-01), complete hard/doctrine
sections, valid component references and ordered variant dates, non-overlapping date bands, six legal
classified starters (B/CA/CL/DD/KE/AMC) that are their own type and fit a dock and the standard budget, a
viable procurement path per role group, and no release placeholder.

| Nation | Playable | Profile | Starters (B/CA/CL/DD/KE/AMC) |
| --- | --- | --- | --- |
| uk | yes | full | alexandra_1877 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| france | yes | full | redoutable_1878 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| germany | yes | full | sachsen_1878 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| usa | yes | full | six DOCTRINE_TEMPLATEs |
| japan | yes | full | six DOCTRINE_TEMPLATEs |
| italy | yes | full | six DOCTRINE_TEMPLATEs |
| russia | yes | full | six DOCTRINE_TEMPLATEs |
| austria_hungary | yes | full | six DOCTRINE_TEMPLATEs |
| spain | yes | full | six DOCTRINE_TEMPLATEs |
| qing | yes | full | six DOCTRINE_TEMPLATEs |
| ottoman_empire | no | full | six DOCTRINE_TEMPLATEs |
| netherlands | no | full | six DOCTRINE_TEMPLATEs |
| portugal | no | full | six DOCTRINE_TEMPLATEs |
| brazil | no | full | six DOCTRINE_TEMPLATEs |

The eleven nations beyond the original UK/France/Germany slices use doctrine-template starters cloned from
the shared 1880 templates; their national identity is carried by the profile (posture, doctrine, industrial
multipliers, gun and component variants, procurement shares, naming). Historical-reconstruction starters are
deferred (ADR-0108/ADR-0110).

## Provenance summary

- **VERIFIED / DERIVED:** uk/france component-variant gun values (navweaps / *Text Book of Gunnery* relayed),
  White 1894 hull fractions, the shared component catalogue and plants, and the 1880 in-service ship figures
  in `docs/research/ship-building-1880-ships-by-nation.md`.
- **ESTIMATE:** the eleven new profiles' strategic shape, doctrine range, and hull/design shapes; most
  imported-gun shell masses; the 1880 completion dates and industrial direction.
- **BALANCE_TARGET:** all industrial multipliers, displacement ceilings, design weights, procurement
  shares, engagement range, research priorities, and the eleven new nations' component-access statuses.

## Per-nation research notes

`docs/research/{usa,japan,italy,russia,austria_hungary,spain,qing,ottoman_empire,netherlands,portugal,brazil}-naval-profile.md`,
plus the earlier `national-naval-profiles-uk-france.md` and `national-naval-profiles-germany.md`. Wikipedia is
not a source anywhere; navypedia.org class pages (built on Conway's *1860–1905*) and Brassey's *Naval Annual
1886* are the principal sources.

## Remaining low-confidence values (deferred, not fabricated)

- Nation-specific heavy-gun *families* the shared catalogue lacks: the Italian 450 mm (100-ton), the Spanish
  320 mm Hontoria, the Qing 30.5 cm Krupp, the Ottoman 229 mm Armstrong, the Dutch 283 mm Krupp, the
  Brazilian Whitworth 300-pdr and the Portuguese 121 mm Armstrong. These are overlaid on the nearest shared
  family and labelled ESTIMATE.
- Sourced shell masses for most non-British guns (only the German 26 cm and Austro-Hungarian 26/28 cm are
  grounded); a print ordnance table would upgrade these.
- Moulded depths (UNVERIFIED for every 1880 hull), per-nation dock/throughput and budget sources.
- The eleven new nations' starters are `DOCTRINE_TEMPLATE`; upgrading them to `HISTORICAL_RECONSTRUCTION`
  needs per-nation design sourcing.
