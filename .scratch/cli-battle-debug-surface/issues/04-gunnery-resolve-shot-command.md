Type: task
Status: resolved

Blocked by: 01

## Question

Add a `gunnery:resolve-shot` command to `apps/compiler-cli` bundling the
"what happens on one shot" gunnery primitives — `resolveAccuracy`, `isHit`,
`resolveHit`, and ammunition consumption (`reserveAndConsumeAmmunition`) —
into a single debug command, rather than exposing each primitive
individually (curated per the map's Notes: gunnery has no single
`resolveGunnery` entry point, only composable primitives).

Design and implement:

- Input: a JSON file matching the relevant `GunneryState` fields (battery/
  gun/mount ids, target, ammunition, fire mode, fire-control solution
  quality, etc. — see `packages/combat/src/gunnery/` for the exact shape)
  plus whatever additional context `resolveAccuracy`'s 16-factor manifest
  and `isHit`'s keyed draw require (a keyed RNG seed/draw index — check
  `packages/combat/src/gunnery/` and its tests for how they're supplied in
  isolation). Document the shape in `--help`.
- Behavior: sequence the primitives the way a real shot resolves — compute
  `finalAccuracyBp` via `resolveAccuracy`, resolve the keyed hit draw via
  `isHit`/`resolveHit`, and consume ammunition via
  `reserveAndConsumeAmmunition` — surfacing each stage's result, not just
  the final outcome, so a caller can see *why* a shot hit or missed (which
  factor drove the accuracy number, what the draw was against what
  threshold).
- Output (human + `--json`): print the accuracy factor manifest, the hit/
  miss result, and the post-shot ammunition state. Human mode should make
  the "why" legible (list the factor manifest with values); `--json` emits
  the structured result.
- Error handling: use the adapter from ticket 01 — in particular the
  `GUNNERY_ACCURACY_FACTOR_MISSING` reason code from the accuracy resolution
  work (`.scratch/b3-m2-gunnery/issues/04-accuracy-resolution.md`) should
  surface cleanly through it.
- Wire into `main.ts` following the existing command-registration pattern.
- Add CLI-level tests with a small hand-built `GunneryState` fixture inline,
  covering a hit, a miss, and a missing-factor error path.

## Answer

Implemented `runGunneryResolveShot` in `apps/compiler-cli/src/commands.ts`,
wired into `main.ts` as `gunnery:resolve-shot`, exported from `index.ts`.

- **Input shape**: `--input <path>` JSON with `{ identity: { battleId,
  batteryId, minute, substep }, accuracyFactors: GunneryAccuracyFactors
  (baseAccuracyBp + the 16 §3 factor keys), salvo: { count, ammunition,
  preferredType, permittedTypes? } }`. `identity` was kept nested in the file
  (not split into flags) since it's the cohesive object the keyed hit-draw
  stream id derives from; only `--seed` (the `RandomEngine` master seed) is
  a CLI flag, matching this CLI's existing `--seed` convention elsewhere.
  Note: `GunneryState` itself (battery/gun/mount ids, target, fire mode,
  etc.) is **not** part of the input — the three bundled primitives
  (`resolveAccuracy`, `resolveHit`, `reserveAndConsumeAmmunition`) don't
  actually consume a `GunneryState`, only the narrower
  `GunneryAccuracyFactors`/identity/ammunition-record shapes shown above;
  the ticket's mention of "GunneryState fields" pointed at the right package
  but the actual call signatures are narrower.
- **Sequencing**: `resolveAccuracy` → `resolveHit` (fresh `RandomEngine(seed)`
  per invocation, so the same seed is deterministic run to run) →
  `reserveAndConsumeAmmunition`, exactly the ticket's specified order —
  surfaces the full factor manifest, the draw vs. threshold, and the
  before/after ammunition account, not just hit/miss.
- **Output**: human mode lists every accuracy factor with its value, the
  final accuracy, the draw and threshold, HIT/MISS, and the ammunition
  account; `--json` emits `{ accuracy, hit, ammunition }` verbatim.
- **Errors**: routed through ticket 01's adapter. Verified against two real
  combat-thrown codes: `GUNNERY_ACCURACY_FACTOR_MISSING` (missing factor)
  and `GUNNERY_AMMUNITION_UNAVAILABLE` (insufficient rounds for the salvo
  count) — both from the actual gunnery primitives, not synthetic errors.
- **Tests**: `apps/compiler-cli/test/gunneryResolveShot.test.ts` — no
  combat mocking. Uses `neutralAccuracyFactors(baseAccuracyBp)` (exported by
  `@bluewave/combat`) to get a deterministic guaranteed HIT
  (`baseAccuracyBp: 10_000` — `isHit` is true for every legal draw) and a
  guaranteed MISS (`baseAccuracyBp: 0`) without depending on the RNG seed.
  Covers: missing `--input`, nonexistent file, invalid JSON (usage-error),
  guaranteed hit with ammunition consumption, guaranteed miss, `--json`
  structural assertions, same-seed determinism, and both adapter error
  paths. Verified end-to-end through the compiled `dist/main.js` binary too:
  hand-computed the expected `finalAccuracyBp` (6,000 base × 9,000/10,000
  range multiplier, all else neutral = 5,400bp) and confirmed the CLI
  produced exactly that, plus confirmed the missing-factor error prints
  the real reason code and context.

Full `compiler-cli` suite (89 tests across 7 files), typecheck, and lint all
pass.
