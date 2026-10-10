# 01 — Minimum playable-loop acceptance gate

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Spec:** `.scratch/playable-loop/spec.md`

## Scope

Prove one end-to-end campaign slice reaches and exercises the shipped modules, and
lock it as a gate: 1880 compile → monthly decisions → a campaign battle that
resolves and is surfaced → save/reload/verify. Wire any built-but-unreachable module
needed by the slice; if a module is out of the slice, record it as deferred (do not
silently drop).

## Acceptance

- AC-1..AC-5 of the spec.
- A new e2e spec in `apps/desktop/e2e/` drives the slice and runs in
  `.github/workflows/desktop-e2e.yml`.
- The slice's save/reload reproduces golden/cross-process hashes.
- A written reachability table: each M1–M4 module marked reachable-from-campaign or
  explicitly deferred.

## Notes

Start by enumerating, from the campaign phase pipeline, which modules actually run
during auto-resolution (PROGRESS.md notes gunnery + weather + damage). The gaps
between "built" and "reachable" are the real work.
