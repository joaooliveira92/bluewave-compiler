# effect-conformance 02 — `Data.TaggedError` + error-handling conformance vs vendored `effect@4.0.2`

**Date:** 2026-10-13
**Ticket:** `.scratch/effect-conformance/issues/02-tagged-errors-conformance.md`
**Scope:** authored consumers only (`packages/**`, `apps/**`; excludes
`vendor/**`, `repos/**`, `node_modules/**`, `dist/**`).
**Method:** read the vendored `effect@4.0.2` source under `vendor/effect/`
(`repos/effect/LLMS.md` read first), then cross-checked every authored site and
ran an empirical probe against `vendor/effect/dist/index.js` (the byte-identical
published artifact; `vendor/effect/package.json` → `"name":"effect"`,
`"version":"4.0.2"`, `"type":"module"`).

---

## 1. Question

Do Bluewave's 14 `Data.TaggedError` classes and its error-handling conventions
match the behaviour and idioms of the vendored `effect@4.0.2`? Specifically:

1. Class shape / `_tag` discrimination, and whether any live consumer relies on
   `instanceof` (ADR-0152 mandates `_tag`).
2. The `_tag` `JSON.stringify` / `structuredClone` hazard recorded in
   `.ai/reports/effect-v4-hardening.md` (F5) — which way does it go, and is any
   authored consumer exposed?
3. `Data.TaggedError` vs `Schema.TaggedError` under the ADR-0152 reachability
   rule, and whether `scripts/assert-tagged-errors.mjs` enforces that rule.
4. `RULES.md` §Errors claims against vendored `Effect` / `Cause` / `Data`.

---

## 2. Sources consulted

Directly verified (read), all under `vendor/effect/` unless noted:

| Source | What it grounds |
| --- | --- |
| `src/internal/core.ts:646-699` | `YieldableError`, `Data.Error`, `Data.TaggedError` implementation |
| `src/Data.ts:1074-1128` | public `Data.Error` / `Data.TaggedError` surface + docs |
| `src/internal/effect.ts:2954-3031` | `catchTag` runtime predicate |
| `src/internal/effect.ts:3399-3401`, `:1054` | `orDie`, `die` implementation |
| `src/Effect.ts:4639-4652`, `:2457`, `:6731` | `catchTag` docs, `die`, `orDie` |
| `src/Predicate.ts:1452-1512` | `isTagged` (`hasProperty(self,"_tag") && self._tag === tag`) |
| `src/Schema.ts:15886-15937`, `:15968` | `Schema.Error`, `Schema.TaggedError` |
| `src/Cause.ts:1312` | `YieldableError` interface |
| `src/internal/record.ts:16-22` | `assignProperties` (enumerable-only copy) |
| `RULES.md:60-69` (repo) | the claims under test |
| `docs/adr/ADR-0152-errors-by-reachability.md` | the reachability rule |
| `scripts/assert-tagged-errors.mjs`, `scripts/run-gates.mjs:64-76` | the gate and its wiring |
| `.ai/reports/effect-v4-hardening.md` §2/F5, §3 | the recorded hazard + prior audit |

Empirical probe (reproducible, run from the repo root):

```sh
node --input-type=module -e '
import { Data, Effect } from "./vendor/effect/dist/index.js";
class NotFound extends Data.TaggedError("NotFound") {}
const e = new NotFound({ message: "gone", resource: "/users/42" });
console.log(JSON.stringify(e));                 // {"message":"gone","resource":"/users/42","_tag":"NotFound"}
const c = structuredClone(e);
console.log(c._tag, c instanceof NotFound, JSON.stringify(c)); // undefined false {}
console.log(Effect.runSync(
  Effect.gen(function*(){ return yield* e; })
    .pipe(Effect.catchTag("NotFound", (x) => Effect.succeed("caught:"+x.resource)))
));                                             // caught:/users/42
'
```

---

## 3. Findings

### 3.1 The 14 `Data.TaggedError` classes (target 1)

All 14 are `class X extends Data.TaggedError("<Tag>")<{...}> {}`. Count and
location (ticket says `diagnostics/src/errors.ts`, but the diagnostics class
lives in `index.ts`):

