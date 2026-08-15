Type: task
Status: resolved

Blocked by: 01

## Question

Add a `battle:advance-minute` command to `apps/compiler-cli` that runs one
`advanceMinute` call (from `packages/combat/src/simulation/engine.ts`)
against a hand-authored `TacticalBattleState` JSON input — the tactical
minute-advance engine (movement, propulsion, collision stub, spotting) has
no CLI reach at all today.

Design and implement:

- Input: a JSON file path (e.g. `--state <path>`) matching
  `AdvanceMinuteInput`'s `state: TacticalBattleState` field, plus `minute`,
  `observationTime`, and optional `orders`/`attackRangeUm`/`engine` as CLI
  flags or additional JSON fields — settle the exact split between "goes in
  the state file" and "goes on the command line" as part of this ticket, and
  document it in `--help`. There is no fixture builder for
  `TacticalBattleState` in `packages/combat/test/` (only inline construction
  in tests) — v1 requires the user to hand-author this JSON; document the
  expected shape clearly in `--help` output since there's no scaffolding to
  point at.
- Output (human + `--json`): print the `MinuteResult` — `minute`,
  `movementStates`, `contacts`, `events` (the `BattleEvent[]`), and
  `minuteHash`. Human mode should be readable (e.g. one line per unit/event)
  rather than a raw object dump; `--json` emits the structured result
  verbatim.
- Error handling: use the adapter from ticket 01 for any `BluewaveError`.
- Wire into `main.ts` following the existing command-registration pattern.
- Add CLI-level tests with a small hand-built `TacticalBattleState` fixture
  inline in the test file (mirroring how `packages/combat/test/simulation/`
  constructs one), covering both a successful minute-advance and at least
  one error path through the ticket-01 adapter.

## Answer

Implemented `runBattleAdvanceMinute` in `apps/compiler-cli/src/commands.ts`,
wired into `main.ts` as `battle:advance-minute`, exported from `index.ts`.

- **Split decided**: `--state <path>` (required) points at a JSON file with
  shape `{ state: TacticalBattleState, orders?: Record<assetId, UnitOrders>,
  attackRangeUm?: number }` — `orders` is a keyed map and `attackRangeUm` is
  conceptually part of the scenario, so both live in the file alongside
  `state`. `minute` (`--minute`, default 1) and `observationTime`
  (`--observation-time`, default `"1900-01-01T00:00:00.000Z"`) are simple
  scalars and live as CLI flags so the same state file can be re-run at
  different minutes without editing it. `engine`/`gunnery` are **not**
  supported in v1 — `advanceMinute` only invokes gunnery when a non-empty
  `gunnery` battery array is supplied, so omitting both keeps this command
  strictly to movement/spotting (steps 4-8), matching the map's scope
  (gunnery is ticket 04's dedicated `gunnery:resolve-shot`).
- **Fixture note**: no builder exists for `TacticalBattleState` anywhere in
  the repo (confirmed — only inline test construction). `--help` documents
  the JSON shape and points at
  `packages/combat/src/tactical/state.ts` and
  `packages/combat/test/simulation/advance.test.ts` as the reference,
  per the map's "hand-authored JSON for v1" decision.
- **Output**: human mode prints minute hash, one line per unit's resolved
  position/heading/speed, spotted contacts, and the event list in order;
  `--json` emits `MinuteResult` verbatim.
- **Errors**: routed through ticket 01's `runCombatOperation`/
  `reportBluewaveError` adapter. Missing/unreadable/malformed `--state` is a
  `usage-error` (mirrors `buildInput`'s existing usage-error convention in
  `commands.ts`), not routed through the combat adapter since it never
  reaches combat code.
- **Tests**: `apps/compiler-cli/test/battleAdvanceMinute.test.ts` — a
  two-unit fixture (no combat mocking; `advanceMinute` runs for real).
  Covers: missing `--state` flag, nonexistent file, invalid JSON (all
  usage-error), a successful minute-advance in both human and `--json`
  modes, `orders`/`attackRangeUm` flowing through from the file, and a real
  `BluewaveError` (`TACTICAL_STATE_INVARIANT_FAILED`, triggered by an
  intentionally non-integer `MovementState.position`) confirmed to surface
  as `validation-error` with the code visible in printed diagnostics —
  exercising the ticket-01 adapter against a genuine combat-thrown error,
  not a synthetic one. Also verified end-to-end through the compiled
  `dist/main.js` binary with a hand-written JSON state file, confirming a
  unit under `orderedSpeedBp`/`orderedHeading` orders actually moved while
  an unordered unit stayed put, and both were mutually spotted as contacts.

Full `compiler-cli` suite (80 tests across 6 files), typecheck, and lint all
pass.
