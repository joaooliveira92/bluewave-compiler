Type: grilling
Status: resolved

## Question

Prerequisite for tickets 08, 09, and 10. Design:

1. **`BluewaveDesktopBridge`'s overall shape** — the cross-cutting interface
   referenced from `shell/App.tsx`, `CampaignShellContext.tsx`,
   `useCampaignShell.ts`, `useNewGameFlow.ts`, and `useCampaignFiles.ts`
   (currently imported from `../../preload/index.js`, but not defined
   there). Confirm the `campaign.execute(command, payload)` shape and the
   `{ outcome: "success" | ..., value | reason }` envelope (already decided
   in ticket 01) as the concrete TypeScript interface, including where it
   physically lives (`apps/desktop/src/shared/bridge-contract.ts`, per the
   screens' existing import paths — that file doesn't exist yet).

2. **`@bluewave/campaign-engine`'s core types** — the package doesn't exist;
   ticket 01 decided it should, as a thin wrapper over `@bluewave/campaign` +
   `@bluewave/persistence`. Design the shapes shared across multiple
   domains (not the per-screen payloads — those are tickets 08/09/10):
   `PlayerProjection` (used by Overview, Campaign Preferences — what subset
   of `CampaignSnapshot` does a player actually need to see?),
   `CampaignConfiguration` and `ArchetypeSelection` (new-game flow input),
   `ARCHETYPE_PRESETS`, `SupportedConfigurationValues`.

3. Where the package lives in the monorepo (`packages/campaign-engine`,
   matching the existing `packages/campaign`, `packages/persistence`
   sibling layout) and its dependency direction (depends on
   `@bluewave/campaign` + `@bluewave/persistence`; `apps/desktop`'s main
   process depends on it — never the other way).

Ground every shape in what the screens actually read today — grep each
screen's usage of these types (e.g. `overview-screen-state.ts`'s
`PlayerProjection` usage, `useNewGameFlow.ts`'s `ArchetypeSelection`/
`CampaignConfiguration` usage) rather than inventing fields speculatively.

## Answer

**Package**: `packages/campaign-engine` (new, sibling to `packages/campaign`
and `packages/persistence`). Depends on `@bluewave/campaign` +
`@bluewave/persistence`; nothing depends on it except `apps/desktop`'s main
process. No circular or reverse dependency.

**`CampaignConfiguration`**: re-exported unchanged from `@bluewave/campaign`
(`packages/campaign/src/campaignConfiguration.ts`) — it already covers
everything the New Game flow needs (`scenarioId`, `fleetSizeSettingId`,
`researchSpeedSettingId`, `technologyVariationSettingId`,
`difficultyProfileId`, etc.), and per the archetype decision below,
archetype selection does not feed into it for MVP. Not redefined.

**`SupportedConfigurationValues`**: derived directly from `@bluewave/campaign`'s
existing ID-union exports (`CANONICAL_SCENARIO_IDS`, `FLEET_SIZE_IDS`,
`RESEARCH_IDS`, `VARIATION_IDS`) — one field per `CampaignConfiguration`
setting that `RulesetOptionsSection.tsx` renders as a dropdown, listing the
valid ids for that field.

**Archetype system** — confirmed cosmetic-but-honest for MVP (not wired
into campaign compilation; real mechanical effects are fog for a future
effort):

```ts
type ArchetypeDimension = "economy" | "industry" | "combat";
interface ArchetypeAllocation { economy: number; industry: number; combat: number; }
type ArchetypeSelection =
  | { kind: "preset"; id: string; allocation: ArchetypeAllocation }
  | { kind: "custom"; allocation: ArchetypeAllocation };
interface ArchetypePreset { id: string; label: string; allocation: ArchetypeAllocation; }
declare const ARCHETYPE_PRESETS: readonly ArchetypePreset[];
declare const BALANCED_ALLOCATION: ArchetypeAllocation;
declare function findPreset(id: string): ArchetypePreset | undefined;
declare function validateArchetypeAllocation(a: ArchetypeAllocation): { ok: boolean; diagnostics: readonly string[] };
declare function archetypeEffects(a: ArchetypeAllocation): /* honest preview, e.g. */ {
  readonly summary: string;
  readonly notes: readonly string[];
};
```

