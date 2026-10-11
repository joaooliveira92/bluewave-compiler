# ADR-0047: P-1 — Damage-Control Scope in Auto-Resolution, Unit Contract, and Recorded Deferrals

## Status

Accepted (2026-10-06)

Superseded by: ADR-0049 (decisions 1 and 2 — the damage-control gate and its recorded deviation).

## Context

P-1 ticket 07 makes the DESIGN-41 damage-control stage real inside
`resolveBattleAuto`: contexts are keyed per ship, flooding feeds
flotation/terminal status, and the stage runs every minute of an auto-resolved
battle. The reviewer pass (`.ai/reports/p1-battles-that-matter.md`) surfaced one
genuine spec-vs-canonical conflict, one unit-contract ambiguity, and two
mechanics gaps that the ticket's slice cannot carry.

1. **AC-6 vs DESIGN-41 §13/§19/§44.** The approved P-1 spec freezes unarmed
   battles: *"Battles between ships without torpedo armament keep byte-identical
   minute hashes and result hashes"* (AC-6). DESIGN-41 §13 says flooding (and
   fire) resolve once per authoritative tactical minute, and §19/§44 tie that to
   the terminal seam. Shell hits already create fire/flooding records in unarmed
   battles; if the stage ran there, their minute hashes would change. The two
   normative documents therefore prescribe different authoritative outcomes for
   the same battle.
2. **Severity units (DESIGN-41 §14, §48 validation 12).** The severity
   thresholds (500 / 1 500 / 3 000) are *basis points of displacement*, while the
   accumulated progressive-flooding field is *integer kilograms*
   (`damage/state.ts`). A kg value fed straight into a bp threshold reads
   CRITICAL almost immediately on any real hull.
3. **§17 high-speed-loss check and §1/§27 resources.** The check consumes a
   keyed draw whose effect (bulkhead/machinery/terminal transition +
   `FLOODING_HIGH_SPEED_LOSS_CHECK`) needs a spatial compartment model that
   `ShipDamageState` does not carry; per-ship damage-control resources are not
   yet part of the state schema, so the stage rebuilds default resources each
   minute.

## Decision

1. **Deterministic AC-6 gate.** The damage-control stage runs in
   `resolveBattleAuto` iff the projected battle contains at least one unit with
   `torpedoArmament` (a projection-time predicate over promoted units). The
   predicate is content-derived and deterministic; unarmed battles keep the
   pre-P-1 semantics byte-for-byte (AC-6), and the gate is what makes the AC-6
   regression test meaningful (pinned unarmed `resultHash` baseline).
2. **Deviation recorded, not silent.** Running DESIGN-41 §13/§19/§44 only in
   torpedo-armed battles is an *approved deviation* from the canonical design for
   the duration of Track P, recorded here per ENGINEERING-CONTRACT §ADR
   threshold. Unarmed battles do not regress — this is the exact behaviour they
   shipped with before P-1.
3. **Follow-up ticket (not dropped).** `.scratch/p1-battles-that-matter/issues/09-unarmed-damage-control.md`
   carries the canonical end state: run the stage in every auto-resolved battle,
   amend spec AC-6, and re-pin affected baselines through the ADR-0007 process
   with this ADR as the authoritative cause.
4. **Unit contract (DESIGN-41 §14).** `floodingRecords`/`floodedWaterBp` mass
   accumulates in integer kilograms; conversion to basis points of displacement
   (`bp = floor(mass × 10_000 / designDisplacementKg)`) happens only at severity
   evaluation (`getFloodingSeverity`, §17 check eligibility), never by rewriting
   the accumulated field. Design displacement is threaded from the projected
   unit into the damage-control context. Boundary tests pin 499/500,
   1 499/1 500, 2 999/3 000 bp.
5. **Deferred, recorded per ENGINEERING-CONTRACT §Delivery contract:**
   - §17 high-speed-loss effect + `FLOODING_HIGH_SPEED_LOSS_CHECK` emission
     (needs a spatial compartment model on `ShipDamageState`) — the keyed draw
     stays deterministic and ledger-recorded; the effect is deferred.
   - §1/§27 persistent damage-control resources (electrical power, teams,
     access) — a state-schema change; defaults are rebuilt per minute until then,
     so pumping/firefighting capacity is at full strength regardless of damage.
   - §15 speed/stability severity multipliers have no battle-path caller yet.

## Consequences

- Torpedo-armed campaign battles now progress flooding to flotation and the §32
  battle-end decision; an 1880 ironclad can founder from a Whitehead hit
  (proven deterministically).
- Unarmed battles are hash-frozen by construction and by a pinned-baseline test
  that can actually fail.
- Severity/priority selection now uses bp-of-displacement, so allocation
  priorities and §17 eligibility follow DESIGN-41 §14 instead of raw tonnage.
- Goldens 10/10 unchanged (no golden scenario resolves a battle); no
  serializer/save/formula version bump — `ShipDamageState` shape is unchanged.
- The next ADR number is **0048**.
