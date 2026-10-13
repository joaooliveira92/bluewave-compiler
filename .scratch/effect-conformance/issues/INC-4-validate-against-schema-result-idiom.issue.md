# INC-4 — `validateAgainstSchema` uses `Result.isFailure`

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** `validateAgainstSchema` narrows its decode `Result` with
`result._tag === "Failure"` where its sibling boundary helpers use `Result.isFailure`.
Standardise on the idiomatic vendored accessor so the boundary helpers read alike. This
closes ticket 03's F6 nit.

## Acceptance criteria

- [ ] `packages/content-schema/src/schema-validator.ts` narrows the decode result with
      `Result.isFailure` (importing `Result` from `effect`) instead of the raw `_tag`
      comparison; control flow, diagnostic text, and codes are identical.
- [ ] `pnpm --filter @bluewave/content-schema exec vp test run` is green.
- [ ] `pnpm preflight` stays green.

## Notes for implementator

- Purely a consistency/readability change in one function; no behaviour change.
- `Result.isFailure`/`Result.isSuccess` are the idiomatic v4 accessors
  (`vendor/effect/src/Result.ts`); the same idiom is used in the boundary decoders named
  in ticket 03 F1.

## Answer

_(empty)_
