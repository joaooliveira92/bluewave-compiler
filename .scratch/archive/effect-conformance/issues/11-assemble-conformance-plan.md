# Assemble the Effect-conformance spec + tickets

**Type:** task
**Status:** resolved
**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 12, 13

## Question

The map's destination. With every verdict in (tickets 01–10), assemble the
severity-tagged findings set and produce the handoff: a spec via `to-spec` and
implementation tickets via `to-tickets` (frontier-ordered vertical slices), or record
that no remediation is warranted.

The plan groups findings into ordered remediation waves; each finding carries severity
(Blocker/Major/Minor/Info), vendored evidence, and an agreed remedy (code / doc / ADR /
accept). Any newly-confirmed behavioural rule that can be machine-checked is proposed as
a ratchet gate (ADR-0106 family).

Do **not** apply fixes here; this ticket produces the plan.

## Answer

The audit is assembled into a severity-tagged findings register and handed off as a
spec (`.scratch/effect-conformance/spec.md`) plus four frontier-ordered implementation
tickets (`INC-1`..`INC-4`). **No Blocker or Major finding remains open** — every one was
remediated in tickets 01–14; the open set is Minor/Info. **No new ratchet gate is
proposed** (see "Ratchet-gate decision"). **No runtime wave** — ADR-0128 stands.

### Destination audit

The map's three done-conditions, closed:

- **Every used concept has a vendored-verified verdict.** `Schema` (01, confirmed
  executably by 04), `Data.TaggedError` (02), `Result` + decode-at-boundary (03): all
  conform except one *false rule* (F-01-1), which was a **doc** error and was fixed.
- **Every declined ai-docs section has a documented, gate-covered declination.** 05 shows
  one closed-allowlist rule (`scripts/assert-runtime-free.mjs`) declines all eleven
  sections; three completeness nits (F-05-2/3/4) carry into the handoff.
- **Each of the six known un-gated seams has a resolved disposition:**

| # | Un-gated seam | Disposition | Where |
|---|---|---|---|
| 1 | `apps/**` tagged errors (`ContentArtifactError`) | **fixed** — gate widened; `_tag` + `static is` added | 12, 14 |
| 2 | `compiler-cli` boundary casts | **fixed** — `cli` scope added; 4 decoded, 4 in a reviewed allowlist | 13 |
| 3 | `09_testing` test-file boundary | **accept with rationale + record** — tests are outside the runtime-free boundary by design (ADR-0150 §1); recorded by INC-2 | INC-2 |
| 4 | `scripts/**` outside `lint:effect` | **accept** — `scripts/**` in `ignorePatterns` | 09 |
| 5 | `campaignInput` fs read in a pure package | **fixed** — IO moved to `content-compiler` (CAH-LEG-1) | 07 |
| 6 | IO-boundary determinism advisories | **accept with rationale** — behavioural golden/cross-process coverage; the one unexercised path pinned by INC-1 | 06, INC-1 |

### Findings register

Severity: **Blocker** (behavioural divergence / boundary leak / false rule), **Major**
(documented rule violated, no runtime impact), **Minor** (style/consistency), **Info**
(doc nit). **Applied** = remedy landed, no forward work; **Open** = carries into a wave
below. Vendored source + tests are the evidence-of-truth for *what an API does*; the
repo's ADRs / `RULES.md` / `agent-patterns/effect-idioms.md` are the policy of record.

#### Open findings → remediation waves

**Wave 1 — close the unrung coverage seams**

| ID | Finding | Sev | Evidence | Remedy | Ticket |
|---|---|---|---|---|---|
| F-05-2 | `09_testing` is documented but ungated: `assert-runtime-free.mjs` guards only `*/src`, so a test file could import `@effect/vitest` unchallenged | Minor | `assert-runtime-free.mjs:37-53,173`; `RULES.md:120` | accept + record (tests outside the runtime-free boundary, ADR-0150 §1) | INC-2 |
| F-05-3 | ADR-0100 §1 presents `@effect/vitest` as adopted; it is vendored-and-unused (runner is `vite-plus/test`) | Info | `docs/adr/ADR-0100:29` | correct the wording | INC-2 |
| F-06-R | `discoverShipBuildingFiles` is authoritative but not exercised by the golden fixture, so its host readdir order is unpinned | Minor | `packages/content-compiler/src/shipBuildingDiscovery.ts:79-92` (sorted) | focused order-independence test, or explicit accept | INC-1 |

