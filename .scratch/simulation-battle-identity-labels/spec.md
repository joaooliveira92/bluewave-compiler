# Spec: Simulation battle identity labels (presentation-only)

Slug: `simulation-battle-identity-labels`
Kind: presentation-only renderer fix inside the debug-gated Simulation screen.
**Triage:** `ready-for-agent` — fully specified, ready for an AFK agent.
**Status:** ready for slicing (`to-tickets`). **Blocked by:** none.
**Frontier:** independent of any open blocker.

## Problem Statement

The debug Battle Arena (Simulation screen → Battle Arena tab, gated by
`VITE_BLUEWAVE_DEBUG` via `DEBUG_MODE`) misrepresents who is fighting.

The battle readout (`BattleManifestView`) hardcodes the attacker column as
`United Kingdom (Player)` and the defender column as `German Empire (AI)`. It
renders `sides[0]` as the attacker and `sides[1]` as the defender, so the
displayed identity is derived from **column order**, and the player/AI role from
a fixed assumption that the UK is always the player and Germany always the AI.
The submarine-pools list (`SubmarinePoolsSection`) hardcodes
`pool.nationId === "nation_uk" ? "UK" : "Germany"`.

Both are latent-wrong because canonical nation ids are **not** `nation_<x>`.
Verified evidence:

- The canonical production content's country ids are `uk`, `germany`, `france`,
  `italy`, … (plus `usa`, `japan`, `russia`, `austria_hungary`, `spain`,
  `qing`). There is no `nation_` prefix anywhere in canonical identity.
- The renderer's country-id bridge maps a nation id to the presentation country
  id keyed by the canonical ids (`uk → gb`, `germany → de`, …), and its test
  explicitly asserts `nationIdToCountryId("nation_uk")` is `null`.
- Canonical display names already exist in the nation flavor-text catalog
  (`NATION_FLAVOR_TEXT[countryId].name`: "United Kingdom", "German Empire",
  "French Republic", …), keyed by presentation country id and reachable from a
  nation id through the bridge.

Consequences today: any non-UK attacker is mislabelled; the `(Player)`/`(AI)`
tag can be inverted whenever the player is not the attacker and not the UK; and
every submarine pool would be labelled "Germany" if pools were ever populated
(the build command currently emits `submarinePools: []`, so the pool branch is
latent rather than currently visible — the battle manifest **is** shown).

From the player's perspective: the debug tool that is supposed to explain an
engagement shows the wrong nations and the wrong side as "the player", which
makes it untrustworthy for exactly the engine inspection it exists to support.

## Solution

Derive every displayed identity from real, canonical data, and derive the
player/AI role from the session's actual player nation — never from column
ordering or a hardcoded nation.

1. Expose the session's player nation id as a **derived, read-only projection
   field** on the campaign projection (`playerNationId`), populated from the
   player slot the projection builder already receives. This is not
   authoritative state and not a save value.
2. The Simulation screen's existing `inspectCampaign` load captures that field
   into the screen reducer state and hands it to the Battle Arena. No new IPC
   channel, preload method, or command is added.
3. A single pure presentation helper maps a canonical nation id → canonical
   display name by composing the existing country-id bridge with the existing
   nation flavor-text catalog; an unmapped id falls back to the raw id verbatim
   (never an invented name).
4. `BattleManifestView` renders each side's own display name (by that side's
   `nationId`) and appends `(Player)`/`(AI)` by comparing the side's `nationId`
   to the player nation id. When the player nation is not yet known, it omits
   the role suffix rather than guessing.
5. `SubmarinePoolsSection` resolves each pool's display name from its
   `nationId`; the hardcoded ternary is deleted.
6. The debug-only scope is preserved: no authoritative simulation state,
   hashes, saves, or Electron boundary surface change.

### Acceptance criteria (brief criterion → requirement IDs → proving tests)

Each criterion is listed with the traceability requirement(s) it serves and the
concrete test that proves it. "Old behaviour fails" means the test is written so
it would fail against the current hardcoded / order-based code.

