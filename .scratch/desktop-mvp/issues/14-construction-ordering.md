# 14 — Construction Ordering

**What to build:** `inspectConstructionScreen`, `submitConstructionCommand`,
`replaceConstructionCommand`, and `cancelConstructionCommand` wired to
`packages/commands`'s real command-lifecycle machinery (`CommandRegistry`,
reservation/settlement), per
[Construction & Fleet Contract](10-construction-fleet-contract.md).

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [ ] Construction screen shows real available designs and the nation's
      current construction projects.
- [ ] Submitting a construction command against a real design queues a real
      project, visible on next inspect.
- [ ] Replace and cancel work against an in-flight command, respecting
      `expectedRevision`/`transportRequestId` optimistic concurrency.
- [ ] A stale `expectedRevision` is rejected, not silently applied.
