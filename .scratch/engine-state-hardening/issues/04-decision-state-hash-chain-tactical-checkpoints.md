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

**Status:** resolved

- [x] Both questions decided, with the choice grounded (research into DESIGN docs / existing ADRs / phase and persistence seams) and recorded.
- [x] ADR written covering the hash-chain decision and the tactical-checkpoint answer.
- [x] Golden impact of any snapshot-shape change documented and reconciled under the golden-regeneration policy.
- [x] Ticket marked resolved with the decision text appended; any follow-on code tickets created and linked.

## Resolution

Recorded in **ADR-0034** (`docs/adr/ADR-0034-engine-state-hash-chain-tactical-checkpoints.md`).
Both questions decided, grounded in DESIGN-52 §§2/5/15/18/22/27–31, ADR-0003/0006/
0007/0016/0025/0026/0027/0032, and the current compile→month→serialize→replay seams.

**Question 1 — snapshot hash chain: NO.** `CampaignSnapshot` does not gain
`stateHash`/`previousStateHash`. Integrity already rests on the per-save wrapping
(envelope `bodyHash` + `rawHash`, ADR-0003) plus the independent on-disk signature
file (ADR-0032) and the save-level predecessor chain (`metadata.previousSaveId`)
plus replay verification. An embedded chain adds no security for the full-file
threat model (an attacker able to rewrite `campaign.json` can recompute an
in-body `stateHash` too — the same reason the separate signature file exists), is
redundant with `previousSaveId` + replay's first-divergence stop, and its surface
cost (snapshot shape change → golden regeneration under ADR-0007, self-referential
hash, threading through every phase + serialization + replay) is unearned.
DESIGN-52 §31 checkpoint chains are *optional* replay-acceleration caches, not
snapshot fields.

**Question 2 — tactical checkpoint persistence: NO persistence path; replay is
re-derivation from manifest + seed.** The minute-by-minute tactical state is
`DERIVED_REBUILDABLE` (DESIGN-52 §5) with a deterministic rebuild contract
(`resolveBattleAuto`, ADR-0026) from manifest + battle seed + committed strategic
weather + version pins. DESIGN-52 §27/§28 define tactical replay as re-resolution
from the *initial* battle snapshot + manifest + seed + ledger; minute checkpoints
are optional acceleration (§31). A campaign-save-alone replay that re-runs
`resolveBattleAuto` and compares the recorded `BattleInstance.result`/`resultHash`
is authoritative and closes REL-1 §22's tactical-checkpoint replay. Battle
autosaves at minute boundaries for crash recovery and the full DESIGN-52
save-package model are recorded as deferred (REL-1, out of scope).

**Golden impact:** neither decision changes the snapshot shape, so
`golden/hashes.json` is **unchanged** (no regeneration under ADR-0007).

**Follow-on code ticket created and linked:**
`.scratch/engine-state-hardening/issues/07-tactical-replay-verification.md` —
implements the tactical replay verification (re-resolve each resolved battle from
manifest + seed and compare result/resultHash).