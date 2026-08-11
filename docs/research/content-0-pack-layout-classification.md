# Research: Content Sprint 0 — Pack Layout & Classification

AFK research into the repo's own code and canonical docs. Research-only; no files modified.

## Findings

### 1. How the content pipeline consumes a content directory

**CLI entry (`apps/compiler-cli/src/main.ts`).** Default option values:
- `--manifest` default `pack.json` (line 135)
- `--content-dir` default `content` (line 136)
- `--output-dir` default `out` (line 137); `--save-dir` default `saves` (line 138)
- Documented in USAGE at lines 38–41. `parseOptions` maps `--manifest`/`--content-dir`/etc. (lines 144–163).

**Input assembly (`apps/compiler-cli/src/commands.ts`).** `buildInput` (lines 540–580):
- resolves `manifestPath` from `--manifest` and `contentDir` from `--content-dir` (544–545);
- requires both to exist (547–555);
- `JSON.parse`es the manifest as `{ files?: Record<string, string[]> }` (557–564);
- resolves every listed collection file **relative to `contentDir`** via `resolve(contentDir, file)` and `safePath` traversal guard (566–587, guard at 582–588).

Field names the CLI readers read from `manifest.files`: `rulesets`, `countries`, `areas`, `routes`, `possessions`, `ports`, `technologies` (commands.ts:572–578).

**Content compiler (`packages/content-compiler/src/stages/parse.ts`).** `fileGroups` (lines 22–31) registers the same content collections plus `manifest:[input.manifestPath]`: `rulesets`, `countries`, `areas`, `routes`, `possessions`, `ports`, `technologies`. Every collection file must parse (YAML) to an **array** (line 45–53 — object ⇒ `SCHEMA` "Expected array").

**Validation (`packages/content-compiler/src/stages/validate.ts`).** `COLLECTION_KEYS` (lines 28–36) = the seven content collections; each validates against its schema (63–98); duplicate IDs (198–218), missing references (236–336), tech cycle (124–196).

**Campaign side (`packages/campaign/src/compiler.ts`).** After the content compiler runs, it reads campaign-specific YAML listed in `CampaignFiles` (lines 35–42): `fleetFiles`, `economyFiles`, `constructionFiles`, `diplomacyFiles`, `researchFiles`, `designFiles`. Loaded at lines 118–147 via `loadCampaignFiles` → `parseYamlFile` (59–80), which requires each file to be a YAML **array**.

**Desktop path (`apps/desktop/src/main/compiler.ts`).** `runCompilation(contentDir, …)` takes a single content dir, reads `pack.json` from it (line 33), and maps both content keys (49–55) and campaign keys (58–63). Note the campaign file field names here are `files.fleets`, `files.economies`, `files.constructions`, `files.diplomacy`, `files.research`, `files.designs`.

> **Gap worth flagging:** the CLI's `runCampaignCompile` (commands.ts:221–233) passes **empty** `campaignFiles` arrays and `rulesetVersion: "1.0.0"`. Only the desktop path (`apps/desktop/src/main/compiler.ts:57–64`) actually wires the campaign-side files (fleets/economies/constructions/diplomacy/research/designs) into `CampaignCompiler`. So a CLI-only compile today does not consume campaign-side collections.

**Required file set:** one `pack.json` manifest (referenced by `--manifest`, or read as `<contentDir>/pack.json` on desktop) plus one YAML file per populated collection, each named in `manifest.files`. Nothing is auto-discovered; every file must be enumerated in `files`.

### 2. `PackManifestSchema` (`packages/content-schema/src/manifest.ts`)

- `type` enum: `z.enum(["production", "fixture", "mod"])` (line 6).
- `dependencies` **are supported**: `z.record(z.string()).optional()` (line 8).
- `files`: `z.record(z.array(z.string())).optional()` (line 7).

`type` and `dependencies` are schema-validated but **not consumed or enforced anywhere** — no stage reads `manifest.type` or `pack.dependencies` (grep across `content-compiler/src`, `campaign/src`, `apps/` finds only the schema declaration; `normalize.ts`/`compile.ts` carry the manifest through unchanged). ADR‑0005:32 restates the schema: "name, version, type (production/fixture/mod), optional files map, optional dependencies."

### 3. DESIGN-05 (`docs/architecture/canonical-content-and-rulesets.md`)

**Important correction on premise:** this file is only 68 lines and does **not** contain manifest requirements named "classification / roots / collections / versions / localization / fixture-or-production". Those requirements do not exist in any doc on disk; the manifold manifest schema lives in code (`content-schema/src/manifest.ts`) and ADR‑0005. What DESIGN-05 *does* say, normatively:

