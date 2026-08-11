# Validation Report: A-0 — B10b Research + Ship Design acceptance pass

## Outcome

`BLOCKED`

The B10b acceptance criteria in `.ai/briefs/b10b-research-design.md` are **not satisfied** by the current repository state. The build is green and generic determinism is proven, but the earlier baseline claim ("code is already committed and green; evidence is the gap") does not survive inspection: several brief acceptance criteria have **no implementation** and several more have **no proving test**. This report corrects the record.

## Scope delivered

Verified as present (committed code, largely in `packages/phase-engine/src/month.ts`, `packages/campaign`):

- `resolveResearchPhase` research resolution wired as Phase 8 (`month.ts:1230-1243`; registry `resolve_research` at `registry.ts:105-111`), including:
  - `RESEARCH_RESOURCE_CONVERSION_BP = 10_000` (`month.ts:302`);
  - 15 canonical field ids (`month.ts:304-320`);
  - `computeResearchResources` zero/positive conversion (`month.ts:322-329`);
  - `largestRemainderAllocation` (`month.ts:331-366`);
  - one-active-candidate per field with progress clamping to cost (`month.ts:422-475`);
  - discovery branch emitting a `TechnologyDiscovered` event (`month.ts:488-523`);
  - keyed stream `research/month/{nationId}/{fieldId}` + weighted draw (`month.ts:437`, `month.ts:290-300`);
  - eligibility filtering incl. availability month and prerequisites (`month.ts:586-625`);
  - financial posting `RESEARCH_EXPENDITURE` with treasury deduction (`month.ts:541-566`).
- Types: `ResearchState`, `CompiledDesignVersion`, `DesignFamily`, `Ship.designVersionId`, `ConstructionProject.designVersionId`, `CampaignSnapshot.designs/designFamilies` (`packages/campaign/src/state.ts`).
- Compiler: `buildResearch`, `buildDesignsFromData`, `buildDesignFamiliesFromData`, ships/constructions map `designVersionId` (`packages/campaign/src/compiler.ts`), design files wired into `CampaignFiles`.
- Construction completion promotes a ship, using design attributes when a `designVersionId` exists (`month.ts:1162-1201`).

Verified as **absent or unproven** (the gap):

- `SetResearchPriorityCommand`: type exists (`packages/commands/src/envelope.ts:22-25`) and is in the `CommandBody` union, but **no lifecycle handler exists** — `CommandLifecycle.validate` accepts only `budget_project` and rejects everything else as `UNKNOWN_COMMAND_TYPE` (`lifecycle.ts:66-76`). No priority validation, no `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`.
- `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`: not emitted anywhere.
- Cycle detection `TECHNOLOGY_PREREQUISITE_CYCLE`: no acyclicity check in `content-compiler` (only unknown-prerequisite ref detection at `validate.ts:235-256`).
- `DesignTemplateSchema`: does not exist in `@bluewave/content-schema`. `TechnologyPrerequisiteChainSchema` lacks `researchFieldId`, `discoveryWeight`, `availabilityMonth`.
- Design YAML content: no design fixtures anywhere; `designFiles: []` in every test/CLI/run-child invocation.
- `IMMEDIATE_KNOWLEDGE` effect application: only an event is appended; no effect handling.
- Research determinism under an actual budget: the cross-process golden fixture (`packages/cross-process-test/src/run-child.ts`) gives GBR **no** `researchBudget`, so research RNG is never exercised in the golden-replay path.

## Requirements evidence (criterion-by-criterion)

Evidence type: `OBSERVED` = directly read code/test; `PROVEN` = run and matched.

