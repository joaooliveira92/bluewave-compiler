# Research note — `Result` and decode-at-boundary conformance vs vendored `effect@4.0.2`

- **Ticket:** `.scratch/effect-conformance/issues/03-result-boundary-decode-conformance.md`
- **Type:** research (AFK)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` source + its embedded tests are the
  evidence-of-truth for *what an API does*; repo ADRs / `RULES.md` /
  `agent-patterns/effect-idioms.md` are the policy of record. A conflict is itself a finding.
- **Scope:** authored `packages/**` + `apps/**` only (exclude `vendor/**`, `repos/**`,
  `node_modules/**`, `**/dist/**`).
- **Probes run:** `node scripts/assert-boundary-decode.mjs` → ok; `node
  scripts/assert-runtime-free.mjs` → ok (16 roots). No code was edited by this session.

---

## 1. Question

Do Bluewave's uses of the Effect `Result` module and its decode-at-boundary pattern
conform to the vendored `effect@4.0.2`? Specifically: (1) are `Result.isFailure` /
`Result.isSuccess` and `.success` / `.failure` the idiomatic v4 accessors; (2) does
`JSON.parse`-into-`unknown`-then-schema-decode match the vendored boundary idiom; (3)
are decode failures surfaced consistently (typed error vs `Option` vs throwing); and (4)
is `Option`/`Predicate` being allowlisted-but-unused a gap?

## 2. Sources consulted

| Source | Verified directly? |
| --- | --- |
| `vendor/effect/src/Result.ts` (types, guards, doc-tests) | ✅ read |
| `vendor/effect/src/internal/result.ts` (guard + proto impl) | ✅ read |
| `vendor/effect/src/Schema.ts` (`decodeUnknownResult` at :1712; docs/example at :1189) | ✅ read |
| `vendor/effect/src/SchemaParser.ts` (`decodeUnknownResult` at :496) | ✅ read |
| `vendor/effect/src/SchemaIssue.ts` (`makeFormatterStandardSchemaV1` :1303) | ✅ read |
| `vendor/effect/src/StandardSchema.ts` (`FailureResult`/`Issue` :112–123) | ✅ read |
| `vendor/effect/src/SchemaAST.ts` (`onExcessProperty` semantics) | ✅ read |
| `vendor/effect/src/ai/McpServer.ts`:1819 (first-party `Result.isSuccess(decodeUnknownResult(...))`) | ✅ read |
| `vendor/effect/ai-docs/src/01_effect/02_schema/index.md` + `10_schema-basics.ts` | ✅ read |
| `repos/effect/packages/effect/SCHEMA.md` §"Handling unexpected keys" | ✅ read (read-only subtree) |
| `repos/effect/LLMS.md` | ✅ read |
| Repo policy: `RULES.md` §Schema and boundaries; `agent-patterns/effect-idioms.md`; ADR-0100 §2; ADR-0143; ADR-0151; `scripts/assert-boundary-decode.mjs`; `scripts/assert-runtime-free.mjs`; `scripts/no-unknown-casts.baseline.json` | ✅ read |

## 3. Findings (severity-tagged)

### F1 — `Result` accessors and property access are idiomatic and correct — **Info**

The vendored `Result` module defines `isSuccess`/`isFailure` as the sanctioned narrowing
guards, and `.success`/`.failure` as the variant payload properties:

- `vendor/effect/src/Result.ts:711` — `export const isFailure: <A, E>(self: Result<A, E>) => self is Failure<A, E> = result.isFailure`
- `vendor/effect/src/Result.ts:744` — `isSuccess` mirror.
- `vendor/effect/src/Result.ts:99–111` — `Failure` carries `readonly failure: E`;
  `:163–175` — `Success` carries `readonly success: A`.
- Doc-tests in the same file (`:86–88`, `:150–152`, `:699–700`) demonstrate exactly the
  Bluewave shape: `if (Result.isFailure(result)) result.failure`.
- The guards dispatch on `_tag` internally (`vendor/effect/src/internal/result.ts:75–82`),
  so they are also compatible with `RULES.md`'s "discriminate with `_tag`" rule.
- First-party precedent: `vendor/effect/src/ai/McpServer.ts:1819` —
  `Result.isSuccess(Schema.decodeUnknownResult(InitializeJsonRpcMessage)(message))`.

Enumerated authored hits: **30 `Result.*` member accesses across 18 files**, every one the
Effect module used on a `Schema.decodeUnknownResult` output (`packages/combat/src/**`,
`packages/persistence/src/store.ts`, `packages/content-schema`, `apps/desktop/src/main/**`,
plus 4 test files). See Appendix A.

**The ticket's "~249 other `Result.*` hits are DOMAIN fields" did not reproduce.** Under
the stated scope (`packages/**` + `apps/**`, `.ts`/`.tsx`, excluding `dist`/`node_modules`)
there are exactly 30 `\bResult\.` occurrences, all the Effect module — **zero** domain
`Result.*` collisions. The ~249 figure likely counts lowercase `result.success` /
`result.failure` domain-field reads (86 in scope a lower bound) or spans out-of-scope trees.
**Verdict:** target 1 conforms; the exclusion heuristic is unnecessary but harmless.

**Remedy:** none. Optional: correct the "~249" note when the ticket answer is written.

### F2 — Decode-at-boundary shape matches the vendored idiom — **Info**

Vendored boundary guidance:

- `vendor/effect/ai-docs/src/01_effect/02_schema/index.md:5` — *"AVOID using predicates or
  manual parsing, instead use `Schema` to parse untrusted data and validate it."*
- `.../10_schema-basics.ts:3–4` — *"decode unknown input into typed values"*; `:32–33`
  reuse `Schema.decodeUnknownEffect`/`decodeUnknownResult` at the edges.
- `vendor/effect/src/Schema.ts:1189–1196` doc-test and `:1712–1716` implementation.

Bluewave's realised shape is *parse into an `unknown` binding, then decode with a schema*:

- `packages/content-compiler/src/fullSurface.ts:134` — `decodeStrict(PackManifestSchema, JSON.parse(manifestText))`.
- `packages/content-compiler/src/artifact.ts:159–175` — `verifyContentBundleArtifact` decodes via `validateAgainstSchema(..., ContentBundleSchema, ...)` (ADR-0143 §2's "decode, never assert").
- `apps/desktop/src/main/campaignBridge.ts:153–184` — `withSchema`/`withStrictSchema` decode the IPC payload.
- `apps/desktop/src/main/{uiState,drawingBoardDraft,campaignSessionMetadata,pendingCommands}.ts` — `JSON.parse(...)` into a decode call, no cast.
- `packages/persistence/src/store.ts:388–398, 419–422, 528` — `raw: unknown` then `decodeUnknownResult`/`decodeUnknownSync`.
- `packages/content-schema/src/decode.ts:9` — one strict decode policy
  (`CONTENT_DECODE_OPTIONS = { onExcessProperty: "error" }`), ADR-0105.

`scripts/assert-boundary-decode.mjs:100–106` flags only `JSON.parse(...) as T` and its
fixtures (`:162–185`) assert "unknown binding passes" and "schema decode passes". This
matches the vendored idiom, and the gate is green (`assert-boundary-decode: ok`).

**Remedy:** none.

### F3 — `apps/compiler-cli` is an un-gated boundary with `JSON.parse(...) as T` — **Major**

`assert-boundary-decode.mjs:30–33` guards only `--scope compiler`
(`packages/content-compiler/src`) and `--scope desktop` (`apps/desktop/src/main`).
`apps/compiler-cli/src` is an IO/entrypoint boundary by ADR-0100 §2 (`:39`), and `RULES.md`
§Schema and boundaries (`:75–76`) requires *"decode … file contents with a strict schema
before use"*. Yet the CLI casts untrusted file contents directly:

- `apps/compiler-cli/src/main.ts:251` — `return JSON.parse(raw) as CommandEnvelope<CommandBody>[];`
- `apps/compiler-cli/src/commands.ts:371` — `JSON.parse(...) as CampaignState`
- `:510` — `as BattleAdvanceMinuteFile`; `:589` — `as GunneryResolveShotFile`
- `:827` — `as CommandEnvelope<CommandBody>[]`; `:834` — `as unknown[]`
- `:841` — `as { finalSnapshotHash: string }`; `:1071` — `as { allow?: unknown }`

These are exactly the "cast-trusted boundary" ADR-0151 §Context (`:18–19`) set out to
freeze, but the gate's two scopes omit them. ADR-0151 §Alternatives (`:82–85`) rejected a
repo-wide gate on the grounds that it "would flag legitimate IO-boundary/display/entry-point
uses" — but these sites are not display; they are file→authoritative-state boundaries the
same rule targets.

**Remedy:** extend `SCOPES` in `scripts/assert-boundary-decode.mjs` with
`cli: ["apps/compiler-cli/src"]` (one self-test pair already covers the semantics), then
fix the eight sites by parsing into `unknown` and matching each payload to its existing
schema (the `cmd` --  `campaign:` -- `event` schemas already exist in `@bluewave/commands`
/ `@bluewave/persistence`). If (and only if) a site is genuinely display-only, add it to a
one-line justified allowlist per ADR-0151 §2. Flagging for the map: this is a resolved
disposition decision (gate scope + fixture), not merely a note.

### F4 — Decode-then-assert narrows the decoded type back to a nominal type — **Minor**

Several boundaries decode correctly and then assert the *success* to a hand-written domain
type, partly negating the honest decoded type:

- `apps/desktop/src/main/monthInput.ts:46` — `parsed.success as unknown as MonthInput` (in
  `scripts/no-unknown-casts.baseline.json:29`).
- `apps/desktop/src/main/pendingCommands.ts:134` — `e.envelope as unknown as CommandEnvelope<CommandBody>` (baselined `:32`).
- `packages/persistence/src/store.ts:447` — `as unknown as StorableCampaignSnapshot` (baselined `:320`).
- `packages/combat/src/air-defense/air-defense-system-definition.ts:260` — `result.success as AirDefenseSystemDefinition`.
- `packages/combat/src/air-defense/attack.ts:204` — `result.success as AirDefenseAttack`.
- `apps/desktop/src/main/campaignBridge.ts:333` — `payload as ResolveTacticalBattlePayload` after `withSchema`.

Unlike F3 this is not a `JSON.parse` boundary cast — the bytes *are* validated — so it is
not a gate breach, but the cast masks divergence between the schema `Type` and the declared
domain type (the reason each cast exists). The vendored model gives the boundary "its type
honestly" only to the extent the schema `Type` equals the consumer type.

**Remedy:** make the schema `Type` the domain type (or bridge with an explicit mapping
function, or `Schema.satisfies`/`.check`), then delete the assertion. At minimum, add a
one-line justification comment at each cast naming the structural divergence, so the
baseline entries are self-explaining.

### F5 — Excess-key strictness is inconsistent across decoders (adjacent to ticket 04) — **Minor**

Vendored truth: `Schema.Struct` **strips** unknown keys by default; rejection requires
`onExcessProperty: "error"` (`vendor/effect/src/SchemaAST.ts:490–495` — *"`onExcessProperty`
— `"ignore"` (default) strips unknown object keys"*; `repos/effect/packages/effect/SCHEMA.md:1039–1044`).

This contradicts the repo policy of record (`RULES.md:74` — *"Schemas are closed by
default; excess keys are rejected"*; `agent-patterns/effect-idioms.md:28–29`), which is
exactly **ticket 04's** subject. Its *use-site* consequences surface in this ticket's
boundaries:

- `apps/desktop/src/main/campaignBridge.ts:158` — the default IPC decoder passes **no**
  options, so extra payload keys are stripped, not rejected; only `withStrictSchema` (`:178`)
  rejects, and the comment restricts it to `placeForeignConstructionCommand`.
- `packages/combat/src/air-combat/contracts.ts:48`, `aircraft/contracts.ts:73`,
  `carrier-operations/contracts.ts:50` decode with no options (strip); while all four
  `air-defense` decoders pass `{ onExcessProperty: "error" }` (`air-defense/contracts.ts:58`,
  `attack.ts:185`, `air-defense-system-definition.ts:244`).
- Content boundaries are uniformly strict (`content-schema/src/decode.ts:9`,
  `schema-validator.ts:6`).

**Do not resolve the contradiction here** — ticket 04 owns the disposition. Cross-reference
only: if ticket 04 concludes "closed requires the explicit option", then F5's strip-not-reject
sites (and `campaignBridge`'s default IPC decoder) are the code fixes it implies.

**Remedy (deferred to 04):** once 04 settles the rule, align every boundary decoder to one
policy constant (mirroring `CONTENT_DECODE_OPTIONS`) and add a gate/parity assertion.

### F6 — Error surfacing is consistent and idiomatic — **Info (with one Minor nit)**

Decode failures become typed errors/messages consistently:

- **Two failure types exist and Bluewave uses the right one.** `Schema.decodeUnknownResult`
  (`vendor/effect/src/Schema.ts:1712–1716`) wraps the parser's issue with
  `Result_.mapError(..., issue => new SchemaError(issue))`, yielding
  `Result<Type, SchemaError>`. `SchemaParser.decodeUnknownResult`
  (`vendor/effect/src/SchemaParser.ts:496–501`) yields `Result<Type, SchemaIssue.Issue>`.
  Every authored call uses the `Schema` form, so `result.failure` is a `SchemaError` **with**
  `.issue` — and the consumers read `.failure.issue` correctly
  (`packages/content-schema/src/schema-validator.ts:24`, `packages/combat/src/schema-issues.ts:20`).
  No authored file imports `SchemaParser` (verified).
- **Failure → typed error:** `packages/combat/src/{air-combat,aircraft,carrier-operations}/contracts.ts`
  and `air-defense/*` throw `BluewaveError` (`Data.TaggedError`) built from
  `formatContractIssues(result.failure)` — matching `RULES.md` "in-process domain errors:
  `Data.TaggedError`" and the vendored `SchemaIssue.makeFormatterStandardSchemaV1`
  (`vendor/effect/src/SchemaIssue.ts:1303`, `StandardSchema.ts:112–123`).
- **Failure → diagnostic:** `packages/content-schema/src/schema-validator.ts:22–33` and
  `packages/persistence/src/store.ts:398–428` map to stable `SCHEMA`/`CORRUPT_SAVE_CODE`
  diagnostics.
- **Failure → tolerant fallback:** sidecar readers (`uiState.ts:73`, `drawingBoardDraft.ts:45`,
  `campaignSessionMetadata.ts:56`, `pendingCommands.ts:122`, `crashSupport.ts:286`) fall back
  to `null`/defaults — the documented tolerant-read contract.
- **Throwing vs `Result` vs `Option` is deliberate and vendored-sanctioned:** `decodeStrict`
  (`content-schema/src/decode.ts:18–20`) uses `decodeUnknownSync` (throws) while
  `decodeStrictResult` (`:27–29`) uses `decodeUnknownResult`; `agent-patterns/effect-idioms.md:27–28`
  names both as the boundary idioms. `Option` is never used for decode — correct, since
  `Option` would discard the `SchemaError`.

**Minor nit:** `packages/content-schema/src/schema-validator.ts:23` narrows with the raw
`result._tag === "Failure"` while every sibling file uses `Result.isFailure`. Both are
correct (`RULES.md` mandates `_tag` discrimination; `Result.isFailure` checks `_tag`
internally). **Remedy:** standardise on `Result.isFailure` for readability/consistency, or
record "raw `_tag` is the house style" — either is conformant.

### F7 — `Option`/`Predicate` allowlisted-but-unused is not a gap — **Info**

`Option` and `Predicate` appear in the runtime-free allowlist
(`scripts/assert-runtime-free.mjs:58–67`), in `RULES.md:54`, and in ADR-0100 §2 (`:38`).
Verified: **zero** authored imports and **zero** `Option.`/`Predicate.` member uses in
`packages/**` + `apps/**`. The allowlist is a *permission* set, not a coverage requirement,
so an allowlisted-but-unused symbol violates nothing. Both are genuinely runtime-free
vendored modules (`vendor/effect/src/Result.ts:25–26` itself imports `Predicate`; `Option`
is plain data). **No remedy.** Per the ticket, the full allowlist audit stays with ticket 05.

- Adjacent doc nit for ticket 05: ADR-0100 §2's table (`:38`) omits `SchemaIssue`, while
  `RULES.md:54` and the gate include it. `SchemaIssue` is runtime-free
  (`vendor/effect/src/SchemaIssue.ts` imports only `Array`/`Formatter`/schema internals).

## 4. Recommendations

| # | Finding | Severity | Recommended remedy | Owner |
| --- | --- | --- | --- | --- |
| F1 | `Result` accessors idiomatic | Info | none | — |
| F2 | Boundary decode shape matches idiom | Info | none | — |
| F3 | `compiler-cli` un-gated boundary casts | **Major** | Add `cli` scope to `assert-boundary-decode.mjs`; decode the 8 sites against existing command/persistence schemas | map → handoff spec |
| F4 | Decode-then-`as`-nominal casts | Minor | Make schema `Type` = domain type or map explicitly; justify any remaining baselined cast | handoff spec |
| F5 | Excess-key strictness inconsistent | Minor | Defer to ticket 04; then unify on one policy constant + gate | ticket 04 |
| F6 | Error surfacing consistent | Info | standardise `schema-validator.ts:23` on `Result.isFailure` (optional) | handoff spec |
| F7 | `Option`/`Predicate` unused | Info | none | ticket 05 |

**BALANCE TARGET / non-normative:** none — every claim here is behavioural or structural
(API semantics + repo policy), not a gameplay figure. No balancing value is asserted.

## 5. Deferred / blocked

- **Ticket 04** owns the *Schema.Struct excess-key contradiction*; F5's strictness
  inconsistency is a use-site consequence, deliberately not resolved here.
- **Ticket 05** owns the full runtime-free allowlist declination check (F7 doc nit included).
- **`apps/compiler-cli` boundary-cast disposition (F3)** is a genuine gate-scope decision;
  the orchestrator/map should adjudicate "extend scope" vs "justified allowlist" before a
  handoff ticket is cut.
- No `docs/OPEN-ISSUES.md` item was silently resolved.

## Appendix A — every authored `Result.*` hit (30, 18 files)

Production (24): `campaignBridge.ts:159,179,353`; `campaignSessionMetadata.ts:56`;
`crashSupport.ts:286`; `drawingBoardDraft.ts:45`; `monthInput.ts:46`;
`pendingCommands.ts:122`; `uiState.ts:73`; `air-combat/contracts.ts:49`;
`air-defense/air-defense-system-definition.ts:250`; `air-defense/attack.ts:191`;
`air-defense/contracts.ts:294,301,308,315`; `aircraft/contracts.ts:74`;
`carrier-operations/contracts.ts:51`; `persistence/src/store.ts:399,423`.
Tests (6): `campaignCommandSchemas.test.ts:38,46,520,530,544,555,589`;
`air-combat/contracts.test.ts:28`; `schema-issues.test.ts:21`;
`schema-serialization.test.ts:196`.

## Appendix B — reproduction commands

```sh
rg -n '\bResult\.' packages apps --glob '*.ts' --glob '!**/dist/**'          # 30 hits, all Effect Result
rg -n 'SchemaParser' packages apps --glob '*.ts'                             # none
rg -n 'JSON\.parse' apps/compiler-cli/src packages/content-compiler/src apps/desktop/src/main
node scripts/assert-boundary-decode.mjs                                      # ok
node scripts/assert-runtime-free.mjs                                         # ok (16 roots)
```
