# Research note — determinism-advisory gating at the IO boundaries: verdict + rationale

- **Ticket:** `.scratch/effect-conformance/issues/06-determinism-advisory-gating.md`
- **Type:** task (decision)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` + tests are the evidence-of-truth for
  *what an API does*; repo ADRs / `RULES.md` / `.ai/ENGINEERING-CONTRACT.md` are the policy
  of record. A conflict is itself a finding.
- **Scope:** whether the warn-level `@effect/tsgo` determinism advisories should be hardened
  into a scoped hard gate over the IO/orchestration boundaries (`packages/persistence`,
  `apps/desktop/src/main`, `apps/compiler-cli`, and — adjacent — `packages/content-compiler`),
  or whether the ADR-0150 §1 exemption is correct.
- **Probes run:** `node scripts/assert-authoritative-determinism.mjs` → ok (15 roots);
  `node scripts/assert-runtime-free.mjs` → ok (16 roots);
  `node scripts/verify-golden-hashes.cjs` → "All 10 hashes match golden reference";
  `node scripts/verify-cross-process-determinism.cjs` → "two runs byte-identical". No code
  was edited by this session (per the map: "Harden means *decide remedies*, not apply them").
- **Durable note sibling of:** `docs/research/effect-conformance-0{1,2,3,4,5}-*.md`.

---

## 1. Question

`pnpm lint:effect` reports the determinism advisories at **warn** level only
(`oxlint.effect.json:10-18`). The hard backstop, `scripts/assert-authoritative-determinism.mjs`
(ADR-0150), scopes `DETERMINISM_ROOTS` to the `packages/**` entries of
`assert-runtime-free.mjs`'s `RUNTIME_FREE_ROOTS` — the pure engine. `apps/desktop/src/main`
and the IO-boundary packages (`persistence`, `content-compiler`, `compiler-cli`) are
excluded by construction (`assert-authoritative-determinism.mjs:12-16,46-48`) and the
exclusion is test-locked (`scripts/test/assert-authoritative-determinism.test.mjs:59-66`).

Do those boundaries hold *authoritative-logic* code that could leak ambient nondeterminism
into the golden/determinism surface? Is a scoped hard gate warranted there?

## 2. The enforcement model (three layers, not one)

| layer | scope | strength | source |
| --- | --- | --- | --- |
| soft advisory | whole repo (`packages`, `apps`) | `warn`; `pnpm lint:effect` exits 0 | `oxlint.effect.json:8-19`; `package.json` `lint:effect` |
| hard gate | pure engine only (`packages/**` of `RUNTIME_FREE_ROOTS`) | fail-closed, ratcheted allowlist | `scripts/assert-authoritative-determinism.mjs`; ADR-0150 |
| behavioural gate | the reference run + its compared hashes | fail-closed on any ambient leak that reaches output | `verify-golden-hashes.cjs`, `verify-cross-process-determinism.cjs`, `verify-golden-repin.mjs` |

ADR-0150 §Consequences states the split explicitly: "the linter remains the **broad**
detector, the gate the **authoritative** enforcement." The boundaries are covered by the
third layer, not by silence.

## 3. What the golden/cross-process surface actually freezes

The reference run `packages/cross-process-test/src/run-child.ts` exercises the boundaries —
`content-compiler` (`buildContentBundleArtifact`, `buildFullSurfaceInput`), `persistence`
(`SaveStore.save` → `SaveStore.load`), and `phase-engine` (which executes the
`CommandEnvelope` the run builds; the run imports only command *types*) — plus `combat`
(`generateBattles`). It hashes the results.

Precision matters here, because it bounds the safety net:

- **`golden/hashes.json` holds 9 keys and does *not* include `contentBundleHash`**
  (`contentArtifactHash`, `initialSnapshotHash`, `closingSnapshotHash`, `commandLedgerHash`,
  `eventLedgerHash`, `financialLedgerHash`, `randomDecisionLedgerHash`,
  `replayVerificationHash`, `battleGenerationHash`). `verify-golden-hashes.cjs:23-30`
  iterates only `Object.keys(golden)`; `cross-process.test.ts:64-71` asserts the same 8
  golden fields (`success` is asserted separately at `:40`).
- The **cross-process** proof (`verify-cross-process-determinism.cjs`) compares the whole
  emitted JSON object across two processes, so it *does* include `contentBundleHash` and
  `battleGenerationHash`.
- The **locale child** (`run-content-bundle-child.ts`, exercised by
  `cross-process.test.ts` "Compiler canonical order is locale-independent (CAH-DET-1)")
  builds a bundle under `LC_ALL`/`LANG` `en_US.UTF-8` vs `tr_TR.UTF-8` and asserts the
  `contentBundleHash` is byte-identical.

So: any ambient read that reaches a *golden-pinned* output, or any compared output that
differs across the two runs / locales, fails a hard gate. `contentBundleHash` is covered
by same-machine repeatability + locale, **not** by a committed golden across OSes.

## 4. Boundary hazard census

### 4.1 `packages/persistence` — ambient values are envelope metadata, never hashed

| site | ambient read | disposition |
| --- | --- | --- |
| `store.ts:109` | `${Date.now()}-${randomUUID()}` save id | directory name / metadata only |
| `store.ts:136` | `new Date().toISOString()` `metadata.timestamp` | save-list display metadata, not hashed |
| `store.ts:561` | `readdirSync(saveDir, …)` in `list()` | neutralised by the explicit total order (timestamp → chain → saveId desc), precisely because raw readdir order is platform-dependent (`store.ts:612-633`, F6) |
| `recovery.ts:35` | `new Date().toISOString()` `recoveredAt` | pointer metadata only |

The hashed fields are pure functions of state — `stateHash`/`serializedHash`/`snapshotHash`
(`store.ts:121-123`) are `sha256Hex` over the (storable) state — and `loadById` re-verifies
`rawHash` (`store.ts:464-467`), the signature (`serializedHash` + `stateHash` +
compatibility version, `store.ts:535-543`) and the envelope (`store.ts:486-499`).
`SaveMetadata` is written to `metadata.json` and never enters a hash. The F6 list ordering
is test-locked (`packages/persistence/test/persistence.test.ts:288`).

### 4.2 `packages/content-compiler` — authoritative, but enumeration is explicitly sorted

`content-compiler` is an IO boundary (not in `RUNTIME_FREE_ROOTS`) and is in
`verify-golden-repin.mjs`'s `AUTHORITATIVE_PACKAGES`, so every edit to it must re-pin
`golden/hashes.json` or declare `Golden-Repin: not-needed` with a reason. Its single
enumeration site, `shipBuildingDiscovery.ts` (`:83`, `:106`, `:114`), is sorted before
returning (`.sort()`, and the UK-first `nationOrder`), so host readdir order cannot reach
`contentBundleHash` — the `.sort()` *is* the determinism mechanism, mirroring F6.
Caveat: the reference fixture declares no ship-building tree, so `discoverShipBuildingFiles`
(and its `readdirSync`) is **not exercised** by the golden/cross-process runs; see §6.

### 4.3 `apps/compiler-cli` — no hazard

No clock, RNG, or enumeration. Its only ambient read is the auto-run guard
`process.env.VITEST` (`main.ts:258`); all filesystem use is explicit-path
(`commands.ts`, `main.ts`). `options.ts` is pure parsing.

### 4.4 `apps/desktop/src/main` — app entrypoint; outside the golden path

Every ambient read is an injectable clock default, app/host metadata, a dev flag, or
UI-session identity — none feed the engine's hashed surface:

- injectable clocks: `crashSupport.ts:162` (`options.now ?? (() => Date.now())`),
  `index.ts:62` (`now: () => new Date()`), `drawingBoardDraft.ts:72`
  (`now: () => Date = () => new Date()`);
- dev flags: `index.ts:23,31` (`process.env.NODE_ENV`, `VITE_BLUEWAVE_DEVTOOLS`);
- session identity: `commands/continuityCommands.ts:60`,
  `commands/compileCampaign.ts:170` (`generateSessionId: () => randomUUID()`);
- host/app metadata: `process.platform`, `process.pid`, `homedir()`;
- sorted enumeration for best-effort crash-bundle pruning: `crashSupport.ts:189`
  (`readdirSync(dir).filter(BUNDLE_RE).sort().reverse()`).

ADR-0128 §2 keeps the main process a synchronous `node:fs` pipeline with no
`ManagedRuntime`; it is deliberately outside the engine's determinism surface.

## 5. Verdict — the exemption is correct: **accept with rationale**

1. **Authoritative output is frozen behaviourally.** On every exercised path, an ambient
   leak that reaches a compared output fails `verify-cross-process-determinism.cjs` (two
   processes, byte-identical) and a golden-pinned field fails `verify-golden-hashes.cjs`.
   The boundaries are guarded by behaviour rather than by source.
2. **Ambient reads at the boundaries are legitimate and non-authoritative.** They are
   envelope metadata (`persistence`), injectable clock defaults / dev flags / session
   identity / host metadata (`desktop main`), or explicitly sorted enumeration
   (`persistence.list`, `shipBuildingDiscovery`, `crashSupport.pruneBundles`) — never a
   field that enters `canonicalSerialize`/`sha256Hex` for an authoritative hash.
3. **A scoped hard gate over the boundaries would mostly restate the boundary.** It would
   flag the ~10 legitimate sites above, forcing a non-empty allowlist whose entries are
   themselves the "legitimate IO-boundary and app-entry-point clocks" ADR-0150
   §Alternatives rejects promoting repo-wide. It would also mis-flag already-sorted
   enumeration (a false positive) and raise preflight maintenance for no reachable-risk
   reduction.
4. **A change to the boundary packages is already reviewed against golden.** Every
   `packages/persistence/src` / `packages/content-compiler/src` edit must re-pin or declare
   `Golden-Repin: not-needed` in the same commit.

## 6. Residual gap (accepted, recorded for the plan)

The pure-engine AST gate freezes *source* including code paths the reference run never
executes. The boundaries get only behavioural coverage, so an ambient read added to an
**unexercised** boundary path that would feed authoritative output when that path runs
elsewhere is not caught by a hard gate. The concrete instance is
`discoverShipBuildingFiles`: authoritative (it feeds `contentBundleHash`, not
golden-pinned), not exercised by the reference fixture (which declares no ship-building
tree), and not covered by a dedicated test — so its determinism rests on the explicit
`.sort()` plus golden-repin review rather than on a gate. Recommended as a *minor* item
for ticket 11's plan: pin discovery order-independence with a focused test (a two-file,
reversed-directory-order fixture) or accept explicitly. **Not applied here** (map: decide,
do not execute).

## 7. References

- Ticket 06: `.scratch/effect-conformance/issues/06-determinism-advisory-gating.md`
- Policy of record: `docs/adr/ADR-0150-authoritative-determinism-gate.md`,
  `docs/adr/ADR-0128-effect-v4-runtime-wave-not-warranted.md` §2,
  `RULES.md` §Determinism, `.ai/ENGINEERING-CONTRACT.md` §Determinism
- Gates: `scripts/assert-authoritative-determinism.mjs`,
  `scripts/assert-runtime-free.mjs`, `scripts/verify-golden-hashes.cjs`,
  `scripts/verify-cross-process-determinism.cjs`, `scripts/verify-golden-repin.mjs`
- Sibling notes: `docs/research/effect-conformance-0{1,2,3,4,5}-*.md`