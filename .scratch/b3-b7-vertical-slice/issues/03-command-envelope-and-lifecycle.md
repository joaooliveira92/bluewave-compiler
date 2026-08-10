# 03 — Command envelope and lifecycle

**What to build:** Versioned command envelopes with expected snapshot hash, idempotency key, and structured outcome. The lifecycle: validate, authorize, reserve, accept or reject, lock, resolve, emit outcomes and events, then produce new aggregate versions. Commands never mutate authoritative state directly. Include explicit command rejection and resolution outcome types.

**Blocked by:** 01

**Status:** resolved

- [x] `CommandEnvelope` type with version, snapshot hash, idempotency key
- [x] Command lifecycle service (validate → authorize → reserve → accept/reject → lock → resolve → emit → produce)
- [x] `CommandOutcome` discriminated union (success, rejection, idempotency match, idempotency conflict)
- [x] Stale expected snapshot hash is rejected
- [x] Same idempotency key returns original result; different command returns `IDEMPOTENCY_CONFLICT`
- [x] An unlocked, invalid, or unreserved command cannot resolve
- [x] `CommandLedger` for append-only command recording
- [x] Tests: acceptance, rejection, idempotency, lock enforcement
- [x] ADR for command lifecycle and ledger design

## Answer

Implemented `packages/commands` with `CommandEnvelope`, `CommandLifecycle` (full 7-step lifecycle), `CommandIdempotencyMap`, `CommandLedger`. 6 tests pass covering envelope creation, success, idempotency match/conflict, stale hash rejection, and ledger determinism.
