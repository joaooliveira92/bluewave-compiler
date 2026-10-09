# ADR-0082: The Drawing Board never loses work: draft sidecar and a durable command queue

## Status

Accepted 2026-10-09.

## Context

The Drawing Board kept its working design in React state, so closing the modal, leaving the screen or restarting threw away
the design and its edit history. A submitted design was answered with "Design queued", but the pending-command queue was
in memory only, so a restart before the month advanced silently dropped it (and every other queued research, diplomacy or
revision command).

## Decisions

1. **Working design sidecar.** `drawing-board-draft.json` beside the campaign's saves holds the starting design id and the
   encoded edit log (`encodeLog`, validated with `decodeLog` on write and read). The board reads it once on open, writes
   400 ms after the last change and when it closes, and removes it when the log is empty. No write happens before the read
   finishes. A restored design is announced with "Keep working" and "Start over". It is renderer-owned, outside the save
   envelope and hash, never read by the engine (like `ui-state.json`). Outside a campaign the board stays a scratch pad.
2. **Durable queue.** The pending-command queue is mirrored to `pending-commands.json` on every change, stamped with the
   session's turn; `loadCampaign` restores it only while that turn is current, and removes a stale or malformed file. The
   engine validates every restored envelope when the month runs, so the file grants nothing the live queue could not.
3. **Submission feedback.** Rejections are worded for the player and always say the design is unchanged; a bridge failure
   is reported instead of escaping; the same design and class name cannot be queued twice in a month.

## Consequences

Two more non-authoritative files per campaign directory. Copying a campaign copies them too, which is the expected
behaviour for work in progress.
