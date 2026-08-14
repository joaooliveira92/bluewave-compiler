# 16 — Save, Load & Continuity

**What to build:** `loadCampaign`, `verifyCampaign`, `replayCampaign`, and
`recoverCampaign` wired to `SaveStore`, `CompatibilityChecker`,
`ReplayVerifier` (`@bluewave/phase-engine` — proven against real content by
the earlier [Verify Full Loop Against Production Pack](05-verify-full-loop-against-production-pack.md)
ticket), and `RecoveryManager`, per
[New-Game & Continuity Contract](08-new-game-continuity-contract.md).

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [ ] Closing and reopening the app, then loading a previously-saved
      campaign via the Campaign File screen, restores real state (not a
      fresh/empty campaign).
- [ ] Verify reports a real pass/fail against the loaded package's
      hash/envelope.
- [ ] Replay reconstructs the command history and confirms a matching
      deterministic hash.
- [ ] Recover runs against a deliberately corrupted save fixture and
      reports a real outcome (not a stub).
