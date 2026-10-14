# Validation Report: P-2 ship-building ticket 22 — build-time sourcing (release blocker)

## Outcome

`PASS_WITH_LIMITATIONS`. Every point that gates the Drawing Board's "provisional"
label is now VERIFIED against a primary contemporary source; the one remaining
SECONDARY point (the 1890 era factor) is a derived class mean and stays labelled
provisional by design for keels laid 1887–1894.

## Scope delivered

- **Low displacement point:** `[390, 18]` (SECONDARY, Wikipedia displacement) →
  `[330, 18]` (VERIFIED) in `content/production/1880/ship-building/balance.yaml`.
  Brassey's Naval Annual 1901's torpedo-boat flotilla table gives Whiting 330 t
  (p. 373) and Bat 326 t (p. 372); the 18-month duration is Brassey p. 264
  (Whiting 14, Bat 16, p. 263). The old 390 t figure matches no 30-knotter in the
  volume (Jane's-derived).
- **1886 era point:** `buildTimeEraProvenance[0]` SECONDARY → VERIFIED. The
  `buildTimeEraBp` factor gates the same provisional label
  (`buildTimeIsProvisional` checks both tables). Trafalgar laid 18 Jan 1886 / Nile
  8 Apr 1886 (Brassey 1886 p. 413), 11,940 t (p. 185), Nile commissioned 30 Jun
  1891 (Brassey 1892 p. 65), Trafalgar completed FY 1889-90 (Brassey 1891 p. 89).
- **1890 era point:** stays SECONDARY (deliberately) — a derived ~43-month class
  mean, not a per-ship primary duration; source string upgraded from Wikipedia to
  Brassey primary for the window and Royal Sovereign's own 32 months.
- **Content lock** refreshed for the deliberate content change.
- Tests updated to pin the new all-VERIFIED displacement table, the label
  behaviour on both tables, and the UI label.

Explicitly deferred: the 1890 era factor's per-ship class dates (four Royal
Sovereign-class keel dates are not printed in the reachable Brassey volumes; would
need Navy Estimates/parliamentary papers or Conway's). Recorded; not fabricated.

## Requirements evidence

- SPM/ADR-0067 §5 build-time table and ADR-0080 era multiplier: stringency of the
  `VERIFIED` status and the provisional label. Evidence:
  `buildTimeIsProvisional` (`packages/ship-design/src/construction.ts:221`) +
  `packages/ship-design/test/construction.test.ts` (all points VERIFIED; era
  bracket tests; mechanism preserved via a demoted copy).
- Ticket 22 acceptance (provenance per point, destroyer source added, provisional
  label dropped once sourced): `docs/research/ship-building-build-times.md` +
  the two new research notes + `DrawingBoard.test.tsx`.

## Commands and observed results

```text
pnpm preflight                                    -> run-gates: 37/37 passed
pnpm content:verify                               -> Content lock verified, hash 3f57ba1f…060f30
pnpm typecheck                                    -> Tasks: 40 successful, 40 total
pnpm format                                       -> All matched files use the correct format.
pnpm lint                                         -> 0 warnings and 0 errors
pnpm check:golden                                 -> All 11 hashes match golden reference
pnpm check:determinism                            -> two runs byte-identical
pnpm check:equivalence                            -> two fresh processes byte-identical (report + catalogue)
pnpm check:balance-reports                        -> balance-report check: ok
packages/ship-design: npx vp test run             -> 81 files, 1300 tests passed
apps/desktop construction: npx vp test run ...    -> 23 files, 236 tests passed
```

The `pnpm check` end-to-end command was **not** run whole: this checkout is shared
with a concurrent session mid-implementing ship-part-model ticket 14 (unrelated
files), so the full gate would validate that session's in-flight code too. Each
step that touches this change was run individually and is green.

## Determinism evidence

- Content artifact hash: `3f57ba1f9865714cfb1d2c50546ffe9e5f695d0f4ecd0d1ceb8a265bce060f30` (was `19ecf232…64f3b2`).
- Cross-process child runs: byte-identical (`check:determinism`).
- Equivalence report/catalogue across two fresh processes: byte-identical.
- Golden hashes: 11/11 unchanged.
- Processes/OS: macOS (darwin), Node per repo policy.

## Canonical artifact changes

The compiled content artifact changes:

- Old bodyHash `19ecf232435bc62ea5a6989a63da0b956067f4eb30a2b2786f5ee8742e64f3b2`
- New bodyHash `3f57ba1f9865714cfb1d2c50546ffe9e5f695d0f4ecd0d1ceb8a265bce060f30`
- Cause: build-time table low point 390→330 t and provenance/status edits.
- Version impact: `contentVersion` unchanged (`0.5.0`); no save/ruleset contract
  version change. Compatibility: none required. Migration: none.
- Regeneration: `pnpm content:verify` (or refresh `content-lock.json` via the
  deliberate content-change procedure, CAH-LOCK).

`historicalBuildMonths` changes only by rounding at the sub-5,600 t end (e.g.
~390 t constant vs ~330 t point); campaign golden hashes are unchanged.

## Tests added

- `packages/ship-design/test/construction.test.ts`: every displacement point is
  VERIFIED; low point is 330 t and cites it; provisional mechanism preserved via a
  demoted copy; era bracket expectations updated (1880 no longer provisional, 1888
  provisional).
- `apps/desktop/.../drawing-board/DrawingBoard.test.tsx`: the label disappears for
  the default hull and a 1895 Majestic hull, and reappears for a 1890-era keel.

## Security and cancellation

No trust-boundary, parsing, path or cancellation change. Content YAML only.

## Performance observations

None material.

## ADRs and dependencies

No new ADR: this applies ADR-0067 §5 (build-time provenance statuses) and ADR-0080
(era multiplier) to the previously unsourced points; ADR-0067's status definitions
already cover the change. No new dependency.

## Known limitations and deferred requirements

- The 1890 era factor remains SECONDARY (derived class mean) → keels laid
  1887–1894 stay "provisional". Deferred to a future sourcing pass (Navy
  Estimates/parliamentary papers or Conway's).
- Jane's Fighting Ships 1898 (the source of the old 390/420 t and the exact
  Bat/Whiting dates) is not reachable (the only archive.org item is a mislabelled
  1914 reprint).

## Changed files

- `content/production/1880/ship-building/balance.yaml` — points/provenance/era + comments.
- `content/production/1880/content-lock.json` — refreshed bodyHash.
- `docs/research/ship-building-build-times.md` — resolved points.
- `docs/research/ship-building-build-times-destroyer-displacement.md` — new note.
- `docs/research/ship-building-build-times-era-multiplier-sourcing.md` — new note.
- `packages/ship-design/test/construction.test.ts` — tests.
- `apps/desktop/src/renderer/screens/construction/drawing-board/DrawingBoard.test.tsx` — UI test.
- `.scratch/ship-building/issues/22-build-time-estimate-rows.md` — ticket resolved.

## Git and remote status

- Branch: `dev`
- Commits: this report's sprint commit.
- Working tree: shared with a concurrent session; only ticket-22 paths staged/committed.
- Push status: not pushed (no instruction to push).
- Pull request: none.
- Merge performed: no.

## Secondary consistency check

- `content:verify` re-run after the lock refresh: verified at the new hash.
- Stage set verified by explicit pathspec (concurrent session's changes excluded).
- Golden/determinism/equivalence re-run green on the current tree.
