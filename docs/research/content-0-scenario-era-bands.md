# Research: Content Sprint 0 — Scenario Identifiers & Era Bands

AFK research into the repo's canonical sources. Research-only; no files modified.

## Findings

### 1. Canonical scenario identifiers, start dates, and simulation end (DESIGN-03)

`docs/rules/campaign-configuration.md` §1 (Supported Start Scenarios) lists exactly five canonical
identifiers and mandates they start in January of their identifier year:

- `scen_1880` → January 1880
- `scen_1900` → January 1900
- `scen_1920` → January 1920
- `scen_1935` → January 1935
- `scen_1960` → January 1960

Each scenario definition MUST carry: `scenarioId`, `startYear`, `startMonth`, `endYear`, `endMonth`,
`scenarioContentHash`, `participationManifestId`, `continuityManifestId`, and the supported
setting-id lists (fleet size, research speed, tech variation, budget, legacy fleet, tactical realism,
difficulty).

§2 (Simulation Timeline): the strategic turn is exactly one calendar month; the first turn begins at
the scenario's declared `startYear`/`startMonth`; the **canonical simulation end is the completion of
December 1970** — a campaign reaching it must complete every December-1970 phase, emit a
`MonthClosingSnapshot`, run terminal and career evaluation, and reject advancement to January 1971
with `SIMULATION_END_REACHED`. An earlier explicit terminal condition defined by DESIGN-02 MAY end the
campaign before December 1970.

### 2. Era bands, full-support predicate, unreachable families (DESIGN-55)

`docs/delivery/release-scope-and-implementation-order.md` §11 (Canonical Era Bands):

- `EARLY`: January 1880 through December 1899
- `PRE_WAR`: January 1900 through December 1919
- `INTERWAR`: January 1920 through December 1939
- `MID_CENTURY`: January 1940 through December 1959
- `LATE`: January 1960 through December 1970

A scenario MUST declare every era band it can reach "through its supported start date, maximum
campaign duration, technology progression, events, continuities, and migrations." The expected era is
NOT inferred only from the start date.

§17 (Full Scenario Support Predicate) — conjunctive; among the requirements **every reachable era band
has complete required strategic and tactical coverage**. "Passing most required systems is
insufficient."

§20 (Strategic and Tactical Coverage): "A system family that is unreachable by the scenario does not
block support, but its unreachability MUST be proved by content and scenario validation."

### 3. Simulation scope and long-form (DESIGN-01)

`docs/vision/game-vision.md` §1 (Product Definition): Bluewave covers **1880 through December 1970**.
A campaign advances in one-month strategic turns, **MAY span multiple technological eras supported by
its selected start scenario**, and continues until an explicit terminal condition is reached.
**`long-form` = the campaign model supports at least 120 strategic turns after any supported start
date**, except when an explicit terminal condition ends it earlier (a minimum/floor, not a cap).

> Note: the "span multiple technological eras" statement lives in §1 (line 14), not §3. §3 (Campaign
> Scope) enumerates the system domains and ties delivery/scenario-support claims to DESIGN-55.

### 4. Does a canonical whole-campaign maximum duration exist?

**No standalone numeric whole-campaign maximum-duration constant exists in the canonical docs.**

- The effective upper bound is the simulation end: December 1970 per DESIGN-03 §2.
- DESIGN-55 §15 requires each scenario's `ScenarioSupportManifest` to declare a
  `maximum supported campaign duration` field, but **assigns no numeric value** — it is
  per-scenario content to be provided.
- The only numeric duration tied to the whole campaign is the **120-turn `long-form` floor**
  (DESIGN-01 §1) — a minimum, not a maximum.
- The 120-month figure in `war-and-peace.md:461` is the **war** duration, not the campaign duration.

### 5. Calendar math from Jan 1880

Era-band calendar spans: EARLY 1880–1899, PRE_WAR 1900–1919, INTERWAR 1920–1939,
MID_CENTURY 1940–1959, LATE 1960–1970.

(a) Start Jan 1880 → run to Dec 1970 (simulation end): 91 years = **1092 strategic turns**.
    Touches all five bands: EARLY (240 mo), PRE_WAR (240), INTERWAR (240), MID_CENTURY (240),
    LATE (132). Reaches **all five era bands**.

(b) Start Jan 1880 → exactly 120 months (long-form floor): 10 years, ending **December 1889**
    (Jan 1880 + 119 months). Entirely inside EARLY; reaches **only `EARLY`**.

### 6. Content-schema manifest type + CLI default content dir

- `packages/content-schema/src/manifest.ts:6` — `PackManifestSchema.type` =
  `z.enum(["production", "fixture", "mod"])`.
- `apps/compiler-cli/src/main.ts:136` — default content directory = `content/`
  (also documented in USAGE at main.ts:40).

## Sources

- `docs/rules/campaign-configuration.md` (DESIGN-03) §1: lines 7–43; §2: lines 45–59
- `docs/delivery/release-scope-and-implementation-order.md` (DESIGN-55) §11: lines 170–182;
  §17: lines 274–289; §20: lines 335–353; §15 (max duration field): lines 237–254
- `docs/vision/game-vision.md` (DESIGN-01) §1: lines 9–19 (notes: 1880–Dec1970 line 9;
  multiple eras line 14; long-form line 19); §3: lines 31–48
- `docs/domain/player-identity-and-continuity.md` (DESIGN-02) §8 terminal conditions: lines 297–352
  (Dec-1970 bound at line 344)
- `docs/rules/war-and-peace.md:461` (war-specific 120-month max — excluded, informational)
- `packages/content-schema/src/manifest.ts:6`
- `apps/compiler-cli/src/main.ts:136` (and :40)

## Key conclusions

1. Five canonical scenarios: `scen_1880/1900/1920/1935/1960`, each starting in January of its year;
   the simulation always ends at completion of December 1970 (`SIMULATION_END_REACHED` blocks Jan 1971).
2. Five era bands: `EARLY PRE_WAR INTERWAR MID_CENTURY LATE` with exact 1880–1970 calendar boundaries.
3. Full support (DESIGN-55 §17) demands complete strategic+tactical coverage of **every reachable** era
   band; unreachable system families are fine only if their unreachability is **proved** (§20).
4. **No single numeric whole-campaign max duration exists.** Effective max = Dec-1970 simulation end;
   per-scenario `maximum supported campaign duration` must be declared but has no shipped value; the
   only whole-campaign duration number is the 120-turn `long-form` **floor**.
5. Jan-1880→Dec-1970 reaches all five bands (1092 months); Jan-1880 running exactly 120 months ends
   Dec-1889 and reaches only `EARLY`.
6. Pack `type` enum = `production | fixture | mod`; CLI default content dir = `content/`.
