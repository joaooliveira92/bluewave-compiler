# 03: Committed content lock and `content:verify`

**Type:** implementation
**Status:** resolved
**Blocked by:** 02 — Codepoint ordering in the compiler
**Frontier:** no

**What to build:** Pin the identity of the compiled artifact in a small committed
lock and add a verification command. The lock records the artifact's semantic
content version and SHA-256 body hash. `content:verify` rebuilds the artifact in
memory and fails when its hash diverges from the lock, naming the two hashes.
Wire the command into the preflight/CI gate so local green implies CI green.
Later content-changing tickets refresh the lock.

## Acceptance criteria

- [ ] A committed lock file records the content version and body hash.
- [ ] `content:verify` rebuilds and succeeds when the artifact matches the lock.
- [ ] `content:verify` fails, naming the differing hashes, when the artifact
      diverges (content drift) or is tampered.
- [ ] `content:verify` is invoked by the preflight/CI gate.
- [ ] The generated artifact itself stays out of git; only the small lock is
      committed.

## Notes

- A content update is an expected new lock, never a divergence; older saves keep
  the hash they recorded (ADR-0123).
