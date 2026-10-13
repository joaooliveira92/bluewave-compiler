# Spec: Content-authoring hardening (`content-authoring-hardening`)

One-line purpose: turn the authored-YAML → compiled-artifact framework from
"production-grade at the value/mechanics layer" into a framework where the whole
authored surface is schema-validated, declared by one manifest, ordered
deterministically, carries machine-checked provenance, is pinned by a committed
content lock, and where the presentation data the player sees is sourced from the
same artifact instead of a duplicated hand-authored renderer corpus.

**Triage:** `ready-for-agent` — fully specified, ready for an AFK agent. In this
repo that means the sliced implementation tickets carry `Status: open`,
`Frontier: yes`, and a resolved/empty `Blocked by:` chain (see
`docs/agents/triage-labels.md`).
**Status:** sliced — 14 frontier-ordered implementation tickets at
`.scratch/content-authoring-hardening/issues/` (01 manifest authority · 02
codepoint ordering · 03 content lock + verify · 04–06 schema coverage · 07 decode
at boundary · 08 provenance · 09 placeholder gate · 10–13 presentation
expand–contract · 14 retire dead paths).
**Source of truth:** this spec. It is the follow-on to the *completed*
`.scratch/content-runtime-integrity/` effort (ADR-0122/0123/0124/0125); it
**extends, does not replace** those ADRs, ADR-0004 (compiler stages), ADR-0005
(strict content parsing), ADR-0092 (national content pipeline), ADR-0105
(content-schema Effect boundary), ADR-0106 (frozen-quality ratchets), ADR-0109
(ship-building content per nation), ADR-0111 (historical national starters).

---

## Problem Statement

The content pipeline compiles the full authored surface into one deterministic,
hash-pinned artifact, and the app runs only on that artifact. But four seams still
let unvalidated, duplicated, or locale-dependent content into the shipped game,
and the framework's governance is prose rather than machinery:

1. **Validation coverage stops short.** The content-pack collections and the
   ship-building catalogue are validated by `@bluewave/content-schema` schemas,
   but the per-nation **reference designs** and the six **campaign-file
   collections** (`fleets`/`economies`/`constructions`/`research`/`designs`/
   `diplomacy`) have **no content schemas**. They are only duplicate-ID checked
   and cross-referenced by hand-written passes, so the strict excess-key policy
   (ADR-0105) does not apply to them: a structurally malformed fleet, economy,
   research programme, design or reference design can still be compiled into the
   artifact. The artifact boundary also *asserts* the decoded shape rather than
   decoding it, so schema/artifact drift is not caught.
2. **Two sources of truth for what gets loaded.** `pack.json`'s `files` map
   declares the content-pack and campaign-file collections; the ship-building
   subtree is discovered purely by filesystem convention. Nothing fails if a
   discovered file is not declared, or a declared file is missing, and the
   ship-building README still claims the subtree is not loaded.
3. **Deterministic ordering is inconsistent.** The compiler's normalize stage
   orders collections with locale-dependent `localeCompare`, while the repo's own
   determinism rule (used by the division screen and the combat orderings) is
   codepoint comparison. Today the two agree on the current ASCII ids, but the
   compiler's canonical order — and therefore the artifact body hash — is not
   pinned to a locale-independent rule.
4. **Release governance is prose.** Provenance and confidence
   (`VERIFIED`/`ESTIMATE`/`PLACEHOLDER`) live in YAML comments and README "replace
   before release" lists, not in the content model, so nothing fails a build when
   a placeholder reaches a shipping pack. And because the artifact is
   git-ignored, nothing pins the exact bytes CI validated against the bytes a
   later machine builds.

Separately, the **presentation layer is a second, hand-authored corpus**. Nation
coordinates, flavor text, dossier fields, the nation-id → country-id slot
mapping, the area → region grouping, and the campaign-map join are renderer-side
tables that are only *test-audited* against the compiled content, never *derived*
from it. A content change therefore requires two edits in two trees, and "single
source of truth" does not hold for what the player actually sees.