| AC | Criterion | Requirement IDs | Proving test |
| -- | --------- | --------------- | ------------ |
| AC-1 | Attacker column display name derives from that side's `nationId` via canonical presentation data; never the hardcoded "United Kingdom". | BW-RUL-001, DESIGN-04 §1/§11, DESIGN-51 | `BattleManifestView` render with attacker `france` → "French Republic"; fails today. |
| AC-2 | Defender column display name derives from that side's `nationId`; never the hardcoded "German Empire". | BW-RUL-001, DESIGN-04 §1/§11, DESIGN-51 | `BattleManifestView` render with defender `france` → "French Republic"; fails today. |
| AC-3 | `(Player)`/`(AI)` per side is decided by comparing that side's `nationId` to the session player nation id, not by column order. | BW-RUL-001, DESIGN-02, DESIGN-04 | Player `germany` ⇒ uk side shows "(AI)", germany side shows "(Player)"; fails today. |
| AC-4 | The player nation id comes from a derived read-only projection field equal to the session's player slot. | BW-STA-001, BW-ARC-002, DESIGN-02 | Projection-builder unit: `playerNationId === "uk"`; `inspectCampaign` surfaces it. |
| AC-5 | When the player nation id is unavailable, the UI omits the role suffix instead of fabricating a role. | BW-RUL-001, DESIGN-51 | Render with `playerNationId = null` → names present, no "(Player)"/"(AI)". |
| AC-6 | Submarine-pool display name derives from `pool.nationId`; the hardcoded Germany default is gone. | BW-RUL-001, DESIGN-04, DESIGN-34 | Pool `uk` → "United Kingdom"; pool `germany` → "German Empire"; `nation_uk`-era fixture corrected. |
| AC-7 | An unmapped/unknown nation id falls back to the raw id verbatim (no invented name, no silent default). | BW-RUL-001, DESIGN-04 §9/§11 | `GBR`/`nation_uk` → displayed as the raw string. |
| AC-8 | No authoritative state, campaign hash, golden hash, save format, or RNG behaviour changes. | BW-DET-003, BW-ARC-001, BW-STA-001, BW-TST-001 | Golden verification unchanged; two-process determinism; projection builder is pure. |
| AC-9 | No Electron boundary change: no new IPC command/preload method; the added field is derived read-only data on the existing `inspectCampaign` transport. | BW-ARC-001, ADR-0021, ADR-0029 | Bridge command-name/boundary tests unchanged and green. |
| AC-10 | The dev-tool scope is preserved: the affected screens stay `DEBUG_MODE`-gated. | DESIGN-51, ADR-0029 | Screen-registry/debug-gate tests green; captured debug screen. |
| AC-11 | Test fixtures use canonical nation ids so the real mapping path is exercised. | BW-RUL-001, DESIGN-04 | Updated render/reducer fixtures use `uk`/`germany`/`france` (no `nation_uk`). |
| AC-12 | Display names come only from the canonical flavor-text catalog; presentation text never feeds mechanics. | BW-RUL-001, DESIGN-04 §1 | Pure helper unit test; renderer imports the catalog read-only. |

## User Stories

1. As a campaign player using the debug Battle Arena, I want each side labelled
   with the nation that is actually fighting, so that the engagement readout is
   trustworthy.
2. As a campaign player, I want the `(Player)` tag on the side I control,
   regardless of whether I am the attacker or the defender, so that I can read
   the battle from my own perspective.
3. As a campaign player whose nation is neither the UK nor Germany, I want my
   nation's canonical name (e.g. "French Republic") shown, so that the tool
   reflects my actual campaign.
4. As a campaign player, I want the AI side clearly marked, so that I can tell
   instantly which squadrons are mine and which are the opponent's.
5. As a campaign player, I want the display names to match the names I already
   see elsewhere in the campaign (nation selection, briefing, diplomacy), so
   that identity is consistent across screens.
6. As a campaign player who has advanced the campaign, I want the player/AI
   roles to stay correct after a month is committed, so that the arena does not
   drift out of sync with my session.
7. As a campaign player, I want the submarine-pools list to name each pool's
   nation correctly if pools are ever shown, so that I am not told every pool
   belongs to Germany.
8. As a campaign player, I want unknown or unexpected nation ids shown honestly
   as their raw id rather than a fabricated name, so that I can spot data
   problems instead of being misled.
9. As a campaign player, I want the labels to appear only in the debug tool, so
   that release builds are unaffected.
10. As a developer inspecting a generated engagement, I want the manifest
    readout to reflect the engine's actual `sides[*].nationId`, so that I can
    trust it while debugging battle generation.
11. As a developer, I want the player nation id to come from a single real
    source (the campaign projection), so that I do not have to reason about
    several competing identity paths.
