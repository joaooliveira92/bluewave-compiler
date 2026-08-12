# M1 Capability Registry and Acceptance Evidence

> Governed by DESIGN-55 §7 (Capability Registry), §8 (Readiness State), §9
> (Acceptance Contract), §10 (Acceptance Evidence). Durable form of the A-5 gate.
> Sign-off: `M1_STRATEGIC_CAMPAIGN_KERNEL` **COMPLETED** (DESIGN-55 §23) at commit
> `A-5-gate` on branch `dev` (2026-08-12), with the deployment limitation recorded
> in ADR-0011.

## Acceptance predicate (DESIGN-55 §9)

For the whole milestone the validate run evidences:

- **Contracts resolved:** no `OPEN DECISION` marker remains in any canonical doc
  (verified: `rg -i "open decision" docs/` returns only this registry/audit
  policy text, not a live marker; residual M1 ambiguities are closed by
  ADR-0001–0011 and the sprint reports below).
- **Implementation at required boundaries:** B0–B10d landed all ten scoped M1
  capability families across `@bluewave/*` + `compiler-cli` + `desktop`.
- **Tests:** full suite `410 passed`, `40/41` files green (the sole failure is the
  pre-existing, separately-tracked broken import in
  `content-schema/test/nation.test.ts`; not M1-scoped, see note).
- **Auto-resolution:** `@bluewave/combat` + `@bluewave/ai` provide the strategic
  deterministic auto-resolution path.
- **Packaged smoke:** desktop `runCompilation` + production-pack test; packaged
  smoke framework itself is deferred to REL-1 (recorded, not claimed).
- **Save/replay/hashes:** `@bluewave/persistence` save/load + replay verifier +
  `scripts/verify-golden-hashes.cjs` (8/8 match).
- **Determinism:** two independent child-process runs byte-identical; golden
  unchanged by the A-5 no-code gate.
- **Content validation:** production-pack test locks `content/production/1880`.

## Registry

Each capability lists: readiness state, implementing packages, governing design
docs, primary test suites, and acceptance evidence.

| §2 capability | State | Implementing packages | Governing docs | Primary tests | Evidence |
|---|---|---|---|---|---|
| Campaign compiler | ACCEPTED | `@bluewave/content-compiler`, `@bluewave/content-schema`, `compiler-cli` | DESIGN-05, 09 | `content-compiler/test` | B0–B8; compile suite green |
| Nations and world | ACCEPTED | `@bluewave/campaign`, `@bluewave/content-schema` | DESIGN-04, 12, 14, 15 | `campaign/test/{scenario,state,continuity}` | B0–B8 |
| Economy | ACCEPTED | `@bluewave/phase-engine`, `@bluewave/campaign` | DESIGN-13 | `phase-engine/test/economy.test.ts` | B10a, `.ai/reports/a2-b10a-acceptance.md` |
| Research | ACCEPTED | `@bluewave/campaign`, `@bluewave/phase-engine`, `@bluewave/content-schema` | DESIGN-20 | `phase-engine/test/research-design.test.ts`, `campaign/test/technologyVariation.test.ts` | B10b, `.ai/reports/a0-b10b-acceptance.md` |
| Ship design and construction | ACCEPTED | `@bluewave/content-schema` (design), `@bluewave/campaign`, `@bluewave/phase-engine` | DESIGN-21, 22, 23 | `content-schema/test/research-design.test.ts`, `phase-engine/test/economy.test.ts` | B10a + B10b |
| Deployment | `CONTENT_ONLY` (deferred) | — (none) | DESIGN-25 | — | ADR-0011; deferred to REL-1 strategic-logistics track |
| Diplomacy | ACCEPTED | `@bluewave/campaign`, `@bluewave/commands`, `@bluewave/phase-engine` | DESIGN-17 | `phase-engine/test/diplomacy-war.test.ts` | B10c, `.ai/reports/a3-b10c-diplomacy-war.md` |
| War and peace | ACCEPTED | `@bluewave/campaign` (warConstants), `@bluewave/phase-engine` | DESIGN-31, 32 | `phase-engine/test/diplomacy-war.test.ts` | B10c |
| Monthly phase pipeline | ACCEPTED | `@bluewave/phase-engine` (registry/month/engine) | DESIGN-10, 11 | `phase-engine/test/{phase-engine,month,integration}` | B0–B8 |
| Save/load/replay/hashes | ACCEPTED | `@bluewave/persistence`, `@bluewave/deterministic`, `@bluewave/phase-engine` (replay) | DESIGN-52, 06, 08 | `persistence/test`, `deterministic/test`, `phase-engine/test` | B0–B8; 8/8 golden |
| Deterministic auto-resolution | ACCEPTED | `@bluewave/combat`, `@bluewave/ai` | DESIGN-08, 49, 50, 54 | `combat/test`, `ai/test/ai.test.ts`, `phase-engine/test/ai-scenario.test.ts` | B0–B8 (combat) + B10d, `.ai/reports/a4-b10d-ai-scenario.md` |

## Pre-existing, non-blocking, separately-tracked defects

- `content-schema/test/nation.test.ts` — broken import
  (`../../../content/research/nations/1880/index.ts`, deleted on `main` in
  `2b3d925`). Canonical nation-corpus-home decision; repair deferred to the owner
  at final validation per SPRINT-PLAN. Does not affect M1 capability acceptance
  (schema package's other suites pass).
- B9 live-GUI headless limitation recorded in `.ai/reports/a1-b9-acceptance.md`.

## Sign-off

`M1_STRATEGIC_CAMPAIGN_KERNEL`: **COMPLETED** (scoped closure per ADR-0011).

- Acceptance authority: autonomous engineering agent (A-5 gate).
- Evidence hash: see `.ai/reports/a5-m1-acceptance-gate.md`.
