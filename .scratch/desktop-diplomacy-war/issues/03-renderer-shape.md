- **Type:** decision
- **Status:** resolved
- **Blocked by:** 02

# 03 — Diplomacy renderer shape

**Resolution — RENDERER (adopted):**

- **Relations card**: rows per known nation (all other nations in the
  snapshot). Columns: nation name, relation label (Neutral / Allied / War /
  Trade agreement), tension (0..10), NAP badge, since month. Per-row action
  controls showing only the commands the engine would accept **given the
  CURRENT projected relation/war state** (derive from the projection, not a
  duplicate of engine validators — the projection reports relation+war state;
  enable/disable follows simple state derived in the reducer, and the engine
  remains the authority at issue time via `CommandLifecycle.validate`).
- **Wars card**: active + ended wars involving the player: war id, sides,
  member ids, attacker/defender war scores, status, start/end; AcceptPeace
  action on ACTIVE wars the player is in (disabled otherwise).
- **Blockades card**: blockader→blockaded in area, established month. To offer
  a real `DeclareBlockade` area picker, the projection also carries an
  `areas` list (id + name, from `world.areas`) — honest, one-to-one data
  required for a valid `areaId` the player can't invent. Recorded as a
  decision (INC-3 traceability; spec D4 was extended by reference).
- **Honest copy**: every submit shows "applies by the engine on the next turn
  advance"; a rejected command surfaces the engine's code + message.
- Empty states are honest ("no wars yet", "no blockades"), never fabricated.

**Status: resolved.**