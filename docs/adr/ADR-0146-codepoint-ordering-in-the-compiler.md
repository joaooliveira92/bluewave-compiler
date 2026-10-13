# ADR-0146: Codepoint ordering for the compiler's canonical content order

## Status

Accepted (2026-10-12).

## Context

ADR-0003 fixes canonical serialization and hashing; ADR-0007 and ADR-0106 make
determinism a frozen quality. The compiler's normalize stage ordered every
collection with `String.prototype.localeCompare`, which depends on the host
locale. The repository's own determinism rule — used by the division screen's
`byId` and the combat orderings' `compareStrings` — is codepoint (UTF-16 code
unit) comparison. The two rules agree on the current ASCII ids, so the artifact
body hash was not observably wrong, but it was not pinned to a rule; a locale
change (or a future non-ASCII id) could move it.

## Decision

1. **One shared codepoint comparator.** `@bluewave/deterministic` exports
   `compareCodePoints(a, b)` (`a < b ? -1 : a > b ? 1 : 0`), the one home for the
   rule. The compiler's normalize stage uses it for every collection order.
2. **The proof covers the compiler.** A dedicated cross-process child builds a
   content bundle whose ids sort differently under a locale-dependent comparison
   (mixed case; e.g. en-US orders `i` before `I`, Turkish `I` before `i`) and
   prints its body hash; the cross-process test asserts the hash is identical
   under `en_US.UTF-8` and `tr_TR.UTF-8`. A unit test pins the comparator and the
   normalize order against the locale-dependent alternative.

## Consequences

- The artifact body hash is reproducible by rule, not by environment.
- The production hash is unchanged: the current ids sort identically under both
  rules (ADR-0106's recorded caveat), and the lock records it unchanged.
- A future locale-dependent sort in the compiler fails the locale proof.

## Related

- ADR-0003 (canonical serialization), ADR-0007 (determinism), ADR-0106
  (frozen-quality ratchets), ADR-0145 (content lock).
