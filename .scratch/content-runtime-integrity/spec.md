# Spec: Content-runtime integrity (`content-runtime-integrity`)

One-line purpose: make the content CI validated be exactly the content the app
runs — compile the full authored surface (content-pack collections plus the
ship-building catalogue) into one deterministic, hash-pinned artifact that the
Electron main process consumes and verifies at startup, serve decoded content to
the renderer over a narrow typed IPC (removing `yaml`/`effect` from the renderer
bundle), and resolve the shipped artifact from app resources for a real packaged
fresh-game smoke.

**Triage:** `ready-for-agent` — fully specified, ready for an AFK agent. In this
repo that means the sliced implementation tickets carry `Status: open`,
`Frontier: yes`, and a resolved/empty `Blocked by:` chain (see
`docs/agents/triage-labels.md`).
**Status:** ready for slicing (`to-tickets`).
**Source of truth:** this spec plus the already-sliced six tickets under
`.scratch/content-runtime-integrity/issues/` (01–06), whose acceptance criteria
this spec gives stable requirement IDs. The sprint originates from evaluating
`docs/content-suggestions.md`.
**Extends, does not replace:** ADR-0004 (compiler stages), ADR-0005 (content
parsing), ADR-0092 (national content pipeline), ADR-0099 (release verification
gates), ADR-0105 (content-schema Effect boundary; deviation `MIG-EXCL-1`),
ADR-0109 (ship-building content per nation), ADR-0111 (historical national
starters).

---

## Problem Statement

A player or release engineer who runs the app cannot be sure that the content
the app executes is the content CI validated. The content-pack collections are
compiled, but the **ship-building catalogue is not**: the Electron main process
and the renderer each read and parse the authored YAML directly at runtime. So
"compiles in dev" does not mean "safe to ship":

- The ship-building subtree (components, propulsion plants, hull forms, balance,
  armament families/models/mounts/ammunition, per-nation naval profiles,
  per-nation reference designs, technologies) is read raw by the main process and
  independently re-parsed by the renderer.
- The renderer validates bundled YAML through `@bluewave/content-schema` and
  therefore transitively bundles `yaml` and `effect` — an explicitly recorded
  architecture deviation (ADR-0105 known deviation #1, `MIG-EXCL-1`, scheduled to
  Wave 5).
- The compiler CLI exposes `validate`/`compile` but no designer-facing
  `content:check`/`content:build` over the whole surface, and no generated content
  artifact directory exists.
- Packaged content resolution walks four directories up to the repository root,
  a path that cannot exist inside an installed / asar build, and the packaging
  configuration never includes the content tree. Packaged resolution is declared
  "out of scope" in the resolver itself.

From the player's and release engineer's perspective: a content file that would
fail validation can still be executed by the shipped app, the renderer runs more
code than a presentational layer should, and the packaged application cannot
load its own content at all. "What CI proved" and "what executes" are two
different things.

## Solution

Introduce one **content-runtime integrity boundary** with three producer/consumer
outcomes and one P1 hardening outcome:

1. **One deterministic, hash-pinned artifact.** The content compiler validates and
   normalizes the **complete** authored surface — the content-pack collections
   **and** the ship-building catalogue — into a single generated, inert artifact
   plus a manifest carrying a semantic content version and a SHA-256 content hash.
   `content:check` (validate, write nothing) and `content:build` (emit the
   artifact) are designer-facing aliases over the existing compiler CLI, not a
   second pipeline.
2. **Main runs on the artifact.** The Electron main process loads campaign and
   ship-building content from the compiled artifact instead of raw YAML. At
   startup it verifies the recorded content version/hash and fails with an
   explicit, actionable error on mismatch rather than silently running content
   that was never validated. The content identity that months and saves record
   derives from the artifact, preserving the replay-divergence contract.
3. **The renderer stops parsing content.** Main exposes a narrow, typed,
   capability-specific content-query IPC (catalogue + reference designs). The
   drawing board and its panels render from IPC-delivered, already-decoded domain
   DTOs; `yaml` and `effect` leave the renderer bundle, executing ADR-0105
   `MIG-EXCL-1`. The renderer receives DTOs and does not know the content was
   authored in YAML.
4. **Packaged content resolves from app resources.** The artifact ships inside the
   packaged application and is resolved relative to app resources (no repo-root
   walk); packaging configuration includes it; `smoke:packaged` launches the real
   binary, starts a **fresh** game, and asserts the drawing board content loads
   and renders.
