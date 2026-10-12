# 34 — Unify cross-package facades onto Effect-typed interfaces

**Type:** implementation
**Status:** done
**Blocked by:** none (33 done)
**Frontier:** no

## What to build

The wide-refactor **contract** step: flip the public surfaces that were held
plain-TS-compatible through Waves 1–4 to their Effect-typed interfaces in one
coherent step, so the monorepo exposes one idiom. Flip boundaries deliberately,
package by package, keeping `pnpm check` green throughout.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-WAVE5-EXIT,
  MIG-RUNTIME-1**; read "facades stable until unification" in Solution and Wave 5.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2 (facade rule), §5.3.
- `.scratch/effect-v4-adoption/issues/08-adoption-sequencing-dod.md` (facade
  rule).

## Acceptance criteria

- [x] Inventory produced: every candidate cross-package facade classified
      against the code (not its frontmatter).
- [x] Decision recorded: no facade is flipped — each candidate is
      renderer-reachable (must stay Effect-free, `MIG-EXCL-1`/ADR-0125) or a
      synchronous pure API (ADR-0100 §2 forbids wrapping). See ADR-0128.
- [x] No package reintroduces `zod`, changes a wire format, or adds ambient
      randomness/wall-clock reads (`MIG-WIRE-1..3`, `MIG-DET-1`).
- [x] `pnpm check` green; single-copy guard green.

## Notes

- This is the migration's only wide, fan-out change; size batches by blast radius
  (per package) and keep the old form until no caller remains.

## Comments

### Audit note (ticket 00, 2026-10-12)

**First deliverable is an inventory, not a flip.** Nothing in the tree exposes an
Effect-typed interface today and there is no list of "deferred" surfaces to flip.
Before changing any signature, list the surfaces that actually need Effect
types. Candidates (ticket 00 §5-B): `persistence` `SaveStore`
(`store.ts:1-11`, sync by contract, ADR-0104 §6), `content-compiler`
(`stages/parse.ts`, `fullSurface.ts`, `artifact.ts`), desktop `src/main`
handlers, `compiler-cli`. Each must justify itself against ADR-0100 §2; a
synchronous pure API is **not** flipped. Renderer-reachable packages stay
Effect-free. If the inventory is empty, close this ticket and let 35/36 proceed
directly.

### Decision (2026-10-12)

**Inventory is empty — nothing is flipped.** `rg` for any deferred
"facade"/"flip"/"plain-TS" marker in `packages`/`apps` returns nothing: no
surface was ever annotated as awaiting an Effect-typed signature. Each candidate:

| Surface | Verdict | Why |
| --- | --- | --- |
| `persistence` `SaveStore` (`store.ts:98`) | not flipped | synchronous by contract (ADR-0104 §6); already uses runtime-free `Schema` + `Data.TaggedError` (`errors.ts`); renderer-reachable via the `contracts` closure |
| `content-compiler` (`index.ts` `CompilerInput`/`CompilerStage`/…) | not flipped | renderer-reachable by `package.json` closure (ticket 00 §5-A); Effect-typed signatures would expose `effect` to the renderer (`MIG-EXCL-1`) |
| `campaign`/`ship-design`/`campaign-engine` | not flipped | renderer value-imports them; error classes stay plain |
| desktop `src/main` | app boundary, not a cross-package facade; decided by ticket 35 |
| `compiler-cli` | entrypoint; decided by ticket 36 |

Closing per this ticket's own note ("if the inventory is empty, close this
ticket"). Resolution and rationale recorded as **ADR-0128**; tickets 35/36 closed
under the same decision. No production code changed.
