# INC-1 — Diplomacy projection + `inspectDiplomacyScreen`

**Type:** task
**Status:** resolved
**Blocked by:**

## What to build

`packages/campaign-engine/src/diplomacy.ts` — `DiplomacyScreenProjection` +
`buildDiplomacyScreenProjection(state, playerSlotId, month)` derived one-to-one
from the compiled snapshot:

- `knownNations`: `{ nationId, name }` for every OTHER nation (id+name from
  `snapshot.nations`; sorted by id).
- `relations`: for pairs involving the player —
  `{ nationAId, nationBId, relation, tension, nap, since }` (from
  `politics.relations`); include the player-facing view field +
  `partnerNationId`/`partnerName`.
- `wars`: wars where the player is a member on either side —
  `{ warId, attackerSideMembers, defenderSideMembers, attackerWarScore,
  defenderWarScore, status, startDate, endDate? }` (+ `playerSide`).
- `blockades`: entries where the player is blockader OR blockaded —
  `{ blockaderId, blockadedNationId, areaId, establishedMonth }`.

Contract `apps/desktop/src/shared/diplomacy-contract.ts` mirroring the shape +
revision/month extension. Handler `inspectDiplomacyScreen(sessionId)` in
`apps/desktop/src/main/commands/diplomacyCommands.ts` (SESSION_NOT_FOUND /
UNKNOWN_PLAYER_SLOT conventions). Wire bridge + name + overload + canary.

## Acceptance (spec AC-1)

- Projection for a compiled production campaign renders real known nations /
  relations / wars / blockades from the snapshot.
- Bridge returns SESSION_NOT_FOUND for unknown session.

## Validation

`pnpm -w turbo run typecheck build --filter=@bluewave/campaign-engine
--filter=@bluewave/desktop` then focused desktop tests.