| # | Class | Location | `_tag` |
| --- | --- | --- | --- |
| 1 | `AiError` | `packages/ai/src/errors.ts:14` | `"AiError"` |
| 2 | `CombatInvariantError` | `packages/combat/src/errors.ts:18` | `"CombatInvariantError"` |
| 3 | `CommandError` | `packages/commands/src/errors.ts:20` | `"CommandError"` |
| 4 | `DiagnosticError` | `packages/diagnostics/src/index.ts:33` | `"DiagnosticError"` |
| 5 | `DuplicateEventIdError` | `packages/events/src/errors.ts:17` | `"DuplicateEventIdError"` |
| 6 | `EventSequenceNotIncreasingError` | `packages/events/src/errors.ts:22` | `"EventSequenceNotIncreasingError"` |
| 7 | `NonFiniteNumberError` | `packages/events/src/errors.ts:32` | `"NonFiniteNumberError"` |
| 8 | `EmptyFormulaIdentifierError` | `packages/events/src/errors.ts:37` | `"EmptyFormulaIdentifierError"` |
| 9 | `PersistenceCorruptSaveError` | `packages/persistence/src/errors.ts:50` | `"PERSISTENCE_CORRUPT_SAVE"` |
| 10 | `PersistenceMissingSaveError` | `packages/persistence/src/errors.ts:59` | `"PERSISTENCE_MISSING_SAVE"` |
| 11 | `PersistenceCancelledError` | `packages/persistence/src/errors.ts:68` | `"PERSISTENCE_CANCELLED"` |
| 12 | `PersistenceUnsignedSaveError` | `packages/persistence/src/errors.ts:77` | `"PERSISTENCE_UNSIGNED_SAVE"` |
| 13 | `PersistenceCompatibilityMismatchError` | `packages/persistence/src/errors.ts:86` | `"PERSISTENCE_COMPATIBILITY_MISMATCH"` |
| 14 | `PhaseEngineError` | `packages/phase-engine/src/errors.ts:21` | `"PhaseEngineError"` |

**Vendored shape (grounded):**

- `Data.TaggedError(tag)` returns `class Base extends Data.Error<{}>` with
  `readonly _tag = tag` and `Base.prototype.name = tag`
  (`core.ts:689-699`, `_tag` at `:695`, `name` at `:697`).
- The base `Data.Error` factory extends `YieldableError`, which extends
  `globalThis.Error` and installs a `[evaluate]` primitive so instances can be
  `yield*`-ed in `Effect.gen` (`core.ts:646-663`, `:666-686`). Empirically
  `e instanceof Error === true` and `String(e) === "NotFound: gone"`.
- `_tag` is an **own, enumerable** instance property (probe:
  `Object.keys(e)` → `["resource","_tag"]`; descriptor `enumerable:true`).
  The tag is excluded from the constructor argument type (`core.ts:692`), and
  `assignProperties` copies only enumerable source keys (`record.ts:16-22`), so
  passing `_tag` in args is neither required nor possible.

**`instanceof` audit:** no live **source** consumer discriminates a tagged class
by `instanceof`. Grep over `packages/**/src` + `apps/**/src` for
`instanceof <TaggedClass>` returns nothing; consumers use `.message`, `.code`
and `_tag` (e.g. `packages/ai/src/aiPlanner.ts`, `packages/phase-engine/src/
battlePhases.ts`, `packages/commands/src/lifecycle.ts`). Only **test** helpers
narrow with `instanceof`: `packages/ai/test/errors.test.ts:22`,
`packages/commands/test/errors.test.ts:17`,
`packages/phase-engine/test/errors.test.ts:20` — each rethrows a non-matching
value and the same tests also assert `_tag`. This is test-only type narrowings,
not production discrimination; see F2.

### 3.2 The `_tag` serialization hazard (target 2)

**Vendored truth — both directions, grounded:**

- **`JSON.stringify` ADDS `_tag`.** `Data.Error` overrides `toJSON()` to return
  `{ ...plainArgs, ...this }` (`core.ts:682-684`), where `plainArgs` is the
  original constructor-args object stored non-enumerably under
  `Symbol.for("effect/Data/Error/plainArgs")` (`core.ts:669`, `:676-679`) and
  `...this` spreads the enumerable own `_tag`. Probe:
  `JSON.stringify(new NotFound({message:"gone",resource:"/users/42"}))` →
  `{"message":"gone","resource":"/users/42","_tag":"NotFound"}`. A plain
  `Error` stringifies to `{}` (`JSON.stringify(new Error("x")) === "{}"`), so
  relative to the pre-migration plain `Error`, `JSON.stringify` now *adds*
  `_tag` **and** every constructor argument.
- **`structuredClone` DROPS `_tag` (and every custom field).** Probe:
  the clone has `_tag === undefined`, `Object.keys(clone) === []`,
  `clone instanceof NotFound === false`, `clone.constructor.name === "Error"`
  (only `message` survives), and `JSON.stringify(clone) === "{}"`. A cloned
  tagged error therefore also stops matching `Effect.catchTag` (see below).