5. **P1 — hardening the trust boundary.** One documented, versioned strict-YAML
   parse policy is the single parse entry point for compiler and runtime loaders;
   and compile-time validation additionally proves content-level invariants
   (acyclic prerequisite/unlock graphs, no self-reference, existing localization
   keys, resolving asset references, deprecated-identifier rejection/migration).

The invariant throughout: **validated content is the only thing that runs.**
Content stays inert YAML (DESIGN-05, DESIGN-57); it is not migrated to
TypeScript.

## Acceptance criteria (brief criterion → requirement IDs → proving tests)

Each criterion mirrors a ticket acceptance criterion and carries a stable
`CRI-*` requirement ID (cross-referenced to the base `BW-*` / `DESIGN-*`
requirement it serves). "Old behaviour fails" means the test is written so it
would fail against today's raw-YAML / repo-root-walk / renderer-parsing code.
Tickets are referenced as `01`–`06`.

### Ticket 01 — explicit, versioned strict-YAML parse policy

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-YAML-1 | A duplicate mapping key within one mapping is rejected with a diagnostic naming the file and the duplicated key. | `BW-RUL-002`, `DESIGN-57` | Parser unit test: YAML with a repeated top-level key and a repeated nested key both fail with a `YAML-*` diagnostic carrying file + key. |
| CRI-YAML-2 | Custom/unsupported YAML tags are rejected — no tag can construct an arbitrary or executable value. | `BW-RUL-002`, `DESIGN-05` | Parser unit test: a document using a non-standard tag fails; a `!!js/*`-style tag fails; no function/object is constructed. |
| CRI-YAML-3 | Anchor/alias use is capped by a documented constant; exceeding it produces a diagnostic. | `BW-RUL-002` | Parser unit test: an alias-bomb document over the documented cap fails with the alias-limit diagnostic; a document at the cap passes. |
| CRI-YAML-4 | The existing size and nesting caps are preserved. | `BW-RUL-002` | Existing parser tests for max size and max nesting stay green. |
| CRI-YAML-5 | Existing valid production content and the full compiler fixture corpus parse unchanged (no false rejections). | `BW-CMP-001` | Full compiler fixture suite + production content parse green; byte-identical accept decisions. |
| CRI-YAML-6 | The policy is documented and linked from the content-parsing ADR (ADR-0005); the parser remains the single parse entry point for compiler and runtime loaders. | `BW-RUL-002`, `DESIGN-53` | Search proves exactly one strict-YAML parse entry point used by compiler and runtime loaders; ADR-0005 links the policy. |

### Ticket 02 — compile the full surface into one hash-pinned artifact

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-ART-1 | `content:build` emits a generated artifact + manifest (semantic content version + SHA-256) covering both the content-pack collections and the ship-building catalogue. | `BW-CMP-001`, `BW-CMP-002`, `DESIGN-05` | CLI test / fixture: build over the production pack emits an artifact containing every content-pack collection and every ship-building collection, with a versioned envelope. |
| CRI-ART-2 | `content:check` validates without writing and returns the same accept/reject decisions as `content:build`. | `BW-CLI-001`, `BW-CMP-001` | CLI test: for a valid pack both succeed and no file is written by check; for a broken pack both reject with the same diagnostic codes. |
| CRI-ART-3 | Two consecutive builds over unchanged content produce byte-identical artifacts. | `BW-TST-001`, `BW-DET-003` | Determinism test: build twice, compare bytes and envelope hash; identical. |
| CRI-ART-4 | Duplicate IDs and dangling cross-file references — in **any** collection, including ship-building — fail with a file + field-path diagnostic. | `BW-CMP-001`, `BW-DIAG-001` | Bad-fixture tests per collection: duplicate ID and dangling reference each fail with file + field path. |
| CRI-ART-5 | Generated output is inert data (no executable content) and generated files are marked do-not-edit. | `BW-RUL-002`, `DESIGN-05` | Artifact is JSON parsed as data; a do-not-edit marker is present; no executable construct appears in output. |
| CRI-ART-6 | Existing `bwc compile` / `bwc validate` behaviour and wire formats for the content-pack boundary are unchanged. | `BW-CLI-001`, `BW-CMP-002` | Existing CLI tests green; existing content-pack envelope/campaign content identity byte-compatible. |

