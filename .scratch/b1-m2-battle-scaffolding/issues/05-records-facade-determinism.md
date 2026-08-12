---
Type: task
Status: resolved
Blocked by: 04
---

# B-1 / 05 — Records, reason codes, BattleGenerator facade, determinism proof

## Question

`BattleGenerationRecord`, 24 (§37) + 17 (§26) reason codes, facade, cross-process
proof.

## Answer

Per spec INC-5: pure `generateBattles` entry + `BattleGenerator` facade + stage
records for all 15 stages; export reason codes; extend the cross-process
determinism child to include a generation scenario (byte-identical diff).