12. As a developer, I want the nation-id→display-name mapping in one reusable
    helper, so that adding another identity label does not duplicate logic.
13. As a developer, I want the role decision to be a pure comparison against
    the player nation id, so that it is testable without a live Electron bridge.
14. As a developer, I want the submarine- and battle-identity rendering to be
    independent of column ordering, so that a future side-ordering change cannot
    silently relabel the battle.
15. As a maintainer, I want no authoritative state, hash, or save change, so
    that this presentation fix cannot affect determinism or compatibility.
16. As a maintainer, I want no new IPC channel or preload capability, so that
    the Electron security boundary is unchanged.
17. As a maintainer, I want the stale `nation_uk` test fixture corrected to a
    canonical id, so that the test suite stops encoding a wrong identity shape.
18. As a reviewer, I want tests that would fail under the old hardcoded /
    order-based behaviour, so that the fix is proven rather than merely present.
19. As a reviewer, I want a captured debug screen of the corrected Battle Arena,
    so that I can confirm the visible labels against the acceptance criteria.
20. As a future implementer, I want the player nation id to survive the same
    `inspectCampaign` refresh the screen already performs, so that there is no
    second fetch or stale copy.

## Implementation Decisions

### Decision 1 — Where the player nation id comes from (the key decision)

The component must not guess. Add **one derived, read-only** field,
`playerNationId`, to the campaign `PlayerProjection`, populated by the
projection builder from the player slot it already receives. It is derived
projection data (the engineering contract's "derived/cached projection"
category), not authoritative state, and it is never persisted as a save value.
This matches the sibling projections that already expose a `playerNationId`.

The Simulation screen's hook already calls `inspectCampaign` on load and on
revision change, so it captures this field from that same response into the
screen reducer state; the screen then passes it to the Battle Arena. **No new
IPC command, preload method, or channel is introduced**; `inspectCampaign`'s
request is unchanged and the response merely carries one additional derived
field.

Alternatives considered and rejected:

- **Fetch a second projection that already carries the player id** (e.g. the
  battle-history or priorities projection). Rejected: an extra round trip, and
  it couples the Battle Arena to a projection unrelated to this screen when the
  campaign projection is already fetched and is the natural home for player
  identity alongside `nationName`.
- **Pass the id down from the shell / new-game flow.** Rejected: unreliable on
  campaign resume, where the shell retains only `nationName`; the projection is
  the only stable, always-fresh source.
- **Infer from side ordering, or from the screen's hardcoded war id.**
  Rejected: this is precisely the bug being fixed.

**Flag for the orchestrator / reviewer (contract interpretation).** This is the
one point where a reviewer could reasonably disagree about scope: the spec
treats adding a derived field to an existing projection as *not* an "Electron
main/preload/renderer boundary change" (no new channel/capability is exposed),
and therefore as in-scope for a presentation-only fix. If the reviewer judges
the shared `PlayerProjection` contract itself to be boundary-constrained, an ADR
recording the extension is the appropriate resolution. No ruleset constant
applies — this is display mapping over existing content, not a numeric or
gameplay parameter.

### Decision 2 — One pure display-name helper

Introduce one small pure presentation helper that resolves a canonical nation id
to a canonical display name by composing the existing country-id bridge with the
existing nation flavor-text catalog. For an unmapped id it returns the raw id
verbatim. It is colocated with the presentation content catalog (the module that
owns canonical display text), not with the country-id bridge. This is the single
new seam; both components use it rather than duplicating the lookup.

### Decision 3 — `BattleManifestView` identity and role

`BattleManifestView` gains a nullable `playerNationId` prop. For each rendered
side it:

- shows the display name resolved from that side's `nationId`;
- appends `(Player)` when `side.nationId === playerNationId`;
- appends `(AI)` when a player nation id is known and differs;
- appends no suffix when the player nation id is unknown.

The attacker/defender columns remain positional (`sides[0]` / `sides[1]`) — this
ticket changes identity and role only, not side ordering or side semantics.
(Sides also carry a `sideId`; keying columns off it is a reasonable future tidy
but is out of scope here.)

### Decision 4 — Wiring

`BattleArenaTab` forwards `playerNationId` to `BattleManifestView`; no other tab
prop changes. `SubmarinePoolsSection` needs no player id and resolves names from
`pool.nationId` alone.

