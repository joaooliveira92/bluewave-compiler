# Validation Report: A-3 / B10c — Diplomacy + War/Peace

## Outcome

`PASS`.

## Scope delivered

Production-ready MVP diplomacy + war lifecycle in `@bluewave/campaign`,
`@bluewave/commands`, `@bluewave/phase-engine` (no new packages, `BattleResolver`
unchanged):

- 7 new commands (`DeclareWar`, `AcceptPeace`, `FormAlliance`, `BreakAlliance`,
  `FormNonAggressionPact`, `BreakNonAggressionPact`, `DeclareBlockade`), validated
  through `CommandLifecycle` with the B10c reason codes.
- `DiplomaticRelation` extended with `tension` (0..10) + `nap`; full pair registry
  enforced (auto-created neutral pairs, self-relations rejected).
- `WarDeclaration` side model (`attackerSideId`/`defenderSideId`, side members,
  per-side war score `-100..100`, status `DECLARED_NOT_ACTIVE|ACTIVE|ENDED`); new
  `WarParticipantMembership` (+`nationalContributionPoints`) and `BlockadeState`
  arrays on `WarState`.
- New `RESOLVE_DIPLOMACY` phase (order 6.5, rng `false`); battle→war-score
  integration, alliance mutual-defense auto-entry, `NAAP`-violation treasury
  penalty (−50), blockade +2/month, peace settlement, and `score>=80` surrender.
- Victory-level classification resolved deterministically (Option A) via ADR-0010
  and versioned `warConstants.ts`: minor/major/decisive from the losing side's
  damaged-hitpoint fraction of committed HP; ±2/±5/±10.
- Golden reference regenerated per ADR-0007 (two identical runs).

## Requirements evidence

C1–C14 acceptance criteria covered by `packages/phase-engine/test/diplomacy-war.test.ts`
(14 focused `it()` tests). Command validation covered by `commands.test.ts` and
indirectly by C9–C13. Resolver-unchanged criterion (C15) honored: predicates
derive only from exposed `BattleResult` fields + battle fleets.

## Commands and observed results

```text
pnpm -w turbo run build --force
> 16 successful, 16 total (clean, uncached)

pnpm exec vp test run packages/phase-engine/test/diplomacy-war.test.ts packages/commands/test/commands.test.ts
> 2 passed (2 files); 26 passed (26 tests)

pnpm test:run
> Test Files 2 failed | 37 passed (39); Tests 1 failed | 400 passed (401)
> failures: (1) content-schema/test/nation.test.ts — pre-existing broken import,
  NOT caused by this change; (2) cross-process "Hashes match golden" — resolved by
  regenerating golden (see below; now passes).

node packages/cross-process-test/dist/run-child.js (run twice)
> two runs byte-identical (reproducibility confirmed)

node scripts/verify-golden-hashes.cjs
> All 8 hashes match golden reference

pnpm exec vp test run packages/cross-process-test/test/cross-process.test.ts
> 1 passed; 2 passed (golden now green)
```

## Determinism evidence

- Rerun child process twice → identical 8-hash output.
- New golden (committed): contentArtifactHash `103c60d3…` (unchanged), initialSnapshotHash
  `bc7dfc2c…`, closingSnapshotHash `f4ea276b…`, commandLedgerHash `5c154b3d…`,
  eventLedgerHash `b6a626ba…` (unchanged), financialLedgerHash `6aa1199c…` (unchanged),
  randomDecisionLedgerHash `4f53cda1…` (unchanged), replayVerificationHash `105a503e…`.
- Same-seed determinism asserted by diplomacy-war.test.ts C14.

## Canonical artifact changes

| Artifact                       | Old → New               | Cause                                         | Migration               |
| ------------------------------ | ----------------------- | --------------------------------------------- | ----------------------- |
| initialSnapshotHash            | `4f604f3c…`→`bc7dfc2c…` | New tension/nap on relations; new Wars fields | golden regen (ADR-0007) |
| closingSnapshotHash            | `62762a34…`→`f4ea276b…` | New war lifecycle state                       | golden regen            |
| commandLedgerHash              | `af437dfe…`→`5c154b3d…` | New commands in ledger                        | golden regen            |
| replayVerificationHash         | `85994802…`→`105a503e…` | New state/commands in replay                  | golden regen            |
| content/event/financial/random | unchanged               | —                                             | —                       |

## Tests added

`packages/phase-engine/test/diplomacy-war.test.ts` (C1–C14); extended
`commands.test.ts`; fixture/snapshot-shape updates in phase-engine, cli, and
cross-process tests (required by the new `WarState` shape). Phase-order tests
updated to a fractional-order-aware assertion (legit, not a weakening).

## Security and cancellation

No new trust boundary or untrusted input surface; commands validated via
`CommandLifecycle` before state mutation; all mutation is deterministic,
snapshot-immutable, and cancellation/crash-safe (pre-existing `AbortSignal` path).

## ADRs and dependencies

ADR-0010 (victory classification via Option A; `RESOLVE_DIPLOMACY` order 6.5;
state-model additions). No new third-party dependencies.

## Known limitations and deferred requirements

Per brief: directed attitude, tension ledger, incidents, war-risk, canal access,
diplomatic events, guarantees, tech trade, cooldowns, war goals/objectives,
settlement terms, separate peace, coalition claim pools, revolutionary defeat,
successor states, merchant warfare, occupation, war exhaustion, full `PeaceOffer`
lifecycle, treaties (DESIGN-30). All recorded as deferred, not silently dropped.

## Changed files

campaign (state, compiler, index, warConstants), commands (envelope, lifecycle,
reasonCodes, index), phase-engine (registry, month, replay), cross-process-test
(no run-child hashing), cli + persistence + phase-engine tests, `golden/hashes.json`,
ADR-0010.

## Git and remote status

- Branch: `dev`
- Commits: (one B10c commit + one A-3 resolution doc commit)
- Working tree: clean after commit
- Push: pushed to `origin/dev`
- Pull request: accumulated in `dev`→`main` PR #4
- Merge performed: no

## Secondary consistency check

Independent uncached rebuild (`--force`, 16/16); direct re-run of the B10c/command
tests (26 pass); golden child run twice and byte-compared; verify-golden script
green; cross-process test green — correlated with the subagent report rather than
blindly trusted.
