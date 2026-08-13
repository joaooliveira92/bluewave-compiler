Type: task
Status: resolved

## Question

`@bluewave/combat` reports failures by throwing `BluewaveError` (code +
context, from `@bluewave/contracts`), while the CLI's existing commands
report failures through `DiagnosticCollector.addError(code, message,
context)` (`@bluewave/diagnostics`). Every new command this map adds
(`battle:generate`, `battle:advance-minute`, `gunnery:resolve-shot`) will
call into combat and needs to surface a thrown `BluewaveError` the same way
the rest of the CLI reports errors — consistent exit-category mapping,
consistent `--json`/human output.

Implement a small shared adapter in `apps/compiler-cli/src/` (e.g. a
`runCombatCommand`-style wrapper or a `catchBluewaveError(fn, collector)`
helper) that:

- Catches `BluewaveError` thrown by a combat call, extracts its `code` and
  context, and calls `collector.addError(code, message, context)` (mirroring
  the pattern already used throughout `commands.ts`).
- Lets non-`BluewaveError` exceptions surface as `internal-error` the way
  other commands already handle unexpected failures.
- Is unit-tested directly (construct a `BluewaveError`, assert the collector
  receives the right code/message/context) rather than only exercised
  indirectly through a downstream command.

This ticket blocks the three new-command tickets (`battle:generate`,
`battle:advance-minute`, `gunnery:resolve-shot`) — each needs this adapter to
report errors consistently rather than inventing its own ad hoc handling.

## Answer

Implemented `apps/compiler-cli/src/combatDiagnostics.ts`, exported from
`src/index.ts`:

- **`reportBluewaveError(error, collector, stage)`** — `BluewaveError` (from
  `@bluewave/contracts`) turns out to have no separate `code` field, only
  `message` (which doubles as the reason code at most call sites — a
  `REASON_CODES` constant — but is a free-form string at a few, e.g.
  `resolver.ts`) and `context: Record<string, unknown>`. The adapter uses
  `error.message` verbatim as both the collector's `code` and `message`
  (matching the existing `"USAGE"`-style convention already in
  `commands.ts`), and folds non-empty `context` into `remediation` as JSON
  since `DiagnosticCollector` has no dedicated context field.
- **`runCombatOperation(fn, collector, stage)`** — wraps a combat call,
  returning a discriminated `{ outcome: "success", value } |
  { outcome: "validation-error" } | { outcome: "internal-error" }`. A caught
  `BluewaveError` reports via `reportBluewaveError` and returns
  `"validation-error"`; any other thrown value reports as `INTERNAL_ERROR`
  and returns `"internal-error"` — the two `outcome` strings deliberately
  match `ExitCategory` values so a new command can propagate the result
  straight through (`if (result.outcome !== "success") return
  result.outcome;`).

Unit-tested directly in `apps/compiler-cli/test/combatDiagnostics.test.ts`
(7 cases: code/message/remediation mapping, empty-context omission, success
pass-through, `BluewaveError` → validation-error, `Error` → internal-error,
non-`Error` thrown value → internal-error). Full `compiler-cli` suite (68
tests) and `typecheck` pass.

Tickets 02-04 (`battle:generate`, `battle:advance-minute`,
`gunnery:resolve-shot`) are now unblocked.
