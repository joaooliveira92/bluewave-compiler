# 15 — Fleet Visibility

**What to build:** `inspectFleetScreen` implemented for real, read-only, per
[Construction & Fleet Contract](10-construction-fleet-contract.md).
`submitMovementCommand`/`replaceMovementCommand`/`cancelMovementCommand`
stay unimplemented stubs — fleet movement is out of this map's scope.

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [ ] Fleet screen shows the player nation's real divisions, ships, and
      ports for the open campaign.
- [ ] Movement-related UI (if any renders) makes clear commands aren't
      available yet, rather than silently failing.