**Wave 2 — complete the policy of record**

| ID | Finding | Sev | Evidence | Remedy | Ticket |
|---|---|---|---|---|---|
| F-05-4 | Six declined Effect modules (`Resources`, `PubSub`, `Stream`, `Batching`, `Schedule`, `Observability`) are gated by the closed-subset rule but **unnamed** in any policy line | Minor | 05 F4 — no `docs/adr`/`RULES.md` hit | one enumerating row in ADR-0100 §2 | INC-2 |

**Wave 3 — consistency nits**

| ID | Finding | Sev | Evidence | Remedy | Ticket |
|---|---|---|---|---|---|
| F-03-4 | Six decode-then-narrow `as T` sites after a *successful* decode (`monthInput.ts`, `pendingCommands.ts`, `persistence/store.ts:447`, `air-defense-system-definition.ts`, `combat/air-defense/attack.ts:204`, `campaignBridge.ts:333`) | Minor | 03 F4 | remove the cast where the schema can carry the nominal type; else record accept | INC-3 |
| F-03-6 | `schema-validator.ts:23` narrows by raw `result._tag === "Failure"` where its siblings use `Result.isFailure` | Info | 03 F6 | use `Result.isFailure` | INC-4 |

**Wave 4 — deferred structural refactor (recorded, not scheduled)**

| ID | Finding | Sev | Evidence | Remedy | State |
|---|---|---|---|---|---|
| F-13-FU | The gate family copies `normalize`/`lineAt`/`SOURCE_RE`/`runSelfTest` with divergent discovery semantics (ticket 13 counts seven; the copied helpers appear in at least eight `scripts/assert-*.mjs`) | Minor | 13 follow-up | dedicated extraction refactor, not a defect fix | **deferred** — trigger: any defect fix that touches ≥2 gate scripts |

**Accepted (no forward work)** — dispositions recorded, not ticketed:

