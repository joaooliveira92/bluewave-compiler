# campaignInput.ts filesystem-read in a runtime-free package

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

ADR-0100 §2 (amendment) records a policy debt: `campaignInput.ts` performs a filesystem
read inside a package classified runtime-free. Confirm the current state
(read-then-decode shape, which package, whether `assert-runtime-free.mjs` covers it and
why it passes), then decide the remedy: move the IO to a boundary, reclassify the
package, or accept-and-document.

Deliver: the facts (file, package, gate status), a boundary-class verdict, and a
remedy with rationale. Escalate to an ADR only if reclassifying the package.

## Answer

**Verdict: the debt is already closed — remedy "move the IO to a boundary" was
chosen and implemented (CAH-LEG-1, commit `37ca7384`, 2026-10-13). No
reclassification; no new ADR; `packages/campaign` stays a pure runtime-free
package.** Durable note:
`docs/research/effect-conformance-07-campaigninput-fs.md`.

**The facts.**

- **File / package.** `packages/campaign/src/campaignInput.ts`, package
  `@bluewave/campaign` — a pure-derivation package, and a runtime-free root
  (`RUNTIME_FREE_ROOTS` in `scripts/assert-runtime-free.mjs:41`; ADR-0100 §2
  runtime-free row).
- **Read-then-decode shape at amendment time (2026-10-12).** The module was an
  untrusted-input adapter: `loadCampaignFiles`/`loadAllCampaignData` ran a
  path-traversal guard (`isInside`) → `readFileSync(fullPath, "utf8")` →
  `yaml.parse`, collecting `CAMPAIGN-PATH`/`CAMPAIGN-PARSE`/`CAMPAIGN-READ`
  diagnostics. That is the filesystem read the ADR amendment recorded.
- **Current shape.** Pure coercion contract only — `toSafeInt`/`toSafeIntOpt`/
  `toStr` plus the `CampaignFileData` interface. No `node:fs`, `node:path` or
  `yaml` import, no loader, no path guard (verified: the only `node:fs` users
  left in the package are `test/*.test.ts` fixtures, which are outside the gate's
  `*/src` scope). Commit `37ca7384` (`rules-compliance` 04/05) removed 95 lines
  and the header now records the move.
- **Gate status / why it passes.** `assert-runtime-free.mjs` *does* scan
  `packages/campaign/src` (it is in `RUNTIME_FREE_ROOTS`), so the file is
  covered — but that gate is an Effect-runtime import allowlist: it detects only
  `effect`/`@effect/*` runtime symbols and subpaths (`findRuntimeImports`,
  `scripts/assert-runtime-free.mjs:95-170`), **not `node:fs`**. It therefore
  passed *even while the IO was present* (the debt was never an Effect gap, as
  the ADR itself notes), and passes *now* trivially because the IO is gone. The
  newer ambient-IO gate `assert-no-stage-io.mjs` is scoped to
  `packages/content-compiler/src/stages` (`STAGE_ROOT`), not `packages/campaign`,
  so it neither covered the old debt nor covers this file.

**Boundary-class verdict.** `campaignInput.ts` was an IO-shaped loader sitting in
the wrong class. The IO now lives at the `content-compiler` boundary
(`buildContentBundleArtifact`, `packages/content-compiler/src/artifact.ts:229`),
which is an IO package per ADR-0100 §2; the CLI (`apps/compiler-cli/src/commands.ts`)
and `packages/campaign/src/compiler.ts:34` consume only a verified, decoded
`ContentBundle` ("validated content is the only thing that runs"). The
classification is now correct on both sides: the IO is at an IO boundary and
`campaign` is genuinely runtime-free.

**Remedy (with rationale).** Of the three options, **move the IO to a boundary**
is the one taken, and it is the right one: the coercion contract is pure and
belongs with the builders, while file reading/parsing is a boundary concern
already owned by `content-compiler`. "Reclassify the package" was wrong — it
would have dragged an entire pure-derivation package into the IO row to
accommodate one loader. "Accept-and-document" is moot — there is nothing left to
accept. No ADR escalation is warranted because the package is *not* reclassified;
ADR-0100 §2's amendment note, which still described the debt as live, is
corrected to record the resolution.