From the framework user's perspective: "validated content is the only thing that
runs" is true for mechanics but not yet for the whole authored surface or for
presentation; a pack can compile with malformed campaign files; the artifact hash
is not reproducible by rule; and no gate stops a placeholder or a stale artifact
from shipping.

## Solution

Harden the existing pipeline in place — no second pipeline, no change to the
authored YAML format or the inert-artifact contract:

1. **Complete the strict schema boundary.** Author content schemas for the
   reference designs and the six campaign-file collections and route them through
   the same strict validator as every other collection; decode the verified
   bundle through the schemas at the artifact boundary instead of asserting its
   shape.
2. **One manifest authority.** Make `pack.json` (or an equivalent manifest
   declaration) the single list of the loaded surface, ship-building subtree
   included; fail closed when a discovered file is undeclared or a declared file
   is missing; reconcile the docs.
3. **Pin ordering to codepoint comparison.** Replace locale-dependent ordering in
   the compiler with the repo's codepoint rule so the artifact hash is
   reproducible by rule, not by environment.
4. **Machine-check provenance.** Carry provenance/confidence as a content-schema
   field on authored values, report confidence counts from `content:check`, and
   add a release gate that fails when an unresolved placeholder remains in a
   shipping pack.
5. **Commit a content lock.** Record the artifact's semantic content version and
   body hash in a small committed lock, and add `content:verify` that rebuilds
   and fails on drift or tamper; wire it into the preflight/CI gate.
6. **Source presentation from the artifact.** Author the nation presentation
   corpus (coordinates, flavor, dossier, slot mapping) and the area-region /
   campaign-map-join grouping as pack content, compile it into the artifact, and
   serve it to the renderer as DTOs over the existing narrow content IPC, so the
   renderer stops owning a duplicated table.
7. **Retire the dead paths.** Remove the unused `--content-version` flag from the
   content commands, and consolidate the legacy raw-input compile path once no
   caller remains.

The invariant throughout stays **"validated content is the only thing that
runs"**, extended to *all* authored collections and to presentation content.
Content stays inert YAML (DESIGN-05, DESIGN-57); it is not migrated to
TypeScript.

## Acceptance criteria (brief criterion → requirement IDs)

Each criterion carries a stable `CAH-*` requirement ID and is asserted at one of
the two seams named under **Testing Decisions**. "Old behaviour fails" means the
test is written so it would fail against today's unvalidated / convention-loaded /
locale-ordered / prose-governed code.

### Complete the schema boundary

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-SCH-1 | Every reference-design record is validated by a content schema through the strict validator; a missing required field, a wrong-typed field, or an excess key fails with a diagnostic naming the file and the field path. | `BW-CMP-001`, `DESIGN-05` |
| CAH-SCH-2 | Each of the six campaign-file collections is validated by a content schema through the strict validator with the same failure behaviour. | `BW-CMP-001`, `DESIGN-05` |
| CAH-SCH-3 | The artifact boundary decodes the verified bundle through the schemas; a bundle that verifies by hash but no longer matches its schema fails closed with a stable code, and no `as unknown` assertion remains at that boundary. | `BW-CMP-002`, ADR-0105 |
| CAH-SCH-4 | Each new schema has a bad fixture (missing/typed/excess) and a positive control; the production pack still compiles. | `BW-CMP-001`, `BW-TST-001` |

### One manifest authority

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-MAN-1 | The manifest is the single declaration of the loaded surface, including the ship-building subtree; discovery reads the declaration rather than inventing a second list. | `BW-CMP-001`, ADR-0109 |
| CAH-MAN-2 | A discovered file that is not declared fails validation, and a declared file that does not exist fails validation, each with an actionable diagnostic. | `BW-CMP-001`, `BW-DIAG-001` |
| CAH-MAN-3 | The content README and the ship-building README describe the one manifest and no longer claim the subtree is unloaded. | `DESIGN-53` |

### Deterministic ordering

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-DET-1 | Compiler ordering uses codepoint comparison, never locale-dependent ordering; the artifact body hash is byte-identical across processes and locales. | `BW-DET-003`, `BW-TST-001` |

