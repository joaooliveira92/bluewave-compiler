# 03 — Command envelope and lifecycle

**What to build:** Versioned command envelopes with expected snapshot hash, idempotency key, and structured outcome. The lifecycle: validate, authorize, reserve, accept or reject, lock, resolve, emit outcomes and events, then produce new aggregate versions. Commands never mutate authoritative state directly. Include explicit command rejection and resolution outcome types.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `CommandEnvelope` type with version, snapshot hash, idempotency key
- [ ] Command lifecycle service (validate → authorize → reserve → accept/reject → lock → resolve → emit → produce)
- [ ] `CommandOutcome` discriminated union (success, rejection, idempotency match, idempotency conflict)
- [ ] Stale expected snapshot hash is rejected
- [ ] Same idempotency key returns original result; different command returns `IDEMPOTENCY_CONFLICT`
- [ ] An unlocked, invalid, or unreserved command cannot resolve
- [ ] `CommandLedger` for append-only command recording
- [ ] Tests: acceptance, rejection, idempotency, lock enforcement
- [ ] ADR for command lifecycle and ledger design
