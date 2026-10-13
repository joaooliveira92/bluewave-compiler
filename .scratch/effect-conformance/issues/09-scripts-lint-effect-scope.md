# scripts/** is outside pnpm lint:effect

**Type:** task
**Status:** open
**Blocked by:** none

## Question

`pnpm lint:effect` runs `oxlint --config oxlint.effect.json packages apps` — the
`scripts/**` tree is linted by neither the Effect-diagnostics gate nor (effect-specific)
`assert-runtime-free`. Decide whether any `scripts/**` file imports/uses Effect in a way
that should be covered, and whether to extend the gate scope.

Deliver: a scan of `scripts/**` for `effect` usage, a verdict on whether to extend
`lint:effect`/gates to cover it, and the remedy (extend scope, add a guard, or accept
with rationale).

## Answer

_(empty)_
