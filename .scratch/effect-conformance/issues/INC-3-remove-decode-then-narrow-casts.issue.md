# INC-3 — Remove the residual decode-then-narrow casts

**Type:** implementation
**Status:** open
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

_(empty)_
