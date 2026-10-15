# 04: IdGenerator service (remove ambient randomness in app programs)

**What to build:** campaign session identifiers are produced by a service rather than by an inline
`randomUUID()` inside the compile and load command programs. No Effect program reaches for ambient
randomness; the identifier source is an explicit, injectable dependency consistent with the
determinism rules for the app surfaces.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] A service in the desktop main runtime provides session-id generation; the compile and load
      programs resolve it from the graph instead of importing a random source directly.
- [ ] No production Effect program calls a global random/UUID source directly.
- [ ] Behaviour is unchanged from the player's perspective (a fresh, unique id per new/loaded
      campaign); the existing suites stay green.
- [ ] Tests can inject a deterministic generator through a test Layer.