### Ticket 03 — main runs on the compiled artifact

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-MAIN-1 | No raw ship-building or reference-design YAML is read in the main process at runtime. | `DESIGN-57`, `BW-RUL-002` | Main-process content loader tests + search: no runtime YAML read/parse remains; loaders consume the artifact. |
| CRI-MAIN-2 | Campaign compile, new-game option listing, and month execution run on artifact-derived content. | `BW-CMP-001`, `BW-CMP-002` | Integration tests: campaign compile, new-game option list, and one month execute against the artifact and produce the expected content. |
| CRI-MAIN-3 | The recorded content hash is artifact-derived; a content change surfaces as an expected content update (not a determinism failure), with golden/replay expectations updated or recorded via an ADR. | `BW-PER-001`, `BW-TST-003` | Replay test: a recorded artifact-hash save replays; a changed artifact surfaces as a content update, not a divergence; ADR records any golden update. |
| CRI-MAIN-4 | A version/hash mismatch at startup produces an explicit error, not a silent fallback. | `BW-PER-001`, `BW-CMP-001` | Startup test: a tampered/absent artifact or mismatched version fails closed with a stable diagnostic. |
| CRI-MAIN-5 | Existing saves still load; `pnpm check` is green. | `BW-PER-003`, `BW-TST-003` | Save load/replay suites green; full orchestrator gate green. |

### Ticket 04 — renderer decoupling over a narrow IPC

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-IPC-1 | Main exposes a narrow content API (design lookup / list + reference designs). It does not expose filesystem paths, generic file reads, or YAML parsing. | `BW-ARC-001`, `DESIGN-57`, ADR-0008 | IPC boundary test: only the named query capabilities are registered; no filesystem/path/parse capability is exported. |
| CRI-IPC-2 | The drawing board and its panels render from IPC-delivered content; `pnpm snap` shows the affected screen unchanged (aria stable, console clean). | `DESIGN-51`, `DESIGN-54` | Render tests with injected content; `pnpm snap` screenshot + `aria.yaml`, console clean, no churn warning. |
| CRI-IPC-3 | The renderer bundle no longer includes `yaml` or `effect`. | ADR-0105 `MIG-EXCL-1`, `BW-ARC-001` | Bundle check: the built renderer bundle contains neither `yaml` nor `effect`; direct imports are gone. |
| CRI-IPC-4 | Renderer tests inject content instead of parsing YAML. | `DESIGN-54` | Renderer suite: drawing-board and panel tests receive fixture content through the loader seam; no test parses YAML. |
| CRI-IPC-5 | No renderer module reads the filesystem or parses YAML. | `DESIGN-57` | Search/architecture check: no renderer module imports `yaml`, `node:fs`, or the schema parser. |

### Ticket 05 — packaged content resolution + fresh-game smoke

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-PKG-1 | Packaged content resolution uses the app resources path and works from an installed / asar build with no repo-relative walk. | ADR-0099, `BW-ARC-001` | Packaged resolver test: resolution succeeds against an app-resources path; no `../../..` dependency remains. |
| CRI-PKG-2 | Packaging configuration ships the content artifact as a resource. | ADR-0099 | Packaging config includes the artifact; a build produces an app whose resources contain it. |
| CRI-PKG-3 | `smoke:packaged` starts a fresh game and asserts the drawing board content loads (screenshot + clean console), not just a saved-game open. | ADR-0099, `DESIGN-54` | Packaged smoke: fresh-game path reached, drawing board renders, screenshot captured, console clean. |
| CRI-PKG-4 | The packaged app runs correctly on a machine without the repository content tree present. | ADR-0099 | Packaged smoke passes with no repo-relative content tree available to the app. |

### Ticket 06 — extended compile validation (graph and reference invariants)

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-INV-1 | A cyclic prerequisite / unlock graph fails validation with a diagnostic naming the cycle. | `BW-CMP-001`, `DESIGN-05` | Bad-fixture: a cyclic graph fails; the diagnostic names the cycle members. |
| CRI-INV-2 | A self-referential requirement fails validation. | `BW-CMP-001`, `DESIGN-05` | Bad-fixture: a design requiring itself fails with file + field path. |
| CRI-INV-3 | A missing localization key referenced by content fails validation. | `BW-RUL-001`, `DESIGN-05` | Bad-fixture: an unresolvable `*Key` reference fails; localized text still never feeds mechanics. |
| CRI-INV-4 | A dangling asset reference fails validation. | `BW-CMP-001`, `DESIGN-05` | Bad-fixture: a reference to a non-existent asset fails with file + field path. |
| CRI-INV-5 | A deprecated identifier is rejected with a migration hint, or auto-migrated where a mapping exists. | `DESIGN-05`, `BW-DIAG-001` | Bad-fixture: a deprecated ID fails with a remediation hint; a mapped ID migrates deterministically. |
| CRI-INV-6 | Each invariant has a bad-fixture test and a positive control (valid content still passes). | `BW-CMP-001`, `DESIGN-54` | Paired tests: one bad fixture and one valid control per invariant. |

