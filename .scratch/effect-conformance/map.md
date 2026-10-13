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
- [Determinism advisory gating](issues/06-determinism-advisory-gating.md): **resolved — accept with rationale, no gate change.** The warn advisories stay the broad detector; the hard gate stays scoped to the pure engine; the IO boundaries (`persistence`, `content-compiler`, `compiler-cli`, `apps/desktop/src/main`) are covered *behaviourally* by golden + cross-process + locale gates on their exercised authoritative paths, and every boundary ambient read is non-authoritative (envelope metadata / injectable clocks / dev flags / sorted enumeration). A scoped boundary gate would flag those legitimate sites (the ADR-0150 §Alternatives rejection) and mis-flag sorted enumeration. **Residual (deferred to 11):** `discoverShipBuildingFiles` is authoritative but unexercised by the golden fixture and not golden-pinned → pin with an order-independence test or accept. Durable note: `docs/research/effect-conformance-06-determinism-advisory-gating.md`.
- [Declination confirmation](issues/05-declination-confirmation.md): **resolved** — one closed-allowlist rule (`scripts/assert-runtime-free.mjs`, a `pnpm preflight` gate) declines every listed ai-docs section: only the 8 runtime-free symbols, only `effect/<allowlisted>` subpaths, no `@effect/*`, in the 15 pure `packages/*/src` roots + `apps/desktop/src/main` (probe `.scratch/effect-conformance/probe/runtime-free-section-probe.mjs`, 18/18). **Documented+gated:** `03_services`, `06_running`, `04_integration`, `07_datetime` (also ADR-0150). **Gated, never named** (Minor doc gap → ticket 11): `05_resources`, `07_pubsub`, `03_stream`, `05_batching`, `06_schedule`, `08_observability`. **The one gate gap:** `09_testing` (documented `RULES.md:120` = `vite-plus/test`; `assert-runtime-free` guards only `*/src`) → remedy accept+record or a separate test-file scope decision in ticket 11. `10_predicate` is **not** declined (allowlisted permission), verified runtime-free. Doc nits **applied**: `SchemaIssue` into ADR-0100 §2 + `effect-idioms.md`; `campaign-engine`/`ship-visual` into ADR-0100 §2's package list. Durable note: `docs/research/effect-conformance-05-declination.md`.
- [campaignInput filesystem-read in a runtime-free package](issues/07-campaigninput-fs-in-pure.md): **resolved — remedy "move the IO to a boundary" already applied; no reclassification, no new ADR.** The ADR-0100 §2 amendment-time debt (`packages/campaign/src/campaignInput.ts` read+parsed YAML files) was closed by CAH-LEG-1 (commit `37ca7384`, `rules-compliance` 04/05), which moved the raw-file/parse boundary to the `content-compiler` IO package (`buildContentBundleArtifact`); `campaignInput.ts` is now a pure coercion contract (`toSafeInt`/`toSafeIntOpt`/`toStr` + `CampaignFileData`) and `campaign` is genuinely IO-free. `assert-runtime-free` covers `packages/campaign/src` but only detects Effect-runtime imports, **not `node:fs`** — it passed even while the IO was present (never an Effect gap), and `assert-no-stage-io` is scoped to `content-compiler/src/stages` only. ADR-0100 §2's amendment note corrected to record resolution. Durable note: `docs/research/effect-conformance-07-campaigninput-fs.md`.
- [Persistence async facade / BluewaveError cleanup](issues/08-persistence-facade-bluewave-error.md): **resolved — `BluewaveError` cleanup dropped (already resolved by ADR-0152); `persistence` async facade + `SaveStore` tagged-error routing kept deferred.** `BluewaveError` already carries `readonly _tag` + `isBluewaveError`, every renderer-reachable class has `_tag`/`static is`, and **zero** `instanceof BluewaveError` remain (tickets 12/14, ADR-0152) — the literal `Data.TaggedError` conversion is permanently barred by `MIG-EXCL-1`, so no trigger. `SaveStore` stays synchronous by contract (ADR-0104 §6) and the facade flip is barred by ADR-0128 §2/§3 (ADR-0152 makes `persistence` non-renderer-reachable, so §1 does not apply; ticket 34 inventory empty); reopen per ADR-0128 §Revisit triggers #1/#3. The `PERSISTENCE_*` tagged vocabulary exists (`errors.ts:50-101`) but the store routes none of its 32 collector `addError` sites through it (only the compatibility checker constructs one, `compatibility.ts:23`); routing reopens when a caller needs `catchTag`, not a collector diagnostic. No new ADR, no code. Durable note: `docs/research/effect-conformance-08-persistence-facade.md`.
- [`scripts/**` outside the Effect gate](issues/09-scripts-lint-effect-scope.md): **resolved — accept with rationale, no scope extension, no new guard.** Probe (`.scratch/effect-conformance/probe/scripts-effect-usage-probe.mjs`, 61 files) finds **0** `effect`/`@effect/*` module references in `scripts/**`; the tree is dev/build tooling outside the workspace (`pnpm-workspace.yaml`), outside the TS project graph (root `tsconfig.json`), and with no root `effect` dependency. It is already gated by `verify-no-unknown-casts` + `verify-test-focus` (`AREAS` include `scripts/`), `vp lint`, `vp fmt`; extending `lint:effect` would only false-positive the determinism advisories on legitimate ambient IO (`process.env` 11 files, `node:fs` 11, `new Date()` 3, random 2). Remedy applied: `"scripts/**"` added to `oxlint.effect.json` `ignorePatterns` (declarative, mirrors `apps/desktop/scripts/**`). Durable note: `docs/research/effect-conformance-09-scripts-lint-effect.md`.
- [Stale "validate IPC with Zod" line in ENGINEERING-CONTRACT.md](issues/10-engineering-contract-zod-line.md): **resolved, applied (doc-only)** — the stale rule was `ENGINEERING-CONTRACT.md:77` + `:102`, plus four live forward-reference docs: `.ai/IMPLEMENTATION-PROMPT.md:42`, `.opencode/agents/implementator.md:30`, `docs/domain/armament-content.md:20`, `packages/README.md:21`; all now say "decode untrusted boundaries with a strict Effect `Schema`" and cite the decode-at-boundary gate (`scripts/assert-boundary-decode.mjs`) + ADR-0102/0105. `RULES.md` was already correct and `AGENTS.md`/`docs/delivery/*` had no Zod instruction; historical records (`ROADMAP.md`, briefs, reports, `PROGRESS.md`, other `.scratch/` efforts) and immutable ADRs (amended via `AMENDMENTS.md`) left intact so the record is not falsified. Reviewer (both axes) flagged the overstated gate scope → tightened to "in the scopes it guards".

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
