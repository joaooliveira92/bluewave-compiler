# Validation Report: CONTENT-2 — PRE_WAR-Band Technology & Ship-Design Continuation

## Outcome

`PASS` (with a distinct, pre-existing unrelated failure documented below that
predates this change and is not caused by it).

## Scope delivered

- Appended **25 `category: PRE_WAR` research technologies** across 10 fields to
  `content/production/1880/technologies.yaml`, continuing the CONTENT-1 EARLY DAG
  acyclically (every prerequisite is an existing EARLY id or a new PRE_WAR id).
- Appended **11 ship-design templates** (real PRE_WAR classes) to
  `content/production/1880/designs.yaml` with integer inputs accepted by the
  campaign compiler's `SafeInt` path.
- Bumped pack `version` `0.1.0` → `0.2.0` in `content/production/1880/pack.json`
  (new content increment / version impact).
- **Deferred (not authored):** deployment (DESIGN-25, unassigned), blockades
  (B10c, blocked), AVIATION/CARRIER_OPERATIONS PRE_WAR techs (M4 unit mechanic
  unaccepted → DESIGN-55 §14). No `CONTENT_ONLY_LOCKED` item was authored, so no
  reachable-locked content.

## Requirements evidence

- Research / Ship Design owning capabilities `ACCEPTED` (A-0b) — every authored
  item is `SUPPORTED_MECHANICAL` per DESIGN-55 §12.
- Technology records validated by `DesignTemplate`-independent schema +
  content-compiler stages (duplicate-id, missing-reference, acyclic). Prereq
  graph acyclic (worker self-check + compile passes with zero diagnostics).
- Design records validated per-entry against `DesignTemplateSchema` in the
  campaign compiler (`buildDesignsFromData`); zero `SCHEMA` diagnostics.
- Production pack compiles via desktop `runCompilation` with `success:true`,
  `diagnostics:[]` (proving test).

## Commands and observed results

```text
pnpm -w turbo run build test
> @bluewave/content-schema:test: Test Files 1 failed | 2 passed (3); Tests 10 passed
> Tasks: 23 successful, 32 total; ERROR @bluewave/content-schema#test exited (1)
> NOTE: the single failing suite is packages/content-schema/test/nation.test.ts,
  which imports content/research/nations/1880/index.ts — a file deleted on main in
  commit 2b3d925 ("removed deprecated files"), unrelated to this change.

pnpm test:run
> Test Files 1 failed | 37 passed (38); Tests 387 passed (387)
> FAIL packages/content-schema/test/nation.test.ts (pre-existing broken import)

pnpm exec vp test run apps/desktop/test/production-pack.test.ts
> Test Files 1 passed (1); Tests 1 passed (1)
```

The production-pack test (the enforcement point for this content) passes. The
only red suite is the unrelated pre-existing `nation.test.ts` broken import.

## Determinism evidence

Repeat compiles of `content/production/1880` via the desktop `runCompilation`
return identical hashes (asserted by `production-pack.test.ts` second-compile
check). Captured current hashes:

- Content artifact hash: `c3be5604fc403399cba0338807fbca83c3e77e6d2bf9a0dcbdfca94a7cf6696f`
- Initial snapshot hash: `cb1f149769b0d3a6807a2d098d4a6fba8780f1f6161b67f76c661df9d5f279aa`
- Closing snapshot / command / event / financial / random-decision ledger hashes:
  not exercised by this content-only increment (no campaign executed). Marked
  unavailable, not passed.
- Replay / cross-process: not exercised by this content-only increment (the
  cross-process fixture is separate and untouched). Marked unavailable.
- Processes/OS: single-process macOS; determinism asserted by same-input test.

## Canonical artifact changes

