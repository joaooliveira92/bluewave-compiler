# Boundary-decode gate scope: cover apps/compiler-cli?

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

Surfaced by ticket 03 (F3). `scripts/assert-boundary-decode.mjs` scopes only
`packages/content-compiler/src` + `apps/desktop/src/main`, but `apps/compiler-cli` is an
ADR-0100 §2 IO boundary that does `JSON.parse(...) as T` at
`apps/compiler-cli/src/main.ts:251` and `commands.ts:371,510,589,827,834,841,1071`,
violating `RULES.md:75-76` / ADR-0143. ADR-0151 excluded a repo-wide gate for
display/entry-point reasons, not these specific sites.

Decide: extend `assert-boundary-decode.mjs` with a `cli` scope (and decode the eight
sites), or add a justified allowlist. Also weigh ticket 03's F4 decode-then-`as`-nominal
sites.

Deliver: a verdict + remedy (gate scope + decode the sites, or allowlist rationale).
Feeds ticket 11.

## Answer

Resolved. Verdict: **widen the gate with a `cli` scope, and record the eight
sites as a reviewed, justified allowlist — not as an unexamined scope gap.**

- **Scope added.** `SCOPES` in `scripts/assert-boundary-decode.mjs` gains
  `cli: ["apps/compiler-cli/src"]`, and `scripts/run-gates.mjs` gains a
  `boundary-decode-cli` gate. The gate is load-bearing: with an empty allowlist
  it finds exactly the eight F3 sites, so a new `JSON.parse(...) as T` in
  `compiler-cli` now fails closed.
- **Why an allowlist, not a decode, for these sites.** F3 is right that these are
  file→state boundaries, not display, and the rule's first choice is to decode
  them. That is not honestly available here. Four formats have no schema at all
  (`CommandEnvelope<CommandBody>` at `main.ts:251` / `commands.ts:827`,
  `TacticalBattleState` at `:510`, `GunneryAccuracyFactors` at `:589`, and the
  CLI's own `campaign-state.json` at `:371`); building them would duplicate
  fast-evolving domain types, and a `CommandBody` union schema does not exist
  anywhere (the desktop's `campaignCommandSchemas.ts` holds IPC wire payloads,
  not `CommandBody`). The one format that *does* have a schema —
  `StorableCampaignStateSchema` (`packages/persistence/src/schemas.ts:92`) — is
  deliberately shallow (`nations`/`designs` are `Record<string, unknown>`), so
  decoding it here would still need the same `as unknown as` narrow that
  `store.ts:447` already carries, i.e. a net-new unknown-cast rather than a
  removed one. Every read is validated downstream: `SaveStore` re-hashes the
  state and any later load re-decodes it; `CommandLifecycle.validate` runs each
  envelope; `ReplayVerifier` re-runs and re-hashes the commands/ledger/final-hash
  rather than trusting them; and the debug tests deliberately assert
  `TACTICAL_STATE_INVARIANT_FAILED` / `GUNNERY_ACCURACY_FACTOR_MISSING` reach the
  adapter. So the deterministic resolution is a reviewed allowlist with that
  evidence, not a decode.
- **Allowlist shape (ADR-0151 §2).** Keyed by file then whitespace-normalised
  cast source, each entry carrying an occurrence count and a one-line
  justification; entries may only shrink, a rewritten cast is treated as new, and
  a duplicate cast beyond its count is kept (the ratchet cannot be widened by
  copying an existing cast). A new `filterAllowlisted` export + tests
  (`scripts/test/assert-boundary-decode.test.mjs`) cover the drop, the count and
  the load-bearing property; ADR-0151 §1 records the third scope and the
  rationale.
- **F4 (decode-then-`as`-nominal)** is unchanged: those bytes are already
  validated, so they are not a boundary-cast breach; their remedy stays with
  ticket 11 as recorded in the ticket-03 note.
- Gate green: `node scripts/assert-boundary-decode.mjs` (all three scopes) and
  `node --test scripts/test/assert-boundary-decode.test.mjs` (11/11).

Feeds ticket 11.

## Remediation (follow-up)

The original answer over-allowlisted: four of the eight sites were honestly
decodable, and the gate silently ignored a removed cast. Follow-up fixes:

- **Decoded** `commands.ts:371` (campaign state via the newly-exported
  `StorableCampaignStateSchema` + `fromStorableSnapshot`), `:834` (command
  ledger, `Schema.Array(Schema.Unknown)`), `:841` (final hash,
  `Schema.Struct({ finalSnapshotHash: Schema.String })`) and `:1071`
  (placeholder allowlist, optional `allow` array). `effect` is now a
  `compiler-cli` dependency (ADR-0100 §2 IO boundary).
  The allowlist shrank to the four genuinely unmodelled reads: `main.ts:251`,
  `commands.ts:827` (`CommandEnvelope<CommandBody>`, no schema exists) and
  `commands.ts:510,:589` (hand-authored debug fixtures the combat engine rejects
  downstream).
- **Fail-closed stale entries.** `partitionAllowlist` reports an entry whose cast
  was removed; `scanBoundaryDecodeCasts` throws in CI/`--strict` and warns
  locally, mirroring `verify-no-unknown-casts.mjs`.
- **Key convention.** ADR-0151 §2 now records that this allowlist keys by raw
  normalised cast source, the one deliberate deviation from ADR-0106 §1's hash.
- **Gate-family de-duplication (deferred, judgement).** The shared helpers
  (`normalize`, `lineAt`, `SOURCE_RE`/`TEST_RE`, the git-discovery/symlink guard,
  `runSelfTest`) are in fact copied across **seven** gate scripts (the four named
  plus `assert-authoritative-determinism`, `assert-no-library-console`,
  `assert-no-stage-io`, `assert-runtime-free`, `assert-single-effect`), and their
  discovery/coverage semantics differ (trailing-slash roots vs `AREAS`, with vs
  without `TEST_RE`). A scoped extraction for four of them would leave the family
  half-refactored and risk the fail-closed semantics the constraint protects, so
  it is deferred to a dedicated refactor rather than folded into a defect fix.