### Machine-checked provenance

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-PROV-1 | Authored content values carry a machine-checked provenance/confidence label as a schema field (not a comment). | `BW-RUL-002`, `DESIGN-05` |
| CAH-PROV-2 | `content:check` reports a per-collection count of each confidence level. | `BW-CLI-001`, `BW-DIAG-001` |
| CAH-PROV-3 | A release gate fails when an unresolved `PLACEHOLDER` (or otherwise-flagged) value remains in a shipping pack, unless it is on a recorded, justified allowlist. | `BW-RUL-001`, `BW-CMP-001` |

### Content lock and verify

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-LOCK-1 | A committed lock records the artifact's semantic content version and body hash. | `BW-CMP-002`, ADR-0122 |
| CAH-LOCK-2 | `content:verify` rebuilds the artifact and fails when it diverges from the lock (content drift or tamper), naming the differing hash. | `BW-CMP-002`, `BW-TST-003` |
| CAH-LOCK-3 | `content:verify` is part of the preflight/CI gate, so local green implies CI green. | `BW-TST-003`, ADR-0106 |

### Presentation sourced from the artifact

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-PRES-1 | Nation presentation data (coordinates, flavor text, dossier fields, slot mapping) is authored as pack content and compiled into the artifact. | `BW-ARC-001`, ADR-0003 |
| CAH-PRES-2 | The area → region grouping and the campaign-map join are authored as pack content (or derived from pack content) and compiled into the artifact. | `BW-ARC-001`, `DESIGN-57` |
| CAH-PRES-3 | Main serves presentation DTOs over the existing narrow content IPC; the renderer consumes DTOs and no longer owns the duplicated tables. | `BW-ARC-001`, ADR-0125 |
| CAH-PRES-4 | The renderer bundle gains no parser/validation runtime; `pnpm snap` shows the affected screens unchanged (aria stable, console clean). | ADR-0105 `MIG-EXCL-1`, `DESIGN-54` |
| CAH-PRES-5 | A presentation change (e.g. a new area, a nation rename) is a single content edit; the audit test that used to compare two tables is replaced by the artifact-sourced path. | `DESIGN-54`, `BW-CMP-001` |

### Retire dead paths

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-LEG-1 | The unused `--content-version` flag is removed from the content commands, and the legacy raw-input compile path is removed once no caller remains (or its remaining caller is migrated first). | `BW-CLI-001` |

### Cross-cutting

| AC | Criterion | Requirement IDs |
| -- | --------- | --------------- |
| CAH-ADR-1 | ADRs record the decisions that materially constrain architecture, determinism, or compatibility: completed schema coverage + decode-at-boundary, manifest authority, the content lock/identity surface, the provenance release gate, and the presentation collection. | ENGINEERING-CONTRACT ADR threshold |
| CAH-SCOPE-1 | Content is not migrated to TypeScript; no expression DSL or `eval`; the era-rooted / one-file-per-design layout is not adopted; no gameplay behaviour changes. | `DESIGN-05`, `DESIGN-57`, ADR-0109, ADR-0111 |
| CAH-GATE-1 | The full orchestrator gate passes on the exact commit. | ENGINEERING-CONTRACT definition of done |
| CAH-TRACE-1 | Requirement traceability is updated for the completed schema coverage, the content lock, and the presentation collection. | `BW-DIAG-001` |

## User Stories

1. As a **content designer**, I want every authored collection — including
   reference designs and campaign files — validated by a schema, so that a
   structurally malformed file is rejected before it can compile.
2. As a **content designer**, I want excess or misspelled keys rejected on every
   collection, so that a typo cannot silently become accepted content.
3. As a **content designer**, I want a diagnostic naming the file and the field
   path for every schema failure, so that I can fix it without guessing.
4. As a **content designer**, I want one manifest to declare the whole loaded
   surface, so that I do not have to know which files are found by convention.
5. As a **content designer**, I want the build to fail when a file I dropped in is
   not declared (or a declared file is missing), so that content cannot be
   silently ignored.
6. As a **content designer**, I want to record a provenance/confidence label on
   an authored value, so that the source of a number travels with the number.
