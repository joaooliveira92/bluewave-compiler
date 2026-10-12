# Validation Report: EFFECT-V4 final acceptance (ticket 37) & Wave 5 exit gate (ticket 38)

## Outcome

`PASS` — migration certified.

## Scope delivered

End-to-end acceptance of the `.scratch/effect-v4-vendor-migration/` effort
(tickets `37-final-acceptance.md`, `38-wave5-exit-gate.md`; proving MIG-GATE-1,
MIG-GATE-SMOKE-1, MIG-GATE-TYPE-1, MIG-GATE-UNIT-1, MIG-GATE-INT-1, MIG-DET-1,
MIG-GRAPH-1/2, MIG-ADR-1, MIG-SCOPE-1, MIG-EXCL-1/2, MIG-WAVE5-ENTRY, MIG-RB-5).
Wave 5's runtime-focused scope was resolved as a documented decision (ADR-0128):
facades stay plain and no `ManagedRuntime`/`runPromise` facade is introduced.

## Requirements evidence

| Requirement      | Evidence                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| MIG-GRAPH-1/2    | `node scripts/assert-single-effect.mjs` ok; `pnpm why effect` shows no registry resolution — every use is `link:../../vendor/effect` |
| MIG-WAVE5-ENTRY  | Wave 4 exit met (ticket 33 PASS, `.ai/reports/effect-v4-wave4-exit-gate.md`)                                                         |
| MIG-GATE-TYPE-1  | `pnpm typecheck` 37/37 (tsgo, `skipLibCheck: true`); `pnpm lint:effect` 0 errors                                                     |
| MIG-GATE-UNIT-1  | `pnpm test:run` green; every focused package suite green (`combat` 3799, `commands` 29, `ai` 37, `phase-engine` 314)                 |
| MIG-GATE-INT-1   | Save/load and compiler/content fixtures green within `pnpm check`                                                                    |
| MIG-GATE-SMOKE-1 | `electron-builder --mac --dir` + `smoke:packaged` — 14/14 PASS; `pnpm test:e2e` 33 passed                                            |
| MIG-DET-1        | `pnpm test:cross-process` `success:true`, hashes identical to the Wave 1–4 exits (no drift)                                          |
| MIG-EXCL-1       | Renderer bundle clean on a fresh build — `check-renderer-bundle.mjs` 20 chunks, `~effect/` 0 hits                                    |
| MIG-EXCL-2       | Sandboxed preload imports no `effect`; packaged build succeeds                                                                       |
| MIG-ADR-1        | ADR-0100–0107 + ADR-0125 + ADR-0128 present and indexed (`docs-check` ok, 127 ADRs)                                                  |
| MIG-SCOPE-1      | No production artifact introduced during ticket production; Wave-5 tickets 34–36 closed without code                                 |
| MIG-GATE-1       | `pnpm check` EXIT 0 end-to-end; `pnpm preflight` 8/8, `format`/`lint`/`lint:effect` green                                            |
| MIG-RB-5         | rollback point: Wave 4 exit `99651575`/`e77cea39`; reverting the Wave 5 doc/ADR delta restores it                                    |

## Commands and observed results

```text
node scripts/assert-single-effect.mjs   -> ok (no registry effect; workspace:vendor/effect)
pnpm why effect                          -> no registry resolution; all link:../../vendor/effect
pnpm typecheck                           -> 37/37
pnpm lint:effect                         -> 0 errors (278 pre-existing warnings)
pnpm check                               -> EXIT 0 end-to-end; desktop e2e 33 passed
pnpm test:cross-process                  -> success:true (hashes below)
electron-builder --mac --dir + smoke:packaged -> 14/14 PASS (incl. no unexpected console errors)
node apps/desktop/scripts/check-renderer-bundle.mjs -> clean (20 chunks)
node scripts/docs-check.cjs              -> ok (391 links, 127 ADRs)
pnpm preflight && pnpm format && pnpm lint -> green
```

## Determinism evidence

Cross-process run (`pnpm test:cross-process`, two child processes, macOS
darwin-arm64) — identical to every prior wave exit, so no hash surface moved
across the migration:

- Content artifact hash: `103c60d3f25d1f6ccf758416ef33754732f0f837ad8021d3985ee027d95bccd9`
- Closing snapshot hash: `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5`
- Replay result hash: `097f992919bdcf70707c8e549a43d008a8169aa90ca67245fcc5d0cdee14b711`
- `"success": true`

## Canonical artifact changes

None. The migration replaced `zod` with Effect `Schema` and plain throws with
in-process `Data.TaggedError`s, all preserving message text, reason codes, wire
formats and hashes.

## ADRs

ADR-0100 (adopted, table amended by ticket 30), 0101–0107, 0125, and **ADR-0128**
(Wave 5 runtime wave not warranted). `docs/adr/README.md` regenerated
(`pnpm adr:index`); `scripts/adr-index.cjs` AREAS updated.

## Known limitations and deferred requirements

Recorded in ADR-0128 and ticket 00 §6: `BluewaveError`/`ship-design`/`campaign`
error classes, hand-rolled reason-code validators, the `persistence` async
facade, and the `campaignInput.ts` filesystem-in-pure-package policy question.
A future non-renderer-reachable async IO seam may introduce a `ManagedRuntime`
under ADR-0100's policy.

## Changed files

- Since Wave 4: `docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md` (new),
  `docs/adr/README.md`, `scripts/adr-index.cjs`,
  `.scratch/effect-v4-vendor-migration/{spec.md,issues/{34,35,36,37,38}.md}`,
  this report. No production code changed in Wave 5.

## Git and remote status

- Branch: `dev`; not pushed; no PR; no merge (local sprint).
- Rollback point: Wave 4 exit state (`99651575`, `e77cea39`).

## Secondary consistency check

Independently re-ran the single-copy guard, `pnpm why effect`, typecheck, lint,
preflight, the renderer-bundle guard and the packaged smoke; all green. The
migration is complete and the `dev` branch is a candidate for the release
boundary (PR to `main`), which remains an orchestrator/human step.