### Cross-cutting

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| CRI-DET-1 | Identical content, ruleset, inputs and compatibility versions produce identical artifact hashes across processes and supported operating systems. | `BW-DET-003`, `BW-TST-001` | `pnpm test:cross-process` byte-identical; artifact envelope hash stable. |
| CRI-DET-2 | A content-identity change is an expected content update, never treated as a nondeterminism failure; any golden movement has an understood authoritative cause recorded via an ADR. | `BW-TST-003`, `BW-PER-001` | Replay/golden verification; ADR records the content-hash surface change. |
| CRI-ADR-1 | ADRs record the decisions that materially constrain architecture, determinism, compatibility, or packaging: artifact format/location/versioning, the strict parse policy, content-hash/identity semantics, and packaged-resource resolution. | ENGINEERING-CONTRACT ADR threshold | ADR files present and linked from this spec / tickets. |
| CRI-SCOPE-1 | Content is not migrated to TypeScript; no expression DSL or `eval`; the era-rooted / one-file-per-design layout is not adopted. | `DESIGN-05`, `DESIGN-57`, ADR-0109, ADR-0111 | Review: content tree layout is unchanged except for the compiled artifact; no code/DSL introduced. |
| CRI-GATE-1 | The full orchestrator gate passes on the exact commit. | ENGINEERING-CONTRACT definition of done | `pnpm preflight`, `pnpm check`, `pnpm test:cross-process`, `pnpm snap`, `smoke:packaged`. |
| CRI-TRACE-1 | Requirement traceability is updated for the artifact identity, the strict parse policy, and the renderer bundle exit. | `BW-DIAG-001` | `.ai/REQUIREMENTS.md` / map rows updated with tests + ADRs. |

## User Stories

1. As a **release engineer**, I want the content the app runs to be exactly the
   content CI validated, so that a file that fails validation can never execute
   in a shipped build.
2. As a **release engineer**, I want one deterministic, hash-pinned content
   artifact, so that a build is reproducible and I can compare what shipped to
   what was validated.
3. As a **release engineer**, I want the app to verify the content version/hash at
   startup and fail loudly on mismatch, so that I never silently ship
   unvalidated content.
4. As a **release engineer**, I want the packaged application to load its content
   from app resources, so that it works on a machine that has never seen the
   repository.
5. As a **release engineer**, I want a packaged smoke that starts a fresh game,
   so that the path that actually reads shipped content is the one verified.
6. As a **content designer**, I want `content:check` to validate the whole surface
   without writing, so that I can iterate quickly and safely.
7. As a **content designer**, I want `content:build` to emit the artifact for the
   whole surface, so that I do not run a second, different pipeline.
8. As a **content designer**, I want precise diagnostics with the file and the
   field path, so that a broken reference or duplicate ID is obvious to fix.
9. As a **content designer**, I want strict YAML that rejects duplicate keys and
   unsupported tags, so that an ambiguous authored file cannot silently become
   accepted content.
10. As a **content designer**, I want anchor/alias use capped by a documented
    constant, so that a pathological document cannot blow up a build.
11. As a **content designer**, I want valid production content and existing
    fixtures to keep parsing, so that tightening the parser never rejects real
    content.
12. As a **content designer**, I want compile-time validation of graph and
    reference invariants (cycles, self-reference, localization keys, asset
    references, deprecated IDs), so that "structurally valid" also means
    "content-valid".
13. As a **campaign player**, I want the drawing board to render the same ships
    and reference designs as before, so that the integrity work does not change
    what I see.
14. As a **campaign player**, I want the drawing board to load faster and the app
    to ship less code, so that the UI stays responsive.
15. As a **campaign player**, I want my existing saves to keep loading, so that
    the integrity change does not cost me a campaign.
16. As a **campaign player**, I want a content update to be distinguishable from a
    real replay divergence, so that replay verification stays trustworthy.
17. As an **engine developer**, I want the compiler to compile the ship-building
    catalogue through the same four typed stages as everything else, so that
    there is one content pipeline, not two.
18. As an **engine developer**, I want the generated artifact to be inert data
    with a do-not-edit marker, so that it can never become a second source of
    truth or run code.
19. As an **engine developer**, I want exactly one strict-YAML parse entry point
    shared by compiler and runtime, so that "what CI validated" and "what the app
    loads" cannot drift.
20. As an **engine developer**, I want the content identity recorded by months and
    saves to derive from the artifact, so that replay-divergence detection is
    preserved or strengthened, never weakened.
