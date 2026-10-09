# 30: Replace the remaining unsourced content values (release gate)

**Type:** research + content
**Status:** open
**Blocked by:** none
**Frontier:** yes (but a release gate, not a feature)

Spec: `.scratch/ship-building/spec.md` section 24; research notes `docs/research/ship-building-early-band*.md`.

## Inventory (as of 2026-10-09; `packages/ship-design/test/placeholders.test.ts` pins these counts and can only go down)

| File | Markers | What is unsourced |
|---|---|---|
| `components.yaml` | 34 | Two heuristics repeated for every gun: internal **volume = 3 L per kg of gun+mount** and **deck footprint = 470 mm2 per kg**; magazine capacities and masses; ship's electrical plant, quarters, funnel, pumps, ventilation. |
| `plants.yaml` | 1 | Plant in-service years (compound 1880, triple expansion 1885, loco 1890, water-tube 1893): the 1882-86 first RN fit is UNVERIFIED. |
| `balance.yaml` | 2 | The yard throughput rate (700 work micro-units per tonne per month per line) and the header note that all other gameplay constants are unsourced. |
| `reference-designs.yaml` | 1 | Reference drafts pending research. |
| `hull-forms.yaml` | 0 | Done. |

## Decided, not placeholders

The revision constants (`revision:` in `balance.yaml`, ADR-0070) and the treasury unit (ADR-0074) are game-design constants with a recorded rationale and structural checks (`checkRevisionBalance`). They are tuned by play, not by sources.

## Work

1. Gun mount volume and deck footprint: find the barbette/turret/casemate footprints and internal volumes for the catalogued mounts (12/13.5/10/9.2/6 in, QF 4.7/12-pdr), replace the two heuristics with per-mount values or a sourced scaling by calibre, and lower the ceiling.
2. Magazine and general equipment masses/volumes: source or derive from the guns they serve (shell and charge volumes already exist per round).
3. Plant years: verify the first Royal Navy fit of triple expansion and locomotive boilers.
4. Yard throughput: calibrate against the historical build-time table (`ship-building-build-times.md`) already in the repo.

## Acceptance

Each replaced value cites its source in a comment and in a research note with a confidence label; the ratchet ceiling is lowered in the same change; the cost calibration tests still pass.
