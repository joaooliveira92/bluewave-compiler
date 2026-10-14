# INC-3 — Remove the residual decode-then-narrow casts

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** Six sites decode untrusted input with an Effect `Schema` and then
narrow the *successfully decoded* value with `as T` (sometimes `as unknown as T`) to
reach the domain's nominal type. The decode is honest, so these are not boundary-trust
breaches — but the cast after a decode can silently drift from the schema. Remove the
cast where the schema can carry the nominal type, and record a one-line accept where the
only mismatch is `exactOptionalPropertyTypes` noise. This closes ticket 03's F4 residual
and keeps the decode-at-boundary guarantee from eroding.

## Acceptance criteria

- [ ] Each of these six sites is resolved to either **(a)** no cast — the schema's output
      *is* the nominal type — or **(b)** a recorded accept with a one-line reason in
      place:
      - `apps/desktop/src/main/monthInput.ts` (the `Result.isSuccess` narrowing)
      - `apps/desktop/src/main/pendingCommands.ts` (the decode narrowing)
      - `packages/persistence/src/store.ts` (the `as unknown as StorableCampaignSnapshot`)
      - `packages/combat/src/air-defense/air-defense-system-definition.ts`
      - `packages/combat/src/air-defense/attack.ts` (`return result.success as AirDefenseAttack`)
      - `apps/desktop/src/main/campaignBridge.ts`
- [ ] No new `as unknown as` is introduced to silence a type error; if a nominal type is
      warranted, it is added at the schema seam (brand/annotation), not at the call site.
- [ ] Excess-key policies are unchanged (the strict/strip split is deliberate, ADR-0155).
- [ ] Malformed input still fails closed at every site (the existing decode/boundary tests
      are the regression guard and must stay green); `scripts/assert-boundary-decode.mjs`
      is green.
- [ ] `pnpm preflight` stays green; no golden/hash change.

## Notes for implementator

- These are `Schema.decodeUnknownResult(...)` successes being asserted to a domain type,
  not `JSON.parse` trusts — do not "fix" them by re-decoding with a parallel schema.
- Where the cast exists only because `exactOptionalPropertyTypes` differs between the
  schema's inferred type and the interface, an in-place accept is the correct outcome.
- `store.ts:447` already goes through `fromStorableSnapshot`; check whether exporting/using
  the schema's output type removes the double cast.

## Answer

Resolved. One of the six sites **removed the call-site cast** by carrying the
nominal type at the schema seam; the other five are **recorded accepts** (the
schema is deliberately looser than the domain type — a nominal brand, an
optional/defaultable field, or a trust-class shape — so the decode genuinely
cannot produce the nominal type without re-modeling it).

**Removed (option a — the schema's output *is* the nominal type):**

- `packages/combat/src/air-defense/attack.ts` — `safeIntSchema` now returns
  `Schema.Codec<SafeInt, number>` (a documented seam **annotation**, not a
  `Schema.brand`: Effect's `Schema.brand` mints `Brand.Brand<"SafeInt">`, a
  `[BrandTypeId]` symbol, not `@bluewave/contracts`' `{ readonly __brand }`), so
  `validateAirDefenseAttack` returns `result.success` with no call-site cast.
  `Encoded` stays `number` and every verbatim filter message is unchanged.

**Recorded accepts (option b — the decoded type is genuinely wider):**

- `packages/combat/src/air-defense/air-defense-system-definition.ts` — the
  schema marks the defaultable fields (`baseKillBp` … `saturationGroup`)
  `Schema.optional` (`createAirDefenseSystemDefinition` fills them before
  validating) while the interface is total; the call-site cast is kept with the
  reason in place.
- `apps/desktop/src/main/monthInput.ts` — the schema models the trust-class array
  elements as `Record<string, unknown>`; the engine re-validates every envelope
  when the month replays.
- `apps/desktop/src/main/pendingCommands.ts` — `StoredQueueSchema` models the
  envelope as `Record<string, unknown>`; the engine re-validates every restored
  envelope at drain.
- `packages/persistence/src/store.ts` — `StorableSnapshotSchema` validates the
  container shape only (`schemas.ts` NOTE); deep value-fidelity is enforced by
  the envelope + `rawHash` checks, and `fromStorableSnapshot` reads the shape
  `toStorableSnapshot` wrote.
- `apps/desktop/src/main/campaignBridge.ts` — the boundary schema only asserts
  `scriptedOrders` is an array of unknown (a debug-gated seam); the renderer
  builds the concrete `RawScriptedForceOrder[]`.

No new `as unknown as` was introduced; excess-key policies are unchanged; the
existing decode/boundary tests stay green; `scripts/assert-boundary-decode.mjs`
green. Commands: `pnpm --filter @bluewave/combat exec vp test run` green (3799
tests); `pnpm --filter @bluewave/persistence exec vp test run` green;
`pnpm --filter @bluewave/desktop exec vp test run src/main/` green;
`pnpm preflight` green. No golden/hash change.

Closes ticket 03's `F-03-4` residual.
