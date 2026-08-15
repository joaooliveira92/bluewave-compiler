# Validation Report: CONTENT-3 IMPL — INTERWAR Tech & Ship-Design Continuation (scen_1880)

## Outcome

`PASS`.

## Scope delivered

Authored the INTERWAR-band (Jan 1920 – Dec 1939) slice of `content/production/1880/`
into `content/production/1880/{technologies,designs}.yaml`, continuing the
EARLY→PRE_WAR DAG, with **zero engine change** (content-only; pack `0.2.0`→`0.3.0`):

- **+24 INTERWAR research techs** across 10 supported fields (GUNNERY, MACHINERY,
  HULL_CONSTRUCTION, SHIP_DESIGN, FIRE_CONTROL, TORPEDOES, MINES_AND_ASW,
  SUBMARINES, INFRASTRUCTURE, DAMAGE_CONTROL), acyclic, all prerequisites within
  the prior authored sets (no cross-era forward refs, no
  `TECHNOLOGY_PREREQUISITE_CYCLE`).
- **+10 real-class design templates**: Nelson (UK 1927), King George V (UK 1937),
  North Carolina (USA 1937), Yamato (JPN 1937), Bismarck (GER 1936), Scharnhorst
  (GER 1935), Littorio (ITA 1934), Richelieu (FRA 1935), Nagato (JPN 1920),
  Myōkō (JPN 1929) — per the locked scoping brief and research note.
- Every authored item `SUPPORTED_MECHANICAL` (owning Research/Design mechanics
  `ACCEPTED`, M1 COMPLETED). **No `CONTENT_ONLY_LOCKED` item authored** (no
  reachable-locked content, §14). No AVIATION/CARRIER/RADAR/MISSILES/AMPHIBIOUS
  techs (M4/M5 deferred families untouched).

## Requirements evidence

- DESIGN-20/21 reachability: verified acyclic DAG, all prereqs resolve, zero
  compiler diagnostics.
- DESIGN-55 §12/§14: all new items `SUPPORTED_MECHANICAL`, none rendering
  unsupported-family content reachable.
- Production-pack test (`apps/desktop/test/production-pack.test.ts`) PASS —
  compiles through the desktop `runCompilation` path with `success:true`,
  `diagnostics:[]`, nation count 14, and determinism (two compiles, identical
  hashes).

## Commands and observed results

```text
pnpm -w turbo run build --force
> 17 successful, 17 total (clean, uncached)

pnpm exec vp test run apps/desktop/test/production-pack.test.ts
> 1 file / 1 test passed (success:true, diagnostics:[], deterministic)

CampaignCompiler direct probe (content/production/1880)
> errors:false [], contentHash 190fa7a9…, rawHash 2ae3e505…

YAML structural probe
> total techs 84 (EARLY 35, PRE_WAR 25, INTERWAR 24); designs 37 (INTERWAR 10)
> missing prereqs: []  |  cross-era forward refs: []

pnpm exec vp test run
> Test Files 1 failed | 40 passed (41);  Tests 410 passed (410)
> failure = pre-existing content-schema/test/nation.test.ts (broken import)

node scripts/verify-golden-hashes.cjs
> All 8 hashes match golden reference

node packages/cross-process-test/dist/run-child.js (twice)
> two runs byte-identical
```

## Determinism evidence

- Two independent compiles of the pack → identical `contentArtifactHash` and
  `snapshotHash` (asserted by the production-pack test and re-run in the probe).
- Cross-process child runs byte-identical.
- `golden/hashes.json` **unchanged** (8/8): the golden fixture is a separate
  3-nation test pack; content-only production additions do not affect it.

## Canonical artifact changes

| Artifact            | Old → New                 | Cause                                                  | Migration           |
| ------------------- | ------------------------- | ------------------------------------------------------ | ------------------- |
| contentArtifactHash | `c3be5604…` → `190fa7a9…` | 24 INTERWAR techs + 10 designs added; pack 0.2.0→0.3.0 | none (content-only) |
| snapshotHash        | `cb1f1497…` → `2ae3e505…` | same compilation change                                | none                |
| golden/hashes.json  | unchanged                 | separate fixture                                       | —                   |

No format / formula / RNG / command / event / save schema change.

## Tests added

None (content-only sprint; the existing production-pack test locks the compile).

## Security and cancellation

No new code paths. Content parsed through the strict YAML parser + Zod boundary
schemas (no executable tags); unreachable-locked content is not authored.

## Performance observations

None measured (content-only; pack still small; no wall-clock data authoritative).

## ADRs and dependencies

No new ADR, no dependency. Deployment (DESIGN-25) and blockades remain deferred
(mechanics-gated) per ADR-0011 / B10c.

## Known limitations and deferred requirements

- Per scoping: AVIATION, CARRIER_OPERATIONS, RADAR_AND_ELECTRONICS, MISSILES,
  AMPHIBIOUS_OPERATIONS INTERWAR content remain deferred to M4/M5/$ (DESIGN-55
  §14); deployment (DESIGN-25) deferred.
- Production-pack smoke suite / scenario support manifest / era-coverage matrix
  are REL-1 scope, not this sprint.

## Changed files

- `content/production/1880/technologies.yaml` (+24 INTERWAR techs)
- `content/production/1880/designs.yaml` (+10 INTERWAR designs)
- `content/production/1880/pack.json` (0.2.0 → 0.3.0)
- `docs/PROGRESS.md`, `.ai/SPRINT-PLAN.md` (traceability)

## Git and remote status

- Branch: `dev`
- Commit: CONTENT-3 IMPL commit
- Working tree: clean after commit
- Push status: pushed to `origin/dev`
- Pull request: none (dev is the deliver branch)
- Merge performed: `no`

## Secondary consistency check

Independent uncached rebuild (17/17); production-pack test re-run straight from
the desktop path; YAML structural probe independently re-verified tech/design
counts, prereq resolution, and acyclic ordering; full suite 410 pass; golden 8/8;
child run byte-compared — all correlated with observed outputs, not trusted from
the worker-side summary.
