# Effect conformance — map

**Type:** map
**Status:** open

## Destination

A severity-tagged Effect-conformance findings set for the authored tree, handed off
as a spec + tickets. Done when: every *used* concept (`01_basics` / `02_schema` /
`04_errors`) has a vendored-verified verdict; every *declined* ai-docs section has a
confirmed, documented, gate-covered declination; and each of the six known un-gated
seams has a resolved disposition (fix, doc, ADR, or accept-with-rationale).

No runtime wave: ADR-0128 stands. "Harden" means *decide remedies*, not apply them —
execution is a later effort off the handoff spec/tickets.

## Notes

- **Domain:** Bluewave, a deterministic naval campaign engine. Effect v4 is vendored
  at `vendor/effect` (`effect@4.0.2`) and `vendor/effect-vitest`; `repos/effect` is a
  read-only subtree for reference. All authored consumers use `"effect": "workspace:*"`.
- **Evidence rule (settled):** vendored source + tests are the evidence-of-truth for
  *what an API does*; the repo's ADRs / `RULES.md` / `agent-patterns/effect-idioms.md`
  are the policy of record. A conflict between them is itself a finding.
- **Method:** read vendored source + tests; write throwaway executable probes
  (`prototype/` or `.scratch/`) to confirm uncertain behaviour; capture durable
  findings as notes under `docs/research/`. Distrust prior Effect knowledge.
- **Severity:** Blocker (behavioural divergence, boundary leak, or a false rule),
  Major (documented rule violated, no runtime impact), Minor (style/consistency),
  Info (doc nit).
- **Skills every session consults:** `research` (AFK tickets) / `prototype` (04) /
  `grilling` + `domain-modeling` (HITL). Per-ticket type is on the ticket's `Type:` line.
- **Facts already established (chart session):** 55 authored files import `effect`; 54
  are pure-only. The only runtime symbol is `Effect.succeed([])` as a decode default at
  `packages/persistence/src/schemas.ts:50`. Services/layers/ManagedRuntime/Streams are
  unused and fail-closed-guarded by `scripts/assert-runtime-free.mjs`.
- **Do not rebuild:** the migration, single-copy guard, runtime-free boundary,
  tagged-error / boundary-decode / determinism gates, Zod→Schema swap, tsgo toolchain
  gate, or CI-parity guard — all exist. Audit *conformance to* them.

## Decisions so far

<!-- one line per resolved ticket: gist + link -->

- [Schema usage conformance vs vendored effect@4.0.2](issues/01-schema-usage-conformance.md): filters / `Result` / `SchemaIssue` formatter conform; **Blocker** — `Schema.Struct` *strips* by default (idioms + ADR-0102 + `RULES.md` wrong; doc-fixed); F2 shared-array aliasing **withdrawn** (probe: `Schema.Array` defaults are fresh per decode).
- [Data.TaggedError + error-handling conformance](issues/02-tagged-errors-conformance.md): 14 classes conform; **Major gate gap** — `apps/**` uncovered by `assert-tagged-errors`, live `instanceof` in `contentArtifact.ts`; ADR-0152 self-inconsistent.
- [Result + decode-at-boundary conformance](issues/03-result-boundary-decode-conformance.md): `Result` + boundary idiom conform; **Major gate gap** — `compiler-cli` `as T` casts un-gated by `assert-boundary-decode`.
- [Error-gate scope](issues/12-error-gate-scope.md): **resolved, applied** — `ContentArtifactError` gains `_tag` + `static is`; `assert-tagged-errors` `SCOPES` widened to every first-party root (apps + all packages) split by value-reachability; ADR-0152 §1/§2/§5 aligned and "renderer-reachable" defined as value-import reachability (persistence → `engine`); the three test `instanceof` helpers moved to `_tag`.
- [Tagged-error residual gaps](issues/14-tagged-error-residual-gaps.md): **resolved, applied** — all remaining test `instanceof`/`toBeInstanceOf` narrowings moved to `_tag`/`isBluewaveError`; `diagnostics` confirmed **not** value-reachable (so `DiagnosticError` stays `Data.TaggedError` in `engine`; ADR-0128 §Context split value vs type reachability); ADR-0152 §1/§6 and `RULES.md` §Errors record the `toThrow(Class)`-only test exception; gate detects `globalThis.Error` + imported `Error` aliases with fixtures; events gains the `JSON.stringify`-vs-`structuredClone` `_tag` regression test.
- [Boundary-decode gate scope](issues/13-boundary-decode-gate-scope.md): **resolved, applied, remediated** — `assert-boundary-decode` gains a `cli` scope (`apps/compiler-cli/src`) wired into `run-gates`; the honestly-decodable sites (campaign state, command ledger, final hash, placeholder allowlist) are decoded, and the four remaining `JSON.parse(...) as T` sites (`CommandEnvelope<CommandBody>` ×2, the two hand-authored debug fixtures) are a reviewed, justified, cast-source-keyed inline allowlist with occurrence counts (ADR-0151 §2). The gate fails closed on a stale entry and keys by raw normalised source (ADR-0151 §2 records the deviation from ADR-0106 §1's hash). Scope is load-bearing; ADR-0151 §1 records it.
- [Schema.Struct excess-key contradiction](issues/04-schema-struct-excess-key-contradiction.md): **resolved by executable probe** (`.scratch/effect-conformance/probe/excess-key-probe.mjs`, 6/6) — `Schema.Struct` **strips** by default (open; string + symbol keys), `{ onExcessProperty: "error" }` rejects, JSON-Schema default is open (`additionalProperties: true`). **Doc-only, already applied** by ticket 01; no code change. Ticket 03's F5 "align decoders to one policy constant" remedy **withdrawn** — strict/strip split is faithful pre-migration parity (`5df46569^` combat; `0c7370d4^` desktop IPC). Ratified in `docs/adr/ADR-0155-per-schema-excess-key-strictness.md`. Durable note: `docs/research/effect-conformance-04-schema-struct-excess-key.md`.

## Not yet specified

- The remediation shape for any Blocker that surfaces (e.g. if the `Schema.Struct`
  contradiction is real, does the code, the doc, or both change?) — graduates once
  tickets 01–04 report. *(Resolved by 01: the F1 contradiction is doc-only and
  doc-fixed across `effect-idioms.md` / ADR-0102 §4 / `RULES.md`; ticket 04 confirms it
  executably and withdraws ticket 03 F5's code remedy — the per-schema strict/strip split
  is faithful pre-migration parity, ratified in ADR-0155. F2's code remedy is withdrawn —
  the probe shows no aliasing.)*
- Whether any newly-confirmed behavioural rule warrants a new ratchet gate
  (ADR-0106 family) vs a doc/ADR statement. *(Resolved: doc/ADR, no new gate — the
  rule is per-schema parity, ratified in ADR-0155 and test-locked in the authored tree:
  `packages/persistence/test/schema-serialization.test.ts` locks default-strip,
  `packages/content-schema/test/parity.test.ts` and `packages/combat/test/air-defense/*`
  lock `onExcessProperty:"error"` rejection, and `packages/persistence/test/schema-struct-excess-key.test.ts`
  pins the raw mechanism.)*
- Graduated by 01–03: tickets 12 (error-gate scope) and 13 (boundary-decode gate scope).

## Out of scope

- Runtime wave (services / layers / ManagedRuntime / Streams) — declined by ADR-0128;
  the audit validates the declination, it does not reverse it.
- ai-docs sections with no Bluewave analogue: `40_sql`, `50_http-client`,
  `51_http-server`, `60_child_process`, `70_cli`, `71_ai`, `80_cluster`.
