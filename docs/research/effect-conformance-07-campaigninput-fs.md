# Research note — `campaignInput.ts` filesystem read in a runtime-free package: verdict + rationale

- **Ticket:** `.scratch/effect-conformance/issues/07-campaigninput-fs-in-pure.md`
- **Type:** task (decision)
- **Date:** 2026-10-13
- **Evidence rule (map):** vendored `vendor/effect` + tests are the evidence-of-truth for
  *what an API does*; repo ADRs / `RULES.md` / `.ai/ENGINEERING-CONTRACT.md` are the policy
  of record. A conflict is itself a finding.
- **Scope:** whether `packages/campaign/src/campaignInput.ts` still performs a filesystem
  read inside a runtime-free package, and if so whether to move the IO to a boundary,
  reclassify the package, or accept-and-document.
- **What this session did:** read the current file, the ADR amendment, git history, and the
  two relevant gates; edited **no code** (the remedy was already applied). Tracker answer +
  ADR correction only.
- **Durable note sibling of:** `docs/research/effect-conformance-0{1,2,3,4,5,6}-*.md`.

---

## 1. Question

ADR-0100 §2 (amendment, 2026-10-12) records that `campaignInput.ts` "performs a filesystem
read inside an otherwise pure package — an acknowledged policy debt (whether to move it to
the `content-compiler`/main boundary) that is not itself an Effect gap." Ticket 07 asks to
confirm the current state and decide the remedy.

## 2. The facts

### 2.1 File and package

`packages/campaign/src/campaignInput.ts`, package `@bluewave/campaign`. `campaign` is a
pure-derivation package (ADR-0100 §2 runtime-free row) and appears in
`RUNTIME_FREE_ROOTS` (`scripts/assert-runtime-free.mjs:41`).

### 2.2 Read-then-decode shape at amendment time

At the split commit `33166e17` (2026-10-08), `campaignInput.ts` was an untrusted-input
adapter:

- `loadCampaignFiles(files, contentDir, collector, signal?)` flattened each authored file;
  `loadAllCampaignData(files, ...)` mapped the six `CampaignFiles` groups.
- `parseYamlFile` resolved the path, rejected traversal/absolute escapes (`isInside`),
  then `readFileSync(fullPath, "utf8")` → `yaml.parse`, collecting `CAMPAIGN-PATH` /
  `CAMPAIGN-PARSE` / `CAMPAIGN-READ` diagnostics.

That is the filesystem read the ADR amendment recorded.

### 2.3 Current shape (pure)

The file is now 33 lines and owns only the coercion contract:

- `toSafeInt(value)` / `toSafeIntOpt(value, fallback)` / `toStr(value, fallback)` —
  primitive coercions over `unknown` compiled-content records;
- the `CampaignFileData` interface.

There is **no** `node:fs`, `node:path` or `yaml` import, no loader and no path guard. The
header records the move: "The raw-file/parse boundary moved to the content compiler
(CAH-LEG-1): the campaign compiler now consumes only a verified, decoded `ContentBundle`,
so this module owns just the coercion contract." The only `node:fs` users remaining in the
package are `test/*.test.ts` fixtures (outside the gate's `*/src` scope).

Commit `37ca7384` (`feat(rules): enforce RULES.md with fail-closed compliance gates`,
2026-10-13, `rules-compliance` 04/05) removed the loader — 4 insertions / 91 deletions in
this file — taking `loadCampaignFiles`, `loadAllCampaignData`, `parseYamlFile`, `isInside`,
`CampaignFiles`, and the `node:fs` / `node:path` / `yaml` imports with it.

### 2.4 Gate status — why `assert-runtime-free` passes

`assert-runtime-free.mjs` **does** scan `packages/campaign/src` (it is in
`RUNTIME_FREE_ROOTS`), so the file is covered. But the gate is an **Effect-runtime import
allowlist**: `findRuntimeImports` (`scripts/assert-runtime-free.mjs:95-170`) reports only
`effect`/`@effect/*` runtime symbols and module subpaths. It has no notion of `node:fs`,
`yaml`, or any other ambient IO.

Consequently it passed **even while the IO was present** — the debt was never an Effect
gap, exactly as the ADR states — and it passes **now** trivially because the IO is gone.
The newer ambient-IO gate `assert-no-stage-io.mjs` is scoped to
`packages/content-compiler/src/stages` (`STAGE_ROOT`), so it neither covered the old debt
nor applies to this file.

## 3. Boundary-class verdict

`campaignInput.ts` was an IO-shaped loader in the wrong class. The IO now lives where the
policy puts it — the `content-compiler` boundary:

- `buildContentBundleArtifact` (`packages/content-compiler/src/artifact.ts:229`) is the
  entry point that reads the raw files, parses/validates/normalizes and compiles them; the
  actual loader read now lives at `packages/content-compiler/src/compiler.ts:91`
  (`fullSurface.ts:146` for manifests). `content-compiler` is an IO package per ADR-0100 §2.
- The CLI (`apps/compiler-cli/src/commands.ts`) and `packages/campaign/src/compiler.ts:34`
  consume only the verified, decoded `ContentBundle` — "validated content is the only thing
  that runs".

Both sides are now correctly classified: IO at an IO boundary, `campaign` genuinely
runtime-free.

## 4. Remedy

Of the three options, **move the IO to a boundary** is the one taken, and it is right: the
coercion contract is pure and belongs with the builders, while file reading/parsing is a
boundary concern already owned by `content-compiler`. Reclassifying the package would drag
a pure-derivation package into the IO row for a single loader; accept-and-document is moot
because there is nothing left to accept. No ADR escalation — the package is not
reclassified. ADR-0100 §2's amendment keeps the original 2026-10-12 text and records the
resolution in a new dated paragraph. The decision of record is the ticket's `## Answer`
(`.scratch/effect-conformance/issues/07-campaigninput-fs-in-pure.md`).

## 5. References

- Ticket 07: `.scratch/effect-conformance/issues/07-campaigninput-fs-in-pure.md`
- Current file: `packages/campaign/src/campaignInput.ts`
- Resolution commit: `37ca7384`; historical shape: `33166e17:packages/campaign/src/campaignInput.ts`
- Policy of record: `docs/adr/ADR-0100-adopt-effect-v4.md` §2 (amendment)
- Gates: `scripts/assert-runtime-free.mjs` (`RUNTIME_FREE_ROOTS`),
  `scripts/assert-no-stage-io.mjs` (`STAGE_ROOT`)
- Boundary implementation: `packages/content-compiler/src/artifact.ts:229`,
  `packages/content-compiler/src/compiler.ts:91`, `packages/campaign/src/compiler.ts:34`
- Sibling notes: `docs/research/effect-conformance-0{1,2,3,4,5,6}-*.md`
