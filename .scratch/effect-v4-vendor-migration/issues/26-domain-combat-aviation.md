# 26 — Domain: `combat` aviation modules on runtime-free Effect idioms

**Type:** implementation
**Status:** done
**Blocked by:** none (21 done)
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset across the `@bluewave/combat` aviation
modules: `air-combat`, `aircraft`, `carrier-operations`, `air-defense`
(contract schemas already Schema'd in ticket 12). Preserve all pure combat math
and reason codes.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy" (pure combat math stays runtime-free).
- `packages/combat/src/{air-combat,aircraft,carrier-operations,air-defense}/**`.
- `docs/adr/ADR-0042-d4-air-defense-layer-resolution-eligibility.md`,
  `docs/adr/ADR-0012-b1-division-boundary.md` (boundary context).

## Acceptance criteria

- [x] The four aviation modules use runtime-free Effect subset idioms; structured
      failures typed via `Data.TaggedError` (`MIG-RUNTIME-1`).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`; no `Effect.run*`.
- [x] Combat outcomes, record fields, and reason codes unchanged (any
      hash-surface change → ADR note, `MIG-DET-1`).
- [x] Focused aviation tests green; `pnpm typecheck` green.

## Notes

- Do not modify `gunnery`/`damage`/`torpedoes`/`mines`/`smoke`/`coastal-defense`
  (ticket 27) or the engagement/foundation modules (ticket 28).

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped and merged with 27/28.** 429 of `combat`'s 432 throws are
`BluewaveError` (stays plain, renderer-reachable class from `contracts`). The
residual plain throws are: `air-combat/records.ts:43`,
`mines/contracts.ts:153,170`. Convert those three to a `Data.TaggedError`
(combat-local) or to `BluewaveError`; keep reason codes and messages. Combat
is not renderer-reachable. Blocked-by corrected: 22 is closed.

### Evidence (2026-10-12)

**Delivered.** Added `packages/combat/src/errors.ts` —
`CombatInvariantError extends Data.TaggedError("CombatInvariantError")` with
`{ message, code?, context? }` (runtime-free `Data` only; combat is not
renderer-reachable). Converted the three residual plain throws
(`air-combat/records.ts:43` → carries `code = AIR_COMBAT_RECORD_INTEGRITY_FAILURE`;
`mines/contracts.ts:153,170` → carry `context`, no code). Re-exported the class
from `packages/combat/src/index.ts`. Added a focused test
(`test/air-combat/records.test.ts`) covering the accept path and the `_tag`/
`name`/`code`/`message` of the tagged throw.

| Check | Result |
| --- | --- |
| `rg "throw new (Error\|TypeError\|RangeError)\|throw Object.assign" packages/combat/src` | no matches |
| `pnpm --filter @bluewave/combat test` | 288 files / 3799 tests passed (+2 new) |
| `pnpm --filter @bluewave/combat typecheck` | exit 0 |
| `pnpm lint:effect` | 0 errors (278 warnings, all pre-existing) |

**Residual:** none. Every remaining `combat` throw is `BluewaveError`
(`instances` retained) or the new tagged local error; no `Layer`/`Runtime`.

### Hardening follow-up (2026-10-12)

Independent adversarial review (`.ai/REVIEW-PROMPT.md`) over this commit returned
**ACCEPT** with two low findings for ticket 26:

- **F2 (low, deferred):** the two `mines/contracts.ts` `CombatInvariantError`
  throws are fail-closed guards reachable only on a registry bug (a missing
  required policy, or a guard that accepts tampering); they have no direct test.
  Deferred: exercising them needs an injectable contract registry that does not
  exist and would be scope creep for a fail-closed proof. The happy path +
  tamper-rejection logic is covered by `test/mines/contracts-rollup.test.ts`.
- **F3 (low, fixed):** the `validateAllMineContracts` header comment mis-named
  `BluewaveError` for the rollup guard; corrected to name `CombatInvariantError`
  (and `BluewaveError` for each contract's own guard).

Consumer-path regression: `apps/compiler-cli/test/combatDiagnostics.test.ts`
adds a case proving a tagged `CombatInvariantError` still routes to
`internal-error` (it is not a `BluewaveError`), preserving the pre-migration
plain-`Error` behaviour. Report: `.ai/reports/effect-v4-hardening.md`.

