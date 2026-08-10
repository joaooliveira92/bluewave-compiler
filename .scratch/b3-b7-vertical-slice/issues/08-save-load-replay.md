# 08 — Save, load, and replay

**What to build:** CLI commands for save, load, and replay. Save after the closing snapshot, load into a fresh process, replay the same commands, verify identical snapshot and ledger hashes. Save/load before advancement preserves future outcomes. Child-process replay reproduces all authoritative hashes.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] CLI `save` command
- [ ] CLI `load` command
- [ ] CLI `replay` command
- [ ] Save/load preserves future outcomes (test)
- [ ] Fresh-process replay reproduces all hashes (test)
- [ ] Replay verification output
- [ ] Tests: save/load cycle, replay identity, child-process determinism
