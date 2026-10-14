# Data.TaggedError + error-handling conformance vs vendored effect@4.0.2

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Do Bluewave's 14 `Data.TaggedError` classes and its error-handling conventions match
vendored `effect@4.0.2` behaviour and idioms?

Targets:

- **The 14 classes** in `packages/{ai,combat,commands,diagnostics,events,persistence,phase-engine}/src/errors.ts`.
  Confirm the `Data.TaggedError` shape, `_tag` discrimination, and that no live
  consumer relies on `instanceof` (ADR-0152 replaced `instanceof` with `_tag`).
- **`_tag` round-trip hazard** — `.ai/reports/effect-v4-hardening.md` recorded a latent
  trap: `JSON.stringify`/`structuredClone` of a tagged error adds `_tag` / drops it.
  Verify against vendored source which way it goes and whether any authored consumer
  is exposed.
- **`Data.TaggedError` vs `Schema.TaggedError`** — we never use `Schema.TaggedError`.
  Confirm that is correct under the reachability rule (ADR-0152: not renderer-reachable
  → `Data.TaggedError`; renderer-reachable → plain class with `readonly _tag`).
- **`RULES.md` §Errors** — "no `orDie`", "`_tag`", etc. Check those claims against
  vendored `Effect`/`Cause` behaviour.

Deliver: severity-tagged verdicts with vendored evidence, plus remedies. Write durable
findings to a note under `docs/research/`.

## Answer

Resolved. Evidence: `docs/research/effect-conformance-02-tagged-errors.md`.

- **F1 (Info, accept):** all 14 classes conform (`Data.TaggedError`, stable `_tag`); no
  live *source* consumer discriminates by `instanceof`. Vendored shape
  `vendor/effect/src/internal/core.ts:689-699`.
- **F2 (Minor):** three tests narrow caught values by `instanceof` contrary to
  `RULES.md:64` — narrow on `_tag` or record a test exception.
- **F3 (Info, latent):** the serialization hazard is both-directional —
  `JSON.stringify` **adds** `_tag` (`core.ts:682-684`), `structuredClone` **drops** it;
  `catchTag` matches strictly on `_tag` (`internal/effect.ts:3027-3030`). No authored
  consumer serializes a tagged error. Recover by `_tag`/`catchTag` *before* any
  stringify/clone.
- **F4 (Major, gate gap):** live `instanceof` violation outside the gate —
  `ContentArtifactError` (`apps/desktop/src/main/contentArtifact.ts:20`) has no `_tag`
  and is discriminated with `instanceof` (`contentCommands.ts:25,43`, `index.ts:295`);
  `assert-tagged-errors.mjs:32-35` scans packages only, so `RULES.md:64` is not enforced
  repo-wide. Feeds new ticket 12.
- **F5/F6 (Minor):** ADR-0152 is self-inconsistent on `persistence` (§1 vs §5) and
  "renderer-reachable" is undefined; the gate's scopes diverge from ADR-0152
  (`campaign-engine`, the five `Data.TaggedError` packages unscanned; `contracts`
  mis-scoped). Harmless today. Feeds ticket 12.
- **F7 (Info, accept):** `RULES.md §Errors` claims are grounded; `orDie` real but unused
  (no runtime per ADR-0128).
