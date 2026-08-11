# Milestone B8: Cross-Process and Cross-Platform Determinism Gate

## Objective

Prove that identical fixture, compiled content artifact, campaign snapshot, command ledger, domain event ledger, financial ledger, and random-decision ledger hashes are reproducible across clean child-process restarts and across Linux, Windows, and macOS with pinned tooling.

## Canonical requirements

BW-DET-003, BW-TST-001, BW-TST-003, BW-CMP-002, BW-PER-003.

## Starting state

The repository implements B0-B7 on `main` with 154 passing tests. The compiler, campaign compiler, phase engine, persistence, replay verifier, and narrow battle auto-resolver exist. Determinism is proven only within a single process — no child-process or cross-OS evidence exists. No CI pipeline is configured. No golden hash files exist.

## In scope

- Cross-process determinism test harness that spawns clean child processes via `child_process.fork()` or `execFileSync()`.
- CI configuration (GitHub Actions) with `os: [ubuntu-latest, windows-latest, macos-latest]` matrix.
- Pinned Node.js (>=24.0.0) and pnpm (>=11.0.0) uniformly across all CI runners.
- Golden hash recording: compile content artifact, initial campaign snapshot, and each authoritative ledger hash as a committed reference file.
- Cross-process verification that repeated compilation, campaign compilation, month execution, save/load, and replay produce identical hashes.
- Cross-OS verification that the same fixture produces identical hashes on all three platforms.
- Updated traceability: BW-TST-001 promoted from `verified` to cross-OS `verified`; BW-DET-003, BW-TST-003 similarly updated.
- ADR for cross-process determinism test strategy and CI architecture.
- Documentation of any environment-dependent effects discovered and how they were neutralised.

## Out of scope

- Full historical scenario support, complete monthly mechanics, AI sophistication, interactive tactical state, Electron packaging, production balance claims, or expansion of game content.
- Performance optimisation or benchmarking.
- Adding new gameplay features.

## Required implementation

### Cross-process test harness

A `cross-process-test` package (or a test suite within `test-support`) that:

1. Spawns a clean child process using `child_process.fork()` or `execFileSync()` with `NODE_OPTIONS="--experimental-vm-modules"` if needed.
2. Each child runs a deterministic sequence: compile fixture → compile campaign → execute one month → save → load → replay → verify.
3. The child prints each authoritative hash as JSON to stdout.
4. The parent collects hashes and compares them to golden references and across children.
5. Runs at least two children sequentially (or in parallel if isolation is proven) and asserts byte-identical hashes.

### CI pipeline

A `.github/workflows/determinism.yml` workflow:

1. Trigger: push to `main`, pull request to `main`, manual dispatch.
2. Matrix: `os: [ubuntu-latest, windows-latest, macos-latest]`.
3. Steps: checkout, install Node.js >=24.0.0, install pnpm >=11.0.0, `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test` (unit tests), then `pnpm test:cross-process` (cross-process determinism proof).
4. Record all authoritative hashes as a CI artifact.
5. Fail if any hash differs from the golden reference or across OS runners.

### Golden hash references

A committed file `golden/hashes.json` containing:

```json
{
  "contentArtifactHash": "<sha256>",
  "initialSnapshotHash": "<sha256>",
  "closingSnapshotHash": "<sha256>",
  "commandLedgerHash": "<sha256>",
  "eventLedgerHash": "<sha256>",
  "financialLedgerHash": "<sha256>",
  "randomDecisionLedgerHash": "<sha256>",
  "replayVerificationHash": "<sha256>"
}
```

These are initially recorded from the cross-process test on the reference OS (Linux), then verified identically on Windows and macOS in CI.

### Environment isolation verification

Add tests that verify authorative packages do not read forbidden ambient inputs. Add a read-only audit that walks the import graph of each domain package and confirms no imports of `os`, `process`, `fs`, `path`, `child_process`, `crypto` (except through the deterministic wrapper), `timers`, `perf_hooks`, or `os` modules.

## Acceptance tests

1. `pnpm test:cross-process` produces identical hashes in two consecutive child-process runs on the same OS.
2. CI runs on all three OSes and produces identical hashes across all matrix entries.
3. Golden hash file matches the Linux CI run.
4. Reordering fixture YAML object keys and source file order does not change the content artifact hash (cross-process).
5. The same opening snapshot and command sequence yields identical closing snapshot, command, event, financial, and random-decision ledger hashes in a child process.
6. The ambient-input audit passes: no domain package imports forbidden modules.
7. The same cross-process determinism proof succeeds after a clean `pnpm install --frozen-lockfile` in a fresh clone.

## Determinism proof

Record all eight authoritative hashes. Run in at least two clean child processes on the same OS, then verify cross-OS identity in CI. The golden hash file is the authoritative reference.

## Compatibility and versions

- Content artifact format: unchanged (ADR-0003 serializer).
- Campaign snapshot format: unchanged.
- Command/event/ledger formats: unchanged.
- No migration required — no on-disk format changes.
- Cross-process determinism proof depends on pinned Node.js and pnpm versions.

## Performance observations

Cross-process test harness overhead (spawn + IPC) is not performance-critical. Record wall-clock time for each child-process run as a CI log line, but do not make it authoritative.

## Stop conditions

- If a hash differs across child processes on the same OS, stop and diagnose before fixing.
- If a hash differs across OSes, determine whether the root cause is an environment-dependent code path, an incidental ordering difference, or a floating-point/platform-math difference. If the latter, stop and create a decision request — do not silently tolerate or work around.
- If a forbidden import is found in a domain package, it must be removed rather than suppressed.
- If CI infrastructure is unavailable (no GitHub Actions), document the manual cross-process verification procedure and defer cross-OS proof.

## Required delivery

- Cross-process test harness (package or test suite).
- `.github/workflows/determinism.yml` CI workflow.
- `golden/hashes.json` golden hash reference file.
- Ambient-input audit test.
- Updated traceability in `.ai/REQUIREMENTS.md`.
- ADR for cross-process determinism test strategy.
- Validation report.
- Changed-file summary.
- Small Conventional Commits.
- Pull-request description (when remote access exists).