21. As an **engine developer**, I want the desktop main process to consume
    already-decoded, normalized artifact data, so that runtime validation stays in
    the schema package and main does not re-derive it.
22. As a **desktop app developer**, I want the renderer to receive domain DTOs
    over a narrow typed IPC, so that it stays presentational and never touches
    files or YAML.
23. As a **desktop app developer**, I want `yaml` and `effect` to leave the
    renderer bundle, so that the renderer stops transitively shipping a
    validation runtime (executing ADR-0105 `MIG-EXCL-1`).
24. As a **desktop app developer**, I want the IPC surface to expose game
    capabilities (design lookup/list, reference designs), not filesystem
    infrastructure, so that the attack surface does not grow.
25. As a **desktop app developer**, I want the renderer content loader to be
    injectable, so that renderer tests supply fixture content instead of parsing
    YAML.
26. As a **desktop app developer**, I want the packaged resolver to use app
    resources, so that packaged builds stop depending on a repo-root walk that
    cannot exist in production.
27. As a **reviewer**, I want tests that fail under the old raw-YAML /
    repo-root-walk / renderer-parsing behaviour, so that the fix is proven rather
    than merely present.
28. As a **reviewer**, I want a captured drawing-board screen and a packaged
    fresh-game smoke, so that I can confirm the visible behaviour against the
    acceptance criteria.
29. As a **reviewer**, I want the era-rooted/one-file-per-design layout and the
    TypeScript-content migration explicitly out of scope, so that the integrity
    work does not silently contradict ADR-0109/ADR-0111.
30. As a **maintainer**, I want the ADRs for artifact format, parse policy,
    content-hash semantics, and packaged resolution recorded, so that the
    constraints survive the people who made them.

## Implementation Decisions

### Decision 1 — One strict-YAML policy, one parse entry point

The content parser is the single trust boundary for authored bytes. Its strict
policy is made explicit and versioned: duplicate mapping keys rejected,
custom/unsupported YAML tags rejected (no tag can construct arbitrary or
executable values), anchor/alias use capped by a documented constant, and the
existing size and nesting caps preserved. Failures surface as precise `YAML-*`
diagnostics carrying the source file and the offending field path. The cap and
the policy version are owned constants, not inherited library defaults. Both the
compiler (through its parse stage) and the runtime content loaders use this one
entry point, so the policy cannot drift between CI and the app. ADR-0005 is
amended to link the explicit policy; the alias cap becomes the documented,
versioned ruleset constant for this routine decision.

### Decision 2 — The compiler gains the full surface as first-class collections

The compiler's four typed stages (parse → validate → normalize → compile,
ADR-0004) already operate on named collections. The ship-building catalogue
(components, propulsion plants, hull forms, balance, armament families / models /
mounts / ammunition, per-nation naval profiles, per-nation reference designs,
technologies) is added as first-class collections flowing through the **same**
stages — not a second pipeline. The artifact is produced by the compile stage as
canonical, sorted, inert JSON, wrapped in the versioned canonical envelope
(bodyHash + compatibilityVersion) per ADR-0003.

- **Format decision (inert JSON, not generated TypeScript).** The artifact is
  normalized JSON. Generated TypeScript is deliberately **not** adopted; a literal
  ID union is only justified if internal tooling genuinely needs one, and that is
  a separate decision. This matches the content-suggestion evaluation and the
  "content is inert data" philosophy (DESIGN-05).
- **Manifest decision.** The artifact is accompanied by a manifest carrying the
  semantic content version and the SHA-256 content hash, so the runtime identity
  is explicit and inspectable.
- **Location/versioning decision.** The artifact lives in a generated output
  directory, is never hand-edited (marked do-not-edit), and is versioned by the
  semantic content version plus the envelope compatibility version. Exact
  location and whether a reference is committed are settled in the artifact ADR.

### Decision 3 — `content:check` / `content:build` are aliases over the existing CLI

Designer-facing `content:check` (validate, write nothing) and `content:build`
(emit the artifact) are thin aliases/configurations over the existing compiler
CLI — the same `Compiler` and stages, invoked with the full surface. This
reconciles ticket 02's two constraints: the new aliases cover the full surface,
while the existing `bwc compile` / `bwc validate` invocation keeps its current
scope and wire format. The keyword `content` is the game capability; the `bwc`
verbs remain the low-level compiler surface.

### Decision 4 — Content-hash and content-identity semantics

Months and saves already record a content identity so a replay can tell a
content update from a real divergence: today `shipBuildingContentHash` hashes the
raw file bytes keyed by relative path (ADR-0109) and `armamentContentHash` is a
separate identity (ADR-0093). Under this work the recorded identity becomes
**artifact-derived** — the artifact's canonical body hash under a domain-separated
envelope — so the identity is exactly the thing CI validated.

