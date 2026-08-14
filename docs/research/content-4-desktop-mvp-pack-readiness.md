# Research: Desktop MVP — `content/production/1880/` Pack Readiness

Answers `.scratch/desktop-mvp/issues/02-content-pack-mvp-readiness.md`: does the
canonical production pack contain enough content to compile and run the MVP
critical-path loop (new game → overview → advance ≥1 strategic month →
fleet/construction visibility → save/load) without missing-content errors?

**Bottom line: ready with caveats.** The pack compiles cleanly today (proven by
an existing test) and has full nation/fleet/economy/research/construction
coverage for its 14 authored nations. It is **not** proven end-to-end against
the MVP loop — no test in the repo runs "compile this pack → advance a month →
save/load" together — and it has one explicit, already-documented content gap
(ship→design linkage) plus several nation-level thin spots that would surface
as a visibly empty/under-detailed UI for specific nation choices, not as a
compile error.

## 1. What `content/production/1880/` actually contains

`content/production/1880/pack.json` (`type: "production"`, version `0.3.0`)
enumerates 12 collections, each backed by exactly one file — no `diplomacy`
key is present in the manifest at all (`content/production/1880/pack.json:5-18`).

| File | Lines | Records | Notes |
| --- | --- | --- | --- |
| `countries.yaml` | 1623 | **14 nations** | `content/production/1880/countries.yaml:1-1623` — ids at lines 1, 129, 247, 361, 474, 589, 698, 811, 925, 1032, 1149, 1272, 1390, 1507: uk, germany, usa, japan, france, italy, russia, austria_hungary, spain, qing, ottoman_empire, netherlands, portugal, brazil. 10 marked `isPlayable: true` (uk, germany, usa, japan, france, italy, russia, austria_hungary, spain, qing); 4 AI-only (ottoman_empire, netherlands, portugal, brazil). |
| `areas.yaml` | 302 | world geography | Sampled — referenced fleet `locationAreaId`s (e.g. `eng_home_coast`, `med_malta`, `africa_cape`) resolve (`content/production/1880/areas.yaml:1-40`). |
| `routes.yaml` | 165 | sea/land adjacency | present |
| `possessions.yaml` | 186 | territorial control | present |
| `ports.yaml` | 292 | ports/levels | present |
| `technologies.yaml` | 741 | **84 tech entries** (`grep -c '^- id:'`) | present |
| `fleets.yaml` | 355 | **19 ships** across nations' fleets | `content/production/1880/fleets.yaml:1-356`. All 14 nations have at least one fleet record; 3 nations (netherlands ×2, portugal, brazil) have fleets with `ships: []` (empty). |
| `economies.yaml` | 14 | 14 rows, one per nation | `content/production/1880/economies.yaml:1-14` — full 1:1 coverage of all 14 nations. |
| `constructions.yaml` | 90 | **9 construction projects** | `content/production/1880/constructions.yaml:1-91` — covers only 8 of 14 nations (uk, france ×2, germany, russia, austria_hungary, italy, usa, qing); 6 nations (japan, ottoman_empire, spain, netherlands, portugal, brazil) have zero construction projects authored. Not an error (empty is valid), just thin. |
| `research.yaml` | 106 | 14 rows, one per nation | `content/production/1880/research.yaml:1-107` — full 1:1 coverage; the 5 least-developed nations (ottoman_empire, spain, netherlands, portugal, brazil) have `technologies: []`. |
| `designs.yaml` | 629 | **37 design templates** | `content/production/1880/designs.yaml:1-629` — covers 9 of 14 nations (uk, france, germany, russia, italy, austria_hungary, usa, japan, qing). **5 nations have zero designs**, including the playable nation **spain** (`grep nationId: "spain" designs.yaml` → no matches). Spain is also absent from `constructions.yaml`. |
| `rulesets.yaml` | 3 | 1 ruleset | present |

## 2. What a campaign compile minimally requires

Two compilers run in sequence (`packages/campaign/src/compiler.ts:115-277`,
`CampaignCompiler.compile`):

1. **Content compiler** (`packages/content-compiler/src/compiler.ts`) validates
   rulesets/countries/areas/routes/possessions/ports/technologies against
   `packages/content-schema` (e.g. `NationSchema` in
   `packages/content-schema/src/nation.ts:428-457`, strict Zod schema requiring
   `id` to be one of 24 canonical `NationIdSchema` values —
   `packages/content-schema/src/nation.ts:7-32` — plus identity/regime/economy/
   doctrine/AI sub-objects).
