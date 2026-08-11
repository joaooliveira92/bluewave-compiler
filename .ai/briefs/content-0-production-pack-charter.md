# Milestone CONTENT-0 — Production Content Strategy + Pack Charter

## Objective

Lock the production content architecture for the first `FULLY_SUPPORTED`
Bluewave scenario so that every later content sprint (CONTENT-1+ and the
C-track) authors against a single, validated plan. By the end of this sprint
we have: a locked primary scenario with start date and reachable era bands; a
declared maximum supported campaign duration; a production pack layout and
module placement; the required content map and DESIGN-55 §12 classification
policy; and a content charter brief that founders all later content work.

## Canonical requirements

- DESIGN-01 §1 (simulation scope 1880–Dec 1970; long-form ≥120 turns; MAY span
  eras); §9 (start-readiness gates).
- DESIGN-03 §1–§2 (five canonical scenarios, all starting January; sim ends Dec
  1970, `SIMULATION_END_REACHED`).
- DESIGN-05 (content pack model; provenance labels; missing-content policy).
- DESIGN-55 §11 (era bands), §12 (content classification), §13 (later-era gate),
  §14 (unsupported isolation), §15 (scenario manifest), §17 (full-support
  predicate), §20 (coverage and provable unreachability).
- ENGINEERING-CONTRACT "Content" and "Persistence/compatibility" sections.
- Requirement index: `.ai/REQUIREMENTS.md`.

## Starting state

Verified (2026-08-11): 32 turbo tasks green; golden determinism hashes stable;
M1 strategic staples accepted (economy/research/design/construction, commits
`334ad70`…`80d57bc`). No on-disk content pack exists; all fixtures are inline
temp files. CLI default content dir is `content/`; desktop compiler is the only
path that wires campaign-side collections. A-3 (B10c) is separately blocked on
a decision request (unrelated to content).

## In scope

- Decide and lock the primary `FULLY_SUPPORTED` scenario: **`scen_1880`**,
  start January 1880.
- Declare reachable era bands: **all five** (`EARLY`, `PRE_WAR`, `INTERWAR`,
  `MID_CENTURY`, `LATE`), because the simulation ends at Dec 1970.
- Declare maximum supported campaign duration: **1092 completed months**
  (Jan 1880–Dec 1970).
- Decide production pack layout: **top-level `content/production/<pack>/`**,
  `pack.json` with `type: "production"`, all collection YAML enumerated in
  `manifest.files`. Anchor pack at `content/production/1880/`.
- Produce the **content map** (required collections across reachable bands) and
  the **classification policy** (DESIGN-55 §12), with `CONTENT_ONLY_LOCKED`
  → `SUPPORTED_MECHANICAL` promotion rule tied to mechanic acceptance.
- Land this charter brief + the wayfinder map
  (`.scratch/content-0-production-pack/`) with resolved decision tickets and
  research notes (`docs/research/content-0-*.md`).

## Out of scope

- Authoring actual game content YAML (that is CONTENT-1+).
- Implementing any new mechanic (Track A/B/C/D/E owns mechanics).
- Resolving the A-3/B10c decision request (separately blocked).
- Materializing the `ScenarioSupportManifest`, era-coverage matrix, or release
  validation report (built at REL-1).

## Required implementation

This is a scoping/strategy sprint; its artifact is the charter (this brief) plus
the decision map and research notes, not engine code.

- **Public de-facto contracts fixed:** scenario ID `scen_1880`; reachable bands
  all five; max duration 1092 months; pack root `content/production/1880/`;
  `pack.json` `type: "production"`.
- **Classification policy:** every authored feature carries exactly one
  DESIGN-55 §12 classification. `SUPPORTED_MECHANICAL` requires an accepted
  owning capability; otherwise `CONTENT_ONLY_LOCKED` with provable
  unreachability (§14 traversal; `UNSUPPORTED_CONTENT_REACHABLE` on any
  reachable locked item). Promotion to `SUPPORTED_MECHANICAL` happens only
  when the governing capability lands (plan's promotion rule).
- **No engine changes required** for the chosen layout (verified against the
  compiler's `--content-dir`/`files` model and desktop's `<dir>/pack.json`).

## Acceptance tests

- The charter brief exists at `.ai/briefs/content-0-production-pack-charter.md`
  and cites the five scenario/era/duration/pack/classification decisions with
  canonical sources.
- The wayfinder map at `.scratch/content-0-production-pack/` has a `map.md`
  plus resolved issue tickets `01`–`05`, and research notes under
  `docs/research/content-0-*.md` citing file:line sources.
- Every era-band reach claim is reproducible from canonical calendar math
  (1892/1092-month span → all five bands).
- The pack-layout decision is consistent with the compiler as written (zero
  engine change); a follow-on compile smoke of a minimal production pack is
  deferred to CONTENT-1.

## Determinism proof

- No engine code or authoritative data authored in this sprint; no golden hash
  changes. The decisions are content-planning only.

## Compatibility and versions

- No format, formula, RNG, command, event, save, or migration impact from this
  scoping sprint.
- Future production packs declare `type: "production"` and pin content/ruleset
  versions per ENGINEERING-CONTRACT; scenario long-form ≥120 turns is
  satisfied (1092 months).

## Performance observations

- None; no engine/data produced.

## Stop conditions

In addition to permanent agent rules:

- If the canonical scenario/era/duration set conflicted with a chosen reachable
  band at REL-1, the charter must be revisited via a decision request (not
  silently changed).
- If a classification of authored content could become reachable without an
  accepted owning capability, stop and require the §14 reachability proof
  before release.

## Required delivery

- Charter brief (this file), wayfinder map + tickets, research notes;
- traceability update (SPRINT-PLAN, PROGRESS);
- Conventional Commits; no self-merge.
