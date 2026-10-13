# Spec: Effect-conformance remediation (`effect-conformance`)

One-line purpose: close the residual Effect-conformance findings the audit surfaced,
freezing the last un-hardened seams, so the audited tree cannot drift back out of
conformance.

**Triage:** `ready-for-agent` — fully specified, ready for an AFK agent. In this repo
that means the sliced implementation tickets carry `Status: open`, `Frontier: yes`, and a
resolved/empty `Blocked by:` chain (see `docs/agents/triage-labels.md`).
**Status:** sliced — 4 frontier-ordered implementation tickets at
`.scratch/effect-conformance/issues/` (`INC-1`..`INC-4`), all unblocked.
**Source of truth:** this spec, together with the findings register in
`.scratch/effect-conformance/issues/11-assemble-conformance-plan.md` and the durable
research notes under `docs/research/effect-conformance-*.md`.
**Grounds:** ADR-0100 (package I/O classification), ADR-0106 (ratchet gates),
ADR-0109 (ship-building discovery convention), ADR-0128 (runtime-free subset;
declination), ADR-0150 (authoritative determinism), ADR-0151 (boundary-decode gate),
ADR-0152 (tagged errors by reachability), ADR-0155 (per-schema excess-key strictness).

---

## Problem Statement

The Effect-conformance audit is complete. Fourteen decision tickets (01–14) established a
vendored-verified verdict for every *used* Effect concept, confirmed that every
*declined* ai-docs section is documented and gated, and gave each of the six known
un-gated seams a disposition. The Blocker/Major findings — the false "closed Struct"
rule, the `apps/**` tagged-error gap, and the `compiler-cli` boundary-cast gap — are
already remediated and gated.

What remains is a small residue of Minor/Info findings that the audit deliberately
deferred to this handoff rather than fixing inline:

1. **One coverage seam is documented but ungated.** `RULES.md:120` names
   `vite-plus/test` as the test runner (declining `@effect/vitest`), but
   `scripts/assert-runtime-free.mjs` guards only `*/src` roots, so a test file could
   import the Effect test runtime unchallenged. ADR-0100 §1 also still reads as if
   `@effect/vitest` were adopted, when it is vendored-and-unused.
2. **Six declined Effect modules are gated by construction but unnamed in policy.** The
   closed-subset runtime-free rule rejects `Resources`, `PubSub`, `Stream`, `Batching`,
   `Schedule`, and `Observability` — but no line in `docs/adr`, `RULES.md`, or the
   `agent-patterns` docs actually names them.
3. **One authoritative path is behaviourally unpinned.** `discoverShipBuildingFiles`
   feeds the compiled content surface and sorts its host `readdir` reads, but the golden
   fixture does not exercise it, so an order-sensitive regression would not fail a hard
   gate.
4. **Two consistency nits.** Six sites narrow a *successfully decoded* value with
   `as T`, and one boundary validator narrows a `Result` by raw `_tag` where its
   siblings use `Result.isFailure`.

From the maintainer's perspective the risk is decay: the audit proved conformance once,
but a rule with no gate or no policy line is a rule the next change can quietly break.
From the autonomous agent's perspective the risk is the same — "did I follow the
declination?" should be answered by a gate or a named rule, not by inference.

## Solution

Close the residual seams and finish the policy of record, without touching runtime
behaviour:

