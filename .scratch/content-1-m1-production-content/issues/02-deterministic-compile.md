# CONTENT-1 — 02: Deterministic compile + golden hash for the production pack

## Question

Prove the authored `content/production/1880/` pack compiles deterministically
through the existing compiler (desktop path, which wires campaign
collections), capture its golden snapshot/content hashes, and add a focused
test that locks the pack compiles clean with zero errors and stable hashes.

## Type

task

## Status

resolved

## Notes

- No engine code changes. Validation path: `apps/desktop/src/main/compiler.ts`
  `runCompilation(contentDir, signal)`.
- Content compiler collections must be strict array YAML; campaign files read
  by `CampaignCompiler`.
- DESIGN-55 §12 classification is a REL-1 materialization; pack is authored
  supported-only (no reachable locked content).

## Blocked by

01-author-m1-production-pack.

## Answer

`runCompilation(content/production/1880)` → `success: true`, `diagnostics:
[]`, 14 nations. Deterministic double-compile hashes locked in a new test
`apps/desktop/test/production-pack.test.ts`:
content `449532384b604c69dd9740bd92b3357e05f62a98fbdde9bcea36a0e409275f0f`,
snapshot `f3e72642371e5a112f5ed8ec99778e763386ccd1024352d4228f6055c375d3f3`.