| # | Criterion (brief) | Implementation evidence | Proving test | Verdict |
| - | ------------------ | ----------------------- | ------------ | ------- |
| 1 | Full monthly turn w/ research resolution for GBR, FRA, GER | `month.ts:1230-1243` wires phase; loops all playable/AI nations (`month.ts:381-382`) | No test runs research for all 3 nations; `month.test.ts` GER test (`:420`) uses `researchBudget 0`; integration fixture is GBR + FRA only | **UNPROVEN** |
| 2 | Expenditure deducted + balanced `RESEARCH_EXPENDITURE` ledger posting | `month.ts:541-566` appends `RESEARCH_EXPENDITURE`; balance asserted only generically (`month.test.ts:262-287`, budget 0) | No research-specific assertion proving a balanced posting | **UNPROVEN** |
| 3 | Zero spend → zero resources; positive ∝ `10_000` bp | `computeResearchResources` + constant (`month.ts:322-329`, `:302`) | No test | **UNPROVEN** |
| 4 | `SetResearchPriorityCommand`; 1..5 HIGH; reject `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED` | Type only; no handler (`lifecycle.ts:66-76` rejects as `UNKNOWN_COMMAND_TYPE`) | None | **NOT IMPLEMENTED** |
| 5 | Command naming exact tech rejected `EXACT_TECHNOLOGY_SELECTION_PROHIBITED` | Not present anywhere (`rg` across repo: only design docs) | None | **NOT IMPLEMENTED** |
| 6 | Largest-remainder allocation (DESIGN-20 §9) | `largestRemainderAllocation` (`month.ts:331-366`) | No direct test of allocation output | **UNPROVEN** |
| 7 | ≤ 1 active candidate/field; progress ≤ cost | activeCandidates Map + clamp (`month.ts:422-475`) | No research-specific test (construction cap tests unrelated) | **UNPROVEN** |
| 8 | Discovery same phase; prereqs/availability revalidated; `IMMEDIATE_KNOWLEDGE` applied | Discovery branch (`month.ts:488-523`) marks completed + event only; no `IMMEDIATE_KNOWLEDGE` handling | None | **PARTIAL / UNPROVEN** |
| 9 | Keyed stream `research/month/nation/field`, deterministic weighted selection | `month.ts:437` stream key + `drawWeighted` | No direct assertion of stream key; generic determinism proven (`integration.test.ts:260,508`) but without research budget in golden fixture | **UNPROVEN (direct)** |
| 10 | Not-yet-available tech ineligible, consumes nothing | `findEligibleTechsForField` availability + prereq checks (`month.ts:595-625`) | No availability/prereq-blocked test | **UNPROVEN** |
| 11 | Cycle → `TECHNOLOGY_PREREQUISITE_CYCLE` at compile | No acyclicity check (`validate.ts:235-256` only ref checks) | None | **NOT IMPLEMENTED** |
| 12 | Designs compiled from YAML → immutable `CompiledDesignVersion` | `buildDesignsFromData` (`compiler.ts:470-507`) wired; no `DesignTemplateSchema`; no YAML fixtures | None | **PARTIAL / UNPROVEN** |
| 13 | Construction references `designVersionId`; completion builds Ship from design attrs | `month.ts:1162-1201`; test `month.test.ts:349` uses `designVersionId ""` and asserts `classId===targetId` only | No design-attribute test | **PARTIAL / UNPROVEN** |
| 14 | Initial fleet ships carry `designVersionId` | `Ship.designVersionId` + compiler maps it (`compiler.ts:349`); fixture ships omit it | None | **UNPROVEN** |
| 15 | Determinism: fixed seed → identical snapshots/hashes | `@bluewave/deterministic` + replay verifier + cross-process harness | `PROVEN` — `pnpm test:cross-process` matched all 7 golden hashes and `success:true` (generic, no research budget) | **PROVEN (generic)** |
| 16 | Existing compiler/command/phase/persistence/determinism suites pass | All suites present | `PROVEN` — `pnpm -w turbo run build test` → 32 tasks green | **PROVEN** |
| 17 | `vitest run` passes across workspace | All 19 test files present | `PROVEN` — same run green | **PROVEN** |

Only criteria 15–17 are satisfied. Criteria 4, 5, 11 are unimplemented. 1–3, 6–10, 12–14 lack proving tests (12–14 additionally lack schema/fixture wiring).

## Commands and observed results

