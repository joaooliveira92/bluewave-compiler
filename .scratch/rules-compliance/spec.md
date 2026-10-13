# Spec: RULES.md compliance (`rules-compliance`)

One-line purpose: make the entire workspace actually obey the always-apply rules
in `RULES.md`, and then freeze each rule with a fail-closed ratchet gate so the
compliance cannot silently decay.

**Triage:** `ready-for-agent` — fully specified, ready for an AFK agent. In this
repo that means the sliced implementation tickets carry `Status: open`,
`Frontier: yes`, and a resolved/empty `Blocked by:` chain (see
`docs/agents/triage-labels.md`).
**Status:** sliced — 7 frontier-ordered implementation tickets at
`.scratch/rules-compliance/issues/`, all unblocked (fully parallel by design:
each ticket owns its own scope-specific gate).
**Source of truth:** this spec, together with `RULES.md` (the rules under audit)
and the `.ai/ENGINEERING-CONTRACT.md` it distils.
**Grounds:** ADR-0004 (compiler stages), ADR-0100/ADR-0128 (runtime-free subset;
plain facades; renderer must not bundle `effect`), ADR-0102/ADR-0105 (Effect
`Schema` is the single validator; wire formats frozen), ADR-0106 (ratchet gates),
ADR-0107 (preflight/gate runner), ADR-0125 (`MIG-EXCL-1`).

---

## Problem Statement

`RULES.md` now states the rules every change must satisfy — determinism, tagged
errors, decoded boundaries, ambient-IO-free compiler stages, canonical
serialization, and the machine gates that prove them. We audited the codebase
against it. The machine-checked rules hold (`pnpm preflight` is 17/17 and
`pnpm lint:effect` reports 0 errors), but six rules are only *partly* obeyed and
most of them are **not machine-checked at all**, so a change can violate them and
still pass CI:

1. **Authoritative wall-clock survives in one exported helper.** The command
   lifecycle's `transitionRecord` stamps `new Date().toISOString()` into a
   `CommandStatusTransitionRecord` and hashes the result. Every real consumer
   (the desktop construction workspace, the phase-engine full-lifecycle path)
   already works around it by rebuilding the transition chain timestamp-free, so
   the helper is a latent determinism trap that stays safe only by convention.
2. **Not every in-process error is tagged.** `@bluewave/contracts` exports a
   plain `BluewaveError` (no `_tag`) that `@bluewave/combat` discriminates with
   `instanceof`; `@bluewave/ship-design` has eight plain `extends Error` classes;
   `@bluewave/campaign` and `@bluewave/persistence` one each. The newer wave
   packages (`ai`, `combat`, `commands`, `diagnostics`, `events`, `persistence`
   errors module, `phase-engine`) already use `Data.TaggedError`.
3. **Some external boundaries are trusted by cast.** The compiler's manifest
   loader, the desktop project loader, and the desktop pack loader all do
   `JSON.parse(...) as SomeManifest`, bypassing the strict schema that exists for
   the same shape.