The contract to preserve is replay-divergence detection, not a particular byte
string. A content update produces a new artifact hash and is an **expected
content update** (like the ADR-0109 file-set change), not a determinism failure;
older saves keep the hash they recorded. Whether the single artifact hash
subsumes `shipBuildingContentHash` and `armamentContentHash` or the manifest
carries both as separate fields (for backward-compatible saves) is settled in the
content-hash ADR. Ticket 03's "never reduce the recorded identity to something
weaker than today's file-bytes hash" is read as "the recorded identity must remain
content-derived and tamper-evident, never a constant or a weaker projection."

### Decision 5 — Main consumes the artifact and verifies it at startup

The desktop main content loaders (campaign/compiler content and the ship-building
content loader) stop reading and parsing raw YAML; they read the compiled
artifact. At startup the app verifies the artifact's recorded content version and
hash against the expected values and, on mismatch or absence, emits an explicit,
actionable error and fails closed — never a silent fallback to unvalidated
content. Runtime-free structural validation stays in the schema package; main
consumes already-decoded, normalized artifact data.

### Decision 6 — Renderer decoupling over a narrow typed content IPC

Main exposes a narrow, capability-specific content-query surface over IPC;
preload validates requests/responses with a boundary schema and exposes only
those methods. The renderer's content loader becomes a thin fetch of decoded
DTOs behind an injectable seam. The shape encodes the "capability, not
infrastructure" decision:

```text
interface ContentApi {
  getShipDesign(id): Promise<ShipDesignDto | null>
  listShipDesigns(filter): Promise<readonly ShipDesignSummaryDto[]>
  listReferenceDesigns(): Promise<readonly ReferenceDesignDto[]>
}
```

Never a generic `readContentFile(path)` / path / YAML-parse capability. Because
the drawing board currently imports `yaml` and decodes with the schema package,
removing those imports and serving DTOs over IPC lets `yaml` and `effect` leave
the renderer bundle (ADR-0105 `MIG-EXCL-1`). `@bluewave/ship-design` itself does
not import the schema package or `effect`, so building/deriving content stays
effect-free; the renderer may still consume ship-design types, but not the
parser or validator.

**Sequencing (wide refactor).** Ticket 04 is a wide refactor with many modules
and tests consuming the synchronous loader. Sequence it **expand–contract**: add
the IPC content query beside the existing loader (nothing breaks), migrate
consumers in batches that each stay green, then delete the old loader and the raw
YAML imports. If batches cannot stay green independently, share an integration
branch and make ticket 04 the integrate-and-verify gate.

### Decision 7 — Packaged content resolves from app resources

The artifact ships as an application resource. Main resolves it relative to the
app resources path (installed / asar), not by walking up to the repository root,
and packaging configuration includes the artifact. `smoke:packaged` launches the
real binary and starts a **fresh** game (not merely opening a pre-compiled save),
then asserts the drawing board content loads and renders. This extends ADR-0099's
packaged-smoke gate.

### Decision 8 — Extended compile validation lives at the compiler/store boundary

The generic content-level invariants (acyclic prerequisite/unlock graphs, no
self-reference, existing localization keys, resolving asset references,
deprecated-identifier rejection with migration) are added to compile-time
validation so **every** pack is covered, not only release nations. The existing
national completeness logic is reused where it already proves an invariant rather
than re-implemented. Each failure yields a diagnostic naming the offending file
and field path, with one bad-fixture test and one positive control per invariant.

### Decision 9 — ADRs required

Per the ENGINEERING-CONTRACT ADR threshold, this work writes ADRs (or amends
existing ones) for:

1. **Generated artifact** — location, inert-JSON format, manifest, semantic
   version, hashing/envelope, do-not-edit policy, and whether a reference is
   committed.
2. **Strict-YAML parse policy** — the explicit, versioned policy and the
   anchor/alias cap constant (amends ADR-0005).
3. **Content-hash/identity semantics** — what the recorded identity becomes and
   how older saves remain loadable (amends/nests ADR-0093, ADR-0109, ADR-0113).
4. **Packaged content resolution** — app-resources resolution and packaging
   inclusion (extends ADR-0099).
5. **Renderer bundle exit** — records the execution of ADR-0105 `MIG-EXCL-1`
   (a note/amendment, not a reversal).

### Decision 10 — No new package, no speculative abstraction