```text
$ pnpm -w turbo run build test
  Tasks: 32 successful, 32 total
  Cached: 32 cached, 32 total
  >>> FULL TURBO

$ pnpm test:cross-process
  {"contentArtifactHash":"3c693419…b242","initialSnapshotHash":"d0a21ab4…fe6a",
   "closingSnapshotHash":"f6d920a5…4673","commandLedgerHash":"eb395a05…d033d",
   "eventLedgerHash":"5d0b63f4…94cb","financialLedgerHash":"f8d21485…9103",
   "randomDecisionLedgerHash":"4f53cda1…2b945","replayVerificationHash":"ee25bb99…6ee",
   "success":true}
  # matches golden/hashes.json byte-for-byte

$ rg -n "RESEARCH_PRIORITY_CONSTRAINT_VIOLATED|EXACT_TECHNOLOGY_SELECTION_PROHIBITED|TECHNOLOGY_PREREQUISITE_CYCLE" packages apps
  # no matches in source (only design docs)
$ rg -n "DesignTemplateSchema" packages apps
  # no matches
$ rg -n "SetResearchPriority" packages apps
  # only: envelope.ts (type), index.ts (re-export), month.ts (unused import)
$ rg -n "designFiles" packages apps
  # all invocations pass [] (campaign.test.ts x4, integration.test.ts, run-child.ts, cli commands.ts)
```

## Determinism evidence

- Content artifact hash: `3c693419cf33e23cf6af06f8b2dcac2b86a0459070dc21fb2ec8bab16bb6b242` (golden + observed)
- Initial snapshot hash: `d0a21ab4d4b8d7f853d7f406f675fb7bc06c3b83c2496b11753e5eeee4e0fe6a`
- Closing snapshot hash: `f6d920a5bac7a937ab97c5dfa351819a4566ec2cc0b2746ae945d24fbd444673`
- Command ledger hash: `eb395a058344041676d43846607cdbf315518ecb2a193fc1edadc151cdbd033d`
- Event ledger hash: `5d0b63f489764fa777f4a671115bee583cb89cfeb911c9206c5e53e603eb94cb`
- Financial ledger hash: `f8d214856dbe9b809132b2815e91a13e4e72163a1d91c7da65205eb24f539103`
- Random-decision ledger hash: `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- Replay result: `match:true` (per run-child), `replayVerificationHash` `ee25bb99b7d241d4ff20413d7aa1815d5660eaa43e782b54091174a19d177ee6`
- Processes/OS used: 1 macOS child process (darwin) — cross-process pairing is covered by `cross-process.test.ts` (2 clean runs).

Note: the golden path does **not** exercise research resolution (no `researchBudget` in the fixture), so research-stream determinism is not yet proven.

## Canonical artifact changes

None. No hashes or golden artifacts were modified by this pass.

## Tests added

None. This was a verification pass only; no implementation or test changes were made. The report documents that tests are **missing** for the acceptance criteria above.

## Security and cancellation

No code changes; no new trust boundaries. Existing `AbortSignal` in campaign compile and atomic save paths (integration tests 14–15) remain green (`PROVEN` above).

## Performance observations

Not collected; no changes made.

## ADRs and dependencies

None introduced. A decision on `RESOLVE_RESEARCH` phase-id alias vs `resolve_research` and the `SetResearchPriorityCommand` lifecycle placement may require an ADR when implementing.

## Known limitations and deferred requirements

- B10b is not accepted: upheld 17-criteria checklist shows 3 unimplemented and 10+ unproven criteria.
- Research fixtures do not include GER research or design YAML; the brief's 3-nation fixture is absent.
- `IMMEDIATE_KNOWLEDGE` effects, `TechnologyPrerequisiteChainSchema` expansion, and compiler cycle validation are pending implementation.
- Deferred per brief (unchanged): adoption/production/refit pipeline, education/national modifiers, intelligence insight, multiple discoveries, mutual exclusion, variation, `ResearchResolutionRecord` full record.

## Changed files

None.

## Git and remote status

- Branch: `main`
- Commits: none created by this pass (working tree clean at `886ea44`)
- Working tree: clean
- Push status: local `main` is 1 commit ahead of `origin/main`
- Pull request: none
- Merge performed: `no`

## Secondary consistency check

- Re-ran `pnpm test:cross-process` and diffed against `golden/hashes.json`: identical output. (Self-describing absence of secondary run — not claimed.)
- Re-grepped the full repo (excluding node_modules) for the three unimplemented reason codes: source matches only in `docs/` design files, confirming no runtime emission.
- Confirmed every `designFiles` invocation is `[]` and every research fixture lacks GER / design templates.