- Content pack contents (lines 10–30): nations, regimes, scenario participation, world areas, adjacency, possessions, ports, canals, climate profiles, technologies, ship components, aircraft, missiles, submarines, coastal defenses, events, AI profiles, historical fleets, generation templates, balance constants.
- Ruleset requirements (lines 32–41): "Every ruleset has: stable identifier; semantic version; content hash; formula version; RNG algorithm version; AI-policy version."
- Missing Content Policy (lines 43–55): compilation fails if required canonical input is missing; the compiler must not silently invent nations/possessions/technologies/starting ownership/diplomatic participants/required fleet designs/scenario continuity; procedural generation allowed only where marked authoritative.
- Provenance Labels (lines 57–65): `CANONICAL_CONTENT MANUAL_EXPLICIT DESIGN_DECISION GENERATED_CANONICAL SCENARIO_OVERRIDE RULESET_CONSTANT DEPRECATED`.
- Localization (lines 67–68): "Localized text is presentation-only. Simulation logic uses stable identifiers, never localized strings."

The `type: "production" | "fixture" | "mod"` classification requirement is satisfied by `PackManifestSchema` (manifest.ts:6).

### 4. DESIGN-55 (`docs/delivery/release-scope-and-implementation-order.md`)

**§12 Content Feature Classification (lines 184–200).** Exactly one release classification per canonical content feature (line 186): `SUPPORTED_MECHANICAL`, `CONTENT_ONLY_LOCKED`, `PRESENTATION_ONLY`, `MIGRATION_ONLY`, or `DEPRECATED` (188–192).
- `SUPPORTED_MECHANICAL` "requires at least one accepted capability that implements it" (194).
- `CONTENT_ONLY_LOCKED` "MAY exist in the canonical pack before its runtime system is accepted, but it MUST be unreachable in a fully supported scenario" (196).
- `PRESENTATION_ONLY` "MUST NOT affect authoritative mechanics" (198); `MIGRATION_ONLY` "exists only to preserve historical save compatibility" (200).

**§13 Later-Era Content Gate (lines 202–215).** Later-era content MAY be packaged before acceptance only when **all** conditions hold (205–213):
- classified `CONTENT_ONLY_LOCKED`;
- cannot be discovered/purchased/produced/installed/assigned/spawned/selected/granted/activated by any supported scenario path;
- AI candidate generation excludes it;
- event and objective predicates exclude it;
- scenario compilation rejects direct references to it for a supported scenario;
- save migration does not activate it without an accepted migration capability;
- UI labels it unavailable/unsupported in content browsers;
- content validation records the capability identifiers required to unlock it.

Closing line (215): "A content item that can enter authoritative runtime state is not content-only."

**§14 Unsupported Content Isolation (lines 217–233).** The build MUST prove isolation through automated traversal of: technology unlock graphs; production and inventory definitions; design-component eligibility; event and objective effects; scenario starting state; private ventures and foreign purchases; AI selection pools; battle-generation temporary assets; continuity and successor-state definitions; migrations; developer/debug defaults in the distributable (219–231). "Any reachable `CONTENT_ONLY_LOCKED` feature MUST fail release validation with `UNSUPPORTED_CONTENT_REACHABLE`" (233).

### 5. Existing on-disk conventions (searched)

No `content/` directory, no `pack.json`, and no pack fixture directory exist on disk (searched whole repo excluding `node_modules`). **All fixtures are synthesized inline into temp dirs at test time**, e.g. `apps/desktop/test/compiler.test.ts:7-45` builds `FIXTURE_FILES` (pack.json with `type: "fixture"`, rulesets/countries/areas/routes/possessions/ports/technologies + fleets/economies/constructions/diplomacy/research) and writes them via `mkdtempSync` (50–53). `ADR-0006:36-38` mandates a fixture-first split: "All B3-B7 development uses a non-production 1880 fixture with clearly reduced scope. Production validators remain strict; fixture-only constructs cannot appear in production packs."

## Recommendation — production pack layout

**Use a top-level `content/production/<pack>/` directory, one subdirectory per production pack, containing `pack.json` (declaring `type: "production"`) plus its collection YAML, all enumerated in `manifest.files`.**

```
content/
  production/1880/           ← contentDir for this pack
    pack.json                ← { name, version, type: "production", files: {...} }
    rulesets.yaml  countries.yaml  areas.yaml  routes.yaml
    possessions.yaml  ports.yaml  technologies.yaml
    fleets.yaml  economies.yaml  constructions.yaml  diplomacy.yaml  research.yaml  designs.yaml
```

Justification (against the compiler as written):

