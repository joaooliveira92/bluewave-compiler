# 07: Console-in-library rule — record the allowance and gate it

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** RULES.md forbids `console.*` in library code, but one
child-process entry point in `@bluewave/combat` and the runtime-free desktop main
use it — defensibly, because those packages have no Effect runtime to log
through. Turn the exception from an unexamined one into an explicit allowlist,
and add an `assert-no-library-console` gate that fails on `console.*` in library
modules while permitting the documented entry points. The gate's allowlist entries
each state why the site is allowed.

## Acceptance criteria

- [ ] A new `assert-no-library-console` gate fails on a `console.*` fixture in a
      library module and passes on the real tree.
- [ ] Each allowlisted site (the combat child-process entry point, the desktop
      runtime-free main/renderer entry points) carries a one-line justification.
- [ ] The gate ships a bad-fixture / good-fixture pair, is registered in
      `run-gates.mjs`, and is invoked by CI (`verify-check-parity` green).
- [ ] No production behaviour changes.

## Notes

- This is the one RULES.md rule the compliance spec parked as "recorded, not
  converted": the sites are genuine boundaries (child-process bootstrap,
  runtime-free main) where `Effect.log` is not available. Do not convert them.
