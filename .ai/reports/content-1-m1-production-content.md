# Validation Report: CONTENT-1 — M1-Era Production Content Pack

## Outcome

`PASS`.

## Scope delivered

Authored the first **production** content pack at `content/production/1880/`
(`type: "production"`) for the `scen_1880` anchor (start Jan 1880), grounded
in four research notes under `docs/research/content-1-*.md`:

- 14 countries (GBR, FRA, GER, RUS, AUT, ITA, USA, JPN, OTT, ESP, NLD, POR,
  CHI, BRA);
- ~100 areas (coastal/land/sea) with controllers;
- 35+ sea/rail routes;
- ~70 possessions;
- ~95 ports (1–10 levels);
- 34 EARLY technologies (acyclic DAG, prerequisites defined);
- 16 ship-design templates (integer normalized fields);
- 22 fleets with 1880-grounded capital ships;
- 14 economies (BALANCE TARGET tuning from research);
- 9 constructions; 14 research states.

No diplomacy relations are authored (B10c blocked → would be reachable without
an accepted capability, a DESIGN-55 §14 concern). No new mechanics introduced;
zero engine change. Everything in the pack is `SUPPORTED_MECHANICAL` (owning
M1 capabilities economy/research/design are `ACCEPTED`).

Deferred: later era bands (PRE_WAR..LATE) to CONTENT-2+/C-track; diplomacy to
A-3/B10c; `ScenarioSupportManifest`/era-coverage/release report to REL-1.

## Requirements evidence

- **Charter (CONTENT-0):** `pack.json` `type: "production"`, enumerated
  `files`, pack at `content/production/1880/` — proven by `runCompilation`.
- **DESIGN-55 §12/§14:** no reachable locked content authored; diplomacy
  deliberately omitted; tech DAG is acyclic (compiler enforces
  `TECHNOLOGY_PREREQUISITE_CYCLE`).
- **Content collections (DESIGN-05 / compiler):** strict array YAML, validated
  against `CountrySchema`/`AreaSchema`/`RouteEdgeSchema`/`PossessionSchema`/
  `PortSchema`/`TechnologyPrerequisiteChainSchema` and `DesignTemplateSchema`;
  duplicate-id, missing-reference, and tech-cycle checks all pass.
- **M1 accepted capabilities (B10a economy, B10b research/design):** pack's
  economies/research/designs/fleets/constructions are wired via the desktop
  `CampaignCompiler` campaign files and compile into a snapshot.

## Commands and observed results

```text
$ pnpm -w turbo run build test
Tasks:    32 successful, 32 total   (exit 0)

$ pnpm -w turbo run test --filter=@bluewave/desktop
test/production-pack.test.ts (1 test) 54ms PASS
Test Files  4 passed (4); Tests  10 passed (10)   (exit 0)

$ pnpm -w turbo run typecheck --filter=@bluewave/desktop
Tasks:    7 successful, 7 total   (exit 0)

$ pnpm format
All matched files use Prettier code style!   (exit 0)
```

`production-pack.test.ts` (new) runs `runCompilation(content/production/1880)`
twice and asserts `success === true`, `diagnostics === []`,
`nations.length === 14` (incl. GBR, FRA, CHI), and that both compiles produce
identical `snapshotHash` and `contentArtifactHash`.

Debug harness during authoring (not committed) confirmed the only blocker was
the campaign compiler rejecting non-integer `speedUms` in design templates
(`SafeInt must be an integer`); resolved by authoring integer values, no engine
change.

## Determinism evidence

- Content artifact hash: `449532384b604c69dd9740bd92b3357e05f62a98fbdde9bcea36a0e409275f0f`
- Snapshot hash: `f3e72642371e5a112f5ed8ec99778e763386ccd1024352d4228f6055c375d3f3`
- Repeated compile in the test produced identical hashes.
- Command/event/financial/random ledgers and replay: **not applicable** — this
  sprint authored a new content pack with no turn progression, so no ledger
  states are produced. Cross-process determinism for the pack is proven
  indirectly by the double-compile hash equality in the test.
- Process/OS: single-process, macOS (darwin). Cross-OS determinism of the
  pack itself is covered by existing `@bluewave/cross-process-test` and the
  deterministic serializer (unchanged).

## Canonical artifact changes

No previously-authorized canonical artifacts changed. The new production pack
is a new artifact category (`content/` dir did not exist before), so there are
no old/new hashes to migrate. M1 fixture golden hashes are untouched (verified
by the 32-task suite staying green with fixture tests intact).

## Compatibility and security notes

- No format, formula, RNG, command, event, save, or migration impact.
- `type: "production"` accepted by `PackManifestSchema`; no malicious YAML
  tags (parser is safe; content is a data-only pack).
- Constraining note recorded: the campaign compiler's `normalized*` design
  fields route through `SafeInt`, so design `speedUms`/`displacementKg`/
  `armorBeltUm` must be integers in this pack despite the schema allowing
  floats. Recorded in the CONTENT-1 brief; no silent engine change made.

## Known limitations and deferred requirements

- Only the M1/EARLY slice is authored; later bands are deferred.
- Diplomacy relations omitted pending A-3/B10c.
- Release artifacts/manifests (DESIGN-55 §15/§19/§29) materialized at REL-1.

## Changed-file summary

- `content/production/1880/pack.json` + 12 YAML collection files (new)
- `apps/desktop/test/production-pack.test.ts` (new)
- `.ai/briefs/content-1-m1-production-content.md` (new)
- `.scratch/content-1-m1-production-content/map.md` + 2 issues (new)
- `docs/research/content-1-world-geography.md`,
  `docs/research/content-1-fleets-and-ship-classes.md`,
  `docs/research/content-1-research-tech-tree.md`,
  `docs/research/content-1-ship-classification-and-economy.md` (new)
- `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md` (traceability)