### Decision 5 — Hook and reducer state

The Simulation screen hook adds `playerNationId` to the load-succeeded
transition and to the screen state (initialised `null`, refreshed from each
`inspectCampaign` projection). It is exposed on the hook's return and threaded
to the screen. It resets on neither battle generation nor resolution — only the
campaign refresh updates it.

### Decision 6 — Test fixtures

The submarine-pool and battle render fixtures are corrected to canonical nation
ids (`uk`, `germany`, `france`; never `nation_uk`) so the mapping path and role
comparison are genuinely exercised rather than skipped.

## Testing Decisions

A good test here asserts **external, user-visible behaviour**: the labels a
render produces from real props, the state a pure reducer yields for a given
action, and the output of the pure projection builder / helper. Tests must not
assert internal call order or private implementation details. Every new test is
written so that the pre-fix code would fail it — that is what proves the bug is
gone.

Modules covered:

- **The pure display-name helper** — nation id → canonical name for mapped and
  unmapped ids. Prior art: the nation-selection country-id bridge tests.
- **`BattleManifestView` render tests** — canonical names per side; the role
  comparison with the player as attacker, as defender, and unknown; non-UK/DE
  nations; unmapped-id fallback. Prior art: the existing battle-manifest render
  test, updated in place.
- **`SubmarinePoolsSection` / `StrategicOverviewTab` render tests** — pool names
  from canonical ids (UK and Germany), an unmapped id, and the corrected
  fixture. Prior art: the existing strategic-overview render test.
- **Simulation screen reducer** — `playerNationId` captured on load-succeeded,
  defaulted to `null`, and preserved across battle actions. Prior art: the
  existing simulation-screen-state reducer test.
- **Campaign projection builder** — `playerNationId` equals the player slot,
  deterministic and pure. Prior art: the existing projection unit tests.
- **`inspectCampaign` command** — surfaces the field through the existing
  command. Prior art: the existing inspect-campaign command test.

Adversarial cases that specifically kill the old behaviour:

- Player nation is the **defender**, not the attacker (role must flip).
- Attacker and defender are nations with no hardcoded fallback (e.g. France),
  proving names are not the old literals.
- `playerNationId` is `null`, proving no fabricated role is shown.
- A pool with a non-UK canonical id, proving the ternary is gone.
- An unmapped id, proving the raw-id fallback rather than a silent "Germany".

Authoritative safety is asserted separately: golden hashes unchanged,
two-process determinism byte-identical, and the projection builder consumes no
randomness.

## Out of Scope

- Populating `submarinePools` at all (the build command still emits `[]`); this
  spec only fixes how a pool is labelled if one exists.
- Changing side ordering, the attacker/defender column semantics, or the
  hardcoded sandbox war selection.
- Any localized/i18n framework; display names come from the existing canonical
  English catalog.
- Any authoritative simulation state, formula, ruleset, content-pack, save,
  hash, or golden change.
- Any new Electron IPC channel, preload method, or capability.
- Other hardcoded nation strings elsewhere in the app, unless they share the
  same helper and are trivially corrected as part of this work.
- Graduating the debug Battle Arena into a player-facing feature.

## Further Notes

