# Wayfinder Map: Effect v4 Adoption

## Destination

Produce the decision + plan to adopt **Effect v4** into Bluewave as a
**full-idiom, package-by-package adoption** — typed errors / structured
failures, Schema-driven validation, async orchestration in the desktop app, and
one monorepo-wide idiom — expanding bottom-up as proven, **including the full
Effect runtime in the authoritative engine core** (the determinism wall is
lifted). The golden-hash / determinism verification spine (DESIGN-08,
`ReplayVerifier`, envelope hashing, cross-process harness) is **demoted from a
hard gate to deprecated machinery**: hash changes are permitted and recorded via
ADR; removing the machinery is a later, separate effort. The map's output is the
adoption plan + ADRs + a handoff spec to the repo's implementation-sprint
machinery. **Plan-only** — this map carries no execution.

Confirmed with the user (2026-08-16): full Effect idiom in the core with the
determinism gate lifted (machinery kept, deprecated, cleanup out of scope);
plan-only posture; all four drivers are live (typed errors, Schema validation,
desktop async orchestration, idiom alignment).

## Notes

- Domain: 1880–1970 naval strategy sim. Monorepo (pnpm 11 + turbo): engine
  packages under `packages/*` are pure (versioned reason-code catalog, deepFreeze
  + envelope records); the DESIGN-08 determinism/golden-hash spine (named RNG
  streams, cross-process determinism) is **deprecated machinery** (ticket 05) —
  still present, no longer a gate; `apps/desktop` is Electron + React 19
  (main/preload/renderer, IPC bridge); `apps/compiler-cli`. Toolchain:
  TypeScript 7.0.2 (native tsgo), module NodeNext, `vp` (vite-plus) for
  lint/format/test, ESM.
- **No Effect anywhere today** — greenfield adoption. Research (ticket 01)
  established the premise correction: **Effect v4 is not stable yet** (RC
  `4.0.0-rc.109`; npm `latest` still v3 `3.22.1`; stable targeted Q3/Q4 2026).
  The **version-line decision is made** (ticket 09): adopt the v4 line, plan
  against v4 API shapes with pinned reference `4.0.0-rc.109`; the
  implementation track starts at stable 4.0.0 (or earlier on the exact pinned
  rc). Code-shape answers across the map use v4 names.
- Constraint documents to consult: the save envelope / ADR-0023 + serializer
  blind spot / ADR-0024 (still governs save-file loadability), the reason-code
  policy (ADR-0020 / B-3 gunnery precedent), and `docs/architecture/*` (command
  model, authoritative state model, validation-normalization-and-repair).
  DESIGN-08 (`docs/architecture/determinism-and-randomness.md`) is consulted as
  **deprecated context only** — its gate is lifted (ticket 05).
- Skills: `/grilling` + `/domain-modeling` for grilling tickets; `/research`
  subagents for research tickets (notes → `docs/research/effect-v4-*.md`);
  consult the `effect-best-practices` skill when a ticket judges Effect code
  shape. Tickets never hand-resolve a decision without the human side of a
  grilling exchange.
- Research notes are written **in place on `dev`** under `docs/research/` (no
  throwaway branch) because the working tree is mid-sprint on the C-2 torpedo
  track; each research ticket carries a context pointer to its note.
- This map is the **planning spine** for a future implementation track — and it
  is now **complete** (all tickets resolved; the route is clear). The plan in
  ticket `08-adoption-sequencing-dod` is handed off as a spec + sprint tickets +
  ADRs by the repo's sprint machinery. This map is plan-only; it carries no
  execution.

## Decisions so far

<!-- one line per closed ticket: title (link) — gist. -->