**`catchTag` matches on `_tag`, not prototype:** `catchTag` builds the predicate
`isTagged(k)`, whose implementation is
`hasProperty(self,"_tag") && self["_tag"] === tag`
(`internal/effect.ts:3027-3030`, `Predicate.ts:1511`). The docs state "The error
type must have a readonly `_tag` field. `catchTag` matches that field"
(`Effect.ts:4651-4652`). This is why the `structuredClone`d error no longer
matches, and it is the mechanism that makes ADR-0152's `_tag`-over-`instanceof`
rule idiomatic.

**Authored exposure: latent, not live.** No authored consumer serializes a
tagged error and depends on `_tag`:

- `JSON.stringify` sites that touch an error are guarded by `instanceof Error`
  first, so a tagged error takes the `message`/`stack` branch:
  `apps/desktop/src/main/crashSupport.ts:99-105` and
  `apps/desktop/src/renderer/lib/crash-report.ts:18-29`. (The renderer cannot
  receive a `Data.TaggedError` anyway.)
- `apps/compiler-cli/src/combatDiagnostics.ts:25` stringifies
  `error.context` (a plain record), not the error.
- Every `structuredClone` in the authored tree operates on snapshots/drafts
  (e.g. `apps/desktop/src/main/commands/battleSandboxCommands.test.ts:77`), never
  on an error.
- `Effect.catchTag` appears only in **comments** (`packages/commands/src/
  errors.ts:13`, `packages/diagnostics/src/index.ts:31`,
  `packages/events/src/errors.ts:11`, `packages/persistence/src/errors.ts:6`,
  `packages/phase-engine/src/errors.ts:18`) — there is no runtime yet
  (ADR-0128: no `Effect.run*`).

This corroborates `.ai/reports/effect-v4-hardening.md` §3 and F5. The F5 phrasing
"adds `_tag` / drops it" is correct: `JSON.stringify` adds it,
`structuredClone` drops it.

### 3.3 `Data.TaggedError` vs `Schema.TaggedError`; the reachability rule (target 3)

- `Data.TaggedError` is the lightweight, non-schema idiom (`Data.ts:1124-1128`;
  `core.ts:689`).
- `Schema.TaggedError` is schema-backed — fields are `Schema`-validated and the
  class carries encode/decode (`Schema.ts:15968-16035`); vendored v4 also adds
  `Schema.Error` for the unschema'd-`_tag` variant (`Schema.ts:15886-15917`).
  RULES.md reserves `Schema.TaggedError` for serializable/wire errors
  (`RULES.md:62-63`).
- The repo uses **only** `Data.TaggedError`; `Schema.TaggedError` is referenced
  in comments but never imported (grep over `packages/**`, `apps/**`). Because
  all 14 are raised and handled in-process and never cross a wire/IPC boundary
  (persistence's save boundary projects to a plain `Diagnostic` via
  `toDiagnostic()`, `persistence/src/errors.ts:33-56`; `CompatibilityError`
  stays a plain `_tag` class per ADR-0152 §5), `Data.TaggedError` is the correct
  choice. **No conformance problem.**

Two governance inconsistencies, however, are worth surfacing (they are not
Effect-behaviour bugs):

- **ADR-0152 contradicts itself on `persistence`.** §1 lists `persistence` among
  "packages the renderer cannot reach" (`Data.TaggedError`), while §5 calls
  `CompatibilityError`'s package "renderer-reachable" and the gate classifies
  `persistence` under `surface` (`assert-tagged-errors.mjs:34`;
  ADR-0152:30-31 vs :50-53). In fact the renderer only **type**-imports
  `@bluewave/persistence` (`SaveMetadata`; `campaign-list-screen-state.ts:1`
  and two tests) — no value import — so value-reachability is nil. The ADR does
  not define "renderer-reachable" (value vs type-only import).
