# Research: `content/production/1880/` — Pack Audit against the Constructed Engine (2026-08-17)

Follow-up to `content-4-desktop-mvp-pack-readiness.md`. Question: is the canonical
production pack "enough" for the parts of the game/engine already constructed?

**Bottom line: yes — sufficient for every engine surface that exists today,
proven end-to-end — but not complete against the 24-nation canon, and it retains
one engine-relevant content gap (ship→design linkage).**

This note is an audit deliverable. It verifies the pack against the *constructed*
toolchain (not static inference), reports coverage gaps, and drafts the
ship→design linkage change.

## 1. Method — verified against the real toolchain

- Ran `bwc campaign:compile` on the pack: **zero diagnostics**, deterministic
  output. Exercises the content compiler (rulesets/countries/areas/routes/
  possessions/ports/technologies) **and** the campaign compiler
  (fleets/economies/constructions/research/designs/diplomacy).
- Ran `packages/cross-process-test/test/production-pack-loop.test.ts`: **passes** —
  compiles this exact pack, advances a strategic month with a real command
  (`budget_project` on `con_gbr_inflexible`), saves, loads, replays
  byte-deterministically. This closes the "no test runs the full loop on this
  pack" caveat recorded in `content-4` (its §5/§6).
- Ran 67 desktop production-pack tests (pack, promotion, commitMonth, fleet,
  construction, research, diplomacy): **all pass**, including `commitMonth`
  advancing a real month against the pack with real maintenance/construction
  figures.

## 2. What the pack contains

`pack.json` (`type: "production"`, v0.3.0) enumerates 12 collections — no
`diplomacy` key. Counts are live (`rg`-verified today):

| Collection | Records | Coverage |
| --- | --- | --- |
| `countries` | **14** of 24 canonical | 10 playable, 4 AI |
| `areas` | 80 | world geography |
| `routes` | 33 | sea/rail edges |
| `possessions` | 62 | territorial control |
| `ports` | 88 | ports + levels |
| `technologies` | 84 | full tree (EARLY→INTERWAR) |
| `fleets` | 19 fleets / 20 ships | all 14 nations ≥1 fleet; 4 fleets empty |
| `economies` | 14 | 1:1 all 14 nations |
| `research` | 14 | 1:1 all 14 nations |
| `constructions` | 9 projects | 8 of 14 nations |
| `designs` | 37 | 9 of 14 nations |

## 3. Coverage gaps (authoring state, not compile errors)

Roster (canonical `NationIdSchema`, `packages/content-schema/src/nation.ts:7-32`):

- **10 of 24 nations missing entirely**: egypt, belgium, denmark,
  sweden_norway, greece, chile, argentina, korea, persia, siam.
- Playable today: uk, germany, usa, japan, france, italy, russia,
  austria_hungary, spain, qing. AI: ottoman_empire, netherlands, portugal,
  brazil.

Thin spots (valid but visibly empty in UI):

- **spain is playable with zero designs and zero construction projects.**
- **5 nations have zero designs**: spain, ottoman_empire, netherlands,
  portugal, brazil (designs by nation: uk 10, germany 6, japan 6, france 4,
  italy 4, usa 3, russia 2, austria_hungary 1, qing 1).
- **6 nations have zero construction projects**: japan, ottoman_empire, spain,
  netherlands, portugal, brazil.
- **No `diplomacy` manifest key** → every pair auto-fills to `neutral`/tension 5
  (`packages/campaign/src/compiler.ts:629-654`). Valid; no authored tension.

## 4. The engine-relevant gap: ship→design linkage

`fleets.yaml` ships carried **no `designVersionId`** (0 matches). The campaign
compiler's `CAMPAIGN-DESIGN` check
(`packages/campaign/src/compiler.ts:224-240`) only fires for ships that *have*
a `designVersionId`, so the pack compiled cleanly — but per-ship full design
detail (displacement, belt, gun caliber/count, crew, machinery) and the tactical
promotion path (`promoteTacticalUnit`) resolved to nothing.

By contrast, all 9 `constructions.yaml` projects carry `designVersionId` and all
9 resolve in `designs.yaml` (verified). Construction→design linkage was intact;
only ship→design was missing.

### 4.0 Applied in this pass (2026-08-17)

14 of the pack's 20 ships now carry `designVersionId` resolving to a real
`CompiledDesignVersion` (see §4.1 table). Verified: pack compiles clean (zero
diagnostics), full loop test passes, and the promotion test now reports the
residual 6-ship gap by id instead of asserting 100% unlinked. Applied to
`content/production/1880/fleets.yaml`, with `apps/desktop/test/production-promotion.test.ts`
and `apps/desktop/src/main/commands/fleetCommands.test.ts` updated to the linked
state.

### 4.1 Linkage — ships with a clean existing design (applied)

Each of these 14 ships maps to an existing 1880-era design by class:

