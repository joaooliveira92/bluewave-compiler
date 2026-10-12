# Mission

You are working in the `bluewave-compiler` monorepo (a deterministic naval wargame
simulator; TypeScript, pnpm workspaces + Turborepo, Vitest, Electron desktop app).
Your job is to drive the project from "release-boundary candidate" to a genuinely
production-ready, released state. Work through the seven workstreams below in
leverage order. This is scheduled work on the `dev` branch.

## Ground rules (read first, they govern everything)

1. Read `AGENTS.md`, `docs/agents/issue-tracker.md`, `.ai/ENGINEERING-CONTRACT.md`,
   `.ai/ORCHESTRATION.md`, and `.ai/REVIEW-PROMPT.md` before editing. The tracker is
   local markdown under `.scratch/<slug>/` (spec.md + issues/). One ticket at a time.
2. Session start: `git pull --rebase` on `dev`, then `pnpm preflight`. Red on a
   conflict marker or in-progress merge = stop and resolve first (ADR-0044).
3. The definition of done for ANY code change is the full gate, green on a clean
   uncached run: `pnpm check` (preflight, format, lint, lint:effect, test:scripts,
   check:licenses, typecheck, build, test:run, check:balance-reports, test:e2e).
   Also prove cross-process determinism and golden hashes unchanged unless the
   change is explicitly a documented golden regeneration (ADR-0007).
4. Every behaviour change gets an ADR in `docs/adr/` and a traceability entry.
   Deferred work is recorded, never silently dropped.
5. A UI change is not done until you capture the affected screen with `pnpm snap`
   (see `docs/agents/desktop-view.md`) and check it against the ticket's acceptance
   criteria (screenshot + aria.yaml, clean console, no churn warning).
6. Commit as you go with Conventional Commits, one logical change per commit. Keep
   `dev` releasable at all times.

## CRITICAL environment caveat (verify before every write)

Another autonomous process has been committing to `dev` concurrently. While a prior
session worked, a `git reset` silently **reverted uncommitted working-tree changes**
(deletions included). Therefore:

- Before starting, run `git log --oneline -20` and `git status`. Re-derive the real
  current state; do NOT trust this prompt's specifics blindly — branches advance.
- Do destructive edits (deletions/moves/renames) as a **single reviewed commit while
  the tree is otherwise clean**. Re-check `git status` immediately before and after.
- If you find your changes were reverted, that is the concurrent process; re-apply
  and commit promptly. Never leave large uncommitted edits sitting.
- If two writers collide on the tracker, stop and surface it rather than fighting.

## Workstream 1 — Cut the release from `dev`  (highest leverage)

Current: `git rev-list --count origin/main..HEAD` was 303; no release has ever been
cut; `CHANGELOG.md` has a large "Unreleased" section; `.github/workflows/release.yml`
builds signed dmg/zip (macOS), nsis (Windows) and AppImage (Linux) on a `v*` tag.

Do:
1. On a clean checkout, run the full `pnpm check` and record EXIT code + e2e count.
2. If green, prepare the `dev → main` release PR per AGENTS.md. Inspect status, full
   diff vs base, and every commit in the range (not just the tip).