The work extends existing boundaries (`content-schema`, `content-compiler`,
`compiler-cli`, desktop main/preload/renderer). No new package is introduced.
The seams are existing ones where possible; the only genuinely new seam is the
renderer's injectable content-loader seam, placed as high as possible (the
loader the drawing board already calls).

## Testing Decisions

**What makes a good test.** Tests assert external behaviour at the highest
available seam, never internal call order or private implementation details. For
this work the load-bearing seams are:

- **Parser policy** — does the one parse entry point accept/reject exactly the
  intended documents, with file + key diagnostics?
- **Compiler accept/reject and artifact determinism** — does the compiler accept
  valid content and reject each broken invariant, and do two builds over
  unchanged content produce byte-identical artifacts?
- **Startup verification** — does the app fail closed on a version/hash mismatch?
- **IPC boundary** — does the narrow content API expose only capabilities and
  reject everything else?
- **Renderer rendering from injected content** — do the drawing board and panels
  produce the same UI from fixture DTOs (via `pnpm snap` and render tests)?
- **Packaged resolution and fresh-game smoke** — does the installed build load
  shipped content and start a fresh game?

**Modules tested.** `@bluewave/content-schema` (strict-YAML policy; boundary
schemas), `@bluewave/content-compiler` (full-surface parse/validate/normalize/
compile; invariants; determinism), `apps/compiler-cli` (`content:check` /
`content:build` aliases; unchanged `bwc` behaviour), desktop main (artifact
loader + startup verification + packaged resolver), desktop preload/IPC boundary
(narrow content API), and renderer drawing board/panels (content injected,
no YAML/`effect`). Cross-process determinism and the golden/replay harness run as
the authoritative safety net.

**Prior art.** The existing `content-schema` YAML-parser tests; the
`content-compiler` fixture/determinism tests; the compiler-CLI command tests; the
desktop main content-loader and save/load tests; the drawing-board render tests
and `pnpm snap`; the `@bluewave/cross-process-test` harness; and the packaged
smoke (`smoke:packaged`) already wired to the release gates (ADR-0099). Prefer
extending these over adding new seams.

**Adversarial cases that kill the old behaviour.** A duplicate-key YAML file that
the old parser accepted; a non-standard tag; an over-cap alias document; a build
byte comparison; a tampered/missing artifact at startup; a renderer bundle scan
for `yaml`/`effect`; a fresh-game packaged smoke with no repo content tree; and a
cyclic/self-referential/deprecated-ID bad fixture per invariant.

## Out of Scope

- **Migrating content to TypeScript.** Content stays versioned YAML compiled to
  inert artifacts (DESIGN-05, DESIGN-57). No `as const satisfies` content modules,
  no executable definitions.
- **Any expression DSL or `eval`/`new Function`.** Formulas stay in the controlled
  TypeScript registry; content never evaluates expressions.
- **Adopting the era-rooted path or one-file-per-design layout.** That contradicts
  the accepted per-nation layout (ADR-0109) and the historical-national-starter
  governance (ADR-0111); the content tree layout is unchanged apart from the
  generated artifact.
- **Generated TypeScript artifacts.** Inert JSON only, unless a later, separate
  decision shows internal tooling needs a literal ID union.
- **Mod / third-party content installation.** This work hardens the first-party
  trust boundary; a mod installation pipeline is a separate effort.
- **New gameplay mechanics, balance retuning, or new nations.**
- **An i18n/localization framework.** The localization-key invariant checks that
  referenced keys exist; it does not introduce a localization system.
- **Cleaning up deprecated determinism machinery.** The golden/replay harness
  keeps running; any hash movement is recorded via ADR, not silenced.
- **A second content pipeline.** `content:check`/`content:build` are aliases over
  the existing compiler.

## Further Notes

- **Grounding (verified).** The authored tree is scenario-rooted
  (`content/production/1880/` with its `ship-building/` subtree), authored in
  YAML, and the ship-building subtree is explicitly **not** in the pack manifest,
  so the current compiler never loads it — it is read raw by both main and the
  renderer. The main loader hashes raw file bytes keyed by relative path and
  keeps a separate armament hash; the renderer globs the per-nation files and
  decodes with the schema package, transitively pulling `yaml` and `effect`.
  Packaged resolution is a four-level repo-root walk declared out of scope, and
  the packaging config excludes the content tree. `@bluewave/ship-design` imports
  neither the schema package nor `effect`.
- **Determinism.** The artifact is produced by the canonical serializer with
  sorted keys and stable collection order (ADR-0003), so hashes are independent
  of YAML key/file order. Any change to a recorded content hash is an expected
  content update with an ADR, never accommodated by weakening a test.
