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
| usa | yes | full | canonicus_1879 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| japan | yes | full | six DOCTRINE_TEMPLATEs |
| italy | yes | full | principe_amedeo_1874 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| russia | yes | full | petr_velikiy_1876 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| austria_hungary | yes | full | six DOCTRINE_TEMPLATEs |
| spain | yes | full | six DOCTRINE_TEMPLATEs |
| qing | yes | full | six DOCTRINE_TEMPLATEs |
| ottoman_empire | no | full | mesudiye_1875 (B, HISTORICAL_RECONSTRUCTION) + five shared templates |
| netherlands | no | full | six DOCTRINE_TEMPLATEs |
| portugal | no | full | six DOCTRINE_TEMPLATEs |
| brazil | no | full | six DOCTRINE_TEMPLATEs |

The eight remaining nations beyond the original UK/France/Germany slices, plus the
cruiser-through-auxiliary starters of every nation, use doctrine-template starters
cloned from the shared 1880 templates; their national identity is carried by the
profile (posture, doctrine, industrial multipliers, gun and component variants,
procurement shares, naming). Italy, Russia and the Ottoman Empire begin with a
`HISTORICAL_RECONSTRUCTION` capital ship promoted from their canonical reference
design (ADR-0111); the United States begins with the coast-defence monitor
*Canonicus* (ADR-0117), admitted by the 1880 per-scenario classification ruleset
(ADR-0116). The remaining candidates (Matador, Vasco da Gama, Sete de Setembro,
Fusō, Numancia/Vitoria, Wei Yuen, Kaiser Max) stay on their `DOCTRINE_TEMPLATE`
design because the shared catalogue does not yet model their ordnance (ADR-0117
lists each); Wei Yuen (belt 0) cannot be a B at all.

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
  family and labelled ESTIMATE. Adding them is recorded as deferred in ADR-0117; the classification blocker
  they used to share is now resolved by the 1880 ruleset (ADR-0116), so each remaining candidate is blocked
  only by its unmodelled ordnance.
- Sourced shell masses for most non-British guns (only the German 26 cm and Austro-Hungarian 26/28 cm are
  grounded); a print ordnance table would upgrade these.
- Moulded depths (UNVERIFIED for every 1880 hull), per-nation dock/throughput and budget sources.
- The remaining nations' starters are `DOCTRINE_TEMPLATE`; upgrading one to
  `HISTORICAL_RECONSTRUCTION` needs both a canonical design the classification
  ruleset admits (ADR-0116 admits the slow coast-defence ships) and ordnance the
  shared catalogue models. The US 15-in Dahlgren smoothbore is now a dedicated
  family (`gun_sb_15in_dahlgren`, ADR-0117); the Dutch 283 mm, Brazilian
  Whitworth 300-pdr, Japanese 235/173 mm, Spanish 254 mm 300-pdr,
  Austro-Hungarian 209 mm and Portuguese 149/67 mm Krupp guns are still unmodelled
  (see `docs/research/ship-building-1880-coast-defence-armament.md` for which
  figures are sourced).
- Per-nation `maxImportedGunCaliberUm` values (ADR-0114 split the mechanism from the domestic ceiling; no
  print source yet justifies a separate domestic figure for an 1880 nation, so none is authored).
