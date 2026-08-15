Type: grilling
Status: resolved
Blocked by: 07

## Question

Design the construction and fleet contracts (`shared/construction-contract.ts`,
`shared/fleet-contract.ts`, neither exists), covering:

- **Construction**: `inspectConstructionScreen` (query) and
  `submitConstructionCommand` (issue a new-ship-build order — in scope per
  ticket 01's decision that construction-order issuing is needed for MVP
  player agency). Decide whether `replaceConstructionCommand` and
  `cancelConstructionCommand` are needed for MVP or can stay unimplemented
  stubs — ground the call in `useConstructionScreen.ts`'s
  `command-screen-workflow.ts`-based submit/replace/cancel pattern and
  `construction-screen-state.ts`'s expected shape.

- **Fleet**: `inspectFleetScreen` (query, read-only for MVP —
  `submitMovementCommand`/`replaceMovementCommand`/`cancelMovementCommand`
  are deferred per this map's destination, which excludes tactical/fleet-
  movement play). Ground the query result in `fleet-screen-state.ts` and
  `MovementCommandsTable.tsx`'s read-only rendering needs only.

Both screens use the same `command-screen-workflow.ts` submit/replace/cancel
pattern with `expectedRevision`/`transportRequestId` (optimistic-concurrency
shape) — decide whether that pattern is real (needs full command-lifecycle
semantics from `@bluewave/campaign`'s division/command primitives) or can be
simplified for construction's MVP-only `submit` path.

## Answer

**The optimistic-concurrency pattern is real — `packages/commands` already
implements exactly what it needs.** No simplification: `expectedRevision`/
`transportRequestId` map directly onto that package's existing
`CommandRegistry`/`CommandRecord`/`IdempotencyScope`/reservation-settlement
model (`registry.ts`, `reservation.ts`, `settlement.ts`, `lifecycle.ts`).
This is the same machinery ticket 05's test already exercised successfully
(a real `budget_project` command against a real construction project).
Consistent with tickets 08/09: the heavy lifting already exists in the
engine packages, the bridge mostly wires UI intent through it.

**Construction** (in MVP scope, per ticket 01's decision):

```ts
interface ConstructionScreenProjection {
  readonly revision: number;
  readonly designs: readonly { designId: string /* ...design catalog fields */ }[];
  readonly constructionProjects: readonly ConstructionProject[]; // @bluewave/campaign's real type
}
// submitConstructionCommand payload, grounded in useConstructionScreen.ts's submit():
interface SubmitConstructionCommandPayload {
  readonly sessionId: string;
  readonly designId: string;
  readonly expectedRevision: number;
  readonly transportRequestId: string;
}
```

`replaceConstructionCommand`/`cancelConstructionCommand` use the same
payload shape plus `commandId` (the in-flight command being replaced/
cancelled) — implemented for real, not stubbed, since they're cheap
extensions of the same `submitConstructionCommand` → `CommandRegistry` path
and the UI already calls them unconditionally.

**Fleet** (read-only for MVP, per this map's destination excluding
fleet-movement/tactical play):

```ts
interface FleetScreenProjection {
  readonly revision: number;
  readonly month: { readonly month: number; readonly year: number };
  readonly playerNationId: string;
  readonly divisions: readonly PermanentDivision[]; // @bluewave/campaign's real type
  readonly areas: readonly unknown[];
  readonly areaEdges: readonly unknown[];
  readonly ports: readonly { capacity: number }[]; // ticket 07's Port shape
  readonly movementCommands: readonly unknown[]; // rendered read-only, never submitted
}
```

`submitMovementCommand`/`replaceMovementCommand`/`cancelMovementCommand`
stay unimplemented stubs for MVP — same treatment as ticket 09's deferred
battle commands.