7. As a **content designer**, I want `content:check` to tell me how many values
   are still estimates or placeholders, so that I know what is left to source.
8. As a **content designer**, I want a single place to edit a nation's
   presentation (coordinates, flavor, dossier, slot mapping), so that I do not
   edit a second renderer table.
9. As a **content designer**, I want adding a new area to require only the area
   data, so that the region grouping does not silently fall into a catch-all.
10. As a **release engineer**, I want a release gate that fails on an unresolved
    placeholder, so that invented numbers cannot ship.
11. As a **release engineer**, I want a committed content lock, so that I can tell
    whether the artifact a build produced is the one CI validated.
12. As a **release engineer**, I want `content:verify` in the gate, so that a
    stale or tampered artifact fails locally exactly as it would in CI.
13. As a **release engineer**, I want the artifact hash to be reproducible by
    rule, so that two machines agree without depending on locale.
14. As a **release engineer**, I want the app to fail loudly if the artifact does
    not match its schema, so that schema/artifact drift is never a silent
    runtime surprise.
15. As a **campaign player**, I want the nation selection, globe and map screens
    to look and behave exactly as before, so that hardening is invisible to me.
16. As a **campaign player**, I want presentation data (names, flavor, dossier) to
    stay consistent with the campaign content, so that a nation rename does not
    leave a stale label on screen.
17. As a **campaign player**, I want my existing saves to keep loading, so that
    the hardening does not cost me a campaign.
18. As a **campaign player**, I want a content update to remain distinguishable
    from a replay divergence, so that replay verification stays trustworthy.
19. As an **engine developer**, I want one strict validator used by every
    collection, so that "structurally valid is not necessarily valid content" has
    one home.
20. As an **engine developer**, I want the artifact boundary to decode rather
    than assert its shape, so that the boundary type is earned, not cast.
21. As an **engine developer**, I want one manifest authority, so that the loaded
    file set cannot drift between the compiler and the runtime.
22. As an **engine developer**, I want codepoint ordering everywhere the compiler
    orders content, so that determinism is a rule, not an accident of ASCII.
23. As an **engine developer**, I want provenance as a schema field, so that the
    release gate can be mechanical.
24. As an **engine developer**, I want the content lock to be small and
    committed, so that the large generated artifact stays out of git while its
    identity is pinned.
25. As a **desktop app developer**, I want presentation DTOs served over the
    existing narrow IPC, so that the renderer stays presentational and does not
    gain a parser or a second content tree.
26. As a **desktop app developer**, I want the renderer's presentation tables
    deleted once the IPC path lands, so that there is exactly one source of
    truth.
27. As a **desktop app developer**, I want the presentation migration sequenced as
    expand–contract, so that each batch stays green.
28. As a **reviewer**, I want tests that fail under the old behaviour, so that
    each fix is proven rather than merely present.
29. As a **reviewer**, I want a captured screen for the presentation change and a
    clean renderer bundle check, so that I can confirm the visible behaviour and
    the boundary against the acceptance criteria.
30. As a **maintainer**, I want ADRs for the schema coverage, manifest authority,
    content lock, provenance gate, and presentation collection, so that the
    constraints survive the people who made them.
31. As a **maintainer**, I want the deferred content invariants (localization
    keys, asset references, deprecated identifiers) explicitly out of scope, so
    that this effort does not quietly claim to close them.
32. As a **maintainer**, I want the dead `--content-version` flag and the legacy
    raw-input path removed, so that the pipeline has one code path.

## Implementation Decisions

### Decision 1 — Complete the schema coverage; decode at the boundary

Content schemas are authored in `@bluewave/content-schema` for the reference
designs and the six campaign-file collections, following the existing
`Effect.Schema` + strict-decode convention (`CONTENT_DECODE_OPTIONS`,
`validateAgainstSchema`) so excess keys are rejected exactly as for the
ship-building catalogue. The compiler's validate stage routes these collections
through the same generic per-collection validation loop it already uses for the
ship-building collections, rather than the current hand-written duplicate-ID and
partial cross-reference passes. The cross-file reference checks that already
exist (nation, technology, design-version links) are preserved or absorbed into
schema-aware passes.

