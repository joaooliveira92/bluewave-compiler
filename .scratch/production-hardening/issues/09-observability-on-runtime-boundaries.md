# 09: Observability on the main runtime boundaries

**What to build:** the desktop main process, now a full runtime surface, logs through the Effect
logging channel with stable spans at the command-dispatch, save, and replay boundaries, rather than
through allowlisted `console.*`. An operator can trace a command from the IPC edge through the service
graph. The local-only crash-bundle path stays independent of the runtime so it still works when the
runtime is dead.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] Command dispatch, save, and replay carry named spans and structured `Effect.log*` entries with
      stable names; the console allowlist shrinks accordingly.
- [ ] The crash-bundle path continues to function without the runtime (verified).
- [ ] Logging never introduces wall-clock/randomness into an authoritative hashed path.
- [ ] The full check stays green; no gameplay/golden change.