- **Gate scopes diverge from ADR-0152's taxonomy.** `SCOPES`
  (`assert-tagged-errors.mjs:32-35`) is
  engine = `{contracts, combat, armament}` and surface =
  `{ship-design, campaign, persistence}`. ADR-0152 §2 names `campaign-engine`
  renderer-reachable but it is **not scanned**; `contracts` is renderer-reachable
  (its own `BluewaveError` comment says so, `contracts/src/index.ts:57-63`) yet
  sits in the `engine` scope; and the five `Data.TaggedError` packages
  (`commands`, `ai`, `events`, `phase-engine`, `diagnostics`) are **unscanned**.
  Today this is harmless — every listed file either uses `Data.TaggedError`
  (invisible to the gate) or carries a `_tag` — but a future plain untagged
  `extends Error` in an unscanned package would pass. The gate does correctly
  accept `Data.TaggedError` subclasses and correctly requires `_tag` elsewhere
  (self-test fixtures `assert-tagged-errors.mjs:172-209`; live run passes
  `engine, surface`).

### 3.4 `RULES.md` §Errors claims (target 4)

`RULES.md:60-69`, claim by claim:

| Claim | Vendored grounding | Verdict |
| --- | --- | --- |
| In-process domain errors: `Data.TaggedError` | `core.ts:689`, `Data.ts:1124` | grounded |
| Serializable/wire errors: `Schema.TaggedError` | `Schema.ts:15968` (schema-backed) | grounded |
| Give every typed failure a stable `_tag` | `core.ts:695` | grounded |
| Discriminate with `_tag`, never `instanceof` | `catchTag` predicate `isTagged` (`internal/effect.ts:3027-3030`, `Predicate.ts:1511`) | mechanism grounded; **one live violation in `apps`** — see F5 |
| Handle with `catchTag`/`catchTags`/`catchReason`; no shared error transformers probing the failure channel | `Effect.ts:4639`, `:4835`, `:5045`; the repo has no such transformer | grounded (no runtime adopted yet) |
| No official `Effect.orDie` … `Effect.die(error)` only where recovery is intentional | `orDie` is real and is `catch_(self, die)` (`Effect.ts:6731`, `internal/effect.ts:3399-3401`), i.e. it converts *every* failure into a defect; `die` exists (`Effect.ts:2457`, `internal/effect.ts:1054`) | grounded; repo uses neither (`git grep orDie|Effect.die` → empty) |
| Preserve interruption and structured context; keep `unknown` out of error/requirement channels | policy; all 14 carry concrete typed fields, none is `unknown` | no counter-evidence |

The `Effect.catchTag` mechanism is otherwise exercised empirically: a
`Data.TaggedError` failed through `Effect.gen` and recovered with
`catchTag("NotFound", …)` in the probe above.

---

## 4. Severity-tagged findings

| ID | Severity | Finding | Vendored / authored evidence | Remedy |
| --- | --- | --- | --- | --- |
| F1 | **Info** | All 14 `Data.TaggedError` classes use the correct vendored shape and a stable `_tag`; no live source consumer discriminates them by `instanceof`. | `core.ts:689-699`; table in §3.1; `git grep 'instanceof <TaggedClass>'` empty in `src`. | None. |
| F2 | **Minor** | Three **test** helpers narrow a caught `unknown` with `instanceof <TaggedError>` (`ai/test/errors.test.ts:22`, `commands/test/errors.test.ts:17`, `phase-engine/test/errors.test.ts:20`), contrary to the letter of RULES.md:64 ("never `instanceof`"). | RULES.md:64; ADR-0152 §3. | Narrow on `_tag` (e.g. a local `hasTag`/`static is` check) or record a test-narrowing exception; low impact because each test also asserts `_tag`. |
| F3 | **Info** | Serialization hazard confirmed and **latent only**: `JSON.stringify` adds `_tag` (+ args) via `toJSON`; `structuredClone` drops `_tag` and all custom fields; a cloned error no longer matches `catchTag`. No authored consumer serializes a tagged error. | `core.ts:682-684`, `:669-679`, `:695`; `internal/effect.ts:3027-3030`; probe; `.ai/reports/effect-v4-hardening.md` §3. | Keep the rule "recover by `_tag` *before* any serialization"; document the round-trip in the note (and optionally a one-line regression test). |
| F4 | **Major** | **Live rule violation, outside the gate:** `ContentArtifactError` has no `_tag` (`apps/desktop/src/main/contentArtifact.ts:20-30`) and is discriminated with `instanceof ContentArtifactError` (`contentCommands.ts:25,43`; `index.ts:295`). The gate's roots are packages only (`assert-tagged-errors.mjs:32-35`), so RULES.md:64's "never `instanceof`" is not enforced repo-wide. | RULES.md:64; ADR-0152 §1/§4; gate `SCOPES`. | Add `readonly _tag = "ContentArtifactError"` + a structural `_tag` guard at the two call sites, **or** explicitly record that apps are out of the ADR-0152/gate scope (and say so in RULES/ADR). Do not silently leave the asymmetry. |
| F5 | **Minor** | ADR-0152 is internally inconsistent about `persistence` reachability (§1 not-renderer-reachable vs §5 "renderer-reachable"; gate says `surface`), and never defines value-import vs type-only reachability; the renderer only type-imports `@bluewave/persistence`. | ADR-0152:30-31 vs :50-53; `assert-tagged-errors.mjs:34`; renderer imports. | Define "renderer-reachable" explicitly and align ADR §1/§5 + gate scope. |
| F6 | **Minor** | Gate scope omits `campaign-engine` (named renderer-reachable in ADR-0152 §2) and all five `Data.TaggedError` packages (`commands`, `ai`, `events`, `phase-engine`, `diagnostics`); `contracts` is in the `engine` scope though renderer-reachable. | ADR-0152 §1-§2; `assert-tagged-errors.mjs:32-35`; all files currently tagged. | Widen `SCOPES` (cheap — `Data.TaggedError` subclasses are ignored by the gate) or record why each is intentionally unscanned. |
| F7 | **Info** | `RULES.md` §Errors claims are grounded except F4; `Data.TaggedError` vs `Schema.TaggedError` split is correct; `orDie` is a real vendored API (implemented as `catch_(self, die)`) and is correctly unused; no `catchTag`/`die` usage yet (no runtime per ADR-0128). | §3.3-§3.4; `Effect.ts:6731`, `internal/effect.ts:3399`; `git grep orDie|Effect.die` empty. | None. |

