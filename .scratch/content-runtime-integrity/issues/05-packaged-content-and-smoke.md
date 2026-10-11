# 05 — Packaged content resolution + fresh-game packaged smoke

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

## What to build

The compiled content artifact ships inside the packaged application and is
resolved relative to the app resources — not by walking up to the repository
root. Packaging configuration includes the artifact. The packaged smoke launches
the real binary, starts a **fresh** game (not merely opening a pre-compiled
save), and verifies the drawing board content loads and renders.

This closes a shipping landmine: today main resolves content by walking four
levels up to the repo root, which cannot exist inside a packaged app, and the
packaging config never includes the content tree.

## Acceptance criteria

- [ ] Packaged content resolution uses the app resources path and works from an
      installed / asar build with no repo-relative `../../../..` dependency.
- [ ] Packaging configuration ships the content artifact as a resource.
- [ ] `smoke:packaged` starts a fresh game and asserts the drawing board content
      loads (screenshot + clean console), not just a saved-game open.
- [ ] The packaged app runs correctly on a machine without the repository content
      tree present.

## Notes

- Grounds on the current content-pack resolver's explicit "packaged-app path
  resolution is out of scope" note and the release-verification gate ADR.
- The existing packaged smoke opens a compiled save; extend it to cover a fresh
  game, which is the path that actually reads shipped content at runtime.
- Depends on 03 (there must be an artifact for main to load and ship).
## Comments

**Partial (2026-10-11, superseded by the resolution below).** Packaged content
resolution and packaging inclusion landed; the fresh-game smoke is written and
runs in CI but was not executed in the reviewing environment.

- `src/main/contentPack.ts` now resolves both `content/generated/1880` (the
  artifact) and `content/production/1880` from `process.resourcesPath` in a
  packaged build (guarded by `process.defaultApp`), falling back to the
  repo-root path in dev/under node (CRI-PKG-1). Unit-tested in
  `src/main/contentPack.test.ts` (packaged vs dev vs plain-node).
- `electron-builder.yml` ships both trees as `extraResources` (CRI-PKG-2).
  The production tree ships so a packaged build can compile a fresh campaign;
  it is folded into the artifact by ticket 07.
- `scripts/packaged-smoke.mjs` now starts a **fresh game** (mirroring
  `e2e/flows.ts`) and asserts the drawing board renders the artifact-backed
  ship-building catalogue (hull sections + ship plan) plus the packaged
  coastline chunk; CI runs it without a precompiled save (CRI-PKG-3/4).
- Explicit `pnpm content:build` CI steps added to `quality.yml` and
  `desktop-e2e.yml`; the desktop vitest global setup rebuilds
  `@bluewave/content-compiler` so tests cannot run against a stale dist.

**Remaining.** The packaged fresh-game path no longer reads the raw production
tree for `compileCampaign`/`listNewGameOptions`: after ticket **07** those
commands compile from the verified artifact (`compileProductionCampaignFromArtifact`),
so the runtime dependency on `content/production/1880` is gone (the raw tree is
still listed as an `extraResources` entry, now needed only as a build-time input
for `content:build`, not at runtime — it can be dropped from resources once the
packaged smoke confirms the artifact path). The packaged smoke still needs one run
against a real `electron-builder` build to confirm CRI-PKG-3/4 end-to-end.

**Resolved (2026-10-11).** The packaged smoke was run end-to-end against a real
`electron-builder --mac --dir` build, and the raw production tree was dropped
from resources now that ticket 07 makes the artifact the sole runtime boundary.

- **Smoke script fix (CRI-PKG-3).** The home-map regression check was misplaced:
  it ran *after* the shell navigated to Construction, where the Overview map is
  unmounted, so `getByRole("application", { name: /World map/ })` never appeared
  and the run timed out before printing any check. The map block now runs while
  the fresh campaign is still on Overview (its home screen); the drawing-board
  checks follow. This reorder is script-only; the resource removal below is the
  only product change.
- **Screenshot leg in the gate (CRI-PKG-3).** The drawing-board screenshot is now
  captured on every smoke run (default `test-results/packaged-smoke.png`, `--shot`
  overrides) and `desktop-e2e.yml` uploads it as `packaged-smoke-screenshot`, so a
  green packaged smoke always leaves the reviewer a screen to inspect.
- **CRI-PKG-1/2/4.** `resolveProductionPackDir` (the last packaged-runtime consumer
  of `content/production/1880`; only a test-only determinism child still names the
  path) was dead after ticket 07, so it and the raw tree's `extraResources` entry
  were removed: the packaged app now ships only `content/generated/1880`.
  `contentPack.ts` resolves the artifact from `process.resourcesPath`;
  `contentPack.test.ts` covers packaged / dev / plain-node. ADR-0124's
  "still shipped" consequence is amended; ADR-0099's smoke description is updated.
- **Proof.** `smoke:packaged` against the real build passes all 15 checks
  (fresh game compiles onto Overview, month header, debug gate, home map paints
  the packaged coastline chunk with 36 reachable areas, drawing board opens on
  the artifact-backed catalogue with 8 hull sections and a rendered plan,
  drawing-board screenshot captured, no uncaught exceptions, no unexpected
  console errors). It also passes with the `Bluewave.app` copied to a temp dir
  outside the repository, and with the raw production tree no longer present in
  `Contents/Resources/content` — so the packaged app loads its shipped content
  from app resources alone.

Artifact shipped: `content/generated/1880/{content-artifact.json,content-manifest.json}`
(manifest `bodyHash` `f7b574c3…`, stable across rebuilds; the earlier
`b54fd387…` in tickets 02/03 predates the campaign-file collections added by
ticket 07, which changed the bundle — an expected content update, ADR-0124).