| ID | Sev | Source | Disposition |
|---|---|---|---|
| F-01-2 | Info | 01 | **withdrawn** — probe shows no aliasing (`Schema.Array` defaults are fresh per decode) |
| F-01-3 | Info | 01 | accept — an `Effect` is the required argument to `withDecodingDefaultType` |
| F-01-4 | Minor (style) | 01 | accept — optional style (`Schema.Int`); ticket 01 recorded "no change" |
| F-01-5 | Info | 01 | accept — filters (`isInt`…`makeFilter`) are the idiomatic v4 form |
| F-01-6 | Info | 01 | accept — `SchemaIssue.makeFormatterStandardSchemaV1` is the right sink |
| F-01-8 | Info | 01 | accept — never using `Schema.TaggedError` is correct (ADR-0152) |
| F-02-1 | Info | 02 | accept — all 14 `Data.TaggedError` classes conform; no source `instanceof` |
| F-02-7 | Info | 02 | accept — `RULES.md §Errors` grounded; `orDie` real but unused (no runtime) |
| F-03-1 | Info | 03 | accept — `Result.isFailure`/`isSuccess` are idiomatic |
| F-03-2 | Info | 03 | accept — decode-at-boundary shape matches the vendored idiom |
| F-03-5 | Info | 03/04 | accept — strict/strip split is pre-migration parity, ratified ADR-0155 |
| F-03-7 | Info | 03/05 | accept — `Option`/`Predicate` are permissions, not gaps |
| F-05-1 | Info | 05 | accept — the gate declines every runtime section (probe 18/18) |
| F-05-6 | Info | 05 | accept — `10_predicate` permitted; hand-rolled guards optional |
| 06 (verdict) | — | 06 | accept — IO-boundary determinism exemption correct (behavioural coverage) |
| F-08-1 | (debt) | 08 | **dropped** — `BluewaveError` cleanup moot under `MIG-EXCL-1` + ADR-0152 |
| F-08-2 | (debt) | 08 | kept **deferred** — `persistence` async facade (ADR-0128 §Revisit #1/#3) |
| F-08-3 | (debt) | 08 | kept **deferred** — `SaveStore` → `PERSISTENCE_*` routing (reopen on `catchTag` need) |

#### Applied remediation (the audit's yield — no forward work)

| ID | Severity | Fix | Where |
|---|---|---|---|
| F-01-1 | Blocker (false rule) | `Schema.Struct` strips by default — doc corrected across `effect-idioms.md`, ADR-0102 §4, `RULES.md` | 01, 04; ADR-0155 |
| F-01-7 | Minor | ADR-0102 §5's v3 names rewritten to the real v4 names | 01 |
| F-02-2 | Minor | three test helpers narrow on `_tag` instead of `instanceof` | 12, 14 |
| F-02-3 | Info (latent) | `_tag` serialization hazard pinned by a regression test (`JSON.stringify` preserves it, `structuredClone` drops it) | 14 G5 |
| F-02-4 | Major (gate gap) | `ContentArtifactError` gains `_tag` + `static is`; `assert-tagged-errors` scopes widened to every first-party root | 12 |
| F-02-5/6 | Minor | ADR-0152 §1/§2/§5/§6 aligned; "renderer-reachable" defined as value-import reachability | 12, 14 |
| F-03-3 | Major (gate gap) | `assert-boundary-decode` gains a `cli` scope; four sites decoded, four allowlisted (ADR-0151 §2) | 13 |
| F-14-G1..G5 | Major/Minor | remaining test `instanceof` migrated; `diagnostics` confirmed not value-reachable; gate detects `globalThis.Error` aliases | 14 |
| F-05-5/7 | Info/Minor | `SchemaIssue` + `campaign-engine`/`ship-visual` added to ADR-0100 §2 | 05 |
| F-07-0 | (debt) | filesystem IO moved out of `packages/campaign` to `content-compiler` (CAH-LEG-1, `37ca7384`) | 07 |
| F-09-0 | (verdict) | `scripts/**` added to `oxlint.effect.json` `ignorePatterns` | 09 |
| F-10-0 | (doc) | five forward-guidance docs corrected from "Zod" to strict Effect `Schema` | 10 |

### Ratchet-gate decision

**No new ratchet gate is proposed.** The one newly-confirmed behavioural rule from the
audit — `Schema.Struct` strips excess keys unless `{ onExcessProperty: "error" }` is
passed (04) — is a *per-schema parity* rule, not an always-apply rule: the strict/strip
split is deliberate pre-migration parity, ratified in **ADR-0155** and already
test-locked (`packages/persistence/test/schema-serialization.test.ts`,
`packages/persistence/test/schema-struct-excess-key.test.ts`,
`packages/content-schema/test/parity.test.ts`, `packages/combat/test/air-defense/*`). A
gate would have to encode the intended strictness per schema — exactly the per-schema
decision the option expresses — so the test lock *is* the ratchet. Every other confirmed
rule is already gated (`assert-runtime-free`, `assert-tagged-errors`,
`assert-boundary-decode`, `assert-authoritative-determinism`,
`assert-canonical-serialization`, `assert-no-stage-io`, `assert-no-library-console`).

### Handoff

- **Spec:** `.scratch/effect-conformance/spec.md` (pointer:
  `.ai/specs/effect-conformance.md`).
- **Tickets** (frontier-ordered; all unblocked, `Frontier: yes`):
  1. `INC-1` — Pin `discoverShipBuildingFiles` order-independence.
  2. `INC-2` — Complete ADR-0100's policy of record (test-file boundary + declined-module naming + §1 wording).
  3. `INC-3` — Remove the residual decode-then-narrow casts.
  4. `INC-4` — `validateAgainstSchema` `Result.isFailure` consistency.
- **Not ticketed:** `F-13-FU` (gate-family extraction) — a deferred structural refactor
  with a recorded trigger.
- **Execution boundary:** this ticket produces the plan only; applying the four tickets
  is the later effort off the handoff (map: "decide remedies, not apply them").
