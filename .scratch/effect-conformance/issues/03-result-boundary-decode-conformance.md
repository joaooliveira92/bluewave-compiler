# Result + decode-at-boundary conformance vs vendored effect@4.0.2

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Do Bluewave's uses of `Result` and its decode-at-boundary pattern conform to vendored
`effect@4.0.2`?

Targets:

- **`Result`** — authored source uses `Result.isFailure` / `Result.isSuccess` on
  `Schema.decodeUnknownResult` outputs. Confirm these are the idiomatic v4 accessors
  and that `.success` / `.failure` property access is correct. (Note: ~249 other
  `Result.*` hits are domain fields, not the Effect module — exclude them.)
- **Decode-at-boundary pattern** — `apps/desktop/src/main/campaignBridge.ts`,
  `packages/content-compiler` stages, desktop main: an `unknown` binding is decoded by
  a schema, never `JSON.parse(...) as T` (enforced by `scripts/assert-boundary-decode.mjs`,
  ADR-0143). Check this matches the vendored recommended boundary idiom.
- **Error surfacing** — how decode failures become typed errors / messages; whether
  `Result` vs `Option` vs throwing is used consistently and idiomatically.
- **`Option` / `Predicate` are unused** though in the runtime-free allowlist — is the
  allowlist itself correct/complete vs vendored (see ticket 05 for the declination check).

Deliver: severity-tagged verdicts with vendored evidence, plus remedies. Write durable
findings to a note under `docs/research/`.

## Answer

Resolved. Evidence: `docs/research/effect-conformance-03-result-boundary.md`.

- **F1 (Info, accept):** `Result.isFailure`/`isSuccess` are idiomatic
  (`vendor/effect/src/Result.ts:711,744`). 30 authored `Result.*` hits across 18 files,
  all the Effect module — the ticket's "~249 domain-field" exclusion did not reproduce.
- **F2 (Info, accept):** decode-at-boundary shape matches the vendored idiom; the gate
  is green on its covered scopes.
- **F3 (Major, gate gap):** un-gated `apps/compiler-cli` boundary casts —
  `assert-boundary-decode.mjs:30-33` scopes only `packages/content-compiler/src` +
  `apps/desktop/src/main`, but the CLI is an ADR-0100 §2 IO boundary with
  `JSON.parse(...) as T` at `apps/compiler-cli/src/main.ts:251` and
  `commands.ts:371,510,589,827,834,841,1071`, violating `RULES.md:75-76` / ADR-0143.
  Feeds new ticket 13.
- **F4 (Minor):** decode-then-`as`-nominal at `monthInput.ts:46`, `pendingCommands.ts:134`,
  `store.ts:447`, `air-defense-system-definition.ts:260`, `air-defense/attack.ts:204`,
  `campaignBridge.ts:333`.
- **F5 (Minor):** excess-key strictness is inconsistent — `campaignBridge.ts:158` strips
  while `air-defense/*` + content boundaries reject. Deferred to ticket 04.
- **F6 (Info, accept):** error surfacing is consistent; nit —
  `schema-validator.ts:23` uses raw `_tag` where siblings use `Result.isFailure`.
- **F7 (Info, accept):** unused `Option`/`Predicate` are permissions, not gaps; allowlist
  audit deferred to ticket 05.
