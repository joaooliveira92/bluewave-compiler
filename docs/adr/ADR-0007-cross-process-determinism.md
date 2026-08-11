# ADR-0007: Cross-Process and Cross-Platform Determinism Test Strategy

## Status

Accepted

## Context

The Bluewave engine must produce identical authoritative hashes across clean child-process restarts and across Linux, Windows, and macOS (BW-DET-003, BW-TST-001). Before B8, determinism was only proven within a single process — no child-process or cross-OS evidence existed.

Additionally, domain packages must not read forbidden ambient inputs (wall-clock time, filesystem order, locale, environment variables, etc.) that could cause non-determinism.

## Decision

1. **Cross-process test harness**: A dedicated `@bluewave/cross-process-test` package contains a `run-child.ts` script that runs the full deterministic pipeline (compile content → compile campaign → execute month → save → load → replay) in a single Node.js process. The test spawns this script as a clean child process via `child_process.execFileSync`, collects the JSON hash output from stdout, and verifies that two consecutive runs produce identical hashes.

2. **Golden hash file**: A committed `golden/hashes.json` file records the reference hashes from the reference OS. CI verifies that the actual hashes match the golden reference on every run.

3. **CI matrix**: A GitHub Actions workflow runs on `ubuntu-latest`, `windows-latest`, and `macos-latest` with pinned Node.js 24.0.0 and pnpm 11.9.0. The `pnpm test` suite runs first, then the cross-process determinism proof runs and verifies against the golden reference.

4. **Ambient-input audit**: An automated test scans all domain package source files for imports of forbidden modules (`os`, `process`, `child_process`, `timers`, `perf_hooks`). Infrastructure packages (`content-compiler`, `campaign`) are allowed to import `node:fs` and `node:path` for I/O at their boundaries.

5. **Test isolation**: Each child process creates unique temporary directories and cleans them up in a `finally` block. The `NODE_OPTIONS` environment variable is cleared in the child to avoid contamination from the parent.

## Consequences

- Cross-process determinism is now verified automatically in CI on every push and pull request.
- Cross-OS determinism is verified by the CI matrix — any OS-dependent hash difference will be detected.
- The ambient-input audit prevents regressions where a domain package accidentally imports a non-deterministic module.
- The golden hash file must be updated when the deterministic pipeline output intentionally changes (e.g., new content, new formulas, new serializer version). The update process is: run the child process, verify the new hashes are correct and reproducible, then commit the updated `golden/hashes.json`.
- Cross-process tests are slower than unit tests (~1-2 seconds per child process) but still fast enough to run on every CI run.
- CI infrastructure (GitHub Actions) is required for cross-OS verification. If unavailable, the cross-process test runs on the local OS only.

## Related requirements

- BW-DET-003: Identical authoritative inputs produce identical hashes across supported operating systems.
- BW-TST-001: Repeated campaign compilation is reproducible.
- BW-TST-003: Replay reproduces authoritative results.

## Related ADRs

- ADR-0003: Serializer and hash strategy (canonical JSON + SHA-256 envelopes).
