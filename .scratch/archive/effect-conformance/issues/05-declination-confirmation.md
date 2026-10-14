# Confirm every declined ai-docs section is documented + gated

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

The audit validates the declination (ADR-0128) rather than reversing it. For each
ai-docs section Bluewave does not use, confirm there is (a) a documented rationale and
(b) a machine gate that keeps it declined.

Sections to confirm: `03_services`, `05_resources`, `06_running`, `07_pubsub`,
`03_stream`, `04_integration`, `05_batching`, `06_schedule`, `07_datetime`,
`08_observability`, `09_testing`, `10_predicate`.

For each, report: the ADR / doc line that declines it, the gate that enforces the
decline (if any), and whether the declination is still sound. Flag any section that is
declined only implicitly (no doc, no gate) as a finding. Also sanity-check the
runtime-free allowlist (`Data, Equal, Hash, Option, Predicate, Result, Schema,
SchemaIssue`) against the vendored runtime-free surface.

Deliver: a table of section → rationale → gate → verdict (documented+gated / gap), with
a remedy for each gap.

## Answer

Resolved. Evidence: `docs/research/effect-conformance-05-declination.md`; probe
`.scratch/effect-conformance/probe/runtime-free-section-probe.mjs` (18/18, exercises the
real gate via `findRuntimeImports`).

**Model.** The declination is one closed-allowlist rule, not twelve decisions:
`scripts/assert-runtime-free.mjs` (a `pnpm preflight` gate) permits only
`RUNTIME_FREE_SYMBOLS` from `effect`, only `effect/<allowlisted>` subpaths, and no
`@effect/*`, in the 15 pure `packages/*/src` roots + `apps/desktop/src/main`. Every
declined section's API is rejected by construction. Doc of record: ADR-0100 §2
(`:31–54`, runtime-free subset / "do not add" cell `:38`), `RULES.md:54–58`, ADR-0128
§1–§4 (`:51–68`), `effect-idioms.md:15–20,42–47`. Scope is deliberate: the IO boundaries
(`persistence`/`content-compiler`/`compiler-cli`) are exempt because ADR-0100 §2 `:39`
permits the full runtime there (ADR-0128 §Revisit `:87–110`), so the declination is
enforced in the pure engine.

| Section | Rationale (doc) | Gate | Verdict |
| --- | --- | --- | --- |
| `03_services` | ADR-0128 §1 `:51–56`; ADR-0100 §2 `:38` | `Context`/`Layer` rejected | documented+gated |
| `05_resources` | ADR-0100 §2 `:38`; `Scope` named only in the IO row `:39` | `Effect`/`Scope`/`LayerMap` rejected | closed-subset + gated; **naming gap** |
| `06_running` | ADR-0128 §2 `:57–62`, §3 `:63–65` | `NodeRuntime` rejected | documented+gated |
| `07_pubsub` | closed-subset: ADR-0100 §2 `:38` | `PubSub` rejected | gated; **naming gap** |
| `03_stream` | closed-subset: ADR-0100 §2 `:38`; ADR-0128 §4 `:66–68` | `Stream`, `effect/NodeStream` rejected | gated; **naming gap** |
| `04_integration` | ADR-0128 §2 `:57–62` (explicit) | `ManagedRuntime` rejected | documented+gated |
| `05_batching` | closed-subset: ADR-0100 §2 `:38` | `Request`/`RequestResolver` rejected | gated; **naming gap** |
| `06_schedule` | closed-subset: ADR-0100 §2 `:38` | `Schedule` rejected | gated; **naming gap** |
| `07_datetime` | RULES.md §Determinism `:28`; ADR-0150 (ambient `Date.now()/new Date()`) | `DateTime` rejected + determinism gate | documented+gated |
| `08_observability` | closed-subset: ADR-0100 §2 `:38`; RULES.md `:112–114` | `Logger`/`Metric` + `effect/observability` rejected | gated; **naming gap** |
| `09_testing` | RULES.md `:120` (`vite-plus/test`) | **none for test files** | **documented but ungated → gap** |
| `10_predicate` | **not declined** — RULES.md `:54`, ADR-0100 §2 `:38`, allowlist | allowlist **admits** it | allowlisted (sound) |