- **Ambiguities flagged to the orchestrator.** Two ticket-02/03 wording tensions
  are resolved here as decisions and must be recorded in the artifact/hash ADRs:
  (a) "existing `bwc compile` unchanged" vs "content:build covers the full
  surface" — resolved by alias/config over one compiler (Decision 3); (b) "content
  hash is artifact-derived" vs "never weaker than today's file-bytes hash" —
  resolved as content-derived artifact identity plus backward-compatible saves
  (Decision 4). These are interpretation choices over the deterministic
  resolution the brief permits, not canonical gameplay changes.
- **No `.ai/briefs/` file exists for this slug.** The sprint brief is the inline
  brief supplied with the spec request; this spec and the six tickets are its
  authoritative expression. (Recorded as an observation, not a blocker.)
- **Ordering.** Dependencies are `01 → 02 → {03, 06} → {04, 05}`. Ticket 06 (P1)
  can run in parallel with 03 after 02; 04 and 05 can run in parallel after 03.
- **Possible follow-ups** (not this work): a generated literal ID union if
  internal tooling needs it; a mod-installation validation path; retiring the
  deprecated determinism harness.

### Definition of done

- [ ] One strict-YAML policy is documented, versioned, and the single parse entry
      point for compiler and runtime loaders; duplicate keys, unsupported tags,
      and over-cap aliases are rejected with file + key diagnostics; existing
      content and fixtures parse unchanged (CRI-YAML-1..6).
- [ ] The compiler validates and compiles the **full** surface (content-pack
      collections + ship-building catalogue) into one deterministic, inert,
      hash-pinned artifact + manifest; two builds are byte-identical;
      `content:check` writes nothing and matches `content:build`; duplicate IDs
      and dangling references fail in any collection (CRI-ART-1..6).
- [ ] Main reads content from the artifact (no raw ship-building/reference-design
      YAML at runtime); campaign compile, new-game option listing, and month
      execution run on artifact-derived content; startup verifies
      version/hash and fails closed on mismatch; existing saves still load
      (CRI-MAIN-1..5).
- [ ] Main exposes a narrow typed content IPC; the drawing board and panels render
      from injected/IPC content; `yaml` and `effect` are absent from the renderer
      bundle; no renderer module reads the filesystem or parses YAML; `pnpm snap`
      shows the affected screen unchanged (CRI-IPC-1..5).
- [ ] The artifact ships as an app resource; packaged resolution uses the app
      resources path with no repo-relative walk; `smoke:packaged` starts a fresh
      game and asserts the drawing board loads with a clean console; the packaged
      app runs without the repository content tree present (CRI-PKG-1..4).
- [ ] Compile validation proves acyclic graphs, no self-reference, existing
      localization keys, resolving asset references, and deprecated-ID
      rejection/migration, each with a bad fixture and a positive control
      (CRI-INV-1..6).
- [ ] Artifact determinism is cross-process/extensible-OS identical; any content-
      hash movement is an expected content update recorded via ADR, not a test
      weakening (CRI-DET-1..2).
- [ ] Required ADRs (artifact format/location/versioning, strict parse policy,
      content-hash semantics, packaged resolution, renderer bundle exit) are
      written or amend existing ADRs and are linked (CRI-ADR-1).
- [ ] Non-goals hold: content is still YAML and inert; no DSL/`eval`; the
      era-rooted / one-file-per-design layout is not adopted (CRI-SCOPE-1).
- [ ] Full orchestrator gate green on the exact commit; traceability updated for
      the artifact identity, parse policy, and renderer bundle exit (CRI-GATE-1,
      CRI-TRACE-1).
- [ ] Clean working tree; small Conventional Commits on `dev`; traceability and
      the `.ai/specs/` pointer updated.

### Validation commands

Focused (run from the repo root; adjust filters to the changed packages):

- `pnpm --filter @bluewave/content-schema exec vp test run`
- `pnpm --filter @bluewave/content-compiler exec vp test run`
- `pnpm --filter @bluewave/compiler-cli exec vp test run` (or the CLI's node test)
- `pnpm --filter @bluewave/desktop exec vp test run src/main`
- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/construction`

Full orchestrator gate:

- `pnpm preflight`
- `pnpm check`
- `pnpm test:cross-process` (two-process determinism, byte-identical)
- `pnpm snap` — capture the drawing board; `aria.yaml` stable, console clean, no
  churn warning
- `smoke:packaged` — packaged fresh-game smoke (drawing-board content loads,
  screenshot captured, console clean)
- the orchestrator's golden/replay verification (any change recorded via ADR)