2. **Campaign compiler** layers fleets/economies/constructions/diplomacy/
   research/designs on top (`packages/campaign/src/compiler.ts:160-240`).
   - Requires at least one nation or fails with `CAMPAIGN` error "No nations
     found in content pack" (`packages/campaign/src/compiler.ts:413-418`).
   - Requires each nation to carry a boolean `isPlayable` or fails with
     `CAMPAIGN-ISPLAYABLE` (`packages/campaign/src/compiler.ts:304-319`).
   - Validates any ship carrying a `designVersionId` resolves to a known
     design, else fails with `CAMPAIGN-DESIGN` (`packages/campaign/src/compiler.ts:224-240`)
     — but this check is a no-op if ships simply omit `designVersionId`
     (see §3 below).
   - `designFiles` are validated per-record against
     `DesignTemplateSchema` (`packages/content-schema/src/design.ts:9-23`);
     invalid records are skipped rather than hard-failing compile.
   - Diplomacy pairs are auto-filled to `neutral` for any nation pair not
     explicitly authored (`packages/campaign/src/compiler.ts:629-654`), which is
     why the pack's missing `diplomacy` manifest key is not a compile blocker.
   - Economy defaults (`treasury: 500, income: 100, expenses: 50`) apply per
     nation if no economy row matches (`packages/campaign/src/compiler.ts:381-392`)
     — moot here since `economies.yaml` covers all 14 nations.

**Cross-reference against the pack:** every required minimum (≥1 nation,
`isPlayable` present on all nations, valid design records) is met. Nothing in
`content/production/1880/` would trip a hard compiler error under this logic.

## 3. The one already-documented, tested gap: ship→design linkage

`apps/desktop/test/production-promotion.test.ts:102-157` — test
`"reports the ship->design linkage gap explicitly rather than fabricating it"`
— explicitly asserts `unlinked === totalShips`, i.e. **100% of the pack's 19
ships lack a `designVersionId`** (confirmed independently: no
`designVersionId` key exists anywhere in `content/production/1880/fleets.yaml`).
The test's own comment (`apps/desktop/test/production-promotion.test.ts:13-19`)
states this is "a deferred CONTENT-track item" tracked as "a B-1 sprint note,
not silently dropped."

Practical effect for the MVP's Fleet/Construction screen: each `Ship` record
in `fleets.yaml` *does* carry directly-authored abstracted stats
(`hitPoints`, `speed`, `firepower`, `armor`, `classId` as a display name —
e.g. `content/production/1880/fleets.yaml:6-18`), so a fleet list showing
those fields will render fine. What will **not** resolve is anything that
needs the full `CompiledDesignVersion` (displacement, belt thickness, gun
caliber/count, crew, machinery type) for a specific ship, or the tactical
promotion path (`promoteTacticalUnit`) per ship — that requires
`ship.designVersionId`, which is absent pack-wide.

By contrast, `constructions.yaml` **does** carry `designVersionId` on every
one of its 9 projects, and all 9 resolve to real entries in `designs.yaml`
(spot-checked: `des_aut_tegetthoff`, `des_ita_italia`, `des_usa_amphitrite`,
`des_chi_dingyuan` all exist at `content/production/1880/designs.yaml`). So
**construction-project→design linkage is intact**; only the **ship**-level
linkage is the gap.

## 4. `docs/audit/MIGRATION-AUDIT.md` and `docs/OPEN-ISSUES.md`

Neither document mentions this pack, ship/design linkage, or any
content-completeness gap — both files are scoped to **specification
ambiguity** in the migrated `DESIGN-*` docs (lexical audit of the original
source document), not to content-pack authoring state
(`docs/audit/MIGRATION-AUDIT.md:1-18`, `docs/OPEN-ISSUES.md:1-38`). No hits
from `rg -i "1880|production pack|designVersionId"` against either file. This
checkpoint yields nothing pack-specific — the actual pack-authoring gap is
tracked in the `production-promotion.test.ts` comment (§3) and, more broadly,
`docs/acceptance/m1-capability-registry.md:43` lists "Ship design and
construction" as `ACCEPTED` (the *mechanism* is accepted), which is a
different claim from "the production pack's ships are linked to designs."

## 5. Existing test coverage of the compile→advance→save/load cycle

Ran both desktop test files locally (`cd apps/desktop && npx vp test run
test/production-pack.test.ts test/production-promotion.test.ts`) — **3/3
tests pass** as of this pack's current content.

