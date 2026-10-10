# Spec — Release-readiness hardening

**Status:** ready-for-agent
**Origin:** production-readiness recommendations 2026-10-10

## Problem

Three production-quality gaps remain after the CI/docs/toolchain hardening:

1. **Performance has no tripwire.** Month-advance and the strategy map at max zoom
   can regress silently until a user notices.
2. **No field observability.** A shipped crash is invisible; there is no way to learn
   about failures from real users.
3. **Save compatibility is untested in the wild.** The contract is reject-on-mismatch
   (DESIGN-52); the first format bump will strand every existing save with no
   migration decision or test.

## Tickets

- `issues/01-performance-budget-tripwire.md`
- `issues/02-crash-error-observability.md`
- `issues/03-save-compatibility-policy.md`

## Out of scope

- The playable loop (`.scratch/playable-loop/`).
- The lethality rebalance (`.scratch/p1-lethality-rebalance/`).