3. Verify the release secrets actually work: `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`,
   `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `WIN_CSC_LINK`,
   `WIN_CSC_KEY_PASSWORD`. A dry-run of `pnpm --filter @bluewave/desktop run pack:*`
   locally where possible; otherwise tag a pre-release and run the workflow to a
   **draft** release and confirm signed artifacts are produced.
4. Move the "Unreleased" CHANGELOG entries under the new version; bump
   `apps/desktop/package.json` version to match the tag.
Deliverable: a tagged draft release with signed installers, or a precise blocker
report naming the exact secret/step that failed.

## Workstream 2 — Close the two open release-readiness gaps

Spec: `.scratch/release-readiness/spec.md`. Work the frontier tickets one at a time:

- `.scratch/release-readiness/issues/01-performance-budget-tripwire.md` — deterministic
  node benchmark for (a) month-advance over the production pack at a fixed seed and
  (b) strategy map at max zoom / largest dataset. Measure first, set the ceiling at
  ~2–3× baseline (catch order-of-magnitude regressions, avoid flake), record the
  baseline in the ticket, and wire the breach into CI.
- `.scratch/release-readiness/issues/02-crash-error-observability.md` — ADR on
  local-only vs opt-in reporting with an explicit privacy stance; main + renderer
  global handlers that never hide a failure; a user-shareable support bundle path
  verified by a test that forces a crash and asserts the bundle exists; no network
  call without explicit consent.

## Workstream 3 — Operationalize save compatibility

ADR-0113 chose reject-on-mismatch; ADR-0129 bumped compatibility. The polish:

- Add a per-released-version save fixture corpus loaded in CI (start it with v1 at
  first release). This is the regression net for the next format bump.
- Confirm the rejection path is user-facing and human-readable end to end
  (`loadCampaign` → bridge → `useCampaignFiles.openCampaign`), with a test per
  released version that a mismatched fixture produces the clear message, not a
  cryptic diagnostic.

## Workstream 4 — Reconcile design docs with the ADR record

`.scratch/doc-reconciliation/issues/01-design-doc-adr-reconciliation.md` (open).
80+ ADRs have changed implemented behaviour while the canonical docs still declare
"Canonical design baseline". For each behaviour-changing ADR, either amend the owning
DESIGN doc (mark amendment + ADR id) or record why no doc change is needed. Goal: a
reader can trust `docs/rules/`, `docs/domain/`, etc. against what the engine does.
Keep `pnpm preflight`'s doc gates green.

## Workstream 5 — Make the tracker trustworthy (stale statuses)

Several tickets contradict their specs; an autonomous agent acting on them will
redo finished work or miss real work. Reconcile each to its true state:
- `.scratch/b3-m2-gunnery/` and `.scratch/b4-m2-armor-damage/` carry
  `READY_FOR_AGENT` INC tickets, but downstream specs declare "B-3/B-4 IMPL DONE".
- `.scratch/c1-m3-torpedoes/` spec says implementation COMPLETE while INC-1..3 show
  `open`; check `c2-m3-mine-warfare` and `c3-m3-submarines` the same way.
Verify against the actual code/tests (not just prose): if the capability exists and
is tested, mark the tickets resolved/done (or delete the superseded folders); if it
genuinely does not exist, reset the spec status and work the frontier. Then reconcile
the just-landed `.scratch` pruning (see Workstream 7), keeping `.ai/specs/README.md`
and `.ai/specs/` pointers consistent. Deliverable: every kept ticket's status matches
reality.

## Workstream 6 — Test-suite signal quality

`.scratch/test-hygiene/issues/01-baseui-act-warnings.md` — silence/absorb the base-ui
HoverCard `act()` warning flood so real failures are visible. Separately, assert there
are no `.only` and no unexplained `.skip` in CI (there was ~1 skip; keep it at zero or
document it).

## Workstream 7 — Land the `.scratch` tracker pruning (committed)

A prior session deleted ~31 completed folders + loose files (`refactor.txt`,
`shipbuilding.txt`, `.DS_Store`) and updated `.ai/specs/`; that change was reverted by
the concurrent reset. Redo it and commit it as one reviewed change:
- Keep only folders with open/queued/deferred work. Delete fully-completed efforts
  (git history is the archive).
- Update `.ai/specs/README.md` and remove dangling `.ai/specs/*.md` pointer files.
- Before deleting, `git tag scratch-archive-<YYYY-MM-DD>` on current HEAD so the
  removal has a single obvious restore point, and `git status` clean.
- Verify no preflight gate breaks: `node scripts/docs-check.cjs`,
  `node scripts/verify-doc-budgets.mjs`, `node scripts/verify-no-unknown-casts.mjs`.
- Leave historical `.scratch/<slug>` citations in ADRs / `docs/PROGRESS.md` /
  `.ai/reports/` / `.ai/SPRINT-PLAN.md` as-is unless explicitly asked to prune them.

## Sequencing & interaction with the concurrent process

- Best order: 7 (quick, makes the tracker sane) → 5 (trust the tracker) → 2 (ship
  blockers) → 3 → 1 (release) → 4 → 6. If the concurrent committer is mid-sprint,
  do the read-only/analysis parts first and land edits in small isolated commits.
- Use the orchestrator + subagent roles from `.ai/ORCHESTRATION.md` where helpful
  (spec-creator/to-spec, to-tickets, implementator, reviewer), and run the
  orchestrator's own validation gate before every commit. A subagent report is a
  spec, not source of truth — re-read files before editing.

## Reporting

After each workstream, report: exact commands run + results, files changed, ADRs
added, and any blocker with the precise failing step. Do not claim a workstream done
until its gate is green on a clean uncached run. Do not merge to `main` yourself
without the release PR context; surface the PR URL.
