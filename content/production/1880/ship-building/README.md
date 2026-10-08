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

## Placeholders (no source; replace before release)
Mount masses, magazine/fitting data, costs, part-load fuel curves, plant volumes and reliability, zone shares, stability windows,
crew per tonne, all cost/construction/CVE/refit/AI constants. Each is marked `PLACEHOLDER` or `ESTIMATE` in the files or in `balance.yaml`'s header.
