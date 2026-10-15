# 04: Bound heavy-test concurrency

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

**What to build:** The workspace test run cannot exhaust a loaded machine and get
a heavy suite killed by the OS. The run carries a bounded concurrency/worker
default below "everything at once" — overridable for fast machines — so the heavy
suites survive under parallel CI load instead of being SIGKILLed.

- [ ] The workspace test run uses a bounded concurrency default below the current
  unbounded behaviour.
- [ ] The bound is overridable via an environment variable or flag for fast
  machines.
- [ ] Heavy suites complete under simulated load without an OS kill.