| Artifact                   | Old hash                                                           | New hash                                                           | Cause                                                     | Version impact                                       | Migration               |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- | ----------------------- |
| Content artifact (`0.1.0`) | `449532384b604c69dd9740bd92b3357e05f62a98fbdde9bcea36a0e409275f0f` | `c3be5604fc403399cba0338807fbca83c3e77e6d2bf9a0dcbdfca94a7cf6696f` | Added 25 PRE_WAR techs + 11 designs; pack `0.1.0`→`0.2.0` | New content version `0.2.0`, ruleset `1.0` unchanged | None (additive content) |
| Snapshot (`0.1.0`)         | `f3e72642371e5a112f5ed8ec99778e763386ccd1024352d4228f6055c375d3f3` | `cb1f149769b0d3a6807a2d098d4a6fba8780f1f6161b67f76c661df9d5f279aa` | Added designs into the snapshot (designs/designFamilies)  | —                                                    | None                    |

Cause is an intended authoritative content addition (new era-band slice), not a
test/golden workaround. Regeneration command: desktop `runCompilation(content/production/1880)`.

## Tests added

- No new test source added; the existing `apps/desktop/test/production-pack.test.ts`
  remains the lock (asserts clean compile, 14 nations, deterministic hashes) and
  passes with the new content. Content-only increment: no code-bearing unit,
  property, metamorphic, save/load, replay, cancellation, or security test
  changes were warranted (no engine change).

## Security and cancellation

- No engine/compiler change; no new trust boundary, parsing, path, or temp-file
  surface. `runCompilation` already accepts `AbortSignal`; content-only.

## Performance observations

- None collected; content-only. No wall-clock data is authoritative.

## ADRs and dependencies

- No new ADRs or dependencies (zero code change; content + docs only).

## Known limitations and deferred requirements

- **Deployment** (DESIGN-25, unassigned) and **blockades** (B10c, blocked on the
  victory-classification decision request) content remain deferred; recorded in
  the SCRATCH tickets, not silently dropped.
- **AVIATION / CARRIER_OPERATIONS** PRE_WAR techs deferred to M4/D-track content
  (their unit mechanic is not accepted; authoring a reachable AVIATION tech would
  violate DESIGN-55 §14).
- **Pre-existing unrelated defect (not caused by this change):**
  `packages/content-schema/test/nation.test.ts` imports
  `content/research/nations/1880/index.ts`, which was deleted on `main` in commit
  `2b3d925` ("removed deprecated files") during the canonical-Nations migration
  (`9801f90`). This makes the `content-schema` suite fail to load that file
  (37/38 suites pass; all 387 tests pass). It is tracked for a distinct repair
  (point the import at the surviving canonical source or restore the corpus) and
  was NOT modified here because its correct fix depends on the intended canonical
  nation-corpus home, which is a separate, ambiguous concern — the contract
  forbids guessing/loosening it.

## Changed files

- `content/production/1880/technologies.yaml` — +25 PRE_WAR techs (10 fields; acyclic).
- `content/production/1880/designs.yaml` — +11 PRE_WAR design templates.
- `content/production/1880/pack.json` — version `0.1.0`→`0.2.0`.
- `AGENTS.md` — workflow contract (dev branch, continuous sprint, orchestrator model).
- Traceability: `.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`; report; research + wayfinder (PR #3).

## Git and remote status

- Branch: `dev`
- Commits: `5bd5946` (AGENTS.md workflow); + this content sprint commit.
- Working tree: clean after commit.
- Push status: pushed to `origin/dev`.
- Pull request: open from `dev` → `main` (this content increment).
- Merge performed: `no`.

## Secondary consistency check

- Re-read `technologies.yaml` / `designs.yaml` tails after authoring (verified
  well-formed toplevel sequences, valid prereq references).
- Re-ran the production-pack test independently (2nd pass; PASS) and captured the
  final hashes via a throwaway spec that was removed before commit (repo clean of
  temp artifacts).
- Confirmed `git ls-tree main content/` shows only `content/production` — i.e.
  the failed `content/research/nations` import is absent on `main` independent of
  this branch, corroborating it is pre-existing.