4. **A compiler stage performs ambient filesystem I/O.** `ParseStage` calls
   `readFileSync` from inside its `run`, contrary to ADR-0004 ("stages do not
   perform ambient I/O").
5. **One serializer skips canonicalization.** Campaign archetype selection is
   serialized with raw `JSON.stringify` instead of the canonical serializer.
6. **The console rule.** Library code uses `console.error` at one child-process
   entry point in `@bluewave/combat` — defensible, because the package is
   runtime-free and has no `Effect.log`, but it should be a recorded decision,
   not an unexamined exception.

From the player's perspective the risk is concrete: an untagged error can be
caught by the wrong handler, a cast boundary can admit malformed content, and a
wall-clock stamp in a hashed record can make "identical inputs" produce different
hashes — the exact guarantee the game is built on. From the agent's perspective
the risk is that the rules are prose an agent can drift from, rather than gates
that fail closed.

## Solution

Close the six gaps, and convert `RULES.md`'s non-mechanical rules into preflight
ratchet gates following the ADR-0106 pattern (`verify-no-unknown-casts`,
`assert-runtime-free`, doc budgets). Fixing an instance without a gate invites the
next instance; the gate is the point.

Concretely:

- Make `transitionRecord` a pure function of its explicit inputs (no ambient
  clock), so its hash is reproducible.
- Give every in-process error a stable `_tag` and stop discriminating with
  `instanceof`. Use `Data.TaggedError` where the package is not
  renderer-reachable; where a package *is* renderer-reachable (`contracts`,
  `ship-design`, `campaign`, `campaign-engine`), keep the error plain-TS but add
  a `readonly _tag` discriminator, so `MIG-EXCL-1` (the renderer must not bundle
  `effect`) is not endangered — recorded in an ADR that amends ADR-0128.
- Decode every external boundary (manifest, pack, project file, save) with the
  existing strict `Schema` before use; delete the `as SomeType` casts.
- Move all filesystem reads for the compiler out of `ParseStage` into the
  compiler's loader, and pass an immutable content map into the stage.
- Route campaign archetype serialization through the canonical serializer.
- Record the console-at-entry-point allowance (and the injectable-clock and
  IO-metadata timestamps already accepted in `persistence`/desktop) as a
  documented allowlist inside the new gates.

## User Stories

1. As a maintainer, I want `RULES.md`'s determinism rule to be machine-checked, so
   that a future change cannot reintroduce ambient randomness or wall-clock time
   into an authoritative package without failing CI.
2. As a maintainer, I want the command lifecycle's `transitionRecord` to be a pure
   function of its inputs, so that a transition record's hash is reproducible
   across runs and machines.
3. As an autonomous agent, I want to be unable to import `Effect` or the runtime
   into a runtime-free package by accident, so that the architecture stays
   intact without me having to remember the rule.
4. As an autonomous agent, I want the rules expressed as gates with fixtures, so
   that "did I follow `RULES.md`?" is answered by commands, not judgement.
5. As a player, I want identical commands and seeds to produce identical
   authoritative hashes, so that replay and save/load are trustworthy.
6. As a player, I want a malformed content pack, project file, or save to be
   rejected with a clear diagnostic, so that corrupted content never reaches the
   simulation.
7. As a maintainer, I want every in-process domain error to carry a stable `_tag`,
   so that callers recover by tag rather than by `instanceof` and the error
   vocabulary is auditable.
8. As a maintainer, I want the renderer to keep bundling no `effect`, so that
   `MIG-EXCL-1` stays executed even as I unify errors.
9. As an autonomous agent, I want a gate that fails on `class extends Error` in a
   runtime-free root, so that new untagged errors cannot land.
10. As an autonomous agent, I want a gate that fails on `Date.now()` / `new
    Date()` / `Math.random()` / `randomUUID()` / `process.env` in an authoritative
    root, with a reviewed allowlist, so that deterministic code stays
    deterministic.
11. As a maintainer, I want a gate that flags `JSON.parse(...) as T` at declared
    external boundaries, so that a cast cannot silently replace a schema decode.
12. As a maintainer, I want a gate that forbids `node:fs` imports inside compiler
    stages, so that ADR-0004's "stages do no ambient I/O" is enforced.
13. As a maintainer, I want the console allowance at child-process entry points
    written into the gate allowlist, so that the exception is deliberate and
    reviewable.
14. As a maintainer, I want campaign archetype serialization to be canonical, so
    that key insertion order can never become the contract.
15. As an autonomous agent, I want the new gates registered in the preflight
    runner and mirrored in CI, so that local and CI enforcement cannot drift.
16. As a maintainer, I want each new gate to have a self-test fixture (a bad input
    that fails, a good input that passes) under `scripts/test/`, so that the gate
    itself cannot rot.
17. As a reviewer, I want the audit findings recorded in an ADR, so that the
    "why" behind each allowlist entry survives the change.
18. As an autonomous agent, I want the compiler's parser to receive content as
    input, so that the stage is testable without touching the filesystem.
19. As a maintainer, I want the existing tagged-error idiom extended consistently,
    so that the codebase has one error strategy per reachability class rather
    than three.
20. As a maintainer, I want existing consumers (`desktop` construction,
    `phase-engine` full lifecycle) to keep producing byte-identical records after
    the `transitionRecord` change, so that goldens stay green.
21. As a player, I want no gameplay or balance behaviour to change, so that this
    governance work is invisible in outcomes.
22. As an autonomous agent, I want the change to leave the working tree gated by
    `pnpm preflight`, `pnpm test:scripts`, and `pnpm check`, so that completion is
    objectively provable.
23. As a maintainer, I want the untagged-error migration to leave the renderer
    boundary test and the bundle tripwire green, so that error unification does
    not regress the renderer.
24. As a maintainer, I want the injected-clock exceptions in desktop crash/support
    code and the IO-metadata timestamps in persistence to be explicitly listed as
    allowed, so that legitimate boundary clocks stop showing up as noise.

## Implementation Decisions

### Decision 1 — `transitionRecord` becomes pure

`@bluewave/commands`' `transitionRecord` must not read the ambient clock. The
deterministic value it needs (a campaign-time / phase identity) is already in
scope at every call site, so the function takes it as an explicit argument (or
drops the field from the hashed record and keeps time as non-hashed metadata).
Existing consumers that already bypass the helper are unaffected; the goldens for
the desktop construction workspace and the phase-engine full lifecycle must stay
byte-identical. `CommandStatusTransitionRecord`'s shape is pinned by the
command/event wire contract (ADR-0023/0024), so any field change carries a parity
test from the existing fixture.

### Decision 2 — one tagging strategy per reachability class

- **Not renderer-reachable** (`commands`, `combat`, `ai`, `events`,
  `phase-engine`, `persistence`): use in-process `Data.TaggedError` with a stable
  `_tag`, per ADR-0128's established idiom. `@bluewave/contracts`' `BluewaveError`
  and the `@bluewave/combat` `instanceof BluewaveError` sites move to
  `_tag`-based handling; the shared base is replaced by a discriminated union or
  a per-condition tagged error (no shared "error transformer").
- **Renderer-reachable** (`contracts`, `ship-design`, `campaign`,
  `campaign-engine`): do **not** newly expose an Effect-typed surface
  (`MIG-EXCL-1`, ADR-0125/0128). Keep the plain classes, but add a
  `readonly _tag: "<StableName>"` discriminator and a discriminated-union type,
  and replace `instanceof` with `_tag` checks. This satisfies `RULES.md`'s
  "stable `_tag`, never `instanceof`" without risking the renderer bundle.

An ADR records this split (amending ADR-0128 §1), because it is the one place
where `RULES.md`'s "use `Data.TaggedError`" and the renderer constraint pull in
opposite directions.

### Decision 3 — decode at every declared external boundary

Replace `JSON.parse(...) as T` with a strict `Schema` decode at: the
content-compiler's manifest loader, the desktop project loader, the desktop pack
loader, and any compiler-CLI site that asserts a boundary shape. Reuse the
existing `@bluewave/content-schema` pack/manifest schemas and the persistence
schemas; do not invent parallel schemas. Excess-key rejection is the policy
already pinned by ADR-0105.

### Decision 4 — the compiler loader owns I/O, not the stage

`ParseStage` receives an immutable `CompilerInput` that already carries the file
*contents* (a name→text map), not a directory to read. The compiler entry point
performs the reads and hands the map to the stage. `CompilerStage` stays
synchronous and free of `node:fs`; the stage becomes testable from an in-memory
input.

### Decision 5 — canonical serialization

Campaign archetype selection is serialized with the canonical serializer from
`@bluewave/deterministic`, not `JSON.stringify`, so ordering is defined by the
serializer contract rather than by object insertion order.

### Decision 6 — encode the rules as ratchet gates

New fail-closed gates in `scripts/`, registered in `scripts/run-gates.mjs` for
`preflight` and mirrored in CI (`verify-check-parity.mjs` keeps them honest):

- **`assert-tagged-errors`** — fails on `class … extends Error` in runtime-free
  roots unless the class carries a `_tag` or is on a small reviewed allowlist.
- **`assert-authoritative-determinism`** — fails on `Date.now()`, `new Date()`,
  `Math.random()`, `randomUUID()`, `process.env`, `node:fs` reads in authoritative
  roots, scoped to non-test source, with the injectable-clock and IO-metadata
  allowlist. This backs `pnpm lint:effect`'s warn-level determinism advisories
  with a hard gate rather than relying on warnings.
- **`assert-boundary-decode`** — fails on `JSON.parse(...) as <T>` at a declared
  boundary allowlist of files/functions.
- **`assert-no-stage-io`** — fails if anything under the compiler's stage
  directory imports `node:fs`/`node:child_process`.
- **`assert-canonical-serialization`** — fails on raw `JSON.stringify` in
  authoritative roots outside the canonical serializer and a reviewed allowlist.

Each gate ships with a fixture pair under `scripts/test/` (bad input fails with a
clear message; good input and the real tree pass), mirroring
`verify-no-unknown-casts.mjs` / `assert-runtime-free.mjs` self-tests.

### Decision 7 — ADRs required

Per the ENGINEERING-CONTRACT ADR threshold, write or amend ADRs for: the
errors-by-reachability split (amends ADR-0128), the gate set and its baselines
(extends ADR-0106), and the compiler-stage I/O move if it changes the ADR-0004
stage contract. Amending existing ADRs is preferred to new overlapping ones.

### Decision 8 — no behaviour change

Every fix is governance/structure: hashes of existing runs, goldens, and
simulation outcomes are unchanged. Any change that would alter a golden is a bug
in the fix, not an expected diff.

## Testing Decisions

### Seams

Two seams; the first is new but is the project's existing gate seam, and the
second reuses existing public boundaries.

1. **Primary — the preflight gate suite.** Each new `scripts/assert-*.mjs` gate
   is driven by a bad fixture (must exit non-zero with the offending location) and
   a good fixture plus the real tree (must exit zero), the exact shape of
   `scripts/test/` for `verify-no-unknown-casts` / `assert-runtime-free`. This is
   the one seam that enforces every package at once and is where most of the work
   is proven.
2. **Secondary — existing public behaviour seams**, only where a gate cannot prove
   the fix:
   - `@bluewave/commands` — `transitionRecord` purity and replay-hash equality.
   - `@bluewave/content-compiler` — the parse stage runs from an in-memory content
     input; a malformed manifest is rejected with a diagnostic.
   - desktop `main` — project/pack/save loaders reject malformed input with a
     typed error instead of a cast.
   - `@bluewave/deterministic` — archetype serialization is canonical /
     key-order-independent.

A good test asserts **external behaviour** — a gate exits non-zero on a bad
input, a command transition hashes identically twice, a malformed pack produces a
diagnostic naming the file — never the internal shape of a helper. Bad-fixture +
positive-control pairs are the norm.

### Modules exercised

- `scripts/` — the five new gates and their `scripts/test/` fixtures.
- `@bluewave/commands` — transition-record determinism; error tagging.
- `@bluewave/contracts`, `@bluewave/campaign`, `@bluewave/ship-design` — `_tag`
  discriminators and the retired `instanceof`/`BluewaveError` paths.
- `@bluewave/content-compiler` — loader/stage I/O boundary; manifest decode.
- `@bluewave/campaign-engine` — canonical archetype serialization.
- desktop `main` — decode-at-boundary for project/pack.
- `@bluewave/persistence` — confirm existing IO-metadata timestamps stay outside
  the authoritative hash (regression guard).

### Prior art

- Ratchet gate + fixture pairs: `scripts/verify-no-unknown-casts.mjs`,
  `scripts/assert-runtime-free.mjs`, and their `scripts/test/` self-tests.
- Compiler stage fixtures: `packages/content-compiler/test/stages/`.
- Boundary fail-closed: desktop `main/contentArtifact.test.ts`.
- Replay/determinism: `scripts/verify-cross-process-determinism.cjs`, the
  phase-engine full-lifecycle tests.
- Renderer boundary: `apps/desktop/src/renderer/content-boundary.test.ts` and
  `scripts/check-renderer-bundle.mjs`.
- Error-consumer recovery: `packages/commands/test/error-consumers.test.ts`.

## Out of Scope

- Any gameplay, balance, or simulation-result change; goldens are expected to be
  byte-identical.
- Introducing an Effect runtime anywhere it is not already (ADR-0128 declined the
  runtime wave); no `ManagedRuntime`, no `runPromise` facades.
- Flipping cross-package facades to Effect-typed signatures (ADR-0128 §1).
- The `console.*` at the combat child-process entry point and the desktop
  main/renderer console use — recorded as an allowlist entry, not converted to
  `Effect.log` (main is runtime-free; there is no runtime to log through).
- IO-metadata wall-clock in `persistence` (`saveId`, save `timestamp`,
  `recoveredAt`) and injected clocks in desktop crash/support and drawing-board
  code — accepted at the IO boundary and outside the authoritative hash; listed
  in the determinism gate's allowlist, not "fixed".
- Test-only `Date.now`/`Math.random` used for unique temp paths — allowed; not
  runtime-dependent.
- Migrating `@bluewave/ship-design` off its own manual (non-`Schema`) deserializers
  beyond the tagged-error change — a separate effort if wanted.
- Localization/i18n, mods, and external content tooling.

## Further Notes

**Audit evidence.** The findings behind this spec, with severity:

| # | Rule | Where (module · symbol) | Severity |
|---|---|---|---|
| A | Determinism: no wall-clock in authoritative code | `@bluewave/commands` · `transitionRecord` | Medium |
| B | Errors: stable `_tag`, no `instanceof` | `@bluewave/contracts` · `BluewaveError`; `@bluewave/combat` · damage pipeline `instanceof`; `@bluewave/ship-design` (8 classes); `@bluewave/campaign`; `@bluewave/persistence` · compatibility | Medium |
| C | Schema: decode every external boundary | `@bluewave/content-compiler` · manifest loader; desktop `main` · project/pack loaders | Medium |
| D | Compiler stages free of ambient I/O | `@bluewave/content-compiler` · `ParseStage` | Medium |
| E | Canonical serialization | `@bluewave/campaign-engine` · `serializeArchetypeSelection` | Low |
| F | No `console.*` in library code | `@bluewave/combat` · weather child entry point | Info |

**What already passes** (so the effort does not re-litigate it): `pnpm preflight`
17/17; `pnpm lint:effect` 0 errors / 312 warnings, all five determinism advisories
warn-level and every production hit benign (deterministic `Date.UTC` timestamps,
cloning an existing `Date`, injectable clocks, IO metadata outside the hash, dev/
build `process.env`, `node:*` in IO-boundary packages); no `Effect.run*`/`orDie`/
`yield* Effect.sync` in production source; the runtime-free gate, unknown-casts
ratchet, doc budgets, content lock and placeholder gate all green; the
test-focus gate clean.

**Why gates, not just fixes.** ADR-0106 established that "qualities that would
otherwise only decay" get frozen as preflight gates. `RULES.md` is exactly such a
quality, and the audit shows six rules without one. The deliverable is the fixed
tree *plus* the machinery that keeps it fixed.

**Reachability nuance (do not miss).** Decision 2's split exists because the
renderer value-imports `ship-design`/`campaign`/`campaign-engine` (and thus
`contracts`); adding an Effect-typed error export there risks bundling `effect`
into the renderer and breaking `MIG-EXCL-1`. This is the one place where the spec
deliberately deviates from a literal reading of `RULES.md`'s error rule, and the
ADR is required to say so.