- `apps/desktop/test/production-pack.test.ts:10-31` — compiles
  `content/production/1880` via `runCompilation` (which wraps
  `CampaignCompiler`, not just the content-only compiler), asserts
  `success: true`, **zero diagnostics**, 14 nations returned (including uk,
  france, qing by name), and that two successive compiles hash-match
  (determinism). This proves the pack compiles cleanly end-to-end through the
  campaign compiler, but does **not** advance a month or touch save/load.
- `apps/desktop/test/production-promotion.test.ts` — compiles the same pack
  directly via `CampaignCompiler`, then exercises `promoteTacticalUnit` per
  linked ship (finding zero, per §3) and documents the linkage gap. Also
  no month-advance or save/load.
- `packages/cross-process-test/src/run-child.ts:15-45` — **does not use
  `content/production/1880` at all.** It defines its own fully synthetic
  2-nation fixture (`uk`/`france`, hand-authored inline YAML strings) written
  to a temp directory (`writeAllFixtureFiles`, `run-child.ts:53-67`), then runs
  the complete loop this ticket cares about — `compileCampaign` → `MonthExecutor.execute`
  (one month, with a budget command) → `SaveStore.save` → `SaveStore.load` →
  `ReplayVerifier.verify` → `generateBattles` (`run-child.ts:223-315`). This is
  exactly the MVP critical-path shape, proven to work — **but against a
  synthetic fixture, not the canonical pack.**

**Net finding: no test anywhere in the repo compiles `content/production/1880`,
advances a strategic month against the resulting snapshot, and then
saves/loads it.** The pack's compile-time correctness is proven; its
runtime behavior under `MonthExecutor`/`SaveStore` is not, though the
mechanism itself (proven functional against the cross-process-test's
synthetic fixture, and independently listed as `ACCEPTED` for Economy,
Research, Ship design and construction, Monthly phase pipeline, and
Save/load/replay/hashes in `docs/acceptance/m1-capability-registry.md:41-48`)
is not expected to behave differently for structurally-valid content — the
`CampaignSnapshot` shape produced from the real pack is the same shape
`MonthExecutor` and `SaveStore` already handle. This is inference from
mechanism acceptance, not a direct proof against this pack.

## 6. Adjacent, out-of-scope blocker (noted, not re-researched)

The desktop game-client shell's new-game flow calls
`bridge.campaign.execute("compileCampaign", config)`
(`apps/desktop/src/renderer/shell/useNewGameFlow.ts:101`) through the
`BluewaveDesktopBridge`/`campaign.execute` IPC contract that, per
`.scratch/desktop-mvp/map.md`, "has never been implemented." That is a
plumbing gap, not a content gap, and is explicitly out of this ticket's scope
— flagged here only so the MVP-readiness picture isn't read as "the pack is
the only thing standing between here and a playable loop."

## Verdict

**Ready with caveats**, not blocked and not unconditionally ready:

- **Compiles cleanly, deterministically, with zero diagnostics** against the
  full campaign compiler, for all 14 authored nations — proven by an existing,
  currently-passing test (§5).
- **No missing-content compile errors are expected** for the MVP loop's
  minimum requirements (≥1 nation, playable slot, valid designs) — cross-
  referenced against the schema/compiler's actual required fields (§2).
- **Caveat 1 (content gap, already tracked):** ships in `fleets.yaml` carry no
  `designVersionId` — a fleet screen showing raw ship stats (hp/speed/
  firepower/armor) works; anything wanting full design-derived detail per
  ship, or tactical promotion, will find every ship unlinked (§3).
- **Caveat 2 (content thinness, not previously documented):** the playable
  nation **spain** has zero design templates and zero construction projects
  authored — a playtester choosing Spain would see a Construction screen with
  nothing to build from and no in-progress projects. Five other nations
  (4 non-playable + spain) share the zero-designs gap; six nations have no
  construction projects at all (§1).
- **Caveat 3 (unproven, not previously documented):** no automated test
  compiles this exact pack and then advances a month / saves / loads against
  the result — the full MVP loop against `content/production/1880` specifically
  is inferred-safe from mechanism acceptance and a synthetic-fixture proof of
  the same code path, not directly demonstrated (§5).

None of these three caveats are missing-content **errors** that would halt a
compile. They are gaps that would show up as visibly thin or unpolished UI
states (or, in the worst case, a first-time runtime surprise in the
untested compile→advance→save/load path) rather than as a blocked build.
