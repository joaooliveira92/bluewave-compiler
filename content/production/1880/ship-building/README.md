# Ship-building content (EARLY band, 1880-1899)

Authored data for `@bluewave/ship-design` (spec: `.scratch/ship-building/spec.md`). Not yet listed in `pack.json`:
the content compiler does not load these files until SB-14 wires them, so the shipped 1880 pack and its goldens are unchanged.

| File | Contents |
|---|---|
| `components.yaml` | 15 weapons (13 guns and machine guns from 12-inch to .303 Maxim, 2 torpedo tubes), magazines, rangefinder and ship fittings |
| `plants.yaml` | 4 propulsion plants (compound, triple-expansion, water-tube, locomotive-boiler torpedo-boat plant) |
| `hull-forms.yaml` | 4 hull forms: torpedo boat, protected cruiser, coast-defence ship, pre-dreadnought battleship |
| `balance.yaml` | balance constants for hull, machinery, armour, cost, construction, CVE, refit, AI |

Source of record: `docs/research/ship-building-early-band.md` (confidence labels kept in comments).

## Sourced / fitted values
- Hull weight law `W = 9.9 * (L*B*D)^1.26 kg` and the per-form factors: fitted to White (1894) hull fractions for Majestic (38 %), Edgar (38 %), Siegfried (~31 %), Havock (~33 %).
- Admiralty coefficients per form (`cFormX100`): fitted to trial power of Royal Sovereign, Majestic, Edgar, Havock, Siegfried; `test/earlyBand.test.ts` checks all within 15 %.
- Gun, shell, charge, ROF: navweaps.com compilation of RN tables; armour factors: Britannica 1911 and Brassey 1902.

## Research pass 2 (docs/research/ship-building-early-band-2.md) applied
- Money is GBP with 1 GBP = 1,000,000 micro-units. Costs are calibrated to Brassey: a Havock-like destroyer prices at ~GBP 34.2k (sourced 34,254; machinery 18,674) and a Majestic-like battleship within 20 % of GBP 911k (sources exclude guns) (`test/references.test.ts`). Hull GBP 70/t of hull line, compound armour GBP 95/t, iron 50, heavy guns GBP 197/kg (200/long ton), machinery GBP 4.5-8 per ihp.
- Gun data: 6"/26 mass 5.08 t, 12"/35 charge 76 kg, sustained rates of fire (0.8 / 5 / 10 / 15 rds/min), QF charges, 6-inch mount 7.6 t, torpedoes per tube 3, Barr & Stroud rangefinder 1893.
- Ship data: Havock coal 61 t and crew 42, Majestic moulded depth 14.0 m (hull form refitted), rounds per gun 200 (6-inch) / 300 (12-pdr), stability windows widened to the sourced GM ranges.

## Pass 2 audit and armour availability (2026-10-09, tickets 25 and SB-2)
Each VERIFIED / SINGLE-SOURCE value in `docs/research/ship-building-early-band-2.md` ("Suggested catalogue values") was checked against the content:
- **Already applied:** gun masses, charges and rates of fire, 6-inch mount mass, 12-inch and secondary rounds per gun, torpedo mass and tubes per ship, torpedo gear cost, destroyer and battleship costs, armour and heavy-gun prices, bunker and crew figures of the reference designs, moulded depths, stability windows, rangefinder year.
- **Applied now:** bunker stowage (`bunkerLitreBpPerKg` 11148 = 40 ft3 per long ton Welsh coal; it was 1 L/kg, 10 % short); torpedo provenance labels (mass and length SINGLE-SOURCE, speed and range VERIFIED); armour material availability (`ship.armour.materialAvailability`: dates and technology ids from the tech tree, `hc_compound_armor` 1886, `hc_nickel_steel_armor` 1889, `hc_harvey_armor` 1892, `hc_krupp_cemented_armor` 1900, iron and mild steel open from 1880; compound obsolete advisory from 1889; no maximum plate thickness because no source gives one).
- **Not applicable (research marks them UNVERIFIED):** barbette/turret/shield masses of 12, 10 and 9.2-inch mounts, tube and carriage masses, magazine capacities per ship, British steel/Harvey/Krupp armour price per ton, Edgar and Speedy costs, QF gun unit prices, accommodation volume per man, Majestic/Edgar dynamo size, rangefinder mass. Applying a number here would be invention; they need a third research pass.
- **Not authored on purpose:** per-component `allowedZones`. No source constrains where a fitting may sit and a guess would invalidate legitimate designs; the zone-refusal code path is covered by pure tests only.

## Placeholders (no source; replace before release)
Heavy mount masses (12/10/9.2-inch), tube and carriage masses, magazine/fitting data, QF unit prices, rangefinder mass, part-load fuel curves, plant volumes and reliability, zone shares, stability windows,
crew per tonne, all cost/construction/CVE/refit/AI constants. Each is marked `PLACEHOLDER` or `ESTIMATE` in the files or in `balance.yaml`'s header.