At the artifact boundary, the verified bundle is **decoded** through the schemas
instead of asserted. The hash check guarantees the bytes are the compiler's, but
decoding gives the boundary its type honestly and turns schema/artifact drift
into a fail-closed error. This retires the `as unknown as …` assertions currently
baselined at that boundary (ADR-0106 ratchet).

### Decision 2 — One manifest authority for the loaded surface

The manifest (`pack.json`) becomes the single declaration of every loaded file,
including the ship-building subtree. The filesystem-convention discovery in the
compiler is retained only as a resolver that must agree with the declaration:
every discovered `.yaml` under a declared directory must be declared, and every
declared file must exist. A mismatch fails validation with an actionable
diagnostic. (If a `directories`-style declaration is preferred over listing each
file, that is an implementation detail; the contract is one authority and a
fail-closed disagreement check.) The content README and ship-building README are
reconciled.

### Decision 3 — Codepoint ordering in the compiler

Every place the compiler orders content (the normalize stage, and any
id-keyed ordering it introduces) uses codepoint comparison, matching the rule
already stated and used elsewhere in the repo (the division screen's `byId`, the
combat orderings' `compareStrings`). A shared comparator is preferred over
re-stating the rule. The artifact body hash must be byte-identical across
locales and processes; the cross-process determinism check is extended to cover
the compiler's canonical order.

### Decision 4 — Provenance as a schema field and a release gate

Authored content values gain a machine-checked provenance/confidence field
(the ship-building catalogue already has a `ProvenanceSchema`; core collections
gain the equivalent). `content:check` emits a per-collection report of confidence
counts. A release gate fails when a shipping pack still carries an unresolved
placeholder, unless the value is on a small, recorded, justified allowlist. The
existing prose labels in YAML comments and READMEs are migrated to the field or
left as comments that the field supersedes.

### Decision 5 — A committed content lock and `content:verify`

A small committed lock file records the artifact's semantic content version and
SHA-256 body hash. `content:verify` rebuilds the artifact in memory and fails when
its hash diverges from the lock, naming the two hashes. This pins "the bytes CI
validated" without committing the large generated artifact. The lock is updated
deliberately when content changes (a content update is expected, never a
divergence), and `content:verify` joins the preflight/CI gate.

### Decision 6 — Presentation sourced from the artifact, delivered as DTOs

The presentation corpus is authored as pack content and compiled into the
artifact, then served to the renderer as DTOs over the **existing** narrow
content-query IPC (ADR-0125) — no new filesystem or generic-read capability.

- **Pure presentation data** (nation coordinates, flavor text, dossier fields,
  the nation-id → country-id slot mapping) becomes an authored collection; the
  renderer reads DTOs.
- **Grouping data** (area → region, campaign-map join) becomes authored content
  or is derived from authored content, so a new area cannot silently miss a
  region.
- **Geo assets** (baked borders/coastline) stay baked generators; only their
  provenance is recorded. This keeps the boundary test's `bake-*` exclusion.

**Sequencing (wide refactor).** The renderer consumes these tables from many
screens and tests, so sequence as **expand–contract**: add the IPC DTO path
beside the existing tables (nothing breaks), migrate consumers in batches that
each stay green, then delete the tables and their audit tests. If batches cannot
stay green independently, they share an integration branch and a final
integrate-and-verify ticket promises green.

### Decision 7 — Retire dead paths

The `--content-version` CLI flag is parsed but unused by `content:check` /
`content:build` (the content version derives from the manifest); remove it or wire
it deliberately. The legacy raw-input compile path is removed once no caller
remains, migrating the last caller first.

### Decision 8 — ADRs required

Per the ENGINEERING-CONTRACT ADR threshold, write or amend ADRs for: completed
schema coverage and decode-at-boundary; manifest authority; the content
lock/identity surface; the provenance release gate; and the presentation
collection and its IPC delivery. Amending ADR-0105/0122/0125 where the decision
extends them is preferred to new overlapping ADRs.

## Testing Decisions

### Seams

Two seams, both already existing (no new seam is invented):

1. **Primary — the compiler CLI boundary.** `content:check`, `content:build`, and
   the new `content:verify` are driven over fixture packs and the production pack;
   assertions are on diagnostics (codes, file, field path), artifact bytes/hash,
   the lock, and the confidence report. This is the same seam the
   `content-runtime-integrity` effort uses, so most new tests extend existing
   fixture suites.
2. **Secondary — the runtime consumer boundary.** The desktop main consumer
   (`readContentArtifact` / the ship-building and campaign loaders) and the
   `campaign:execute` bridge are driven to prove presentation DTOs are served
   decoded, that schema/artifact drift fails closed, and that renderer tests can
   inject DTOs instead of importing the tables.

A good test asserts **external behaviour** — a pack compiles or fails, a
diagnostic names the file and field, a DTO is what the screen needs — never the
internal shape of a stage or a comparator. Bad-fixture + positive-control pairs
are the norm, as the existing invariant tests already do.

### Modules exercised

- `@bluewave/content-schema` — new schemas and their bad/positive fixtures.
- `@bluewave/content-compiler` — validate-stage coverage, manifest authority,
  codepoint ordering, decode-at-boundary, provenance report, lock/verify.
- `@bluewave/compiler-cli` — `content:check` / `content:build` / `content:verify`
  behaviour and the removed flag.
- desktop `main` — artifact consumer + content IPC serving presentation DTOs.
- desktop `renderer` — screens consume injected DTOs; the boundary/bundle check
  stays green.

### Prior art

- Compiler stage fixtures: `packages/content-compiler/test/stages/`.
- Collection carry / cross-reference tests: `test/campaignCollections.test.ts`.
- Artifact verify + fail-closed: desktop `main/contentArtifact.test.ts`.
- IPC serving decoded content: desktop `main/campaignBridge.test.ts`.
- Renderer audit-against-pack pattern (to be replaced by artifact-sourcing):
  `area-regions.test.ts` and the world-map tests.
- Cross-process determinism: `scripts/verify-cross-process-determinism.cjs`.

## Out of Scope

- Migrating authored content to TypeScript; any expression DSL or `eval`
  (DESIGN-05, DESIGN-57).
- The era-rooted / one-file-per-design layout (ADR-0109, ADR-0111).
- A localization/i18n framework, a localization-key catalogue, asset-reference
  resolution, and deprecated-identifier migration — the invariants CRI-INV-3/4/5
  deferred; they stay deferred until the content model gains the fields.
- Mod support, downloadable content, and external content tooling.
- Any change to gameplay mechanics, balance, or simulation results. This effort
  changes validation, ordering, governance, and presentation sourcing only.
- Reworking the artifact format itself (it stays inert JSON, hash-pinned, with
  the do-not-edit marker) — only the coverage and the pinning of its identity
  change.

## Further Notes

- **Relationship to `content-runtime-integrity`.** That effort (ADR-0122/0123/
  0124/0125) built the producer/consumer halves of the artifact boundary. This
  effort closes the validation and governance seams that effort explicitly left
  open (its ticket 06 deferred the localization/asset/deprecation invariants and
  its campaign-collections decision only duplicate-ID-checked the six
  collections), and adds the presentation-sourcing follow-on.
- **The presentation corpus is the one place the "single source of truth" claim
  currently fails**; sourcing it from the artifact is the highest-value
  user-visible outcome after the schema coverage.
- **Determinism caveat.** Codepoint and locale ordering currently agree on the
  production ids, so CAH-DET-1 is a latent-risk fix, not a present-hash change;
  the artifact hash is expected to be unchanged by it, and any change must be
  explained and recorded (ADR-0106).
- **Sizing.** Schema coverage, manifest authority, ordering, provenance and the
  lock are each a vertical slice through `content-schema` + `content-compiler` +
  `content-cli` + tests. Presentation sourcing is a larger expand–contract
  refactor across `content-schema`, `content-compiler`, desktop main, preload,
  and the renderer screens.
