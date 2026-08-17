# 16 — Save, Load & Continuity

Status: resolved

## Answer

Implemented for real: `loadCampaign`, `verifyCampaign`, `replayCampaign`,
`recoverCampaign` in `continuityCommands.ts` wire through `@bluewave/persistence`
(`SaveStore`/`CompatibilityChecker`/`RecoveryManager`) and
`@bluewave/phase-engine` (`ReplayVerifier`), proven against real
`content/production/1880` saves. `loadCampaign` restores a real session
(post-month state + continuation to next month, deterministic
`campaignSeed`/`playerSlotId`/`scenarioId` via a new atomic `session.json`
sidecar written by `compileCampaign`); verify passes/fails against the
package envelope; replay reconstructs committed months and confirms a
matching deterministic hash (tamper → `matched:false`); recover reverts a
deliberately corrupted save to its predecessor (healthy package → no
needless revert).

**Recorded caveats (ADR-0024):** `SaveStore`'s envelope hash covers only the
Record-form (non-Map) remainder of state (`canonicalSerialize` collapses
Maps to `{}`), so verify/recover cannot detect Map-backed corruption
(treasury/nations) — replay's Record-form subset hash does, and is the strong
integrity check for this MVP. The serializer fix is deferred to the
persistence track (closed folow-up ticket
[17-serializer-hash-integrity](17-serializer-hash-integrity.md) + ADR-0024);
`session.json`'s seed is folded into that same follow-up.

**What to build:** `loadCampaign`, `verifyCampaign`, `replayCampaign`, and
`recoverCampaign` wired to `SaveStore`, `CompatibilityChecker`,
`ReplayVerifier` (`@bluewave/phase-engine` — proven against real content by
the earlier [Verify Full Loop Against Production Pack](05-verify-full-loop-against-production-pack.md)
ticket), and `RecoveryManager`, per
[New-Game & Continuity Contract](08-new-game-continuity-contract.md).

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [x] Closing and reopening the app, then loading a previously-saved
      campaign via the Campaign File screen, restores real state (not a
      fresh/empty campaign).
- [x] Verify reports a real pass/fail against the loaded package's
      hash/envelope.
- [x] Replay reconstructs the command history and confirms a matching
      deterministic hash.
- [x] Recover runs against a deliberately corrupted save fixture and
      reports a real outcome (not a stub).