---

## 5. Recommendations (for the implementator / orchestrator)

Normative (grounded, safe to act on):

1. **No change needed to the 14 classes.** Their `Data.TaggedError` shape and
   `_tag` values match vendored behaviour exactly (F1).
2. **Keep `Data.TaggedError`, never `Schema.TaggedError`, for these errors.**
   They are in-process and never serialized; `Schema.TaggedError` is reserved
   for wire errors by RULES.md (F7).
3. **Treat `_tag` as process-fatal to serialization:** recover with
   `Effect.catchTag`/`_tag` *before* any `JSON.stringify`/`structuredClone`;
   never rely on `_tag` after a clone (F3). If a future wave puts these errors
   on a wire, switch that error to `Schema.TaggedError` (or a plain `Diagnostic`
   projection, as persistence already does).
4. **Fix or scope F4.** Minimal: give `ContentArtifactError` a
   `readonly _tag` and replace the two `instanceof` sites with a structural
   `_tag` check. If apps are deliberately out of the rule's scope, say so in
   RULES.md/ADR-0152 so the gate's coverage gap is a decision, not an accident.
5. **Clarify ADR-0152 (F5) and widen the gate scope (F6).**

Non-normative / DECISION-REQUEST (do not treat as accepted constants):

- Whether `persistence` is "renderer-reachable" for the purpose of the error
  rule (F5) — needs a definition of value vs type-only imports.
- Whether the enforcement gate should cover `apps/**` and the five remaining
  packages (F4/F6) — a scope decision the orchestrator should record in an ADR,
  not resolve silently.

---

## 6. Deferred

- **No `Effect` runtime adopted** (ADR-0128): `Effect.catchTag`, `catchTags`,
  `catchReason`, `Effect.die` are all unused. The `_tag` discriminators are
  present and `catchTag`-compatible (verified empirically), but the RULES
  §Errors "handle with `catchTag`" clause is prospective until a runtime lands.
  That is already documented; no new action.
- **F2** (test-only `instanceof`) and **F5/F6** (ADR/gate wording) are
  documentation/scope items that need an owner: orchestrator or a follow-up
  ticket.
- **F4** needs an owner decision on whether apps are in the error rule's scope;
  the fix itself is mechanical.

## 7. Answers to the four target questions

1. **Shape / `_tag`:** conformant; all 14 match `Data.TaggedError` exactly; no
   live source consumer uses `instanceof` (only three test helpers — F2).
2. **Serialization hazard:** `JSON.stringify` **adds** `_tag` (via `toJSON`),
   `structuredClone` **drops** it; latent, no authored consumer depends on it.
3. **Data vs Schema:** `Data.TaggedError` is correct for all 14 (non-wire);
   `Schema.TaggedError` correctly unused. The gate enforces `_tag` for plain
   Error classes but its scopes diverge from ADR-0152 (F5/F6), and a live
   untagged app-local error evades it (F4).
4. **RULES §Errors:** grounded against vendored `Data`/`Effect`/`Cause`; the
   only live violation is F4.