**Still sound?** Yes for all eleven declined sections. The rationale (a synchronous
deterministic engine with no async IO/orchestration, ADR-0100 §2 / ADR-0128 §Context) still
holds, and none of ADR-0128's four revisit triggers (`:92–104`) is met: no non-renderer
async IO seam, no runtime-free package with async IO, no `Cause`/`AbortSignal` requirement,
no renderer-reachable Effect surface. The "naming gap" rows are the only imprecision —
they are `documented+gated` (the closed-subset rule is the doc; the gate rejects the API),
but no policy line names the section. `09_testing` is the sole genuine gap.

**Findings.**
- **F1 (Info):** the gate declines every runtime section — probe 18/18. No failed-open case.
- **F2 (Minor, gate gap):** `09_testing` — zero `@effect/vitest` usages, but
  `assert-runtime-free.mjs` guards only `*/src` roots, so a test file could import it
  ungated; `@effect/vitest` is undeclared (vendored + workspace-overridden) so the barrier
  is implicit only. Remedy for ticket 11: **accept + record** (tests are excluded from the
  runtime-free boundary by design, ADR-0150 §1), or add a test-file scope as a separate
  scope decision — not smuggled in here.
- **F3 (Info, doc nit):** ADR-0100 §1 `:29–30` mentions `@effect/vitest` as if adopted;
  it is vendored-and-unused (runner is `vite-plus/test`). Clarify when F2 is recorded.
- **F4 (Minor, doc):** `05_resources`/`07_pubsub`/`03_stream`/`05_batching`/`06_schedule`/
  `08_observability` are correctly gated but **no policy-of-record line declines the Effect
  module** they stand for — a search of `docs/adr`, `RULES.md`, `agent-patterns`, and
  `.ai/ENGINEERING-CONTRACT.md` finds no Effect-policy mention of `PubSub`, `Schedule`,
  `Request`/`RequestResolver`, `DateTime`, `Logger`, `Metric`, `Otlp`, `Batching`,
  `NodeRuntime`, or `LayerMap` (the lone `Observability` hit is `ADR-0091:45`, about AI-
  procurement diagnostics, not the Effect module). Remedy: one enumerating row in ADR-0100
  §2 (ticket 11); no gate change.
- **F5 (Info, applied):** allowlist sanity-check passes — all eight are *usable without
  running an `Effect`* (the allowlist criterion), `SchemaIssue` included. Note this is not
  "imports no runtime": e.g. `vendor/effect/src/Schema.ts:26` imports `Effect` (plus
  `DateTime`/`Cause`/`Exit`), and `Data.ts:1076,1128` touches `internal/core` via
  `core.Error`/`core.TaggedError` — the bundle side effect ADR-0128 §Context already
  accounts for; the authored sites still never `run` one. The ticket-03 F7 doc nit is real
  and fixed here: ADR-0100 §2 `:38` omitted `SchemaIssue` while `RULES.md:54` and the gate
  include it.
- **F6 (Info):** `10_predicate` is permitted, not declined (allowlist is a permission set);
  the vendored "never hand-roll `isRecord`/`isString`" guidance is unadopted at 5 authored
  sites — optional, domain guards beyond `Predicate`'s surface. No remedy required.
- **F7 (Minor, doc parity):** `assert-runtime-free.mjs` guards `packages/campaign-engine/src`
  and `packages/ship-visual/src` (`:42,:53`), but ADR-0100 §2's pure-row package list omits
  both (grep: no hits). A guarded root with no doc line is the same class as F4. Remedy
  applied with F5: both packages added to ADR-0100 §2's list.

**Remediation applied (doc-only, gate/code untouched):** `SchemaIssue` added to ADR-0100
§2's runtime-free-subset cell and to `agent-patterns/effect-idioms.md`'s list (F5);
`campaign-engine`/`ship-visual` added to ADR-0100 §2's package list (F7). Both are factual
policy-of-record corrections the earlier tickets explicitly deferred to ticket 05 (ticket 03
F7: *"Ticket 05 owns the full runtime-free allowlist declination check (F7 doc nit
included)"*). All other remedies are recommendations for the handoff (ticket 11), per the
map's "decide remedies, not apply them" for the runtime wave.