- **Decide and record the `09_testing` boundary.** The recommended deterministic
  resolution is **accept + record**: test files are outside the runtime-free boundary by
  design (ADR-0150 §1), and `@effect/vitest` is not a dependency — so the exemption is
  written into ADR-0100 §2 (and §1's wording corrected) rather than a new test-file scope
  being added to the runtime-free gate.
- **Pin `discoverShipBuildingFiles` order-independence** with a focused test that proves
  the discovered groups are stable under shuffled `readdir` order, mirroring the existing
  enumeration-order pins.
- **Name the six declined modules** in one enumerating row of ADR-0100 §2, so the
  closed-subset rule has a searchable policy line.
- **Remove the residual decode-then-narrow casts** where the schema can carry the nominal
  type, and record an explicit accept where the narrowing is only `exactOptionalProperty`
  noise.
- **Normalise the one `Result` narrowing** to `Result.isFailure`, matching its siblings.

Nothing here changes a gameplay, balance, or simulation result; the goldens are expected
to stay byte-identical.

## User Stories

1. As a maintainer, I want the `09_testing` declination written into ADR-0100, so that
   "why is there no test-file runtime gate?" has a documented answer.
2. As a maintainer, I want ADR-0100 §1 to stop presenting `@effect/vitest` as adopted, so
   that the runtime-free policy does not contradict the actual test runner.
3. As an autonomous agent, I want the six declined Effect modules named in one policy
   row, so that a search for `PubSub`/`Schedule`/`Stream` finds the declination instead of
   nothing.
4. As a maintainer, I want `discoverShipBuildingFiles` pinned by an order-independence
   test, so that a host `readdir`-order regression on an authoritative path fails CI.
5. As a maintainer, I want an unexercised authoritative path either pinned or explicitly
   accepted, so that "not covered by the golden fixture" is a recorded decision, not a
   blind spot.
6. As an autonomous agent, I want the residual decode-then-narrow casts removed where the
   schema can carry the nominal type, so that a later type change cannot silently widen a
   boundary.
7. As a reviewer, I want every remaining `as T` after a decode either gone or justified
   in place, so that the decode-at-boundary rule is not eroded by "helpful" narrowing.
8. As an autonomous agent, I want the one `Result` narrowing written the same way as its
   siblings, so that consistency cannot be mistaken for a special case.
9. As a maintainer, I want the audit's Blocker/Major fixes left exactly as they are, so
   that this residue-closing work cannot regress the already-gated conformance.
10. As a maintainer, I want no new ratchet gate unless a confirmed rule is genuinely
    always-apply, so that the gate suite stays meaningful rather than noisy.
11. As a player, I want no gameplay or balance behaviour to change, so that this
    governance work is invisible in outcomes.
12. As an autonomous agent, I want the change to leave `pnpm preflight` and
    `pnpm test:scripts` green, so that completion is objectively provable.
13. As a maintainer, I want the deferred gate-helper refactor recorded with a trigger, so
    that it is neither silently dropped nor done prematurely.
14. As a maintainer, I want the handoff spec and tickets to trace every open finding to a
    ticket or an accept, so that the audit has no loose ends.
15. As a reviewer, I want the spec's Out-of-Scope section to name the deferred refactor
    and the untouched runtime wave, so that the boundary of this effort is explicit.

## Implementation Decisions

### Decision 1 — the `09_testing` boundary is accept + record, not a new gate

`assert-runtime-free.mjs` stays scoped to `*/src` roots (with `apps/desktop/src/main`).
The declination is recorded in ADR-0100 §2 as an explicit "test files" row: the
runtime-free boundary protects the *bundled renderer* and the *pure packages*, neither of
which a `*.test.ts` file reaches; and `@effect/vitest` is not a declared dependency, so
the implicit barrier is documented rather than newly gated. ADR-0100 §1's
`@effect/vitest` sentence is reworded to say vendored-and-unused (runner:
`vite-plus/test`, `RULES.md:120`). A dedicated test-file scope remains an alternative only
if a future change gives the runtime-free boundary a reason to cover test files.

### Decision 2 — name the declined modules

ADR-0100 §2 gains one enumerating row (or extends the runtime-free "do not add" cell)
listing the declined Effect modules by name — `Resources`/`Scope`, `PubSub`, `Stream`,
`Batching`/`Request`, `Schedule`, `Observability` (`Logger`/`Metric`) — each pointing at
the closed-subset rule. No gate change: the gate already rejects the APIs.

### Decision 3 — pin discovery order-independence

`discoverShipBuildingFiles` reads host directories with an explicit `.sort()` (and the
reference-design nation order is pinned to UK-first). Add a focused test asserting the
returned groups are identical under a shuffled directory iteration (or a fixture with
names whose lexical and creation order differ). This is the same shape as the existing
`persistence` F6 total-order pin and the content-compiler sorted-enumeration guarantee.

### Decision 4 — remove decode-then-narrow casts where the type can carry them

Where a `Schema` decode is followed by `as T` solely because the schema's inferred type
is structural and the domain type is nominal, prefer making the schema carry the nominal
type (a brand on the schema, or a `Schema.suspend`/annotation) over the cast. Where the
only mismatch is `exactOptionalPropertyTypes`, keep the value but record why in place.
This preserves the decode-at-boundary guarantee the gate enforces.

### Decision 5 — one `Result` idiom

`schema-validator.ts` narrows the decode `Result` with `result._tag === "Failure"`;
siblings use `Result.isFailure`. Standardise on `Result.isFailure` (the idiomatic v4
accessor, vendor `Result.ts`), so the boundary helpers read alike.

### Decision 6 — no new ratchet gate; no behaviour change

The one newly-confirmed behavioural rule (per-schema excess-key strictness) is a
parity rule already ratified in ADR-0155 and test-locked, so it takes a doc/ADR statement,
not a gate. Every other confirmed rule is already gated. No gameplay/balance/simulation
result, golden, or hash changes.

## Testing Decisions

### Seams

1. **Primary — the existing test suite at the affected public seams.** `INC-1` adds an
   order-independence test beside the existing content-compiler discovery tests (the same
   seam the sorted-enumeration guarantee already uses); `INC-3`/`INC-4` are proven by the
   packages' existing decode tests staying green with the cast removed. No new seam is
   introduced.
2. **Secondary — the preflight gate suite.** `INC-2` is a doc-only ADR change; its
   correctness is enforced by the existing `docs-check` and `preflight` doc gates, not a
   new test.

A good test asserts **external behaviour** — the discovered file groups are identical
under shuffled host order; a boundary still rejects malformed input after a cast is
removed — never the internal shape of a helper. Bad-fixture + positive-control pairs stay
the norm where a gate fixture exists.

### Modules exercised

- `@bluewave/content-compiler` — `discoverShipBuildingFiles` order-independence; the
  full-surface input builder it feeds.
- `@bluewave/persistence`, `@bluewave/commands`, `@bluewave/combat`,
  `@bluewave/content-schema`, desktop `main` — the residual decode-then-narrow sites; the
  existing decode tests are the regression guard.
- `@bluewave/content-schema` — `validateAgainstSchema`'s `Result` narrowing.
- `docs/adr/ADR-0100` — policy-of-record rows (checked by `docs-check`, not a unit test).

### Prior art

- Enumeration-order pins: `packages/persistence/test/persistence.test.ts` (F6 total
  order); the content-compiler sorted-enumeration tests.
- Decode-at-boundary tests: `packages/content-schema/test/parity.test.ts`,
  `packages/combat/test/air-defense/*`, desktop `main/*.test.ts`.
- Boundary gate: `scripts/test/assert-boundary-decode.test.mjs`.
- ADR/doc gates: `scripts/docs-check.cjs`, `scripts/verify-doc-budgets.mjs`.

## Out of Scope

- Applying the deferred **gate-family helper extraction** (`F-13-FU`): the seven gate
  scripts share copied `normalize`/`lineAt`/`SOURCE_RE`/`runSelfTest` helpers with
  divergent discovery semantics; extracting them is a dedicated refactor, not a residue
  fix. Recorded with a trigger: revisit when a defect fix touches ≥2 gate scripts.
- Any **runtime wave** (services / layers / `ManagedRuntime` / streams): declined by
  ADR-0128; this spec validates the declination, it does not reverse it.
- Re-litigating the **applied Blocker/Major fixes** (the excess-key doc fix, the
  `apps/**` tagged-error gate, the `compiler-cli` boundary-decode scope): they are
  already gated.
- The **`persistence` async facade** and **`SaveStore` → `PERSISTENCE_*` routing**:
  kept deferred with their own triggers (ticket 08).
- Any gameplay, balance, or simulation-result change; goldens are byte-identical.

## Further Notes

**Findings this spec discharges.** `F-05-2`, `F-05-3`, `F-05-4` (INC-2); `F-06-R`
(INC-1); `F-03-4` (INC-3); `F-03-6` (INC-4). `F-01-4` (prefer `Schema.Int`) is recorded
as accepted optional style, per ticket 01. The complete register, with every finding's
severity, evidence, and disposition, is
`.scratch/effect-conformance/issues/11-assemble-conformance-plan.md`.

**Why this is not a new gate.** ADR-0106 freezes *always-apply* qualities; the residual
findings here are either policy-of-record completeness or behaviour that is already
pinned behaviourally. Adding gates for them would expand the suite without a rule to
enforce. The one machine-checkable rule (excess-key strictness) is per-schema by design,
so its test lock is the ratchet.

**Traceability.** Every open finding maps to a ticket or an explicit accept; every
Blocker/Major from tickets 01–14 is recorded as applied with its gate. The audit's
destination — a vendored-verified verdict per used concept, a documented/gated
declination per declined section, and a disposition per un-gated seam — is met.
