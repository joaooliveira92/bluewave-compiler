# 08 — Save, load, and replay

**What to build:** CLI commands for save, load, and replay. Save after the closing snapshot, load into a fresh process, replay the same commands, verify identical snapshot and ledger hashes. Save/load before advancement preserves future outcomes. Child-process replay reproduces all authoritative hashes.

**Blocked by:** 06, 07

**Status:** resolved

- [x] CLI `campaign:save` command
- [x] CLI `campaign:load` command
- [x] CLI `replay` command
- [x] Save/load preserves future outcomes (test)
- [x] Fresh-process replay reproduces all hashes (test)
- [x] Replay verification output
- [x] Tests: save/load cycle, replay identity, child-process determinism

## Answer

Implemented `ReplayVerifier` in phase-engine, CLI commands (campaign:compile, campaign:save, campaign:load, turn:execute, replay) in compiler-cli. 5 CLI tests pass covering replay match, mismatch detection, and determinism.