- **Grounding (verified).** The country-id bridge and its test, the nation
  flavor-text catalog, the two named components and their render tests, the
  battle-manifest `sides[*].nationId` shape (supplied by the sandbox's renderer
  mapping from the engine's attacker/defender ids), the campaign projection
  builder, the simulation hook/reducer, and the debug gate were all read before
  writing this spec. The submarine pool's `nationId` shape is inferred from the
  pool type and its (stale) fixture; its raw-id fallback is deliberately
  defensive because no production producer populates pools yet.
- **Determinism.** The added projection field is derived from an existing
  argument and consumes no randomness; no authoritative hash, golden, or save
  changes are expected. Any golden movement is a stop condition, not something
  to accommodate.
- **Debug scope.** The affected screens remain gated by the debug flag; a UI
  change requires a captured debug screen from both implementator and reviewer
  before approval.
- **Latent branch.** Because the pool list is empty in production, the pool-name
  fix is proven by unit/render tests rather than by the live app; the battle
  manifest path is exercised live.
- **Possible follow-ups** (not this ticket): make the sandbox war selection
  generic instead of a fixed war id; key battle columns off `sideId`; add
  localized display-name keys.

### Definition of done

- [ ] The player nation id is sourced from one derived, read-only projection
      field, captured via the existing `inspectCampaign` load; no new IPC
      command/preload method.
- [ ] `BattleManifestView` derives both side names from their `nationId` and the
      role from the player nation id comparison; no hardcoded nation literals
      remain.
- [ ] `SubmarinePoolsSection` derives names from `pool.nationId` via the shared
      helper; no hardcoded "Germany"/`nation_uk` remains.
- [ ] One pure display-name helper exists and is unit-tested, including the
      raw-id fallback.
- [ ] All AC-1..AC-12 have a proving test that fails against the pre-fix code.
- [ ] Stale `nation_uk` fixtures are corrected to canonical ids.
- [ ] Focused tests pass; full orchestrator gate passes; golden hashes and
      two-process determinism unchanged.
- [ ] A debug screen capture of the corrected Battle Arena (and submarine pools
      if reachable) is attached by implementator and reviewer.
- [ ] Clean working tree; Conventional Commits on `dev`; traceability update for
      `PlayerProjection.playerNationId`.

### Validation commands

Focused (run from the repo root; adjust the test path selectors to the changed
files):

- `pnpm --filter @bluewave/desktop exec vp test run src/renderer/screens/simulation`
- `pnpm --filter @bluewave/desktop exec vp test run src/main/commands/inspectCampaign.test.ts`
- `pnpm --filter @bluewave/campaign-engine exec vp test run test/projection.test.ts`

Full orchestrator gate:

- `pnpm preflight`
- `pnpm check`
- `pnpm test:cross-process` (two-process determinism, byte-identical)
- the orchestrator's golden-hash verification (unchanged expected)
- `pnpm snap:debug` — capture the Battle Arena and check the labels against
  AC-1..AC-6, console clean, no churn warning

## Implementation record

Landed on `dev` in commit `817c7b2`
(`feat(simulation): derive battle identity labels from canonical nation data`).

- **AC-1..AC-3, AC-5, AC-11** — `BattleManifestView` now takes `playerNationId`
  and derives each side's name via `nationDisplayName(side.nationId)` and the
  role via id comparison; five render tests cover UK/DE, France/France, the
  player-as-defender flip, unknown player (no suffix) and unmapped-id fallback.
- **AC-4, AC-9** — `PlayerProjection.playerNationId` added as a derived
  read-only field; `inspectCampaign` surfaces it through the existing transport
  (no new IPC/preload surface). Covered by projection + inspectCampaign tests.
- **AC-6, AC-7, AC-12** — `nationDisplayName()` added in
  `content/nationDisplayName.ts` over the existing bridge + flavor catalog, with
  raw-id fallback; `SubmarinePoolsSection` uses it. Covered by helper and
  overview render tests.
- **AC-8** — projection builder is pure; no authoritative state, hash or save
  change. `packages/campaign-engine` tests green (102).
- **AC-10** — the screens stay debug-gated; no gate change.
- **Wiring** — `playerNationId` threaded through the screen reducer, hook and
  `BattleArenaTab`; `SimulationScreen` composition test added.

Validation run: desktop `pnpm test` 1345 passed / 14 failed (all 14 pre-existing
in `src/main/commands/{design,continuity}Commands`, unrelated in-flight design
work); `pnpm typecheck` and `pnpm lint` clean; campaign-engine 102 passed.

**Outstanding:** the debug `pnpm snap:debug` screen capture (AC-10 / DoD) is
**blocked by a pre-existing, explicitly-deferred bug** discovered while
attempting it: `handleGenerateBattle` hardcodes `warId: "war_uk_germany"`, but
the engine builds war ids as `war_<declarer>_<target>_<month>`, so the live
command returns `WAR_NOT_FOUND` (verified: *"No war war_uk_germany in this
campaign.; Known wars: war_uk_germany_1880-01"*). The Battle Arena therefore
cannot generate an engagement through the UI at all — which is why the
hardcoded labels were never seen live. Fixing it is the follow-up this spec's
Further Notes already listed ("make the sandbox war selection generic instead of
a fixed war id"), and is out of scope here. The label behaviour is proven by the
render tests; the capture remains the one open DoD checkbox, gated on that fix.

Gate pieces run: `pnpm preflight` clean; `pnpm test:cross-process`
byte-identical (`success:true`) — no determinism/golden change (AC-8).
