- **Type:** grilling
- **Status:** resolved
# B-6: Campaign Consequences — battle result → war score / ships / reservations

## Question

When a battle resolves, what exactly changes on the campaign side, and through
which existing seams?

## Answer

**Locked.**
1. **War score / victory classification / contribution points — reuse
   unchanged.** The existing `applyBattleResult` in `packages/phase-engine/src/
   month.ts:1391` is fed `{ winnerId, loserId, damageReport }` from
   `resolveBattleAuto`'s result. No re-derivation; the DESIGN-31/ADR-0010
   path stays the single source of truth.
2. **Ship damage/loss:** for each ship in `damageReport`, apply accumulated
   loss to `ship.hitPoints` (clamped ≥ 0). When `terminalStatus` reached
   `SINKING`/`FOUNDERED` (or hitPoints == 0), the ship is removed from its
   fleet (authoritative battle outcome; DESIGN-37 §19/20 consequences through
   campaign provenance — provenance via `participantMembership
   nationalContributionPoints` + battle record). Ships that survive keep damage
   (harm to readiness is a real consequence, not fabricated).
3. **Reservations:** after every battle in a war resolves, clear
   `ship.inBattleId` so ships re-enter the deployment pool (B-1 wiring sets
   it; B-6 must unset it). Battles marked `resolved` with `result` recorded
   (fields already on `BattleInstance`).
4. **No treasure/prisoner/economic sidebar**: none exist yet; not invented.
5. Failing invariants (unknown battle, missing nation, pending battle without
   manifest) produce stable diagnostics, never silent skips.

**Migration/version:** this changes the `CampaignSnapshot` shape → new
`compatibilityVersion` or supplemental-version bump with the ADR; no old-save
continuation without a migration path documented (ADR-0007 process).