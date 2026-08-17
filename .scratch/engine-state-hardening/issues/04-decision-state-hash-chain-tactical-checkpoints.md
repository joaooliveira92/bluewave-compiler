# 04 — Decision: snapshot hash-chain + tactical checkpoint persistence

**Type:** decision

**What to build:** a decided position (recorded as an ADR + this ticket
resolved) on two related state-architecture questions, with no code landing
until the decision is recorded:

1. **State hash chain.** Should `CampaignSnapshot` carry its own
   `stateHash`/`previousStateHash` threaded through the month pipeline,
   persistence serialization, and replay verification — turning the snapshot
   into an explicit hash chain rather than relying on per-save wrapping
   (envelope + raw hash) plus external replay to establish integrity? Consider
   the golden-hash impact (the snapshot shape changes, so goldens regenerate
   under ADR-0007's policy), the replay-verifier relationship, and whether the
   added field is worth the surface cost.

2. **Tactical checkpoint persistence.** The campaign snapshot stores only a
   battle's manifest and final result; the minute-by-minute tactical state is
   transient and re-derivable from manifest + seed. REL-1 §22 requires "replay
   at strategic + tactical checkpoints". Decide whether replaying from a
   campaign save alone is acceptable (deterministic re-resolution from
   manifest + seed), or whether mid-battle tactical state needs a persistence
   path, and document the chosen answer.

Deliverables: an ADR (or a decision-request if a genuine canonical-contract
ambiguity appears) and a golden-impact note for any snapshot shape change, plus
this ticket marked resolved with the decision recorded. No implementation from
this ticket itself — follow-on tickets derive from it.

**Blocked by:** None — can start immediately.

**Status:** open

- [ ] Both questions decided, with the choice grounded (research into DESIGN docs / existing ADRs / phase and persistence seams) and recorded.
- [ ] ADR written covering the hash-chain decision and the tactical-checkpoint answer.
- [ ] Golden impact of any snapshot-shape change documented and reconciled under the golden-regeneration policy.
- [ ] Ticket marked resolved with the decision text appended; any follow-on code tickets created and linked.