- **Zero compiler changes.** `buildInput` resolves `--manifest` and `--content-dir` independently (commands.ts:544–545) and resolves all `files` relative to `contentDir` (566–578), so a pack dir is just an explicit contentDir. Desktop reads `<contentDir>/pack.json` (desktop/main/compiler.ts:33) — same layout works unchanged.
- **Reuses the CLI's `content` root token**, so `--content-dir content/production/1880` is a natural specialization of the default `content` (main.ts:136, :40), avoiding a new top-level token.
- **Keeps production separate from inline test fixtures.** The mandated fixture/prod split (ADR-0006:36-38) is satisfied structurally: fixtures stay inline/temp in tests (desktop/test/compiler.test.ts:41–54), production lives under `content/production/`. Any future non-production scratch can go under `content/fixtures/` with `type: "fixture"`.
- **Declares `type: "production"`** per `PackManifestSchema` (manifest.ts:6); the field is accepted by the validator today and is the designated hook for future strict production validation (§12 of DESIGN-55 / ADR-0006's "production validators remain strict").
- **Extra pack culture is cheap**: `content/production/<pack>/` is additive; no single `pack.json` at the repo root is overwritten.
- **Payload is fully enumerated in `files`** (nothing auto-discovered), so production packs and fixture packs keep identical structure — required by how `parse.ts` and the desktop compiler read them.

Caveats:
- Because the CLI default `--manifest` is `pack.json` at the CWD (main.ts:135), a production compile must pass both flags, e.g. `bwc compile --manifest content/production/1880/pack.json --content-dir content/production/1880`. Alternatively place a thin `pack.json` at repo root that points at the production pack.
- Campaign-side collections (fleets/economies/constructions/diplomacy/research/designs) are only consumed by the desktop compiler today; CLI `campaign:compile` passes empty arrays (commands.ts:223–230). A production pack authoring all 14 collections should compile via the desktop path (or extend the CLI) until that gap closes.

## Sources

- `apps/compiler-cli/src/main.ts` — defaults: 135–138; USAGE: 38–41; option parsing: 144–163
- `apps/compiler-cli/src/commands.ts` — `buildInput`: 540–580; safePath: 582–588; empty campaign files: 221–233
- `packages/campaign/src/compiler.ts` — `CampaignFiles`: 35–42; loads: 118–147; `parseYamlFile`: 59–80
- `apps/desktop/src/main/compiler.ts` — reads `contentDir/pack.json`: 33; content keys: 49–55; campaign keys: 58–63
- `packages/content-compiler/src/stages/parse.ts` — `fileGroups`: 22–31; array-only: 45–53
- `packages/content-compiler/src/stages/validate.ts` — `COLLECTION_KEYS`: 28–36; per-schema validate: 63–98; dup/ref/cycle: 100–196, 198–336
- `packages/content-schema/src/manifest.ts` — `type` enum: 6; `files`: 7; `dependencies`: 8
- `docs/architecture/canonical-content-and-rulesets.md` (DESIGN-05) — contents: 10–30; ruleset versions: 32–41; missing-content policy: 43–55; provenance: 57–65; localization: 67–68
- `docs/delivery/release-scope-and-implementation-order.md` (DESIGN-55) — §12: 184–200; §13: 202–215; §14: 217–233
- `docs/adr/ADR-0005-content-parsing.md:32` — manifest schema restated
- `docs/adr/ADR-0006-campaign-architecture.md:36-38` — fixture-first, production/fixture split
- `apps/desktop/test/compiler.test.ts:7-54` — inline temp fixture (`type: "fixture"`), no on-disk pack

## Key conclusions

1. A pack = `pack.json` manifest + one enumerated YAML array file per collection; nothing is auto-discovered. Content collections: rulesets, countries, areas, routes, possessions, ports, technologies. Campaign collections (desktop-only today): fleets, economies, constructions, diplomacy, research, designs.
2. `PackManifestSchema.type` = `production | fixture | mod`; `dependencies` and `files` are optional but schema-validated only (not consumed).
3. DESIGN-05 on disk has **no** manifest classification/roots/collections language (contradicts the question's premise); the type classification lives in schema + ADR-0005.
4. DESIGN-55: five classifications; `CONTENT_ONLY_LOCKED` allowed only if unreachable; `SUPPORTED_MECHANICAL` needs an accepted capability; §14 mandates automated reachability proof, `UNSUPPORTED_CONTENT_REACHABLE` on any reachable locked item.
5. No on-disk content/pack today; fixtures are inline temp files. Recommended: top-level `content/production/<pack>/` with `type: "production"`, loadable by the existing compiler with zero changes.
