# ADR-0152: Errors are tagged by reachability — `Data.TaggedError` inside, `readonly _tag` at the renderer boundary

## Status

Accepted (2026-10-13). Amends [ADR-0128](ADR-0128-effect-v4-runtime-wave-not-warranted.md) §1
and extends ADR-0128's runtime-free error idiom; executes [RULES.md](../../RULES.md)
"Errors" together with [MIG-EXCL-1](archive/ADR-0125-renderer-content-ipc.md).

## Context

`RULES.md` "Errors" requires every in-process domain error to carry a stable
`_tag` and callers to discriminate with `_tag`, never `instanceof`. ADR-0128 §1
established the in-process `Data.TaggedError` idiom for the runtime-free packages
(`commands`, `combat`, `ai`, `events`, `phase-engine`, `persistence`), but the
migration left plain `extends Error` families behind: `@bluewave/contracts`
`BluewaveError` (told apart with `instanceof` in the combat damage pipeline, the
phase-engine battle phases and the compiler-CLI diagnostics),
`@bluewave/ship-design` (eight classes), `@bluewave/campaign` and
`@bluewave/persistence` (one each).

A literal application of the rule — convert every error to `Data.TaggedError` —
collides with ADR-0128 §1's result: the renderer value-imports `ship-design`,
`campaign`, `campaign-engine` and `contracts`, so a public Effect-typed surface
there is a retained side effect that bundles `effect` into the renderer
(`MIG-EXCL-1`, ADR-0125; confirmed by the esbuild experiment in ADR-0128).

**"Renderer-reachable" means the renderer value-imports the package**, directly
or transitively through another renderer-reachable package. A type-only import
(`import type`, or an all-type `export … from`) is erased by the bundler and does
**not** make a package renderer-reachable — which is why `persistence` (only
`import type { SaveMetadata }`) and `phase-engine` (only
`import type { ForeignConstructionPreview }`) are not. The renderer-reachable
packages whose error classes the renderer can reach are `contracts`,
`ship-design`, `campaign`, `campaign-engine` and `ship-visual`. ADR-0128 §Context
records the wider module graph the renderer also touches (`armament`,
`deterministic`, `random`, `content-schema`, `content-compiler`, `diagnostics`),
none of which declares a renderer-facing plain `Error` subclass.

## Decision

1. **Not renderer-reachable → `Data.TaggedError`.** Packages the renderer cannot
   reach (`combat`, `commands`, `ai`, `events`, `phase-engine`, `persistence`)
   keep ADR-0128 §1's in-process `Data.TaggedError` with a stable `_tag`.
   `@bluewave/combat`'s `instanceof BluewaveError` sites move to `_tag` handling;
   no shared error transformer or guard that probes the failure channel is added.
2. **Renderer-reachable → plain class with `readonly _tag`.** `contracts`,
   `ship-design`, `campaign`, `campaign-engine` and `ship-visual` keep plain
   TypeScript classes and add a `readonly _tag: "<StableName>"` discriminator.
   This satisfies RULES.md's "stable `_tag`" without exposing an Effect-typed
   surface, so `MIG-EXCL-1` stays executed.
3. **`instanceof` is replaced by `_tag`.** `BluewaveError` gains
   `readonly _tag = "BluewaveError"` and an `isBluewaveError` `_tag` type guard;
   the surface classes gain a `static is(value)` `_tag` guard used at their call
   sites (combat pipeline, phase-engine battle phases, compiler-CLI diagnostics,
   desktop drawing-board/design paths, ship-design yard choice and formula
   evaluation, phase-engine construction commands). Message text and `code`
   vocabularies are unchanged.
4. **The enforcement is a gate.** `scripts/assert-tagged-errors.mjs` fails on any
   new `class … extends Error` without a `_tag` in either reachability scope, and
   its `SCOPES` cover every first-party source root — all packages plus the app
   roots (`apps/desktop/src/{main,preload,renderer}`, `apps/compiler-cli/src`) —
   so an untagged error cannot hide in an unguarded package or app
   ([ADR-0151](ADR-0151-rules-compliance-ratchet-gates.md)); an allowlist entry
   carries its reason. The gate requires a stable `_tag`, not a particular base
   class, so an existing plain `readonly _tag` class is conformant in either
   scope (e.g. `ContentArtifactError` in `apps/desktop/src/main`).
5. **The persistence compatibility error stays plain.** `CompatibilityError` keeps
   a plain `readonly _tag` even though `persistence` is **not** renderer-reachable
   under §1. RULES.md requires a stable `_tag` and callers to discriminate by it;
   it does not mandate a particular base class, and the gate (§4) accepts a `_tag`
   field in either scope. `CompatibilityError` is a standalone compatibility
   checker error, not part of the `PersistenceError` `Data.TaggedError` channel,
   so it is left as-is rather than migrated.

## Consequences

- One error strategy per reachability class, not three: `Data.TaggedError`
  inside the engine, a plain `_tag` discriminator at the renderer boundary.
- `pnpm preflight` fails on a new untagged error class in a guarded root, so the
  vocabulary cannot decay; the renderer boundary source-scan and bundle tripwire
  stay green because no Effect import is added to a renderer-reachable package.
- Behaviour is unchanged: error messages, codes and control flow are identical;
  `instanceof` and `_tag` are equivalent for values this codebase constructs.

## Alternatives considered

- **Convert everything to `Data.TaggedError`.** Rejected: bundles `effect` into
  the renderer (`MIG-EXCL-1`, ADR-0128 §1, ADR-0125).
- **Leave `BluewaveError` and the surface classes as-is.** Rejected: keeps the
  `instanceof` discrimination RULES.md forbids and leaves the vocabulary
  unauditable.
- **A shared `hasTag` guard across packages.** Rejected for the Effect failure
  channel (RULES.md "do not add shared error transformers or guards that probe
  the failure channel"); the per-class `static is`/`isBluewaveError` guards are
  plain structural `_tag` checks at the call site.
