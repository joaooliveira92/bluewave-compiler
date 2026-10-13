# ADR-0155: Excess-key strictness is per-schema parity, not one boundary-wide policy constant

## Status

Accepted (2026-10-13). Records the position settled by effect-conformance ticket 04
(`.scratch/effect-conformance/issues/04-schema-struct-excess-key-contradiction.md`) and the
withdrawal of ticket 03's F5 remedy; no code change.

## Context

ADR-0102 §4, ADR-0104 §3 and ADR-0105 §2 state the rule of record: in the vendored
`effect@4.0.2`, `Schema.Struct` **strips** unmodeled keys on decode by default
(`onExcessProperty: "ignore"`, matching a non-strict `z.object`); strict rejection needs
the decode option `{ onExcessProperty: "error" }`. Ticket 01 corrected the false
"`Struct` is closed by default" rule across `agent-patterns/effect-idioms.md`,
`ADR-0102 §4` and `RULES.md`.

Ticket 03 (Result + decode-at-boundary conformance) reported a finding **F5**: that the
authored tree decoded some boundaries strictly and others with the strip default, and
proposed the remedy "align every boundary decoder to one policy constant". Ticket 04
settled the underlying behaviour with an executable probe against the vendored artifact
(`.scratch/effect-conformance/probe/excess-key-probe.mjs`, 6/6; durable write-up
`docs/research/effect-conformance-04-schema-struct-excess-key.md`) and **withdrew F5**:
the split is faithful pre-migration parity, not a divergence. Because `RULES.md` requires
a compatibility-binding decision to take an ADR, the withdrawn remedy and the position
that replaces it are recorded here.

## Decision

1. **The mechanism is settled.** `Schema.Struct` strips excess keys (string and symbol)
   by default; `{ onExcessProperty: "error" }` rejects them; the JSON-Schema emission
   default is likewise open (`additionalProperties: true`). Authority is the vendored,
   byte-identical `effect@4.0.2` (`vendor/effect/src/SchemaAST.ts:490,526-539,3006,3015-3045`,
   `vendor/effect/src/Schema.ts:16233,16324`) confirmed by the probe and the upstream test
   `repos/effect/packages/effect/test/schema/Schema.test.ts:637-678`.
2. **Excess-key strictness is chosen per schema, mirroring Zod parity.** A boundary that
   was `.strict()` pre-migration passes `{ onExcessProperty: "error" }`; a boundary that
   was an open `z.object` takes the strip default. Concretely:
   - `packages/combat/src/air-defense/*` were `.strict()` (migrated at `5df46569`) and
     decode with the option;
   - `packages/combat/src/{air-combat,aircraft,carrier-operations}/contracts.ts` were open
     `z.object` — 0 `.strict()` at `5df46569^` — and take the strip default;
   - the desktop main-process IPC boundary (`campaignBridge.ts` +
     `campaignCommandSchemas.ts`) was open `z.object` — 0 `.strict()` at `0c7370d4^` (the
     IPC migration commit) — so `withSchema` strips and only `withStrictSchema` (used
     solely for `placeForeignConstructionCommand`) rejects.
   `@bluewave/content-schema` is the deliberate exception: its boundaries decode strictly
   under one centralized helper (`{ onExcessProperty: "error" }`, ADR-0105 §3), a
   fail-closed strengthening recorded there.
3. **Unifying every boundary on one policy constant is rejected.** It would break parity:
   a strict constant would weaken nothing but a strip-by-default constant would newly
   admit at formerly-open boundaries, and applying `"error"` everywhere would newly reject
   at formerly-open ones. The lever is per-schema parity, documented at each site.

## Consequences

- Wire compatibility is preserved by per-schema parity, not by a boundary-wide constant;
  a boundary that must reject states it, and a boundary that strips states that.
- The behaviour is test-locked in the authored tree, so no new ratchet gate is needed
  (recorded in `.scratch/effect-conformance/map.md`): `packages/persistence/test/schema-serialization.test.ts`
  locks the strip default; `packages/content-schema/test/parity.test.ts` and
  `packages/combat/test/air-defense/*` lock `onExcessProperty: "error"` rejection; and a
  focused mechanism test pins the raw option (string and symbol keys, open JSON-Schema
  default) independently of the docs.

## Alternatives considered

- **One boundary-wide policy constant (ticket 03 F5).** Withdrawn: it would trade faithful
  pre-migration parity for uniformity. See §3.
- **Rely on the strip default everywhere.** Rejected: it would silently drop excess keys
  at boundaries that were `.strict()` (ADR-0105 §Alternatives).
- **Pass `{ onExcessProperty: "error" }` everywhere.** Rejected: it would newly reject at
  boundaries that were open `z.object`, changing accepted wire input.

## Related

- ADR-0102 (replace Zod with Effect Schema), ADR-0104 §3 (`persistence` beachhead — strip
  default), ADR-0105 §2/§3 (`content-schema` — strict policy), ADR-0106 (ratchet gates).
- `docs/research/effect-conformance-04-schema-struct-excess-key.md`,
  `.scratch/effect-conformance/issues/04-schema-struct-excess-key-contradiction.md`.