| Ship | classId | designVersionId |
| --- | --- | --- |
| `gbr_inflexible` | Inflexible | `des_gbr_inflexible` |
| `gbr_dreadnought` | Dreadnought (1875) | `des_gbr_dreadnought75` |
| `gbr_alyxandra` | Alexandra | `des_gbr_alexandra` |
| `fra_redoutable` | Redoutable | `des_fra_redoutable` |
| `ger_kaiser` | Kaiser | `des_ger_kaiser` |
| `ger_sachsen` | Sachsen | `des_ger_sachsen` |
| `rus_petrveliky` | Petr Veliky | `des_rus_petrveliky` |
| `rus_sinop` | Ekaterina II | `des_rus_ekaterina2` |
| `aut_tegetthoff` | Tegetthoff | `des_aut_tegetthoff` |
| `ita_duilio` | Duilio | `des_ita_duilio` |
| `ita_italia` | Italia | `des_ita_italia` |
| `usa_amphitrite` | Amphitrite | `des_usa_amphitrite` |
| `jpn_fuso` | Fusō | `des_jpn_fuso` |
| `chi_dingyuan` | Dingyuan | `des_chi_dingyuan` |

(14 ships map cleanly. Note `fra_devastation` and `fra_courbet` are the ships
behind constructions `con_fra_devastation→des_fra_amiral_duperre` and
`con_fra_courbet→des_fra_redoutable`, respectively.)

### 4.2 Ships needing a new design (must author, not fabricate)

| Ship | classId | Need |
| --- | --- | --- |
| `gbr_malta_temp` | Temeraire | new 1880-era design `des_gbr_temeraire` |
| `fra_devastation` | Dévastation | new design (currently ships behind `des_fra_amiral_duperre`) |
| `fra_courbet` | Courbet | new 1880-era design `des_fra_courbet_1880` (the existing `des_pw_france_courbet` is a 1913 dreadnought — wrong era) |
| `aut_custoza` | Custoza | new design `des_aut_custoza` |
| `ott_mesudiye` | Mesudiye | ottoman has zero designs — needs the whole nation's design set |
| `esp_numancia` | Numancia | spain has zero designs — needs the whole nation's design set |

Authoring these requires historical design data (displacement/speed/armor/guns/
crew/machinery) that must be sourced, not guessed — see §5 for the gate.

### 4.3 New finding: repo-wide design-unit scale mismatch (blocks actual promotion)

Promoting the newly-linked ships surfaced a unit inconsistency **between the
design-authoring layer and the tactical classifier** — repo-wide, not a pack
bug:

- `designs.yaml` (and every design fixture in the repo, e.g.
  `packages/campaign/test/campaign.test.ts:557-559`) authors `armorBeltUm` in
  **mm**, `mainGuns.caliber` in **mm**, and `speedUms` in **knots**.
- The campaign compiler passed these through verbatim as
  `normalizedArmorUm` / `mainGunsCaliber` / `normalizedSpeedUms`
  (`packages/campaign/src/compiler.ts:738-754`).
- The combat classifier reads them as **micrometers** (`UM_PER_INCH = 25_400`,
  `UMS_PER_KNOT = 514_444`, `packages/combat/src/tactical/shipType.ts:32-33`,
  `:127-129`) and rejected every authored design with
  `INVALID_SHIP_TYPE` ("armor below family minimum").

**Resolved by ADR-0037 (2026-08-17):** authoring stays mm/knots; the campaign
compiler now normalizes to canonical µm/µm·s⁻¹ in the compiled design
(`packages/campaign/src/designUnits.ts`, `MM_TO_UM`, `KNOTS_TO_UMS`); display
consumers (`campaign-engine/src/construction.ts`,
`phase-engine/src/month.ts`) convert back. `promoteTacticalUnit` now succeeds
deterministically for the commissioned linked ships whose designs meet DESIGN-22
thresholds. Golden hashes are unaffected (the golden fixture authors no
designs).

**Remaining (recorded, not silently dropped):** `des_jpn_fuso` (3.72M kg) and
`des_usa_amphitrite` (4.0M kg) fall below the DESIGN-22 "B"-family minimum
displacement of 5,000,000 kg regardless of units — a separate canonical decision
(14-type registry has no home for small slow ironclads below the B floor), tracked
in ADR-0037's non-goals. `promoteTacticalUnit` reports `INVALID_SHIP_TYPE` for
them; the production-promotion test documents this rather than fabricating a type.

## 5. Recommended priority

1. **Applied in this pass:** `designVersionId` added to 14 ships (§4.1, §4.0).
2. **Applied in this pass:** design-unit normalization resolved (§4.3, ADR-0037);
   `promoteTacticalUnit` works for commissioned linked ships meeting DESIGN-22
   thresholds. Remaining: classify `des_jpn_fuso` / `des_usa_amphitrite` (below
   the 5M kg "B" floor — deferred decision, see ADR-0037 non-goals).
3. Author designs+constructions for playable nations that lack them —
   **spain first** (playable, zero designs, zero constructions).
4. Decide the 10 missing nations (rostering): defer vs. complete, with an ADR.
5. `fra_devastation`/`fra_courbet`/Temeraire/Custoza/Mesudiye/Numancia need
   sourced design data (research gate) — do not fabricate.

## Verdict

- **Engine-ready: yes, proven.** Only production pack; compiles clean,
  deterministic, and the full compile→advance→save→load→replay loop passes
  against it. Ship→design linkage applied (14/20 ships) and design units
  normalized (ADR-0037), so commissioned linked ships now promote
  deterministically.
- **Complete: no** — 14/24 nations; the residual 6-ship design gap; and two
  designs below the DESIGN-22 "B" displacement floor. None of these block the
  compiled campaign engine or the tactical layer.
