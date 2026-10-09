# Validation Report: campaign-command-screen IMP-03 (right nation rail)

## Outcome

`PASS`.

## Scope delivered

Completes the final open ticket of `.scratch/campaign-command-screen`
(CC-5): the right nation rail lists the player first then every known power with
its relation in words and war score while at war (from the read-only
`inspectDiplomacyScreen` projection); selecting a row shows relation detail
inline; deferred intel/almanac items collapse into one "Not yet modelled"
disclosure; "All relations" navigates to the Diplomacy & War screen.

This increment finished national-flag coverage for the rail: the 1880 pack's four
non-playable powers (`ottoman_empire`, `netherlands`, `portugal`, `brazil`) were
missing flag art and now resolve, so all 14 powers render a flag. Flag art for
nine further powers not in the 1880 pack (`belgium`, `denmark`, `greece`,
`chile`, `argentina`, `siam`, `korea`, `egypt`, `sweden_norway`) is also in the
manifest for later scenarios.

It also repaired pre-existing format drift in files committed by the two
`commit all` commits on `dev` (`AppFrame.tsx`, `NationRail.test.tsx`) that had
bypassed the format gate.

Deferred (unchanged from ticket 07): intel bars/level/reports and Almanac — the
engine has an empty `IntelligenceState`; no placeholder bars. No nation drawer
exists and the Diplomacy screen takes no nation parameter, so selection shows
detail inline (recorded in the component header).

## Requirements evidence

| Requirement                    | Implementation                              | Proving test                                          |
| ------------------------------ | ------------------------------------------- | ----------------------------------------------------- |
| CC-5 relations + war score     | `NationRail.tsx`, `nation-rail-state.ts`    | `NationRail.test.tsx` — "lists the player first…"     |
| CC-5 inline relation detail    | `NationRail.tsx` detail block               | "selects a nation and shows its detail inline"        |
| CC-5 deferred intel items      | `DEFERRED_NATION_RAIL_ITEMS` + disclosure   | "collapses deferred intel items…"                     |
| CC-5 All relations link        | `onNavigate("diplomacy")`                   | "All relations opens Diplomacy & War"                 |
| CC-5 flag coverage (14 powers) | `nationAssetManifest.ts`, `FLAG_COUNTRY_ID` | "renders flag art for every 1880 power, player first" |

## Commands and observed results

```text
node scripts/preflight.cjs
ok (no in-progress git operation, no conflict markers in tracked files)

pnpm --filter @bluewave/desktop exec tsc -b
exit 0 (clean)

pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/overview/NationRail.test.tsx
6 tests passed (1 file)

pnpm format
All matched files use the correct format.

pnpm lint
0 warnings and 0 errors (1584 files, 112 rules)
```

## Determinism evidence

Renderer-only change; no authoritative packages or artifacts touched. Golden
hashes and cross-process determinism are unchanged by construction; re-verified
in the sprint validation gate.

## Canonical artifact changes

None.

## Tests added

`NationRail.test.tsx`: a render test asserting a full 14-power rail produces 14
flag images (guards the manifest entries and the campaign-id→country-id map).

## Security and cancellation

No trust boundary, IPC, filesystem, or async change. `resolveNationAsset` is
pure; no ambient inputs.

## ADRs and dependencies

None. No new dependency.

## Known limitations and deferred requirements

Intel/almanac remain deferred (no engine state). Flag art beyond the 1880 pack is
present but unreachable until a scenario uses those powers.

## Changed files

- `apps/desktop/src/renderer/content/nationAssetManifest.ts` — 13 flag entries.
- `apps/desktop/src/renderer/screens/overview/NationRail.tsx` — campaign-id map.
- `apps/desktop/src/renderer/screens/overview/NationRail.test.tsx` — guard test + format.
- `apps/desktop/src/renderer/shell/AppFrame.tsx` — format only.
- `apps/desktop/src/renderer/assets/flags/*.png` — 13 new flag assets.

## Git and remote status

- Branch: `dev`
- Commits: see sprint report (IMP-03 increment).
- Working tree: clean after the increment.
- Push status: not pushed (local `dev` ahead of `origin/dev`).
- Pull request: none.
- Merge performed: no.

## Secondary consistency check

Re-ran `pnpm format` after `format:fix`; the focused test passed on a second run;
PNG assets verified as valid PNG via `file`.
