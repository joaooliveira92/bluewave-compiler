# ADR-0081: Each save records its month's input, so replay runs the month the player played

## Status

Accepted 2026-10-09. Fixes `replayCampaign` for months with player commands; builds on ADR-0066 (SubmitDesign) and the
shared pending-command queue (desktop-diplomacy-war INC-2).

## Context

`commitMonth` executes a month with the player's queued command envelopes (research priorities, diplomacy, designs,
revisions) and the ship-building content. The queue is in memory and was dropped after the month, and `replayCampaign`
replayed every month with no commands and no content. Any month with a player command therefore failed replay verification
after a restart (reproduced with a research priority change), and a submitted design passed only because designs sit outside
the replay hash.

## Decisions

1. **The save that closes a month carries that month's input**: `month-input.json` (`month_input_v1`) in the same atomic save
   directory, with its sha256 in `metadata.json` (`monthInputHash`, optional, so older saves load unchanged). It holds the
   envelopes exactly as executed (snapshot hashes refreshed at drain), the engine's outcome for each, and the hash of the
   ship-building files the engine was given. `SaveStore` treats it as opaque JSON; the desktop owns its shape and validates it
   (saves are trust-class data).
2. **Replay runs the same month**: the stored envelopes, the original outcomes as the ledger to compare step by step, the
   ship-building content, and the player's slot first on both sides, exactly as `commitMonth` executes.
3. **Changed content is reported, not replayed**: if the ship-building content hash differs from the one the month recorded,
   the revision is "content-changed" (not matched, with a warning). Content updates such as ADR-0080 are expected to make old
   months irreproducible by a newer build; a hash mismatch must not be confused with a divergence.
4. **A missing, altered or malformed month input fails the revision** ("unreadable"), never falls back to "no commands".
   Saves from before this ADR have no month input and replay as before.

## Consequences

Replay verification is meaningful again for every command family. The `designs` and `designFamilies` maps are still outside
`snapshotToHashable`; adding them changes the cross-process determinism contract and is left as a follow-up.