- [Effect v4 Release Reality](issues/01-effect-v4-release-reality.md) — **resolved.** v4 is a real major but **NOT stable**: `effect@latest` = `3.22.1` (v3, still maintained, no EOL); `rc` = `4.0.0-rc.109`; stable targeted Q3/Q4 2026. v4 = ESM-only, consolidated packages, large API-rename surface (`Either`→`Result`, `Context.Tag`→`Context.Service`), official migration guide exists. Note: `docs/research/effect-v4-release-reality.md`. Which line to adopt is now ticket 09.
- [Toolchain Compatibility](issues/02-toolchain-compatibility.md) — **resolved.** Clean under this repo's exact stack: TS 7.0.2/tsgo + `erasableSyntaxOnly` proven (keep `skipLibCheck: true` — load-bearing), NodeNext+composite works, ESM-only, no vite/electron/vp blockers (but no `effect` in the sandboxed preload). Renderer bundle ~28 kB (core) / 86 kB (realistic set) gzip, BALANCE TARGET. Note: `docs/research/effect-v4-toolchain-compatibility.md`.
- [Incremental Adoption Path](issues/03-incremental-adoption-path.md) — **resolved.** Official gradual adoption is the designed stance and is **architectural** (one boundary-heavy service with Schema first → leaf→orchestration → one `ManagedRuntime` → entrypoints last), not a module ladder. `Schema`/`Data`/`Option`/`Result` standalone-adoptable without the runtime. Zod coexistence rule: Schema = single source of truth, Zod **derived from the Schema AST**, never dual-maintained. Note: `docs/research/effect-v4-incremental-adoption.md`.
- [Runtime Determinism Profile](issues/04-runtime-determinism-profile.md) — **resolved.** Pure/runtime seam is clean (Schema/Data/Option/Result runtime-free; only executing `Effect` engages the runtime). `Random.withSeed` deterministic (ISAAC, no global setSeed); `TestClock` controls the clock. **No documented cross-process guarantee** (empirical only); 5 nondeterminism traps encoded (default Random, live Clock, fiber-ID counters, race/timeout, unordered HashMap/HashSet, op-budget yields). Note: `docs/research/effect-v4-runtime-determinism.md`.
- [Version-Line Choice](issues/09-version-line-choice.md) — **resolved.** Adopt the **v4 line**: planning specs v4 API shapes with pinned reference `4.0.0-rc.109`; the implementation track starts at stable 4.0.0 (Q3/Q4 2026), or earlier on the exact pinned rc if it must move first; the rc→stable bump rides the official migration guide. No v3 line adopted.
- [Engine-Core Effect Policy](issues/05-engine-core-effect-policy.md) — **resolved.** The determinism wall is **lifted**: full Effect idiom (runtime included) is permitted in the authoritative engine core; the golden-hash/determinism verification spine is demoted from a hard gate to deprecated machinery (hash changes permitted, recorded via ADR); the machinery (DESIGN-08, `ReplayVerifier`, envelope hashing, cross-process harness, acceptance registries) stays in place for a later separate cleanup. Research-04 traps become advisory hygiene only. Conflicts with DESIGN-08 (normative) — flagged for a dedicated ADR at handoff.
- [Beachhead Selection](issues/06-beachhead-selection.md) — **resolved.** The beachhead is **`@bluewave/persistence`** with the **full on-ramp bar**: one boundary-heavy service re-implemented with Effect (tagged errors replace throw + `DiagnosticCollector`; Effect Schema validates the save boundary per `SAVE-MANIFEST.md`); save files round-trip loadably (empirically proving Effect values survive `canonicalSerialize` — absorbs the serializer fog); cancellation/rollback preserved; `PERSISTENCE_*` codes survive as tagged errors; public `SaveStore` API compatible; tests green.
- [Schema vs Zod Policy](issues/07-schema-vs-zod-policy.md) — **resolved.** **Replace entirely, boundary-by-boundary**: Effect Schema becomes the single validator at all three boundaries — persistence/save (beachhead, first), desktop IPC (command/save schemas), then `content-schema` pack schemas (last). Each boundary migrates in place (Zod is validation-only here, no derivation bridge needed, never dual-maintained); the root `zod` devDependency is removed when `content-schema` finishes.
- [Adoption Sequencing & Definition of Done](issues/08-adoption-sequencing-dod.md) — **resolved.** The **plan**: service-first with stable facades — Phase 0 foundations (pin, lint gate, `skipLibCheck`) → Phase 1 beachhead (`persistence`) → Phase 2 boundary services (`content-schema`, desktop IPC, `diagnostics`) → Phase 3 foundation bottom-up (`contracts`→`deterministic`→`random`→`events`) → Phase 4 core bottom-up (`campaign`→`commands`→`content-compiler`→`phase-engine`→`combat`→`campaign-engine`→`ai`) → Phase 5 unification (one `ManagedRuntime`, entrypoints last). **DoD** (strict): tagged errors, Schema at boundaries, Effect for async, `effect-best-practices` lint gate, tests green, hash-output changes ADR-noted. **Verification**: harness keeps running; golden drift recorded via ADR, never a blocker. Handoff = spec + frontier-ordered sprint tickets + ADRs (incl. DESIGN-08 demotion record). **The map's route is clear — this is the last ticket.**

## Not yet specified

Fog is exhausted — the map is complete (ticket 08 charts every remaining
decision into phases). These items remain as **implementation-track concerns
owned by the named phases**, not map-level decisions:

- Whether `@bluewave/random`'s hand-rolled PRNG is replaced by Effect `Random` —
  owned by Phase 3's ticket.
- Error-model transition: mapping Effect typed failures onto the versioned
  reason-code catalog; whether the `DiagnosticCollector` contract is replaced —
  owned by Phases 1–2.
- Desktop renderer bundle-size / React-interop implications — owned by Phases 2
  and 5 (toolchain facts in ticket 02).

## Out of scope

- **Removing/redesigning the determinism verification machinery** (DESIGN-08,
  `ReplayVerifier`, envelope hashing, cross-process harness, m1/m2 acceptance
  registries) — demoted to deprecated by ticket 05, but its removal is a
  later, separate effort, not this map's route.
- UI-framework migration of the React renderer (Effect-React / effect-atom
  adoption).
- Content-pack YAML format or schema changes.
- A standalone Zod upgrade independent of the Schema-vs-Zod decision.