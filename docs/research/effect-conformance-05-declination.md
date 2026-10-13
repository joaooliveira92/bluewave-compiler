# Research note — the declined ai-docs sections: documented rationale + machine gate

- **Ticket:** `.scratch/effect-conformance/issues/05-declination-confirmation.md`
- **Type:** task (AFK confirmation)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` source + its embedded tests are the
  evidence-of-truth for *what an API does*; repo ADRs / `RULES.md` /
  `agent-patterns/effect-idioms.md` are the policy of record. A conflict is itself a finding.
- **Scope:** the 12 ai-docs sections the audit lists as *not used* by Bluewave. The
  runtime wave is declined by ADR-0128; this note validates that declination, it does
  not reverse it.
- **Probes run:** `node .scratch/effect-conformance/probe/runtime-free-section-probe.mjs`
  → 18/18; `node scripts/assert-runtime-free.mjs` → ok; `node
  scripts/assert-authoritative-determinism.mjs` → ok. No code was edited by this session
  (one policy-doc factual correction, §5).
- **Durable note sibling of:** `docs/research/effect-conformance-0{1,2,3,4}-*.md`.

---

## 1. Question

For every ai-docs section Bluewave does **not** use, confirm there is (a) a documented
rationale for declining it and (b) a machine gate that keeps it declined; flag any
section declined only implicitly; and sanity-check the runtime-free allowlist
(`Data, Equal, Hash, Option, Predicate, Result, Schema, SchemaIssue`) against the
vendored runtime-free surface.

## 2. The enforcement model (why one gate covers eleven sections)

The declination is not eleven separate decisions — it is **one closed-allowlist rule**
applied to every runtime-free root:

1. **Doc of record.** ADR-0100 §2 (`:31–54`) splits the workspace into three layers and
   fixes the pure row to the *runtime-free subset*: `Schema`/`Data`/`Result`/`Option`/
   `Predicate`/`Equal`/`Hash`; the "Do **not** add" cell (`:38`) is `Effect`/`Layer`/
   `ManagedRuntime`/fibers/live services. `RULES.md` §"Effect source of truth"
   (`:54–58`) restates it as a closed rule — *"The runtime-free roots in
   `scripts/assert-runtime-free.mjs` import nothing else from `effect`. The full runtime
   lives only at IO boundaries."* ADR-0128 then declines the runtime *concretely*:
   §1 facades stay plain (`:51–56`), §2 no `ManagedRuntime` in `apps/desktop/src/main`
   (`:57–62`), §3 `compiler-cli` stays plain (`:63–65`), §4 the runtime-free subset is
   "the whole in-process idiom", single runtime symbol `Effect.succeed([])`
   (`:66–68`). `agent-patterns/effect-idioms.md` mirrors both (`:15–20`, `:42–47`).

2. **The gate.** `scripts/assert-runtime-free.mjs` (wired into `pnpm preflight` via
   `scripts/run-gates.mjs` `GATE_SETS.preflight`) is a **closed allowlist**, not a
   denylist: it permits only `RUNTIME_FREE_SYMBOLS` (`:58–67`), only `effect/<Name>`
   subpaths that equal an allowlisted name (`:74–77`), and **no** `@effect/*` import
   (`:79–81`). Any other named import of `effect` fails closed (`:133–136`). Its roots
   (`:37–54`) are the 15 pure `packages/*/src` trees plus `apps/desktop/src/main`.
   Therefore every section whose API is not one of the eight — i.e. every declined
   section — is rejected by construction in those roots.

3. **Scope of the gate is deliberate.** `packages/persistence/src`,
   `packages/content-compiler/src`, and `apps/compiler-cli/src` are the IO boundary and
   are **not** in `RUNTIME_FREE_ROOTS` (the header comment, `:33–36`, says so). ADR-0100
   §2's IO row (`:39`) explicitly *permits* `Effect`/`Layer`/`Context.Service`/
   `ManagedRuntime`/`Scope`/`Cause` there, and ADR-0128 §Revisit triggers (`:87–110`)
   says the first genuine async IO seam introduces one runtime there under ADR-0100's
   policy. So the declination is **scoped to the pure engine**; at the IO boundaries the
   sections are an *allowed-but-unused* capability, not a forbidden one. That is why the
   gate (which freezes the pure roots) is the correct enforcement, not a repo-wide ban.

Consequence: a section is *documented+covered* when (a) the closed-subset rule names
its rationale, or an ADR names the section explicitly, **and** (b) the gate rejects its
representative import. The probe (`probe/runtime-free-section-probe.mjs`) confirms (b)
for every section: **18/18**.

## 3. Section-by-section table

Verdict key: **documented+gated** = rationale in the policy of record and the gate
rejects the section's API; **naming gap** = gated, but no policy line names the section
(the rationale is the closed-subset rule, not an explicit decline) — Minor.

| ai-docs section | Bluewave analogue | Rationale (doc line) | Gate (evidence) | Verdict |
| --- | --- | --- | --- | --- |
| `01_effect/03_services` | `Context.Service`, `Layer`, `Context.Reference` | ADR-0128 §1 `:51–56` (facades stay plain); ADR-0100 §2 `:38` ("do not add" `Layer`/`Context.Service`/live services) | `Context`/`Layer` rejected (`probe` 1–2) | documented+gated |
| `01_effect/05_resources` | `Scope`, `Effect.acquireRelease`, `Layer.effectDiscard`, `LayerMap` | ADR-0100 §2 `:38` ("do not add" `Effect`/`Layer`); `Scope` is named only in the **IO** row `:39` (allowed there, declined in pure roots) | `Effect`/`Scope`/`LayerMap` rejected (`probe` 3–5) | documented (closed-subset) + gated; **naming gap** |
| `01_effect/06_running` | `NodeRuntime.runMain`, `BunRuntime`, `Layer.launch` | ADR-0128 §2 `:57–62` (main keeps `whenReady`/`ipcMain`); §3 `:63–65` (`compiler-cli` stays plain) | `NodeRuntime` rejected (`probe` 6) | documented+gated |
| `01_effect/07_pubsub` | `PubSub` event bus | closed-subset: ADR-0100 §2 `:38` ("do not add" live services); ADR-0128 declines the runtime wave | `PubSub` rejected (`probe` 7) | gated + **naming gap** |
| `03_stream` | `Stream`, `NodeStream` | closed-subset: ADR-0100 §2 `:38`; ADR-0128 §4 `:66–68` (runtime-free subset is the whole idiom) | `Stream` and `effect/NodeStream` rejected (`probe` 8–9) | gated + **naming gap** |
| `04_integration` | `ManagedRuntime` bridge | ADR-0128 §2 `:57–62` *explicitly* ("No `ManagedRuntime` is introduced in `apps/desktop/src/main`"); revisit trigger 1 `:92–97` | `ManagedRuntime` rejected (`probe` 10; gate self-test fixture too) | documented+gated |
| `05_batching` | `Request`, `RequestResolver` | closed-subset: ADR-0100 §2 `:38` | `Request`/`RequestResolver` rejected (`probe` 11) | gated + **naming gap** |
| `06_schedule` | `Schedule`, `Effect.retry`/`repeat` | closed-subset: ADR-0100 §2 `:38` | `Schedule` rejected (`probe` 12) | gated + **naming gap** |
| `07_datetime` | `DateTime`, `Clock`-powered time | RULES.md §Determinism `:28`; ADR-0150 §1 (`assert-authoritative-determinism`) rejects ambient `Date.now()`/`new Date()`; `DateTime` is a runtime module (imports `Effect`/`Layer`/`Context`) | `DateTime` rejected (`probe` 13); determinism gate rejects ambient time in pure roots (`assert-authoritative-determinism.mjs:92–113,160–163`) | documented+gated (double-covered) |
| `08_observability` | `Logger`, `Metric`, `effect/observability` (Otlp) | closed-subset: ADR-0100 §2 `:38`; logging is diagnostics/`Effect.log*` at IO only (RULES.md `:112–114`); `console.*` frozen by `assert-no-library-console.mjs` | `Logger`/`Metric` and `effect/observability` rejected (`probe` 14–15) | gated + **naming gap** |
| `09_testing` | `@effect/vitest` (`it.effect`) | RULES.md `:120` *"Tests run on `vite-plus/test`"* | **none for test files** — `assert-runtime-free` guards only `*/src` roots; `@effect/*` is rejected only *inside* those roots (`probe` 16) | **documented but NOT machine-gated → the one gap** |
| `10_predicate` | `Predicate` type guards | **Not declined** — explicitly *permitted*: RULES.md `:54`, ADR-0100 §2 `:38`, allowlist `:58–67` | allowlist **admits** it (`probe` 17) | allowlisted (sound); no declination owed |

**Still sound?** Yes for all eleven declined sections. The premise — a synchronous,
deterministic engine with no async IO/orchestration — is unchanged, and none of ADR-0128's
four revisit triggers (`:92–104`) is met. The "naming gap" rows are the only imprecision:
they are `documented+gated` (the closed-subset rule is the doc of record; the gate rejects
the API), but no policy line names the section, so a reader must reason from the allowlist.
`09_testing` is the sole true gap.

## 4. Findings (severity-tagged)

### F1 — The allowlist correctly declines every runtime section — **Info**
The probe exercises the *real* gate (`findRuntimeImports` imported from
`scripts/assert-runtime-free.mjs`): each declined section's representative import is
rejected with `runtime symbol "<Name>" imported from effect`, or `runtime module
import: effect/<Subpath>` / `@effect/* package import is not permitted`. **18/18.**
No failed-open case. See §3 and `probe/runtime-free-section-probe.mjs`.

### F2 — `09_testing` is documented but has no gate over test files — **Minor (gate gap)**
`RULES.md:120` fixes the runner (`vite-plus/test`), and `@effect/vitest` is never
imported anywhere in `packages/**`, `apps/**` or `scripts/**` (verified: 0 hits). But
`assert-runtime-free.mjs` only guards `packages/*/src` + `apps/desktop/src/main`, and
its `isGuarded` (`:172–174`) requires the `src` prefix — so a `packages/*/test/*.ts`
file is not scanned, and `@effect/vitest` in a test would not fail any gate. The barrier
is *implicit*: `@effect/vitest` is not declared in any manifest (only vendored at
`vendor/effect-vitest` and forced to `workspace:*` by `pnpm-workspace.yaml` overrides),
and `verify-package-dependencies.mjs:22` would *permit* declaring it (it only requires
the `workspace:*` specifier). **Remedy (decide in handoff, ticket 11):** accept with
rationale *or* extend a gate. Lowest-risk is **accept + record**: tests are excluded
from the runtime-free boundary by design (ADR-0150 §1 also excludes tests), the runner
is documented, and `@effect/vitest` cannot appear without a manifest edit. The fail-closed
alternative — teach `assert-runtime-free.mjs` a test-file scope that rejects `@effect/*`
(but not the runtime symbols a test might legitimately `runSync`) — is a scope decision
of the same shape as tickets 12/13 and should not be smuggled in here.

### F3 — ADR-0100 §1 mentions `@effect/vitest` as if adopted, but it is vendored-and-unused — **Info (doc nit)**
ADR-0100 §1 (`:29–30`) says *"`@effect/vitest` tracks the same unified version"* — true
of the vendored artifact, but the repo's test runner is `vite-plus/test` and
`@effect/vitest` has zero first-party usages. Read in isolation it implies the section
is adopted. **Remedy:** when F2's disposition is recorded, add a half-line to ADR-0100 §1
(or RULES.md) noting `@effect/vitest` is vendored for the single-copy line but tests run
on `vite-plus/test`.

### F4 — Six sections are declined by the closed-subset rule but never named — **Minor (doc)**
`05_resources`, `07_pubsub`, `03_stream`, `05_batching`, `06_schedule`, and
`08_observability` are correctly gated, but **no policy-of-record line declines the Effect
module** they stand for. A search of `docs/adr`, `RULES.md`, `agent-patterns`, and
`.ai/ENGINEERING-CONTRACT.md` finds no Effect-policy mention of `PubSub`, `Schedule`,
`Request`/`RequestResolver`, `DateTime`, `Logger`, `Metric`, `Otlp`, `Batching`,
`NodeRuntime`, or `LayerMap`. (The lone `Observability` hit is
`docs/adr/ADR-0091-live-ai-procurement.md:45`, about AI-procurement diagnostics — not the
Effect `effect/observability` module.) Their rationale is ADR-0100 §2's closed subset — a
valid rationale, but discovering "we declined X" requires reasoning from the allowlist
rather than reading a line. **Remedy (doc-only, batch into ticket 11):** add one table row
to ADR-0100 §2 (or a short "declined ai-docs sections" note) enumerating these six by name
with "declined: not needed by a synchronous deterministic engine; rejected by
`assert-runtime-free.mjs`". No gate change.

### F5 — The runtime-free allowlist is genuine and the `SchemaIssue` doc nit is real — **Info**
Verified against the vendored modules. The allowlist criterion is **"usable without running
an `Effect`"**, *not* "imports no runtime" — the module bodies may import the runtime core
(ADR-0128 §Context already accounts for that as a bundle side effect):

| allowlisted | vendored module | usable without a runtime? | note |
| --- | --- | --- | --- |
| `Predicate` | `src/Predicate.ts` | ✅ imports only `Function`/`HKT`/`Types` | **zero authored uses** (ticket 03 F7) |
| `Option` | `src/Option.ts` | ✅ no `Effect` import | zero authored uses |
| `Equal` / `Hash` | `src/Equal.ts` / `src/Hash.ts` | ✅ pure | zero authored uses |
| `Data` | `src/Data.ts` | ✅ constructors are pure | imports `internal/core` only via `core.Error`/`core.TaggedError` (`:1076,:1128`) |
| `Result` | `src/Result.ts` | ✅ pure data type | in use |
| `Schema` | `src/Schema.ts` | ✅ sync decode/encode needs no runtime | the module *does* import `Effect` (`:26`) plus `DateTime`/`Cause`/`Exit` — tree-shaken; the authored sites never `run` one |
| `SchemaIssue` | `src/SchemaIssue.ts` | ✅ data type + formatter | imports `Array`/`Formatter`/`Predicate` + schema internals; no `Effect` |

The audit's F7 doc nit is confirmed: **ADR-0100 §2's table (`:38`) omits `SchemaIssue`**,
while `RULES.md:54` and the gate's `RUNTIME_FREE_SYMBOLS` include it. **Remedy applied**
(§5).

### F6 — `10_predicate` is permitted, not declined — **Info**
It is the one listed "unused" section that is **not** a declination: `Predicate` is a
first-class member of the runtime-free subset (RULES.md `:54`, ADR-0100 §2 `:38`,
allowlist `:58–67`), so the gate *admits* it (`probe` 17). An allowlist is a permission
set, not a coverage requirement, so allowlisted-but-unused violates nothing. Adjacent
observation (not a declination question): the vendored `10_predicate` guidance —
*"NEVER write your own helper functions like `isRecord` or `isString`"* — is not adopted;
Bluewave hand-rolls guards at 5 sites (`packages/content-compiler/src/artifact.ts:291`,
`confidence.ts:208`; `packages/combat/src/aircraft/model.ts:26`; `apps/desktop/src/renderer/.../recent-files.ts:12`;
and the domain-specific `isStringArray`/`isRecordCleared`). Since Predicate is *permitted*,
using it where it fits is optional; the narrow domain guards (arrays, cleared records) are
outside `Predicate`'s surface anyway. **Remedy:** none required; optionally record the
house style in `effect-idioms.md` (batch into ticket 11).

### F7 — Two guarded roots are missing from ADR-0100 §2's package list — **Minor (doc parity)**
`assert-runtime-free.mjs` guards `packages/campaign-engine/src` (`:42`) and
`packages/ship-visual/src` (`:53`), but ADR-0100 §2's pure-row package list named neither
(verified: zero hits in the ADR). A guarded root with no doc line is the same class of
doc-vs-gate drift as F4. **Remedy applied** (§5): both added to the ADR list.

## 5. Remediation applied by this ticket

Doc-only; **no gate or code touched**.

- **F5 doc nit (factual, assigned here by ticket 03 F7):** added `SchemaIssue` to
  ADR-0100 §2's runtime-free-subset cell so the policy-of-record table matches
  `RULES.md:54` and `RUNTIME_FREE_SYMBOLS`; updated `agent-patterns/effect-idioms.md`'s
  runtime-free list to match.
- **F7 doc parity:** added `campaign-engine` and `ship-visual` to ADR-0100 §2's
  pure-row package list, matching `RUNTIME_FREE_ROOTS`.

Everything else is a **remedy recommendation** for the handoff (ticket 11), per the
map's "decide remedies, not apply them" rule for this audit.

## 6. Reproduction commands

```sh
node .scratch/effect-conformance/probe/runtime-free-section-probe.mjs   # 18/18
node scripts/assert-runtime-free.mjs                                    # ok (16 roots)
node scripts/assert-authoritative-determinism.mjs                       # ok
rg -n "from \"?effect|from \"?@effect/" packages apps --glob '*.ts' -g '!**/dist/**'   # only Effect.succeed
rg -n "PubSub|Schedule|RequestResolver|DateTime|Observability|Logger|Metric|Otlp|Batching|NodeRuntime|LayerMap" \
   docs/adr RULES.md agent-patterns .ai/ENGINEERING-CONTRACT.md   # only ADR-0091:45 (AI diagnostics, not the Effect module)
```