`archetypeEffects` computes an honest, non-mechanical preview (flavor
text/qualitative notes derived from the allocation's balance, not tied to
any real starting-condition modifier) — it must not claim effects that
`compileCampaign` doesn't actually apply.

**`PlayerProjection`** — confirmed shape (Q15), "one nation's slice of
`CampaignSnapshot`, flattened for UI convenience," derived from
`@bluewave/campaign`'s `NationState` + top-level `CampaignSnapshot` fields:

```ts
interface PlayerProjection {
  readonly campaignIdentity: string;
  readonly snapshotHash: string;
  readonly economy: { treasury: number; monthlyAppropriation: number; shipyardCapacity: number };
  readonly fleet: readonly { divisions: readonly { ships: readonly unknown[] }[] }[];
  readonly ports: readonly { capacity: number }[];
  readonly knownTechnologyIds: readonly string[];
  readonly strategicAreas: readonly unknown[];
  readonly knownEnemyNations: readonly string[];
}
```

`fleet`/`ports`/`strategicAreas`/ship element shapes stay loosely typed
here (`unknown`/minimal) — tickets 09 (simulation) and 10
(construction/fleet) own their full detailed shapes; this ticket only
covers what Overview and Campaign Preferences read.

## Addendum (during ticket 11 implementation): Q14 reversed

Q14's "cosmetic-but-honest" call for the archetype system turned out to be
wrong once implementation actually read `screens/new-game/archetype-consequence.ts`
and its test — pre-existing application code (not written during this
map) that computes real numeric effects (`treasuryMultiplier`,
`appropriationMultiplier`, `shipyardMultiplier`, `commanderBonus`,
`doctrineBonus`) from the allocation, with exact values pinned by
`archetype-consequence.test.ts` (e.g. `merchantPrince = {economy:10,
industry:5, combat:5}` against `BALANCED_ALLOCATION = {economy:7,
industry:7, combat:6}` → `"Starting treasury" === "+24%"`,
`"Commander bonus in battle" === "-5"`). That test predates this map and
was never about to change — Q14 was decided without seeing it.

**Reversed, user-confirmed**: `archetypeEffects` is implemented for real,
matching the pre-existing tests' formula
(`treasuryMultiplier = 1 + 0.08 × Δeconomy`, `commanderBonus = 5 × Δcombat`,
analogous formulas for `appropriationMultiplier`/`shipyardMultiplier`/
`doctrineBonus`). `ARCHETYPE_POINT_TOTAL` is `20` (not `150` as originally
guessed), `BALANCED_ALLOCATION` is `{economy:7, industry:7, combat:6}`,
and the three presets are `merchant_prince`, `shipyard_baron`,
`grand_admiral` (grounded in `nation-selection/archetypeNationSynergy.ts`
and the archetype screen-state test), not the four invented names
originally listed above. Whether these multipliers get applied when
`compileCampaign` builds the starting `CampaignConfiguration`, or stay
display-only for now, is left to ticket 12 (New Game → Overview) to
decide — a narrower, more honest gap than the one this ticket originally
described.

**`BluewaveDesktopBridge`/envelope**: lives at
`apps/desktop/src/shared/bridge-contract.ts` (app-level, Electron/IPC-
specific — not domain logic, so not part of `packages/campaign-engine`):

```ts
interface BluewaveDesktopBridge {
  readonly campaign: {
    execute<C extends string>(command: C, payload: unknown): Promise<BridgeResult<unknown>>;
  };
}
type BridgeResult<T> =
  | { outcome: "success"; value: T; diagnostics: readonly string[] }
  | { outcome: "rejected" | "error"; reason: string; diagnostics: readonly string[] };
```

Per-command payload/result types are narrowed in tickets 08/09/10, not
here.
